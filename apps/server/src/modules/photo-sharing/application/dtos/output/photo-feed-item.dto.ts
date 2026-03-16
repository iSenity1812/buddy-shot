export interface PhotoFeedItemDto {
  photoId: string;
  photoRecipientId: string | null;
  sender: {
    userId: string;
    username: string;
    avatarKey: string | null;
  };
  imageKey: string;
  imageUrl: string;
  caption: string | null;
  myReaction: string | null;
  reactionSummary: Array<{
    emoji: string;
    count: number;
  }>;
  createdAt: string;
  deliveredAt: string | null;
}

export interface PhotoFeedResultDto {
  items: PhotoFeedItemDto[];
  total: number;
  page: number;
  limit: number;
}
