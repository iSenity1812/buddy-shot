import { injectable } from "inversify";
import { envConfig } from "@/shared/config/env.config";
import type { IMediaStoragePort } from "../../application/ports/media-storage.port";

@injectable()
export class PassthroughMediaStorageAdapter implements IMediaStoragePort {
  getPublicUrl(imageKey: string): string {
    const key = imageKey.replace(/^\/+/, "");
    const base = envConfig.cloudflare.r2PublicUrlBase;

    if (!base) {
      return key;
    }

    return `${base.replace(/\/$/, "")}/${key}`;
  }
}
