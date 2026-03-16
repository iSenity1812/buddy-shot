import { inject, injectable } from "inversify";
import { IUseCase } from "@/shared/application";
import { IDENTITY_KEY } from "../../di/identity.token";
import type { IUserRepository } from "../../domain/repositories/auth.repository.interface";
import { UserNotFoundError } from "../../domain/errors/identity.error";
import { GetMeInputDto } from "../input/get-me.dto";
import { AccountResponseOutputDto } from "../output/account-response.dto";

@injectable()
export class GetMeUseCase
  implements IUseCase<GetMeInputDto, AccountResponseOutputDto>
{
  constructor(
    @inject(IDENTITY_KEY.REPOSITORY.USER)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(input: GetMeInputDto): Promise<AccountResponseOutputDto> {
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new UserNotFoundError({ userId: input.userId });
    }

    return {
      id: user.id,
      email: user.email.value,
      username: user.username,
    };
  }
}