import { EntityBaseProps } from "@/shared/domain";
import { AvatarKey } from "../value-objects/avatar.vo";
import { Bio } from "../value-objects/bio.vo";
import { Username } from "../value-objects/username.vo";

export interface ProfileProps extends EntityBaseProps {
  /** Same ID as the User aggregate in identity-access module */
  userId: string;
  username: Username;
  bio: Bio;
  avatarKey: AvatarKey | null;
  isActive: boolean; // For soft-deletion
}
