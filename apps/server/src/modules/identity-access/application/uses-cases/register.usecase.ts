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
import { PRISMA_CLIENT } from "@/shared/shared-di.tokens";
import type { IEventBus, IUseCase } from "@/shared/application";
import { RegisterInputDto } from "../input/register.dto";
import { AuthResponseOutputDto } from "../output/auth-respose.dto";
import { EmailValidationError } from "../../domain/errors/identity.error";
import { PlainPassword } from "../../domain/value-objects/plain-passowrd.vo";
import { User } from "../../domain/entities/user";
import { RefreshToken } from "../../domain/entities/refresh-token";
import { IdentityHelper } from "../helpers/identity.helper";
import { AuthDtoMapper } from "../mappers/auth.mapper";
import type { PrismaClient } from "@prisma/client";

@injectable()
export class RegisterUseCase implements IUseCase<
  RegisterInputDto,
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

    @inject(PRISMA_CLIENT)
    private readonly prisma: PrismaClient,
  ) {}

  async execute(input: RegisterInputDto): Promise<AuthResponseOutputDto> {
    // 1. Guard: unique email
    const emailExists = await this.userRepository.existsByEmail(input.email);
    if (emailExists) throw new EmailValidationError(input.email);

    // 2. hash password
    const plain = PlainPassword.create(input.password);
    const hashed = await this.passwordHasher.hash(plain);

    // 3. create user aggregate
    const userId = crypto.randomUUID();
    const user = User.create({
      userId: userId,
      email: input.email,
      username: input.username.toLowerCase().trim(),
      passwordHash: hashed.value,
    });

    // 4-6. Persist + issue auth artifacts.
    // If any post-create step fails, compensate by removing the created user
    // so register does not leave partial state behind.
    try {
      await this.userRepository.save(user);

      const pushToken = this.resolveDevicePushToken({
        pushToken: input.device?.pushToken,
        deviceId: input.device?.deviceId,
        userId,
      });

      const deviceId = await this.deviceService.resolveDevice({
        userId,
        pushToken,
        platform: input.device?.platform,
      });

      const tokenPair = await this.issueTokenPair(user, deviceId);
      return AuthDtoMapper.toResponse(user, tokenPair);
    } catch (error) {
      try {
        await this.prisma.user.delete({ where: { id: userId } });
      } catch {
        // Best-effort compensation only.
      }
      throw error;
    }
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

    // Final fallback for desktop/testing clients with no device metadata.
    return `desktop:${context.userId}`;
  }

  private async issueTokenPair(user: User, deviceId: string) {
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

    return {
      accessToken,
      refreshToken: rawRefresh,
      accessTokenExpiresIn: this.tokenService.getAccessTokenTTLSeconds(),
      refreshTokenExpiresAt: expiresAt,
    };
  }
}
