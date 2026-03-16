import { injectable } from "inversify";
import { envConfig } from "@/shared/config/env.config";
import type { IMediaStoragePort } from "../../application/ports/media-storage.port";

@injectable()
export class PassthroughMediaStorageAdapter implements IMediaStoragePort {
  private resolvePublicBaseUrl(): string {
    const explicitBase = envConfig.cloudflare.r2PublicUrlBase.trim();
    if (explicitBase) {
      return explicitBase.replace(/\/+$/, "");
    }

    const accountId = envConfig.cloudflare.r2AccountId.trim();
    const bucketName = envConfig.cloudflare.r2BucketName.trim();

    if (!accountId || !bucketName) {
      return "";
    }

    return `https://${accountId}.r2.cloudflarestorage.com/${bucketName}`;
  }

  getPublicUrl(imageKey: string): string {
    const key = imageKey.trim().replace(/^\/+/, "");
    const base = this.resolvePublicBaseUrl();

    if (!base) {
      return key;
    }

    return `${base}/${key}`;
  }
}
