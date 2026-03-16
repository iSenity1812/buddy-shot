import { injectable } from "inversify";
import { IStoragePort } from "../../application/ports/storage.port";
import {
  S3Client,
  DeleteObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { envConfig } from "@/shared/config/env.config";

@injectable()
export class R2StorageAdapter implements IStoragePort {
  private readonly client: S3Client;
  private readonly bucketName: string;
  private readonly publicBaseUrl: string;

  private resolvePublicBaseUrl(): string {
    const explicitBase = this.publicBaseUrl.trim();
    if (explicitBase) {
      return explicitBase.replace(/\/+$/, "");
    }

    const accountId = envConfig.cloudflare.r2AccountId.trim();
    const bucketName = this.bucketName.trim();

    if (!accountId || !bucketName) {
      return "";
    }

    return `https://${accountId}.r2.cloudflarestorage.com/${bucketName}`;
  }

  constructor() {
    const accountId = envConfig.cloudflare.r2AccountId;
    this.bucketName = envConfig.cloudflare.r2BucketName;
    this.publicBaseUrl = envConfig.cloudflare.r2PublicUrlBase;

    this.client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: envConfig.cloudflare.r2AccessKeyId,
        secretAccessKey: envConfig.cloudflare.r2SecretAccessKey,
      },
      forcePathStyle: false,
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED",
    });

    this.client.middlewareStack.add(
      (next) => async (args: any) => {
        const req = args.request as any;
        if (req?.headers) {
          delete req.headers["x-amz-checksum-crc32"];
          delete req.headers["x-amz-sdk-checksum-algorithm"];
          delete req.headers["x-amz-trailer"];
        }
        // Also strip from query string if present
        if (req?.query) {
          delete req.query["x-amz-sdk-checksum-algorithm"];
          delete req.query["x-amz-checksum-crc32"];
        }
        return next(args);
      },
      {
        step: "finalizeRequest",
        priority: "high",
        name: "removeChecksumHeaders",
      },
    );
  }

  /**
   * Returns a public CDN URL for the given R2 object key.
   * Assumes the bucket has a public custom domain configured.
   */
  getPublicUrl(key: string): string {
    const normalizedBase = this.resolvePublicBaseUrl();
    const normalizedKey = key.trim().replace(/^\/+/, "");

    if (!normalizedBase) {
      return normalizedKey;
    }

    return `${normalizedBase}/${normalizedKey}`;
  }

  async putObject(
    key: string,
    body: Buffer,
    contentType: string,
  ): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: body,
      ContentType: contentType,
    });
    await this.client.send(command);
  }

  /**
   * Generates a pre-signed PUT URL so the client can upload directly to R2.
   * Controller calls this to get the URL, then returns it to the mobile app.
   * Default expiry: 5 minutes.
   */
  async getUploadPresignedUrl(
    key: string,
    expiresInSeconds = 300,
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });
    return getSignedUrl(this.client, command, {
      expiresIn: expiresInSeconds,
      signableHeaders: new Set(["host"]),
    });
  }

  async deleteObject(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });
    await this.client.send(command);
  }
}
