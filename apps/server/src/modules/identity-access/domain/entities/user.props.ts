import { EntityBaseProps } from "@/shared/domain";
import { HashedPassword } from "../value-objects/hashed-password.vo";
import { Email } from "../value-objects/email.vo";

export interface UserProps extends EntityBaseProps {
  email: Email;
  passwordHash: HashedPassword;
  username: string;
  isActive: boolean;
}
