import type { NextFunction, Request, Response } from "express";
import { inject } from "inversify";
import { controller, httpGet, httpPost } from "inversify-express-utils";
import { ok, paginated } from "@/shared/http/builder/response.factory";
import {
  ForbiddenError,
  UnauthorizedError,
} from "@/shared/errors/domain-error";
import {
  Role as RoleDecorator,
  ROLE_METADATA_KEY,
} from "@/shared/security/role.decorator";
import { Role } from "@/shared/types/role.enum";
import { PHOTO_SHARING_KEY } from "../di/photo-sharing.token";
import { SendPhotoUseCase } from "../application/use-cases/send-photo.usecase";
import { GetPhotoFeedUseCase } from "../application/use-cases/get-photo-feed.usecase";

@controller("/photos")
export class PhotoSharingController {
  constructor(
    @inject(PHOTO_SHARING_KEY.USE_CASE.SEND_PHOTO)
    private readonly sendPhotoUseCase: SendPhotoUseCase,

    @inject(PHOTO_SHARING_KEY.USE_CASE.GET_FEED)
    private readonly getPhotoFeedUseCase: GetPhotoFeedUseCase,
  ) {}

  @httpPost("/send")
  @RoleDecorator(Role.USER, Role.ADMIN)
  async sendPhoto(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const senderId = this.getAuthorizedUserId(req, "sendPhoto");
      const result = await this.sendPhotoUseCase.execute({
        senderId,
        imageKey: req.body?.imageKey,
        caption: req.body?.caption,
        recipientIds: req.body?.recipientIds,
      });

      return res.status(201).json(
        ok(result, {
          message: "Photo sent successfully.",
        }),
      );
    } catch (error) {
      next(error);
    }
  }

  @httpGet("/feed")
  @RoleDecorator(Role.USER, Role.ADMIN)
  async getFeed(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const userId = this.getAuthorizedUserId(req, "getFeed");
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 20;
      const sort = req.query.sort === "asc" ? "asc" : "desc";

      const result = await this.getPhotoFeedUseCase.execute({
        userId,
        username: req.query.username ? String(req.query.username) : undefined,
        from: req.query.from ? new Date(String(req.query.from)) : undefined,
        to: req.query.to ? new Date(String(req.query.to)) : undefined,
        page,
        limit,
        sort,
      });

      return res.status(200).json(
        paginated(result.items, {
          page: result.page,
          limit: result.limit,
          total: result.total,
          message: "Photo feed fetched successfully.",
        }),
      );
    } catch (error) {
      next(error);
    }
  }

  private getAuthorizedUserId(
    req: Request,
    methodName: keyof PhotoSharingController & string,
  ): string {
    this.assertRole(req, methodName);

    if (!req.user?.id) {
      throw new UnauthorizedError("Authentication required");
    }

    return req.user.id;
  }

  private assertRole(
    req: Request,
    methodName: keyof PhotoSharingController & string,
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
