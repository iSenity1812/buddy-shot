import { AuthenticatedUser } from "../security/authenticated-user.interface";

declare global {
  namespace Express {
    interface User extends AuthenticatedUser {}

    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export {};
