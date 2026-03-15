import { createHash, randomUUID } from "crypto";
import bcrypt from "bcrypt";
import { faker } from "@faker-js/faker";
import { createPrismaClient } from "../../../shared/infrastructure/database/postgre/prisma.provider";

type SeedUser = {
  id: string;
  email: string;
  username: string;
};

const prisma = createPrismaClient();

function sha256(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

function avatarKey(): string {
  return `avatars/${randomUUID()}.jpg`;
}

function photoKey(): string {
  return `photos/${randomUUID()}.jpg`;
}

async function main(): Promise<void> {
  faker.seed(20260316);

  await prisma.$transaction([
    prisma.reaction.deleteMany(),
    prisma.photoRecipient.deleteMany(),
    prisma.photo.deleteMany(),
    prisma.refreshToken.deleteMany(),
    prisma.device.deleteMany(),
    prisma.friendship.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  const baseUsers: SeedUser[] = [
    { id: randomUUID(), email: "alice@buddyshot.test", username: "alice" },
    { id: randomUUID(), email: "bob@buddyshot.test", username: "bob" },
    { id: randomUUID(), email: "carol@buddyshot.test", username: "carol" },
    { id: randomUUID(), email: "dave@buddyshot.test", username: "dave" },
    { id: randomUUID(), email: "emma@buddyshot.test", username: "emma" },
    { id: randomUUID(), email: "frank@buddyshot.test", username: "frank" },
    { id: randomUUID(), email: "grace@buddyshot.test", username: "grace" },
    { id: randomUUID(), email: "henry@buddyshot.test", username: "henry" },
    { id: randomUUID(), email: "ivy@buddyshot.test", username: "ivy" },
    { id: randomUUID(), email: "jack@buddyshot.test", username: "jack" },
    { id: randomUUID(), email: "karen@buddyshot.test", username: "karen" },
    { id: randomUUID(), email: "leo@buddyshot.test", username: "leo" },
    { id: randomUUID(), email: "mira@buddyshot.test", username: "mira" },
    { id: randomUUID(), email: "nina@buddyshot.test", username: "nina" },
    { id: randomUUID(), email: "oscar@buddyshot.test", username: "oscar" },
  ];

  const passwordHash = await bcrypt.hash("password123", 10);
  const bios = [
    "Coffee first, then photos.",
    "Street food hunter and sunset chaser.",
    "Weekend hikes, weekday design.",
    "Always down for a late-night snack run.",
    "Tiny camera, big stories.",
    "Photobombs are my love language.",
    "If it’s raining, I’m shooting.",
    "Trying to make Mondays look good.",
    "Skyline collector.",
    "Good vibes, better light.",
    "I make friends with cats and baristas.",
    "From portraits to pastries.",
    "Short captions, long memories.",
    "Capture now, edit later.",
    "Late bloomer, early riser.",
  ];

  await prisma.user.createMany({
    data: baseUsers.map((user, index) => ({
      id: user.id,
      email: user.email,
      passwordHash,
      username: user.username,
      avatarKey: index % 3 === 0 ? avatarKey() : null,
      bio: bios[index],
      isActive: index % 14 !== 0,
      version: 1,
    })),
  });

  const devicePlatforms = ["IOS", "ANDROID", "DESKTOP"] as const;
  const devices = baseUsers.map((user, index) => ({
    id: randomUUID(),
    userId: user.id,
    pushToken: `push:${user.username}:${user.id}`,
    platform: devicePlatforms[index % devicePlatforms.length],
    isActive: index % 5 !== 0,
    lastSeenAt: index % 4 === 0 ? null : faker.date.recent({ days: 3 }),
  }));

  await prisma.device.createMany({ data: devices });

  const refreshTokens = devices.map((device, index) => ({
    id: randomUUID(),
    userId: device.userId,
    deviceId: device.id,
    tokenHash: sha256(`refresh:${device.userId}:${index}`),
    isRevoked: index % 7 === 0,
    expiresAt: faker.date.soon({ days: 14 }),
    createdAt: faker.date.recent({ days: 10 }),
  }));

  await prisma.refreshToken.createMany({ data: refreshTokens });

  const friendshipPairs: Array<[number, number, "PENDING" | "ACCEPTED"]> = [
    [0, 1, "ACCEPTED"],
    [0, 2, "PENDING"],
    [1, 3, "ACCEPTED"],
    [2, 4, "ACCEPTED"],
    [3, 5, "PENDING"],
    [4, 6, "ACCEPTED"],
    [5, 7, "PENDING"],
    [6, 8, "ACCEPTED"],
    [7, 9, "ACCEPTED"],
    [8, 10, "PENDING"],
    [9, 11, "ACCEPTED"],
    [10, 12, "PENDING"],
    [11, 13, "ACCEPTED"],
    [12, 14, "ACCEPTED"],
    [3, 9, "ACCEPTED"],
  ];

  await prisma.friendship.createMany({
    data: friendshipPairs.map(([requester, addressee, status]) => ({
      id: randomUUID(),
      requesterId: baseUsers[requester].id,
      addresseeId: baseUsers[addressee].id,
      status,
    })),
  });

  const photos = Array.from({ length: 15 }).map((_, index) => {
    const sender = baseUsers[index % baseUsers.length];
    return {
      id: randomUUID(),
      senderId: sender.id,
      imageKey: photoKey(),
      caption: faker.lorem.sentence({ min: 3, max: 7 }),
      expiresAt: index % 4 === 0 ? faker.date.soon({ days: 5 }) : null,
      createdAt: faker.date.recent({ days: 6 }),
    };
  });

  await prisma.photo.createMany({ data: photos });

  const photoRecipients = photos.flatMap((photo, photoIndex) => {
    const recipientA = baseUsers[(photoIndex + 3) % baseUsers.length];
    const recipientB = baseUsers[(photoIndex + 7) % baseUsers.length];

    return [
      {
        id: randomUUID(),
        photoId: photo.id,
        recipientId: recipientA.id,
        isViewed: photoIndex % 2 === 0,
        viewedAt: photoIndex % 2 === 0 ? faker.date.recent({ days: 2 }) : null,
        deliveredAt: faker.date.recent({ days: 2 }),
      },
      {
        id: randomUUID(),
        photoId: photo.id,
        recipientId: recipientB.id,
        isViewed: photoIndex % 3 === 0,
        viewedAt: photoIndex % 3 === 0 ? faker.date.recent({ days: 2 }) : null,
        deliveredAt: faker.date.recent({ days: 2 }),
      },
    ];
  });

  await prisma.photoRecipient.createMany({ data: photoRecipients });

  const emojis = ["🔥", "😍", "😂", "👏", "🎉", "🤩", "😮", "💯", "✨", "😎"];
  const reactions = photoRecipients.slice(0, 15).map((recipient, index) => ({
    id: randomUUID(),
    photoRecipientId: recipient.id,
    userId: recipient.recipientId,
    emoji: emojis[index % emojis.length],
  }));

  await prisma.reaction.createMany({ data: reactions });
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("Seed completed.");
  })
  .catch(async (error) => {
    console.error("Seed failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
