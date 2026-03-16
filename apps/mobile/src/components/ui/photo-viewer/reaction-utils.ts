import type { PhotoPost } from "@/src/types/Photo";
import type { PhotoReactionUpdatedSocketPayload } from "@/src/services/realtime/socket-events";

function upsertReactionSummary(
  summary: { emoji: string; count: number }[],
  emoji: string,
  delta: number,
): { emoji: string; count: number }[] {
  const counter = new Map(summary.map((item) => [item.emoji, item.count]));
  const nextCount = (counter.get(emoji) ?? 0) + delta;

  if (nextCount <= 0) {
    counter.delete(emoji);
  } else {
    counter.set(emoji, nextCount);
  }

  return Array.from(counter.entries())
    .map(([value, count]) => ({ emoji: value, count }))
    .sort((a, b) => b.count - a.count);
}

export function applyRealtimeReactionUpdate(
  post: PhotoPost,
  payload: PhotoReactionUpdatedSocketPayload,
): PhotoPost {
  if (post.id !== payload.photoId) {
    return post;
  }

  const isOwnRecipient = post.photoRecipientId === payload.photoRecipientId;
  const expectedMyReaction =
    payload.action === "removed" ? null : payload.emoji;

  if (isOwnRecipient && post.myReaction === expectedMyReaction) {
    return post;
  }

  let nextSummary = post.reactionSummary;

  if (isOwnRecipient) {
    if (post.myReaction) {
      nextSummary = upsertReactionSummary(nextSummary, post.myReaction, -1);
    }
    if (expectedMyReaction) {
      nextSummary = upsertReactionSummary(nextSummary, expectedMyReaction, 1);
    }
  } else if (payload.action === "added") {
    nextSummary = upsertReactionSummary(nextSummary, payload.emoji, 1);
  } else if (payload.action === "removed") {
    nextSummary = upsertReactionSummary(nextSummary, payload.emoji, -1);
  } else if (payload.action === "changed") {
    if (payload.previousEmoji) {
      nextSummary = upsertReactionSummary(nextSummary, payload.previousEmoji, -1);
    }
    nextSummary = upsertReactionSummary(nextSummary, payload.emoji, 1);
  }

  return {
    ...post,
    myReaction: isOwnRecipient ? expectedMyReaction : post.myReaction,
    reactionSummary: nextSummary,
  };
}

export function applyDesiredReactionState(
  post: PhotoPost,
  desiredReaction: string | null,
): PhotoPost {
  if (post.myReaction === desiredReaction) {
    return post;
  }

  let nextSummary = post.reactionSummary;
  if (post.myReaction) {
    nextSummary = upsertReactionSummary(nextSummary, post.myReaction, -1);
  }

  if (desiredReaction) {
    nextSummary = upsertReactionSummary(nextSummary, desiredReaction, 1);
  }

  return {
    ...post,
    myReaction: desiredReaction,
    reactionSummary: nextSummary,
  };
}
