import { PhotoPost } from "../types/Photo";
import { Friend, FriendRequest } from "../types/User";

export const friends: Friend[] = [
  { id: "1", name: "Emma", avatar: "https://i.pravatar.cc/150?img=1" },
  { id: "2", name: "Liam", avatar: "https://i.pravatar.cc/150?img=3" },
  { id: "3", name: "Sophia", avatar: "https://i.pravatar.cc/150?img=5" },
  { id: "4", name: "Noah", avatar: "https://i.pravatar.cc/150?img=7" },
  { id: "5", name: "Olivia", avatar: "https://i.pravatar.cc/150?img=9" },
];

const incomingRequestUsers: Friend[] = [
  { id: "11", name: "Mia", avatar: "https://i.pravatar.cc/150?img=11" },
  { id: "12", name: "James", avatar: "https://i.pravatar.cc/150?img=12" },
  { id: "13", name: "Ava", avatar: "https://i.pravatar.cc/150?img=13" },
  { id: "14", name: "Benjamin", avatar: "https://i.pravatar.cc/150?img=14" },
  { id: "15", name: "Ella", avatar: "https://i.pravatar.cc/150?img=15" },
];

export const incomingFriendRequests: FriendRequest[] = [
  {
    id: "fr-1",
    sender: incomingRequestUsers[0],
    createdAt: daysAgo(0, 8),
  },
  {
    id: "fr-2",
    sender: incomingRequestUsers[1],
    createdAt: daysAgo(1, 11),
  },
  {
    id: "fr-3",
    sender: incomingRequestUsers[2],
    createdAt: daysAgo(2, 15),
  },
  {
    id: "fr-4",
    sender: incomingRequestUsers[3],
    createdAt: daysAgo(3, 10),
  },
  {
    id: "fr-5",
    sender: incomingRequestUsers[4],
    createdAt: daysAgo(4, 13),
  },
];

const photoUrls = [
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=400&fit=crop",
];

const messages = [
  "Missing you! 💛",
  "Look at this view!",
  "Best day ever ✨",
  "Wish you were here",
  "Golden hour magic",
  "Sunday vibes 🌿",
  "Remember this place?",
  "Made me think of you",
  "Can't believe this is real",
  "Our favorite spot",
];

function daysAgo(d: number, hour = 9) {
  const date = new Date();
  date.setDate(date.getDate() - d);
  date.setHours(hour, Math.floor(Math.random() * 60), 0, 0);
  return date;
}

export const photoPosts: PhotoPost[] = [
  {
    id: "1",
    imageUrl: photoUrls[0],
    message: messages[0],
    sender: friends[0],
    timestamp: daysAgo(0, 9),
  },
  {
    id: "2",
    imageUrl: photoUrls[1],
    message: messages[1],
    sender: friends[1],
    timestamp: daysAgo(0, 14),
  },
  {
    id: "3",
    imageUrl: photoUrls[2],
    message: messages[2],
    sender: friends[2],
    timestamp: daysAgo(1, 10),
  },
  {
    id: "4",
    imageUrl: photoUrls[3],
    message: messages[3],
    sender: friends[3],
    timestamp: daysAgo(2, 11),
  },
  {
    id: "5",
    imageUrl: photoUrls[4],
    message: messages[4],
    sender: friends[4],
    timestamp: daysAgo(3, 16),
  },
  {
    id: "6",
    imageUrl: photoUrls[5],
    message: messages[5],
    sender: friends[0],
    timestamp: daysAgo(5, 8),
  },
  {
    id: "7",
    imageUrl: photoUrls[6],
    message: messages[6],
    sender: friends[1],
    timestamp: daysAgo(7, 12),
  },
  {
    id: "8",
    imageUrl: photoUrls[7],
    message: messages[7],
    sender: friends[2],
    timestamp: daysAgo(10, 15),
  },
  {
    id: "9",
    imageUrl: photoUrls[8],
    message: messages[8],
    sender: friends[3],
    timestamp: daysAgo(12, 9),
  },
  {
    id: "10",
    imageUrl: photoUrls[9],
    message: messages[9],
    sender: friends[4],
    timestamp: daysAgo(14, 17),
  },
];
