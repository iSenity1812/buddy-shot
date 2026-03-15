import type { NextFunction, Request, Response } from "express";
import { inject } from "inversify";
import {
  controller,
  httpDelete,
  httpGet,
  httpPatch,
  httpPost,
} from "inversify-express-utils";
import { ok } from "@/shared/http/builder/response.factory";
import {
  ForbiddenError,
  UnauthorizedError,
} from "@/shared/errors/domain-error";
import {
  Role as RoleDecorator,
  ROLE_METADATA_KEY,
} from "@/shared/security/role.decorator";
import { Role } from "@/shared/types/role.enum";
import { SOCIAL_FRIEND_KEY } from "../di/social-friend.token";
import { SendFriendRequestUseCase } from "../application/use-cases/send-friend-request.usecase";
import { RespondFriendRequestUseCase } from "../application/use-cases/respond-friend-request.usecase";
import { ListIncomingFriendRequestsUseCase } from "../application/use-cases/list-incoming-friend-requests.usecase";
import { ListOutgoingFriendRequestsUseCase } from "../application/use-cases/list-outgoing-friend-requests.usecase";
import { ListFriendsUseCase } from "../application/use-cases/list-friends.usecase";
import { RemoveFriendUseCase } from "../application/use-cases/remove-friend.usecase";
import { SearchUsersUseCase } from "../application/use-cases/search-users.usecase";
import { SocialFriendValidationError } from "../domain/errors/social-friend.error";

@controller("/social/friends")
export class SocialFriendController {
  constructor(
    @inject(SOCIAL_FRIEND_KEY.USE_CASE.SEND_FRIEND_REQUEST)
    private readonly sendFriendRequestUseCase: SendFriendRequestUseCase,

    @inject(SOCIAL_FRIEND_KEY.USE_CASE.RESPOND_TO_FRIEND_REQUEST)
    private readonly respondFriendRequestUseCase: RespondFriendRequestUseCase,

    @inject(SOCIAL_FRIEND_KEY.USE_CASE.LIST_INCOMING_REQUESTS)
    private readonly listIncomingFriendRequestsUseCase: ListIncomingFriendRequestsUseCase,

    @inject(SOCIAL_FRIEND_KEY.USE_CASE.LIST_OUTGOING_REQUESTS)
    private readonly listOutgoingFriendRequestsUseCase: ListOutgoingFriendRequestsUseCase,

    @inject(SOCIAL_FRIEND_KEY.USE_CASE.LIST_FRIENDS)
    private readonly listFriendsUseCase: ListFriendsUseCase,

    @inject(SOCIAL_FRIEND_KEY.USE_CASE.REMOVE_FRIEND)
    private readonly removeFriendUseCase: RemoveFriendUseCase,

    @inject(SOCIAL_FRIEND_KEY.USE_CASE.SEARCH_USERS)
    private readonly searchUsersUseCase: SearchUsersUseCase,
  ) {}

  @httpPost("/requests")
  @RoleDecorator(Role.USER, Role.ADMIN)
  async sendFriendRequest(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const requesterId = this.getAuthorizedUserId(req, "sendFriendRequest");
      const result = await this.sendFriendRequestUseCase.execute({
        requesterId,
        addresseeId: req.body?.addresseeId,
      });

      return res.status(201).json(
        ok(result, {
          message: "Friend request sent successfully.",
        }),
      );
    } catch (error) {
      next(error);
    }
  }

  @httpPatch("/requests/:friendshipId")
  @RoleDecorator(Role.USER, Role.ADMIN)
  async respondToFriendRequest(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const actorId = this.getAuthorizedUserId(req, "respondToFriendRequest");
      const friendshipId = this.requireRouteParam(
        req.params.friendshipId,
        "friendshipId",
      );
      const result = await this.respondFriendRequestUseCase.execute({
        friendshipId,
        actorId,
        action: req.body?.action,
      });

      return res.status(200).json(
        ok(result, {
          message:
            req.body?.action === "accept"
              ? "Friend request accepted."
              : "Friend request rejected.",
        }),
      );
    } catch (error) {
      next(error);
    }
  }

  @httpGet("/requests/incoming")
  @RoleDecorator(Role.USER, Role.ADMIN)
  async listIncomingRequests(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const userId = this.getAuthorizedUserId(req, "listIncomingRequests");
      const result =
        await this.listIncomingFriendRequestsUseCase.execute(userId);

      return res.status(200).json(
        ok(result, {
          message: "Incoming friend requests fetched successfully.",
        }),
      );
    } catch (error) {
      next(error);
    }
  }

  @httpGet("/requests/outgoing")
  @RoleDecorator(Role.USER, Role.ADMIN)
  async listOutgoingRequests(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const userId = this.getAuthorizedUserId(req, "listOutgoingRequests");
      const result =
        await this.listOutgoingFriendRequestsUseCase.execute(userId);

      return res.status(200).json(
        ok(result, {
          message: "Outgoing friend requests fetched successfully.",
        }),
      );
    } catch (error) {
      next(error);
    }
  }

  @httpGet("")
  @RoleDecorator(Role.USER, Role.ADMIN)
  async listFriends(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const userId = this.getAuthorizedUserId(req, "listFriends");
      const result = await this.listFriendsUseCase.execute(userId);

      return res.status(200).json(
        ok(result, {
          message: "Friend list fetched successfully.",
        }),
      );
    } catch (error) {
      next(error);
    }
  }

  @httpDelete("/:friendUserId")
  @RoleDecorator(Role.USER, Role.ADMIN)
  async removeFriend(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const userId = this.getAuthorizedUserId(req, "removeFriend");
      const friendUserId = this.requireRouteParam(
        req.params.friendUserId,
        "friendUserId",
      );
      await this.removeFriendUseCase.execute({
        userId,
        friendUserId,
      });

      return res.status(200).json(
        ok(undefined, {
          message: "Friend removed successfully.",
        }),
      );
    } catch (error) {
      next(error);
    }
  }

  @httpGet("/search")
  @RoleDecorator(Role.USER, Role.ADMIN)
  async searchUsersByUsername(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> {
    try {
      const userId = this.getAuthorizedUserId(req, "searchUsersByUsername");
      const result = await this.searchUsersUseCase.execute({
        userId,
        username: String(req.query.username ?? ""),
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      });

      return res.status(200).json(
        ok(result, {
          message: "Users fetched successfully.",
        }),
      );
    } catch (error) {
      next(error);
    }
  }

  private getAuthorizedUserId(
    req: Request,
    methodName: keyof SocialFriendController & string,
  ): string {
    this.assertRole(req, methodName);

    if (!req.user?.id) {
      throw new UnauthorizedError("Authentication required");
    }

    return req.user.id;
  }

  private assertRole(
    req: Request,
    methodName: keyof SocialFriendController & string,
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

  private requireRouteParam(
    value: string | undefined,
    paramName: string,
  ): string {
    if (!value) {
      throw new SocialFriendValidationError(
        `Missing required route param: ${paramName}.`,
      );
    }

    return value;
  }
}
