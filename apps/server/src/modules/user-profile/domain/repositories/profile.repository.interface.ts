import { Profile } from "../entities/profile";

/**
 * Repository interface for the Profile aggregate.
 * Lives in domain/ — defines the CONTRACT only.
 * Implementation lives in infrastructure/repositories/.
 */
export interface IProfileRepository {
  /** Load by userId (Profile.id === User.id) */
  findByUserId(userId: string): Promise<Profile | null>;

  /** Load by username — for discovery & duplicate check */
  findByUsername(username: string): Promise<Profile | null>;

  /**
   * Persist a Profile aggregate.
   * Implementation MUST:
   *  1. Check optimistic locking version (throw ConcurrencyError if mismatch)
   *  2. INSERT or UPDATE the record
   *  3. Publish domainEvents via IEventBus
   *  4. Call profile.clearEvents()
   */
  save(profile: Profile): Promise<void>;
}
