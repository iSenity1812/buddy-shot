import { inject, injectable } from "inversify";
import type { IUseCase } from "@/shared/application";
import { PHOTO_SHARING_KEY } from "../../di/photo-sharing.token";
import type { IPhotoSharingRepository } from "../../domain/repositories/photo-sharing.repository.interface";
import type { SendPhotoDto } from "../dtos/input/send-photo.dto";
import type { SendPhotoResponseDto } from "../dtos/output/send-photo-response.dto";
import { Photo } from "../../domain/entities/photo";
import { PhotoDelivery } from "../../domain/entities/photo-delivery";
import { Recipient } from "../../domain/entities/recipient";
import {
  PhotoRecipientNotEligibleError,
  PhotoSharingValidationError,
} from "../../domain/errors/photo-sharing.error";
import { PhotoSharingDtoMapper } from "../mappers/photo-sharing-dto.mapper";
import type { IMediaStoragePort } from "../ports/media-storage.port";

@injectable()
export class SendPhotoUseCase implements IUseCase<
  SendPhotoDto,
  SendPhotoResponseDto
> {
  constructor(
    @inject(PHOTO_SHARING_KEY.REPOSITORY)
    private readonly repository: IPhotoSharingRepository,

    @inject(PHOTO_SHARING_KEY.PORT.MEDIA_STORAGE)
    private readonly mediaStorage: IMediaStoragePort,
  ) {}

  async execute(input: SendPhotoDto): Promise<SendPhotoResponseDto> {
    const senderId = input.senderId?.trim();
    if (!senderId) {
      throw new PhotoSharingValidationError("senderId is required.");
    }

    const normalizedRecipientIds = this.normalizeRecipientIds(
      input.recipientIds,
    );
    if (normalizedRecipientIds.length === 0) {
      throw new PhotoSharingValidationError(
        "At least one recipientId is required.",
      );
    }

    const eligibleRecipientIds = await this.repository.findEligibleRecipientIds(
      senderId,
      normalizedRecipientIds,
    );

    if (eligibleRecipientIds.length !== normalizedRecipientIds.length) {
      const nonEligible = normalizedRecipientIds.filter(
        (id) => !eligibleRecipientIds.includes(id),
      );
      throw new PhotoRecipientNotEligibleError(nonEligible);
    }

    const recipients = eligibleRecipientIds.map((id) => Recipient.create(id));
    const photo = Photo.create({
      senderId,
      imageKey: input.imageKey,
      caption: input.caption,
    });

    const deliveries = recipients.map((recipient) =>
      PhotoDelivery.create({
        photoId: photo.id,
        recipientId: recipient.userId,
        senderId,
        imageKey: photo.imageKey,
        caption: photo.caption,
      }),
    );

    await this.repository.savePhotoWithDeliveries(photo, deliveries);

    return PhotoSharingDtoMapper.toSendPhotoResponse(
      photo,
      deliveries,
      this.mediaStorage,
    );
  }

  private normalizeRecipientIds(recipientIds: string[]): string[] {
    if (!Array.isArray(recipientIds)) {
      return [];
    }

    const unique = new Set(
      recipientIds
        .map((item) => String(item ?? "").trim())
        .filter((item) => item.length > 0),
    );

    return [...unique];
  }
}
