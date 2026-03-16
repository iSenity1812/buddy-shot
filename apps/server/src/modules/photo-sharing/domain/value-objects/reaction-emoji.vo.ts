import { PhotoSharingValidationError } from "../errors/photo-sharing.error";

export const REACTION_EMOJI_WHITELIST = [
  "❤️",
  "🧡",
  "💛",
  "💚",
  "💙",
  "💜",
  "🖤",
  "🤍",
  "🤎",
  "💔",
  "❣️",
  "💕",
  "💞",
  "💓",
  "💗",
  "💖",
  "💘",
  "💝",
  "😂",
  "🤣",
  "🙂",
  "🙃",
  "😉",
  "😊",
  "😇",
  "🥰",
  "😍",
  "🤩",
  "😘",
  "😗",
  "😚",
  "😙",
  "😋",
  "😛",
  "😜",
  "🤪",
  "😝",
  "🫠",
  "🫶",
  "🔥",
  "✨",
  "⭐",
  "🌟",
  "💫",
  "⚡",
  "💯",
  "👍",
  "👎",
  "👏",
  "🙌",
  "👌",
  "🤌",
  "🤝",
  "🙏",
  "🤞",
  "✌️",
  "🤟",
  "😮",
  "😲",
  "😯",
  "😳",
  "😱",
  "🤯",
  "🤔",
  "🫢",
  "🥹",
  "😭",
  "😢",
  "😎",
  "🥶",
  "🥵",
  "🤤",
  "😴",
  "🤗",
  "🫡",
  "🎉",
  "🥳",
  "😅",
  "😬",
  "🤭",
  "👀",
  "🍿",
  "🧠",
] as const;

const REACTION_EMOJI_SET = new Set<string>(REACTION_EMOJI_WHITELIST);

export class ReactionEmoji {
  static assertAllowed(emoji: string): void {
    const normalized = emoji.trim();
    if (!normalized) {
      throw new PhotoSharingValidationError("emoji is required.");
    }

    if (!REACTION_EMOJI_SET.has(normalized)) {
      throw new PhotoSharingValidationError(
        "emoji is not supported by reaction whitelist.",
      );
    }
  }
}
