import { inject, injectable } from "inversify";
import { IUseCase } from "@/shared/application";
import { IDENTITY_KEY } from "../../di/identity.token";
import type { IUserRepository } from "../../domain/repositories/auth.repository.interface";
import type { IPasswordHasher } from "../../domain/services/auth.service.interface";
import {
  InvalidCredentialsError,
  UserNotFoundError,
} from "../../domain/errors/identity.error";
import { PlainPassword } from "../../domain/value-objects/plain-passowrd.vo";
import { ChangePasswordInputDto } from "../input/change-password.dto";

@injectable()
export class ChangePasswordUseCase
  implements IUseCase<ChangePasswordInputDto, void>
{
  constructor(
    @inject(IDENTITY_KEY.REPOSITORY.USER)
    private readonly userRepository: IUserRepository,

    @inject(IDENTITY_KEY.DOMAIN_SERVICE.PASSWORD_HASHER)
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  async execute(input: ChangePasswordInputDto): Promise<void> {
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new UserNotFoundError({ userId: input.userId });
    }

    const isCurrentValid = await this.passwordHasher.compare(
      PlainPassword.create(input.currentPassword),
      user.passwordHash,
    );
    if (!isCurrentValid) {
      throw new InvalidCredentialsError();
    }

    const newPlainPassword = PlainPassword.create(input.newPassword);
    const newHashedPassword = await this.passwordHasher.hash(newPlainPassword);

    user.changePassword(newHashedPassword);
    await this.userRepository.save(user);
  }
}
