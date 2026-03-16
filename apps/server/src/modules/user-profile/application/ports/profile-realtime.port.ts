export interface ProfileAvatarChangedNotification {
  userId: string;
  username: string;
  avatarUrl: string | null;
}

export interface IProfileRealtimePort {
  notifyAvatarChanged(payload: ProfileAvatarChangedNotification): Promise<void>;
}
