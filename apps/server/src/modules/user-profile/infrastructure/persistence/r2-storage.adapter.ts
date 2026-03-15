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
    });
  }

  /**
   * Returns a public CDN URL for the given R2 object key.
   * Assumes the bucket has a public custom domain configured.
   */
  getPublicUrl(key: string): string {
    return `${this.publicBaseUrl}/${key}`;
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
      ContentType: "image/*", // allow any image type
    });
    return getSignedUrl(this.client, command, {
      expiresIn: expiresInSeconds,
      signableHeaders: new Set(["host", "content-type"]),
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
