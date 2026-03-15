export interface AuthResponseOutputDto {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: number;
  refreshTokenExpiresAt: string; // ISO 8601
  user: AuthUserOutputDto;
}

export interface AuthUserOutputDto {
  id: string;
  email: string;
  username: string;
}
