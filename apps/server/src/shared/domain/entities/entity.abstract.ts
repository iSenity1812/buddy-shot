import { randomUUID } from "crypto";
import { EntityBaseProps } from "./base-entiy.props";

/**
 * Abstract base class cho tất cả Entities trong domain.
 *
 * Entity được định danh bởi IDENTITY (id) của nó.
 * Hai entity cùng id thì bằng nhau, dù props khác nhau.
 *
 * KHÔNG dùng class này trực tiếp. Dùng AggregateRoot cho Aggregate Root,
 * và Entity cho các child entities bên trong aggregate.
 *
 * Sử dụng:
 * ```ts
 * export class OrderItem extends Entity<OrderItemProps> {
 *   private constructor(props: OrderItemProps) {
 *     super(props);
 *   }
 *
 *   static create(props: Omit<OrderItemProps, keyof EntityBaseProps>): OrderItem {
 *     return new OrderItem({
 *       ...Entity.createBaseProps(),
 *       ...props,
 *     });
 *   }
 *
 *   static reconstitute(props: OrderItemProps): OrderItem {
 *     return new OrderItem(props);
 *   }
 * }
 * ```
 */
export abstract class Entity<TProps extends EntityBaseProps> {
  protected readonly props: TProps;

  protected constructor(props: TProps) {
    this.props = props;
  }

  // ─── Identity ────────────────────────────────────────────────────────────────

  get id(): string {
    return this.props.id;
  }

  /** So sánh theo identity (id), không quan tâm props */
  equals(other?: Entity<TProps>): boolean {
    if (other === null || other === undefined) return false;
    if (!(other instanceof Entity)) return false;
    return this.props.id === other.props.id;
  }

  // ─── Audit fields ────────────────────────────────────────────────────────────

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // ─── Optimistic locking ──────────────────────────────────────────────────────

  get version(): number {
    return this.props.version;
  }

  /**
   * Gọi mỗi khi có thay đổi state.
   * Tăng version và cập nhật updatedAt.
   * Repository sẽ dùng version này để check conflict khi save.
   */
  protected incrementVersion(): void {
    (this.props as EntityBaseProps).version += 1;
    (this.props as EntityBaseProps).updatedAt = new Date();
  }

  // ─── Helper tạo base props khi create mới ────────────────────────────────────

  /**
   * Dùng trong static factory method `create()` của subclass:
   * ```ts
   * static create(input: CreateUserInput): User {
   *   return new User({ ...Entity.createBaseProps(), ...input });
   * }
   * ```
   */
  protected static createBaseProps(): EntityBaseProps {
    const now = new Date();
    return {
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
      version: 0,
    };
  }

  toJSON(): TProps {
    return this.props;
  }
}
