import { inject, injectable } from "inversify";
import type { IUseCase } from "@/shared/application";
import { ForbiddenError } from "@/shared/errors/domain-error";
import { PHOTO_SHARING_KEY } from "../../di/photo-sharing.token";
import type { IPhotoSharingRepository } from "../../domain/repositories/photo-sharing.repository.interface";
import { PhotoSharingValidationError } from "../../domain/errors/photo-sharing.error";
import type { UpdatePhotoCaptionDto } from "../dtos/input/update-photo-caption.dto";

@injectable()
export class UpdateMyPhotoCaptionUseCase
  implements IUseCase<UpdatePhotoCaptionDto, { photoId: string; caption: string }>
{
  constructor(
    @inject(PHOTO_SHARING_KEY.REPOSITORY)
    private readonly repository: IPhotoSharingRepository,
  ) {}

  async execute(
    input: UpdatePhotoCaptionDto,
  ): Promise<{ photoId: string; caption: string }> {
    const userId = input.userId?.trim();
    const photoId = input.photoId?.trim();
    const caption = input.caption?.trim();

    if (!userId) {
      throw new PhotoSharingValidationError("userId is required.");
    }

    if (!photoId) {
      throw new PhotoSharingValidationError("photoId is required.");
    }

    if (!caption) {
      throw new PhotoSharingValidationError("caption is required.");
    }

    if (caption.length > 100) {
      throw new PhotoSharingValidationError(
        "caption must be at most 100 characters.",
      );
    }

    const updated = await this.repository.updateOwnPhotoCaption({
      userId,
      photoId,
      caption,
    });

    if (!updated) {
      throw new ForbiddenError("You can only edit captions of your own photos.");
    }

    return {
      photoId,
      caption,
    };
  }
}
