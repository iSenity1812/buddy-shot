import type { SearchRelationshipStatus } from "../../../domain/repositories/friendship.repository.interface";

export interface SearchUserDto {
  userId: string;
  username: string;
  bio: string | null;
  avatarKey: string | null;
  avatarUrl: string | null;
  relationshipStatus: SearchRelationshipStatus;
}
