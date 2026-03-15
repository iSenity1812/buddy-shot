export interface GetProfileDto {
  /** Can look up by userId OR username */
  userId?: string;
  username?: string;
}
