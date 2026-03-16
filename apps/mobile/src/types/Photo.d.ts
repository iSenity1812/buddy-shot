import { Friend } from "./User";

export interface PhotoPost {
  id: string;
  photoRecipientId: string | null;
  imageUrl: string;
  message: string;
  sender: Friend;
  myReaction: string | null;
  reactionSummary: {
    emoji: string;
    count: number;
  }[];
  timestamp: Date;
}
