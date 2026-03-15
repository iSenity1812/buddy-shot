import type { EntityBaseProps } from "@/shared/domain";

export interface PhotoDeliveryProps extends EntityBaseProps {
  photoId: string;
  recipientId: string;
  isViewed: boolean;
  viewedAt: Date | null;
  deliveredAt: Date | null;
}
