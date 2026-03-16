import type { NextFunction, Request, Response } from "express";
import { randomUUID } from "crypto";
import multer from "multer";
import { inject } from "inversify";
import {
  controller,
  httpDelete,
  httpGet,
  httpPatch,
  httpPost,
} from "inversify-express-utils";
import type { IStoragePort } from "@/modules/user-profile/application/ports/storage.port";
import { PROFILE_KEY } from "@/modules/user-profile/di/profile.token";
import { ok, paginated } from "@/shared/http/builder/response.factory";
import {
  DomainError,
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
import { GetAllPhotosUseCase } from "../application/use-cases/get-all-photos.usecase";
import { GetMyPhotosUseCase } from "../application/use-cases/get-my-photos.usecase";
import { UpdateMyPhotoCaptionUseCase } from "../application/use-cases/update-my-photo-caption.usecase";
import { DeleteMyPhotoUseCase } from "../application/use-cases/delete-my-photo.usecase";

const PHOTO_UPLOAD_MIDDLEWARE = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

@controller("/photos")
export class PhotoSharingController {
  constructor(
    @inject(PHOTO_SHARING_KEY.USE_CASE.SEND_PHOTO)
    private readonly sendPhotoUseCase: SendPhotoUseCase,

    @inject(PHOTO_SHARING_KEY.USE_CASE.GET_FEED)
    private readonly getPhotoFeedUseCase: GetPhotoFeedUseCase,

    @inject(PHOTO_SHARING_KEY.USE_CASE.GET_ALL_PHOTOS)
    private readonly getAllPhotosUseCase: GetAllPhotosUseCase,

    @inject(PHOTO_SHARING_KEY.USE_CASE.GET_MY_PHOTOS)
    private readonly getMyPhotosUseCase: GetMyPhotosUseCase,

    @inject(PHOTO_SHARING_KEY.USE_CASE.UPDATE_MY_PHOTO_CAPTION)
    private readonly updateMyPhotoCaptionUseCase: UpdateMyPhotoCaptionUseCase,

    @inject(PHOTO_SHARING_KEY.USE_CASE.DELETE_MY_PHOTO)
    private readonly deleteMyPhotoUseCase: DeleteMyPhotoUseCase,

    @inject(PROFILE_KEY.PORT.STORAGE)
    private readonly storagePort: IStoragePort,
  ) {}

  @httpPost("/upload-direct", PHOTO_UPLOAD_MIDDLEWARE.single("file"))
  @RoleDecorator(Role.USER, Role.ADMIN)
  async uploadPhotoDirectly(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      this.getAuthorizedUserId(req, "uploadPhotoDirectly");
      const file = (req as Request & { file?: multer.Multer.File }).file;

      if (!file) {
        throw new DomainError(
          "VALIDATION_ERROR",
          "Missing file. Send multipart/form-data with field name 'file'.",
          400,
        );
      }

      const ext = this.resolvePhotoExtension(file.mimetype);
      if (!ext) {
        throw new DomainError(
          "VALIDATION_ERROR",
          "Invalid photo type. Allowed: image/jpeg, image/png, image/webp.",
          400,
        );
      }

      const imageKey = `photos/${randomUUID()}.${ext}`;
      await this.storagePort.putObject(imageKey, file.buffer, file.mimetype);

      return res.status(200).json(
        ok(
          {
            imageKey,
            imageUrl: this.storagePort.getPublicUrl(imageKey),
          },
          {
            message: "Photo uploaded successfully.",
          },
        ),
      );
    } catch (error) {
      next(error);
    }
  }

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

  @httpGet("/all")
  @RoleDecorator(Role.USER, Role.ADMIN)
  async getAllPhotos(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const userId = this.getAuthorizedUserId(req, "getAllPhotos");
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 20;
      const sort = req.query.sort === "asc" ? "asc" : "desc";

      const result = await this.getAllPhotosUseCase.execute({
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
          message: "All related photos fetched successfully.",
        }),
      );
    } catch (error) {
      next(error);
    }
  }

  @httpGet("/me")
  @RoleDecorator(Role.USER, Role.ADMIN)
  async getMyPhotos(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const userId = this.getAuthorizedUserId(req, "getMyPhotos");
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 20;
      const sort = req.query.sort === "asc" ? "asc" : "desc";

      const result = await this.getMyPhotosUseCase.execute({
        userId,
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
          message: "My photos fetched successfully.",
        }),
      );
    } catch (error) {
      next(error);
    }
  }

  @httpPatch("/:photoId/caption")
  @RoleDecorator(Role.USER, Role.ADMIN)
  async updateMyCaption(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const userId = this.getAuthorizedUserId(req, "updateMyCaption");
      const result = await this.updateMyPhotoCaptionUseCase.execute({
        userId,
        photoId: String(req.params.photoId ?? ""),
        caption: String(req.body?.caption ?? ""),
      });

      return res.status(200).json(
        ok(result, {
          message: "Caption updated successfully.",
        }),
      );
    } catch (error) {
      next(error);
    }
  }

  @httpDelete("/:photoId")
  @RoleDecorator(Role.USER, Role.ADMIN)
  async deleteMyPhoto(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const userId = this.getAuthorizedUserId(req, "deleteMyPhoto");
      await this.deleteMyPhotoUseCase.execute({
        userId,
        photoId: String(req.params.photoId ?? ""),
      });

      return res.status(200).json(
        ok(undefined, {
          message: "Photo deleted successfully.",
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

  private resolvePhotoExtension(
    mimeType: string,
  ): "jpg" | "png" | "webp" | null {
    switch (mimeType) {
      case "image/jpeg":
        return "jpg";
      case "image/png":
        return "png";
      case "image/webp":
        return "webp";
      default:
        return null;
    }
  }
}
