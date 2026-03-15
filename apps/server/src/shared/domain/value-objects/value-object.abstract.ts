/**
 * Abstract base class cho tất cả Value Objects.
 *
 * Value Object là object được định danh bởi GIÁ TRỊ của nó, không phải identity.
 * Hai VO với cùng properties thì được coi là BẰNG NHAU.
 *
 * Đặc điểm quan trọng:
 *  - Immutable: không được thay đổi sau khi tạo
 *  - Self-validating: validate ngay trong constructor
 *  - No identity: không có ID riêng
 *
 * Sử dụng:
 * ```ts
 * interface EmailProps { value: string }
 *
 * export class Email extends ValueObject<EmailProps> {
 *   private constructor(props: EmailProps) {
 *     super(props);
 *   }
 *
 *   static create(email: string): Email {
 *     if (!email.includes('@')) throw new Error('Invalid email');
 *     return new Email({ value: email.toLowerCase().trim() });
 *   }
 *
 *   get value(): string { return this.props.value; }
 *
 *   toString(): string { return this.props.value; }
 * }
 * ```
 */
export abstract class ValueObject<TProps extends Record<string, unknown>> {
  /** Props được đóng băng (frozen) để đảm bảo immutability */
  protected readonly props: Readonly<TProps>;

  protected constructor(props: TProps) {
    // Some subclasses reference `this.props` inside `validate`.
    // Ensure `this.props` is initialized before validation runs.
    this.props = Object.freeze({ ...props });
    this.validate(this.props as TProps);
  }

  /**
   * Override method này để validate props.
   * Ném Error nếu không hợp lệ.
   * Mặc định: không validate gì cả (để subclass tự quyết định).
   */
  protected validate(_props: TProps): void {
    // override in subclass nếu cần
  }

  /**
   * So sánh deep equality dựa trên props.
   * Không dùng `===` vì VO là object reference khác nhau.
   */
  equals(other: ValueObject<TProps>): boolean {
    if (other === null || other === undefined) return false;
    if (other.constructor !== this.constructor) return false;
    return this.deepEqual(this.props, other.props);
  }

  /** Deep equality cho nested objects */
  private deepEqual(a: unknown, b: unknown): boolean {
    if (a === b) return true;
    if (a === null || b === null) return false;
    if (typeof a !== "object" || typeof b !== "object") return false;

    const keysA = Object.keys(a as object);
    const keysB = Object.keys(b as object);
    if (keysA.length !== keysB.length) return false;

    return keysA.every((key) =>
      this.deepEqual(
        (a as Record<string, unknown>)[key],
        (b as Record<string, unknown>)[key],
      ),
    );
  }

  /**
   * Tạo bản copy với một số props thay đổi (vì VO là immutable, không sửa trực tiếp).
   *
   * ```ts
   * const updatedMoney = money.copyWith({ amount: 200 });
   * ```
   */
  protected copyWith(newProps: Partial<TProps>): this {
    const Constructor = this.constructor as new (props: TProps) => this;
    return new Constructor({ ...this.props, ...newProps });
  }
}
