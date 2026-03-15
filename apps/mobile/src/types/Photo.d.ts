import { Friend } from "./User";

export interface PhotoPost {
  id: string;
  imageUrl: string;
  message: string;
  sender: Friend;
  timestamp: Date;
}
