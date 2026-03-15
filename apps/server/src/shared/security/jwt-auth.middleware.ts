import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { envConfig } from "../config/env.config";
import { Role } from "../types/role.enum";

type AccessTokenPayload = {
  sub: string;
  username?: string;
  iat?: number;
  exp?: number;
};

export function jwtAuthMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    next();
    return;
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    next();
    return;
  }

  try {
    const decoded = jwt.verify(
      token,
      envConfig.jwtSecret,
    ) as AccessTokenPayload;
    req.user = {
      id: decoded.sub,
      name: decoded.username ?? "",
      email: "",
      role: Role.USER,
      isDeleted: false,
    };
  } catch {
    // Invalid/expired token is intentionally ignored here.
    // Route-level auth checks will return UNAUTHORIZED consistently.
  }

  next();
}
