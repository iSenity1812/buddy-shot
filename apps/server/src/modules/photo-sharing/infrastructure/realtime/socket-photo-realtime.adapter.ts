import { injectable } from "inversify";
import { socketGateway } from "@/shared/realtime/socket.gateway";
import type {
  IPhotoRealtimePort,
  PhotoRecipientNotification,
} from "../../application/ports/photo-realtime.port";

@injectable()
export class SocketPhotoRealtimeAdapter implements IPhotoRealtimePort {
  async notifyRecipientDelivery(
    payload: PhotoRecipientNotification,
  ): Promise<void> {
    socketGateway.emitToUser(payload.recipientId, "photo:recipient", payload);
  }
}
