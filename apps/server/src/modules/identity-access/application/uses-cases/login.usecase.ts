import { injectable, inject } from "inversify";
import { IDENTITY_KEY } from "../../di/identity.token";
import type {
  IRefreshTokenRepository,
  IUserRepository,
} from "../../domain/repositories/auth.repository.interface";
import type {
  IDeviceService,
  IPasswordHasher,
  ITokenService,
} from "../../domain/services/auth.service.interface";
import { EVENT_BUS } from "@/shared/shared-di.tokens";
import type { IEventBus, IUseCase } from "@/shared/application";
import { AuthResponseOutputDto } from "../output/auth-respose.dto";
import {
  EmailValidationError,
  InvalidCredentialsError,
} from "../../domain/errors/identity.error";
import { PlainPassword } from "../../domain/value-objects/plain-passowrd.vo";
import { User } from "../../domain/entities/user";
import { RefreshToken } from "../../domain/entities/refresh-token";
import { IdentityHelper } from "../helpers/identity.helper";
import { AuthDtoMapper } from "../mappers/auth.mapper";
import { LoginInputDto } from "../input/login.dto";
import { UserLoggedInEvent } from "../../domain/events/user-logged-in.event";

@injectable()
export class LoginUseCase implements IUseCase<
  LoginInputDto,
  AuthResponseOutputDto
> {
  constructor(
    @inject(IDENTITY_KEY.REPOSITORY.USER)
    private readonly userRepository: IUserRepository,

    @inject(IDENTITY_KEY.REPOSITORY.REFRESH_TOKEN)
    private readonly refreshTokenRepository: IRefreshTokenRepository,

    @inject(IDENTITY_KEY.DOMAIN_SERVICE.PASSWORD_HASHER)
    private readonly passwordHasher: IPasswordHasher,

    @inject(IDENTITY_KEY.DOMAIN_SERVICE.DEVICE)
    private readonly deviceService: IDeviceService,

    @inject(IDENTITY_KEY.DOMAIN_SERVICE.TOKEN)
    private readonly tokenService: ITokenService,

    @inject(EVENT_BUS)
    private readonly eventBus: IEventBus,
  ) {}

  async execute(
    input: LoginInputDto,
    ip?: string,
  ): Promise<AuthResponseOutputDto> {
    // 1. find user
    const user = await this.userRepository.findByEmail(input.email);
    if (!user) throw new EmailValidationError(input.email);

    // 2. check account status
    user.assertCanLogin();

    // 3. verify password
    const plain = PlainPassword.create(input.password);
    const passwordValid = await this.passwordHasher.compare(
      plain,
      user.passwordHash,
    );
    if (!passwordValid) {
      throw new InvalidCredentialsError();
    }

    const pushToken = this.resolveDevicePushToken({
      pushToken: input.device?.pushToken,
      deviceId: input.device?.deviceId,
      userId: user.id,
    });

    // 4. Resolve device info
    const deviceId = await this.deviceService.resolveDevice({
      userId: user.id,
      pushToken,
      platform: input.device?.platform,
    });

    // 5. Revoke existing tokens for this device (single-session-per-device)
    await this.refreshTokenRepository.revokeAllForDevice(deviceId);

    // 6. Issue new token pair
    const rawRefresh = this.tokenService.generateRawRefreshToken();
    const ttlSeconds = this.tokenService.getRefreshTokenTTLSeconds();
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

    const refreshToken = RefreshToken.create({
      userId: user.id,
      deviceId,
      tokenHash: IdentityHelper.sha256(rawRefresh),
      expiresAt,
    });
    await this.refreshTokenRepository.save(refreshToken);

    const accessToken = this.tokenService.signAccessToken({
      sub: user.id,
      deviceId,
      username: user.username,
    });

    // 7. Raise login event (audit / anomaly detection)
    await this.eventBus.publish(
      new UserLoggedInEvent(user.id, user.version, {
        deviceId,
        platform: (input.device?.platform ?? "DESKTOP").toUpperCase(),
        ip,
      }),
    );
    return AuthDtoMapper.toResponse(user, {
      accessToken,
      refreshToken: rawRefresh,
      accessTokenExpiresIn: this.tokenService.getAccessTokenTTLSeconds(),
      refreshTokenExpiresAt: expiresAt,
    });
  }

  private resolveDevicePushToken(context: {
    pushToken: string | undefined;
    deviceId: string | undefined;
    userId: string;
  }): string {
    const pushToken = context.pushToken?.trim();
    if (pushToken) {
      return pushToken;
    }

    const deviceId = context.deviceId?.trim();
    if (deviceId) {
      return `device:${deviceId}`;
    }

    return `desktop:${context.userId}`;
  }
}
