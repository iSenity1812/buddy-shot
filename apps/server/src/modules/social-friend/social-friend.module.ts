import { ContainerModule } from "inversify";
import type { PrismaClient } from "@prisma/client";
import { SOCIAL_FRIEND_KEY } from "./di/social-friend.token";
import { PRISMA_CLIENT, EVENT_BUS } from "@/shared/shared-di.tokens";
import type { IEventBus } from "@/shared/application";
import type { IFriendshipRepository } from "./domain/repositories/friendship.repository.interface";
import { PrismaFriendshipRepository } from "./infrastructure/repositories/prisma-friendship.repository";
import { SendFriendRequestUseCase } from "./application/use-cases/send-friend-request.usecase";
import { RespondFriendRequestUseCase } from "./application/use-cases/respond-friend-request.usecase";
import { ListIncomingFriendRequestsUseCase } from "./application/use-cases/list-incoming-friend-requests.usecase";
import { ListOutgoingFriendRequestsUseCase } from "./application/use-cases/list-outgoing-friend-requests.usecase";
import { ListFriendsUseCase } from "./application/use-cases/list-friends.usecase";
import { RemoveFriendUseCase } from "./application/use-cases/remove-friend.usecase";
import { SearchUsersUseCase } from "./application/use-cases/search-users.usecase";
import "./presentation/social-friend.controller";

export const socialFriendModule = new ContainerModule((bind) => {
  bind<IFriendshipRepository>(SOCIAL_FRIEND_KEY.REPOSITORY)
    .toDynamicValue(
      ({ container }) =>
        new PrismaFriendshipRepository(
          container.get<PrismaClient>(PRISMA_CLIENT),
          container.get<IEventBus>(EVENT_BUS),
        ),
    )
    .inTransientScope();

  bind<SendFriendRequestUseCase>(SOCIAL_FRIEND_KEY.USE_CASE.SEND_FRIEND_REQUEST)
    .to(SendFriendRequestUseCase)
    .inTransientScope();

  bind<RespondFriendRequestUseCase>(
    SOCIAL_FRIEND_KEY.USE_CASE.RESPOND_TO_FRIEND_REQUEST,
  )
    .to(RespondFriendRequestUseCase)
    .inTransientScope();

  bind<ListIncomingFriendRequestsUseCase>(
    SOCIAL_FRIEND_KEY.USE_CASE.LIST_INCOMING_REQUESTS,
  )
    .to(ListIncomingFriendRequestsUseCase)
    .inTransientScope();

  bind<ListOutgoingFriendRequestsUseCase>(
    SOCIAL_FRIEND_KEY.USE_CASE.LIST_OUTGOING_REQUESTS,
  )
    .to(ListOutgoingFriendRequestsUseCase)
    .inTransientScope();

  bind<ListFriendsUseCase>(SOCIAL_FRIEND_KEY.USE_CASE.LIST_FRIENDS)
    .to(ListFriendsUseCase)
    .inTransientScope();

  bind<RemoveFriendUseCase>(SOCIAL_FRIEND_KEY.USE_CASE.REMOVE_FRIEND)
    .to(RemoveFriendUseCase)
    .inTransientScope();

  bind<SearchUsersUseCase>(SOCIAL_FRIEND_KEY.USE_CASE.SEARCH_USERS)
    .to(SearchUsersUseCase)
    .inTransientScope();
});
