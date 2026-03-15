import { User } from "../../domain/entities/user";
import { AuthResponseOutputDto } from "../output/auth-respose.dto";

export class AuthDtoMapper {
  static toResponse(
    user: User,
    tokenPair: {
      accessToken: string;
      refreshToken: string;
      accessTokenExpiresIn: number;
      refreshTokenExpiresAt: Date;
    },
  ): AuthResponseOutputDto {
    return {
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      accessTokenExpiresIn: tokenPair.accessTokenExpiresIn,
      refreshTokenExpiresAt: tokenPair.refreshTokenExpiresAt.toISOString(),
      user: {
        id: user.id,
        email: user.email.value,
        username: user.username,
      },
    };
  }
}
