import { IUseCase } from "@/shared/application";
import { inject, injectable } from "inversify";
import { RefreshTokenInputDto } from "../input/refresh-token.dto";
import { AuthResponseOutputDto } from "../output/auth-respose.dto";
import { IDENTITY_KEY } from "../../di/identity.token";
import type {
  IRefreshTokenRepository,
  IUserRepository,
} from "../../domain/repositories/auth.repository.interface";
import type {
  IPasswordHasher,
  ITokenService,
} from "../../domain/services/auth.service.interface";
import { IdentityHelper } from "../helpers/identity.helper";
import {
  InvalidCredentialsError,
  TokenReuseDetectedError,
} from "../../domain/errors/identity.error";
import { RefreshToken } from "../../domain/entities/refresh-token";
import { AuthDtoMapper } from "../mappers/auth.mapper";

@injectable()
export class RefreshTokenUseCase implements IUseCase<
  RefreshTokenInputDto,
  AuthResponseOutputDto
> {
  constructor(
    @inject(IDENTITY_KEY.REPOSITORY.USER)
    private readonly userRepository: IUserRepository,

    @inject(IDENTITY_KEY.REPOSITORY.REFRESH_TOKEN)
    private readonly refreshTokenRepository: IRefreshTokenRepository,

    @inject(IDENTITY_KEY.DOMAIN_SERVICE.PASSWORD_HASHER)
    private readonly passwordHasher: IPasswordHasher,

    @inject(IDENTITY_KEY.DOMAIN_SERVICE.TOKEN)
    private readonly tokenService: ITokenService,
  ) {}

  async execute(input: RefreshTokenInputDto): Promise<AuthResponseOutputDto> {
    const incomingHash = IdentityHelper.sha256(input.rawRefreshToken);

    // look up hash
    const stored =
      await this.refreshTokenRepository.findByTokenHash(incomingHash);

    // 2. Token not found → possible reuse of a long-expired / deleted token
    if (!stored) {
      throw new InvalidCredentialsError("Invalid refresh token");
    }

    // Reuse detection: if token exists but is already expired, it means attacker is trying to reuse a stolen token after we have deleted it
    if (stored.isRevoked) {
      await this.refreshTokenRepository.revokeAllForUser(stored.userId); // Revoke all tokens for this user to prevent further damage
      throw new TokenReuseDetectedError({
        userId: stored.userId,
        deviceId: stored.deviceId,
      });
    }

    // 4. Check expiry
    stored.assertValid();

    // 5. Optional device check (non-strict).
    // If the client provides a deviceId, we keep a best-effort guardrail.
    // If omitted, we allow refresh with only the refresh token for simplicity.
    if (input.deviceId && stored.deviceId !== input.deviceId) {
      throw new InvalidCredentialsError("Device mismatch");
    }

    // 6. Load user
    const user = await this.userRepository.findById(stored.userId);
    if (!user) throw new InvalidCredentialsError("Invalid refresh token");
    user.assertCanLogin();

    // 7. Rotate: revoke old, issue new
    stored.revoke();
    await this.refreshTokenRepository.save(stored);

    const rawRefresh = this.tokenService.generateRawRefreshToken();
    const ttlSeconds = this.tokenService.getRefreshTokenTTLSeconds();
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

    const newRefreshToken = RefreshToken.create({
      userId: user.id,
      deviceId: stored.deviceId,
      tokenHash: IdentityHelper.sha256(rawRefresh),
      expiresAt,
    });
    await this.refreshTokenRepository.save(newRefreshToken);

    const accessToken = this.tokenService.signAccessToken({
      sub: user.id,
      deviceId: stored.deviceId,
      username: user.username,
    });

    return AuthDtoMapper.toResponse(user, {
      accessToken,
      refreshToken: rawRefresh,
      accessTokenExpiresIn: this.tokenService.getAccessTokenTTLSeconds(),
      refreshTokenExpiresAt: expiresAt,
    });
  }
}
