import { inject, injectable } from "inversify";
import type { IUseCase } from "@/shared/application";
import { PHOTO_SHARING_KEY } from "../../di/photo-sharing.token";
import type { IPhotoSharingRepository } from "../../domain/repositories/photo-sharing.repository.interface";
import type { GetPhotoFeedDto } from "../dtos/input/get-photo-feed.dto";
import type { PhotoFeedResultDto } from "../dtos/output/photo-feed-item.dto";
import { PhotoSharingDtoMapper } from "../mappers/photo-sharing-dto.mapper";
import type { IMediaStoragePort } from "../ports/media-storage.port";
import { PhotoSharingValidationError } from "../../domain/errors/photo-sharing.error";

@injectable()
export class GetPhotoFeedUseCase implements IUseCase<
  GetPhotoFeedDto,
  PhotoFeedResultDto
> {
  constructor(
    @inject(PHOTO_SHARING_KEY.REPOSITORY)
    private readonly repository: IPhotoSharingRepository,

    @inject(PHOTO_SHARING_KEY.PORT.MEDIA_STORAGE)
    private readonly mediaStorage: IMediaStoragePort,
  ) {}

  async execute(input: GetPhotoFeedDto): Promise<PhotoFeedResultDto> {
    const userId = input.userId?.trim();
    if (!userId) {
      throw new PhotoSharingValidationError("userId is required.");
    }
    const username = input.username?.trim() || undefined;

    const page = Math.max(1, Number(input.page ?? 1));
    const limit = Math.min(50, Math.max(1, Number(input.limit ?? 20)));
    const sort = input.sort === "asc" ? "asc" : "desc";

    const { items, total } = await this.repository.listFeed({
      userId,
      username,
      from: input.from,
      to: input.to,
      page,
      limit,
      sort,
    });

    return PhotoSharingDtoMapper.toFeedResult(
      items,
      total,
      page,
      limit,
      this.mediaStorage,
    );
  }
}
