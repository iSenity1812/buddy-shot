export interface GetPhotoFeedDto {
  userId: string;
  username?: string;
  from?: Date;
  to?: Date;
  page?: number;
  limit?: number;
  sort?: "asc" | "desc";
}
