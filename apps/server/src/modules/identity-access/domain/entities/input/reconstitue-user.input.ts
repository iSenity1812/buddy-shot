import { EntityBaseProps } from "@/shared/domain";

export interface ReconstitueUserInput extends EntityBaseProps {
  email: string;
  passwordHash: string;
  username: string;
  isActive: boolean;
}
