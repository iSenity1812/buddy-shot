import type { EntityBaseProps } from "@/shared/domain";

export interface PhotoProps extends EntityBaseProps {
  senderId: string;
  imageKey: string;
  caption: string | null;
  expiresAt: Date | null;
}
