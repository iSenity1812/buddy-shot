/**
 * Basic properties for all entities in the system.
 * Extend interface in specific entities to add more properties.
 *
 * ```ts
 * interface UserProps extends EntityBaseProps {
 *   email: Email;        // Value Object
 *   username: string;
 *   role: UserRole;      // Enum / VO
 * }
 * ```
 */

export interface EntityBaseProps {
  id: string;
  createdAt: Date;
  updatedAt: Date;

  /**
   * Optimistic locking — tăng mỗi khi save.
   * Nếu version trong DB khác version hiện tại → throw ConcurrencyError.
   */
  version: number;
}
