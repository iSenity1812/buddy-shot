export interface ChangeAvatarInputDto {
  userId: string;
  /** New R2 object key. Pass null to remove avatar. */
  avatarKey: string | null;
}
