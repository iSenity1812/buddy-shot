import { createHash } from "crypto";

export class IdentityHelper {
  /** SHA-256 hash of the raw token — used for fast DB lookup before bcrypt compare */
  static sha256(raw: string): string {
    return createHash("sha256").update(raw).digest("hex");
  }
}
