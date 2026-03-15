import { randomUUID } from "crypto";
import { IUseCase } from "@/shared/application";
import { inject, injectable } from "inversify";
import type { IStoragePort } from "../ports/storage.port";
import { PROFILE_KEY } from "../../di/profile.token";
import { AvatarUploadUrlInputDto } from "../dtos/input/avatar-upload-url.dto";
import { AvatarUploadUrlResponseDto } from "../dtos/output/avatar-upload-url-response.dto";
import { ProfileValidationError } from "../../domain/errors/profile.error";
import { AvatarKey } from "../../domain/value-objects/avatar.vo";

@injectable()
export class GenerateAvatarUploadUrlUseCase implements IUseCase<
  AvatarUploadUrlInputDto,
  AvatarUploadUrlResponseDto
> {
  private static readonly DEFAULT_EXPIRES_SECONDS = 300;
  private static readonly ALLOWED_EXTS = new Set([
    "jpg",
    "jpeg",
    "png",
    "webp",
  ]);

  constructor(
    @inject(PROFILE_KEY.PORT.STORAGE)
    private readonly storagePort: IStoragePort,
  ) {}

  async execute(
    input: AvatarUploadUrlInputDto,
  ): Promise<AvatarUploadUrlResponseDto> {
    const ext = this.resolveExtension(input.fileExt, input.contentType);
    if (!ext) {
      throw new ProfileValidationError(
        "Avatar file type is required (fileExt or contentType).",
      );
    }

    if (!GenerateAvatarUploadUrlUseCase.ALLOWED_EXTS.has(ext)) {
      throw new ProfileValidationError(
        "Invalid avatar file type. Allowed: jpg, jpeg, png, webp.",
        { ext },
      );
    }

    const key = `avatars/${randomUUID()}.${ext}`;
    AvatarKey.create(key);

    const uploadUrl = await this.storagePort.getUploadPresignedUrl(
      key,
      GenerateAvatarUploadUrlUseCase.DEFAULT_EXPIRES_SECONDS,
    );

    return {
      avatarKey: key,
      uploadUrl,
      publicUrl: this.storagePort.getPublicUrl(key),
      expiresInSeconds: GenerateAvatarUploadUrlUseCase.DEFAULT_EXPIRES_SECONDS,
    };
  }

  private resolveExtension(
    fileExt?: string,
    contentType?: string,
  ): string | null {
    if (fileExt && fileExt.trim()) {
      return fileExt.replace(".", "").trim().toLowerCase();
    }

    if (contentType && contentType.startsWith("image/")) {
      const subtype = contentType.slice("image/".length).toLowerCase();
      if (subtype === "jpeg") return "jpg";
      return subtype;
    }

    return null;
  }
}
