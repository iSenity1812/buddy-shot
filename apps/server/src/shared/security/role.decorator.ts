import { Role as UserRole } from "../types/role.enum";

export const ROLE_METADATA_KEY = Symbol("role_metadata_key");

export function Role(...roles: UserRole[]): MethodDecorator {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    Reflect.defineMetadata(ROLE_METADATA_KEY, roles, target, propertyKey);
    return descriptor;
  };
}
