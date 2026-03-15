import { injectable } from "inversify";
import { IPasswordHasher } from "../../domain/services/auth.service.interface";
import { PlainPassword } from "../../domain/value-objects/plain-passowrd.vo";
import { HashedPassword } from "../../domain/value-objects/hashed-password.vo";
import bcrypt from "bcrypt";

@injectable()
export class BcryptPasswordHasher implements IPasswordHasher {
  private static readonly ROUNDS = 12;

  async hash(plain: PlainPassword): Promise<HashedPassword> {
    const hash = await bcrypt.hash(plain.value, BcryptPasswordHasher.ROUNDS);
    return HashedPassword.fromHash(hash);
  }

  async compare(
    plain: PlainPassword,
    hashed: HashedPassword,
  ): Promise<boolean> {
    return bcrypt.compare(plain.value, hashed.value);
  }
}
