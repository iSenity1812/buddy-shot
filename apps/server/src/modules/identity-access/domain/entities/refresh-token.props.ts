import { EntityBaseProps } from "@/shared/domain";

export interface RefreshTokenProps extends EntityBaseProps {
  userId: string;
  deviceId: string;
  tokenHash: string; // bcrypt hash of the raw token
  isRevoked: boolean;
  expiresAt: Date;
}

export interface CreateRefreshTokenInput {
  userId: string;
  deviceId: string;
  tokenHash: string;
  expiresAt: Date;
}
