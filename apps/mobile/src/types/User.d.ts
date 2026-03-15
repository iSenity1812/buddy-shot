export interface Friend {
  id: string;
  name: string;
  avatar: string;
}

export interface FriendRequest {
  id: string;
  sender: Friend;
  createdAt: Date;
}
