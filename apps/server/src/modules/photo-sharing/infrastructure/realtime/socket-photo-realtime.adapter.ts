import { injectable } from "inversify";
import { socketGateway } from "@/shared/realtime/socket.gateway";
import { SOCKET_EVENT } from "@/shared/realtime/socket-events";
import type {
  IPhotoRealtimePort,
  PhotoCaptionUpdatedNotification,
  PhotoDeletedNotification,
  PhotoRecipientNotification,
} from "../../application/ports/photo-realtime.port";

@injectable()
export class SocketPhotoRealtimeAdapter implements IPhotoRealtimePort {
  async notifyRecipientDelivery(
    payload: PhotoRecipientNotification,
  ): Promise<void> {
    socketGateway.emitToUser(
      payload.recipientId,
      SOCKET_EVENT.PHOTO_RECIPIENT,
      payload,
    );
  }

  async notifyPhotoCaptionUpdated(
    payload: PhotoCaptionUpdatedNotification,
  ): Promise<void> {
    for (const userId of payload.audienceUserIds) {
      socketGateway.emitToUser(userId, SOCKET_EVENT.PHOTO_CAPTION_UPDATED, {
        photoId: payload.photoId,
        caption: payload.caption,
        actorUserId: payload.actorUserId,
      });
    }
  }

  async notifyPhotoDeleted(payload: PhotoDeletedNotification): Promise<void> {
    for (const userId of payload.audienceUserIds) {
      socketGateway.emitToUser(userId, SOCKET_EVENT.PHOTO_DELETED, {
        photoId: payload.photoId,
        actorUserId: payload.actorUserId,
      });
    }
  }
}
