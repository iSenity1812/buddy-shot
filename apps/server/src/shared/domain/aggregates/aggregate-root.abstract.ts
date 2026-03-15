import { EntityBaseProps } from "../entities/base-entiy.props";
import { Entity } from "../entities/entity.abstract";
import { DomainEvent } from "../events/domain-event.abstract";

/**
 * Abstract base class cho Aggregate Root.
 *
 * Aggregate Root là "cổng vào duy nhất" của một Aggregate.
 * Mọi thay đổi state bên trong aggregate phải đi qua AR.
 *
 * Tính năng bổ sung so với Entity:
 *  - Quản lý Domain Events (collect → dispatch sau khi save)
 *  - Enforces invariants của toàn bộ aggregate
 *
 * Sử dụng:
 * ```ts
 * interface UserProps extends EntityBaseProps {
 *   email: Email;
 *   username: string;
 *   passwordHash: string;
 *   status: UserStatus;
 * }
 *
 * export class User extends AggregateRoot<UserProps> {
 *   private constructor(props: UserProps) {
 *     super(props);
 *   }
 *
 *   // ── Factory: tạo mới ──────────────────────────────────────────────────────
 *   static create(input: CreateUserInput): User {
 *     const user = new User({
 *       ...AggregateRoot.createBaseProps(),
 *       email: Email.create(input.email),
 *       username: input.username,
 *       passwordHash: hashPassword(input.password),
 *       status: UserStatus.PENDING,
 *     });
 *
 *     // Raise event sau khi tạo xong
 *     user.addEvent(
 *       new UserRegisteredEvent(user.id, user.version, user.email.value)
 *     );
 *
 *     return user;
 *   }
 *
 *   // ── Factory: tái tạo từ DB (không raise event) ────────────────────────────
 *   static reconstitute(props: UserProps): User {
 *     return new User(props);
 *   }
 *
 *   // ── Commands (business logic) ─────────────────────────────────────────────
 *   activate(): void {
 *     if (this.props.status !== UserStatus.PENDING) {
 *       throw new Error('Only pending users can be activated');
 *     }
 *     this.props.status = UserStatus.ACTIVE;
 *     this.incrementVersion();
 *     this.addEvent(new UserActivatedEvent(this.id, this.version));
 *   }
 *
 *   // ── Getters ───────────────────────────────────────────────────────────────
 *   get email(): Email { return this.props.email; }
 *   get username(): string { return this.props.username; }
 *   get status(): UserStatus { return this.props.status; }
 * }
 * ```
 */
export abstract class AggregateRoot<
  TProps extends EntityBaseProps,
> extends Entity<TProps> {
  /**
   * Domain Events được thu thập trong suốt vòng đời của transaction.
   * Chưa được publish, chỉ được dispatch SAU KHI repository.save() thành công.
   */
  private _domainEvents: DomainEvent[] = [];

  protected constructor(props: TProps) {
    super(props);
  }

  // ─── Domain Events ───────────────────────────────────────────────────────────

  get domainEvents(): ReadonlyArray<DomainEvent> {
    return this._domainEvents;
  }

  /**
   * Thêm event vào danh sách chờ dispatch.
   * Gọi trong các command method sau khi thay đổi state.
   */
  protected addEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  /**
   * Xoá tất cả events sau khi đã dispatch.
   * Repository / Unit of Work sẽ gọi sau khi save thành công:
   *
   * ```ts
   * // trong UserRepository.save():
   * await this.db.save(userRecord);
   * await this.eventBus.publishAll(user.domainEvents);
   * user.clearEvents();
   * ```
   */
  clearEvents(): void {
    this._domainEvents = [];
  }

  /**
   * Trả về tất cả events đang chờ dispatch và đồng thời xoá chúng khỏi aggregate.
   * Repository / Unit of Work sẽ gọi sau khi save thành công
   *
   */
  pullDomainEvents(): DomainEvent[] {
    const events = [...this._domainEvents];
    this.clearEvents();
    return events;
  }

  /**
   * Kiểm tra có event nào đang chờ dispatch không.
   * Hữu ích trong unit test:
   * ```ts
   * expect(user.hasPendingEvents()).toBe(true);
   * expect(user.domainEvents[0]).toBeInstanceOf(UserRegisteredEvent);
   * ```
   */
  hasPendingEvents(): boolean {
    return this._domainEvents.length > 0;
  }

  // ─── Optimistic locking ──────────────────────────────────────────────────────

  /**
   * Kiểm tra version conflict trước khi save.
   * Repository sẽ so sánh version này với version hiện tại trong DB.
   *
   * ```ts
   * // trong repository:
   * const existing = await this.db.findOne({ id: aggregate.id });
   * aggregate.checkVersion(existing.version);   // throws nếu conflict
   * await this.db.save(aggregate);
   * ```
   */
  checkVersion(persistedVersion: number): void {
    if (this.version !== persistedVersion) {
      throw new ConcurrencyError(
        this.constructor.name,
        this.id,
        persistedVersion,
        this.version,
      );
    }
  }
}

// ─── Concurrency Error ────────────────────────────────────────────────────────

/**
 * Thrown khi phát hiện optimistic locking conflict.
 * HTTP layer nên map error này thành 409 Conflict.
 */
export class ConcurrencyError extends Error {
  readonly aggregateType: string;
  readonly aggregateId: string;
  readonly expectedVersion: number;
  readonly actualVersion: number;

  constructor(
    aggregateType: string,
    aggregateId: string,
    expectedVersion: number,
    actualVersion: number,
  ) {
    super(
      `Concurrency conflict on ${aggregateType}(${aggregateId}): ` +
        `expected version ${expectedVersion}, got ${actualVersion}. ` +
        `The aggregate was modified by another process.`,
    );
    this.name = "ConcurrencyError";
    this.aggregateType = aggregateType;
    this.aggregateId = aggregateId;
    this.expectedVersion = expectedVersion;
    this.actualVersion = actualVersion;

    // Fix prototype chain cho instanceof check
    Object.setPrototypeOf(this, ConcurrencyError.prototype);
  }
}
