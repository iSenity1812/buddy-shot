import type { NextFunction, Request, Response } from "express";
import { inject } from "inversify";
import { controller, httpPost } from "inversify-express-utils";
import { ok } from "@/shared/http/builder/response.factory";
import {
  Role as RoleDecorator,
  ROLE_METADATA_KEY,
} from "@/shared/security/role.decorator";
import { Role } from "@/shared/types/role.enum";
import {
  ForbiddenError,
  UnauthorizedError,
} from "@/shared/errors/domain-error";
import { IDENTITY_KEY } from "../di/identity.token";
import { RegisterUseCase } from "../application/uses-cases/register.usecase";
import { LoginUseCase } from "../application/uses-cases/login.usecase";
import { RefreshTokenUseCase } from "../application/uses-cases/refresh.usecase";
import { LogoutUseCase } from "../application/uses-cases/logout.usecase";
import jwt from "jsonwebtoken";
import { envConfig } from "@/shared/config/env.config";

@controller("/auth")
export class AuthController {
  constructor(
    @inject(IDENTITY_KEY.USE_CASE.REGISTER)
    private readonly registerUseCase: RegisterUseCase,

    @inject(IDENTITY_KEY.USE_CASE.LOGIN)
    private readonly loginUseCase: LoginUseCase,

    @inject(IDENTITY_KEY.USE_CASE.REFRESH)
    private readonly refreshTokenUseCase: RefreshTokenUseCase,

    @inject(IDENTITY_KEY.USE_CASE.LOGOUT)
    private readonly logoutUseCase: LogoutUseCase,
  ) {}

  @httpPost("/register")
  async register(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const output = await this.registerUseCase.execute(req.body);

      return res.status(201).json(
        ok(output, {
          message: "Registration successful.",
        }),
      );
    } catch (error) {
      next(error);
    }
  }

  @httpPost("/login")
  async login(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const output = await this.loginUseCase.execute(req.body, req.ip);

      return res.status(200).json(
        ok(output, {
          message: "Login successful.",
        }),
      );
    } catch (error) {
      next(error);
    }
  }

  @httpPost("/refresh")
  async refreshToken(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const authHeader = req.headers.authorization;
      const bearer =
        authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";

      const rawRefreshToken =
        req.body?.rawRefreshToken ?? req.body?.refreshToken ?? bearer;

      const output = await this.refreshTokenUseCase.execute({
        rawRefreshToken,
        deviceId: req.body?.deviceId,
      });

      return res.status(200).json(
        ok(output, {
          message: "Token refreshed successfully.",
        }),
      );
    } catch (error) {
      next(error);
    }
  }

  @httpPost("/logout")
  @RoleDecorator(Role.USER, Role.ADMIN)
  async logout(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      this.hydrateUserFromBearer(req);
      this.assertRole(req, "logout");
      if (!req.user?.id) {
        throw new UnauthorizedError("Authentication required");
      }

      await this.logoutUseCase.execute({
        userId: req.user.id,
        deviceId: req.body?.deviceId,
        allDevices: req.body?.allDevices,
      });

      return res.status(200).json(
        ok(undefined, {
          message: "Logout successful.",
        }),
      );
    } catch (error) {
      next(error);
    }
  }

  private hydrateUserFromBearer(req: Request): void {
    if (req.user?.id) {
      return;
    }

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return;
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      return;
    }

    try {
      const decoded = jwt.verify(token, envConfig.jwtSecret) as {
        sub: string;
        username?: string;
      };

      req.user = {
        id: decoded.sub,
        name: decoded.username ?? "",
        email: "",
        role: Role.USER,
        isDeleted: false,
      };
    } catch {
      // Keep route-level unauthorized behavior.
    }
  }

  private assertRole(
    req: Request,
    methodName: keyof AuthController & string,
  ): void {
    const requiredRoles = Reflect.getMetadata(
      ROLE_METADATA_KEY,
      Object.getPrototypeOf(this),
      methodName,
    ) as Role[] | undefined;

    if (!requiredRoles || requiredRoles.length === 0) {
      return;
    }

    const role = req.user?.role;
    if (!role) {
      throw new UnauthorizedError("Authentication required");
    }

    if (!requiredRoles.includes(role)) {
      throw new ForbiddenError("You do not have permission");
    }
  }
}
