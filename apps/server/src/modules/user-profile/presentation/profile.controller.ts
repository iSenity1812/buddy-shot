import type { NextFunction, Request, Response } from "express";
import { inject } from "inversify";
import { controller, httpGet, httpPatch, httpPost } from "inversify-express-utils";
import { GetProfileUseCase } from "../application/use-cases/get-profile.usecase";
import { UpdateProfileUseCase } from "../application/use-cases/update-profile.usecase";
import { ChangeAvatarUseCase } from "../application/use-cases/change-avatar.usecase";
import { GenerateProfileQrCodeUseCase } from "../application/use-cases/generate-profile-qrcode.usecase";
import { GenerateAvatarUploadUrlUseCase } from "../application/use-cases/generate-avatar-upload-url.usecase";
import { PROFILE_KEY } from "../di/profile.token";
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
import jwt from "jsonwebtoken";
import { envConfig } from "@/shared/config/env.config";

@controller("/profiles")
export class ProfileController {
  constructor(
    @inject(PROFILE_KEY.USE_CASE.GET_PROFILE)
    private readonly getProfileUseCase: GetProfileUseCase,

    @inject(PROFILE_KEY.USE_CASE.UPDATE_PROFILE)
    private readonly updateProfileUseCase: UpdateProfileUseCase,

    @inject(PROFILE_KEY.USE_CASE.CHANGE_AVATAR)
    private readonly changeAvatarUseCase: ChangeAvatarUseCase,

    @inject(PROFILE_KEY.USE_CASE.GENERATE_QR_CODE)
    private readonly generateProfileQrCodeUseCase: GenerateProfileQrCodeUseCase,

    @inject(PROFILE_KEY.USE_CASE.GENERATE_AVATAR_UPLOAD_URL)
    private readonly generateAvatarUploadUrlUseCase: GenerateAvatarUploadUrlUseCase,
  ) {}

  @httpGet("/me")
  @RoleDecorator(Role.USER, Role.ADMIN)
  async getMyProfile(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const userId = this.getAuthorizedUserId(req, "getMyProfile");
      const profile = await this.getProfileUseCase.execute({ userId });

      return res.status(200).json(
        ok(profile, {
          message: "Profile fetched successfully.",
        }),
      );
    } catch (error) {
      next(error);
    }
  }

  @httpGet("/:username")
  @RoleDecorator(Role.USER, Role.ADMIN)
  async getProfileByUsername(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      this.assertRole(req, "getProfileByUsername");
      const profile = await this.getProfileUseCase.execute({
        username: req.params.username,
      });

      return res.status(200).json(
        ok(profile, {
          message: "Profile fetched successfully.",
        }),
      );
    } catch (error) {
      next(error);
    }
  }

  @httpPatch("/me")
  @RoleDecorator(Role.USER, Role.ADMIN)
  async updateMyProfile(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const userId = this.getAuthorizedUserId(req, "updateMyProfile");
      const profile = await this.updateProfileUseCase.execute({
        userId,
        username: req.body?.username,
        bio: req.body?.bio,
      });

      return res.status(200).json(
        ok(profile, {
          message: "Profile updated successfully.",
        }),
      );
    } catch (error) {
      next(error);
    }
  }

  @httpPatch("/me/avatar")
  @RoleDecorator(Role.USER, Role.ADMIN)
  async changeMyAvatar(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const userId = this.getAuthorizedUserId(req, "changeMyAvatar");
      const profile = await this.changeAvatarUseCase.execute({
        userId,
        avatarKey: req.body?.avatarKey ?? null,
      });

      return res.status(200).json(
        ok(profile, {
          message: "Avatar changed successfully.",
        }),
      );
    } catch (error) {
      next(error);
    }
  }

  @httpPost("/me/avatar/upload-url")
  @RoleDecorator(Role.USER, Role.ADMIN)
  async generateMyAvatarUploadUrl(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const userId = this.getAuthorizedUserId(req, "generateMyAvatarUploadUrl");
      const output = await this.generateAvatarUploadUrlUseCase.execute({
        userId,
        fileExt: req.body?.fileExt,
        contentType: req.body?.contentType,
      });

      return res.status(200).json(
        ok(output, {
          message: "Avatar upload URL generated successfully.",
        }),
      );
    } catch (error) {
      next(error);
    }
  }

  @httpGet("/me/qrcode")
  @RoleDecorator(Role.USER, Role.ADMIN)
  async generateMyProfileQrCode(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const userId = this.getAuthorizedUserId(req, "generateMyProfileQrCode");
      const payload = await this.generateProfileQrCodeUseCase.execute(userId);

      return res.status(200).json(
        ok(payload, {
          message: "Profile QR code generated successfully.",
        }),
      );
    } catch (error) {
      next(error);
    }
  }

  private getAuthorizedUserId(
    req: Request,
    methodName: keyof ProfileController & string,
  ): string {
    this.hydrateUserFromBearer(req);
    this.assertRole(req, methodName);

    if (!req.user?.id) {
      throw new UnauthorizedError("Authentication required");
    }

    return req.user.id;
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
    methodName: keyof ProfileController & string,
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
