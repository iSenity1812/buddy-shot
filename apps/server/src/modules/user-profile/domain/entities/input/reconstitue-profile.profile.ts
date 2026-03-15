import { EntityBaseProps } from "@/shared/domain";

export interface ReconstitueProfileInput extends EntityBaseProps {
  userId: string;
  username: string;
  bio: string | null;
  avatarKey: string | null;
  isActive: boolean;
}
