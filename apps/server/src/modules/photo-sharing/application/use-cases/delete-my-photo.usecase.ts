import { inject, injectable } from "inversify";
import type { IUseCase } from "@/shared/application";
import { ForbiddenError } from "@/shared/errors/domain-error";
import { PHOTO_SHARING_KEY } from "../../di/photo-sharing.token";
import type { IPhotoSharingRepository } from "../../domain/repositories/photo-sharing.repository.interface";
import { PhotoSharingValidationError } from "../../domain/errors/photo-sharing.error";
import type { IPhotoRealtimePort } from "../ports/photo-realtime.port";

interface DeleteMyPhotoDto {
  userId: string;
  photoId: string;
}

@injectable()
export class DeleteMyPhotoUseCase implements IUseCase<
  DeleteMyPhotoDto,
  { photoId: string }
> {
  constructor(
    @inject(PHOTO_SHARING_KEY.REPOSITORY)
    private readonly repository: IPhotoSharingRepository,

    @inject(PHOTO_SHARING_KEY.PORT.REALTIME)
    private readonly realtime: IPhotoRealtimePort,
  ) {}

  async execute(input: DeleteMyPhotoDto): Promise<{ photoId: string }> {
    const userId = input.userId?.trim();
    const photoId = input.photoId?.trim();

    if (!userId) {
      throw new PhotoSharingValidationError("userId is required.");
    }

    if (!photoId) {
      throw new PhotoSharingValidationError("photoId is required.");
    }

    const audienceUserIds =
      await this.repository.listAudienceUserIdsForOwnPhoto({
        userId,
        photoId,
      });

    const deleted = await this.repository.deleteOwnPhoto({
      userId,
      photoId,
    });

    if (!deleted) {
      throw new ForbiddenError("You can only delete your own photos.");
    }

    await this.realtime.notifyPhotoDeleted({
      photoId,
      actorUserId: userId,
      audienceUserIds,
    });

    return { photoId };
  }
}
