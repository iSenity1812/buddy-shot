export interface PhotoFeedItemDto {
  photoId: string;
  sender: {
    userId: string;
    username: string;
    avatarKey: string | null;
  };
  imageKey: string;
  imageUrl: string;
  caption: string | null;
  createdAt: string;
  deliveredAt: string | null;
}

export interface PhotoFeedResultDto {
  items: PhotoFeedItemDto[];
  total: number;
  page: number;
  limit: number;
}
