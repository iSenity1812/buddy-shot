import { inject, injectable } from "inversify";
import { IUseCase } from "@/shared/application";
import { IDENTITY_KEY } from "../../di/identity.token";
import type { IUserRepository } from "../../domain/repositories/auth.repository.interface";
import {
  EmailAlreadyExistsError,
  UserNotFoundError,
} from "../../domain/errors/identity.error";
import { UpdateEmailInputDto } from "../input/update-email.dto";
import { AccountResponseOutputDto } from "../output/account-response.dto";

@injectable()
export class UpdateEmailUseCase
  implements IUseCase<UpdateEmailInputDto, AccountResponseOutputDto>
{
  constructor(
    @inject(IDENTITY_KEY.REPOSITORY.USER)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(input: UpdateEmailInputDto): Promise<AccountResponseOutputDto> {
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new UserNotFoundError({ userId: input.userId });
    }

    const nextEmail = input.email.toLowerCase().trim();
    if (nextEmail !== user.email.value) {
      const existed = await this.userRepository.findByEmail(nextEmail);
      if (existed && existed.id !== user.id) {
        throw new EmailAlreadyExistsError({ email: nextEmail });
      }

      user.changeEmail(nextEmail);
      await this.userRepository.save(user);
    }

    return {
      id: user.id,
      email: user.email.value,
      username: user.username,
    };
  }
}
