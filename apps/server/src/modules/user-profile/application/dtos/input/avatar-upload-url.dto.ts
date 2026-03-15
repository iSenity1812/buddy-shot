export interface AvatarUploadUrlInputDto {
  userId: string;
  /** File extension (jpg/jpeg/png/webp). Optional if contentType is provided. */
  fileExt?: string;
  /** MIME type (image/jpeg, image/png, image/webp). Optional if fileExt is provided. */
  contentType?: string;
}
