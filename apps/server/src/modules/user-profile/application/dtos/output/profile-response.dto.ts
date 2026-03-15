export interface ProfileResponseOutputDto {
  userId: string;
  username: string;
  bio: string;
  /** Resolved CDN URL, not the raw R2 key */
  avatarUrl: string | null;
  updatedAt: string; // ISO 8601
}
