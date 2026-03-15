export const SOCIAL_FRIEND_KEY = {
  USE_CASE: {
    SEND_FRIEND_REQUEST: Symbol("SendFriendRequestUseCase"),
    RESPOND_TO_FRIEND_REQUEST: Symbol("RespondToFriendRequestUseCase"),
    LIST_INCOMING_REQUESTS: Symbol("ListIncomingFriendRequestsUseCase"),
    LIST_OUTGOING_REQUESTS: Symbol("ListOutgoingFriendRequestsUseCase"),
    LIST_FRIENDS: Symbol("ListFriendsUseCase"),
    REMOVE_FRIEND: Symbol("RemoveFriendUseCase"),
    SEARCH_USERS: Symbol("SearchUsersUseCase"),
  },
  REPOSITORY: Symbol("FriendshipRepository"),
};
