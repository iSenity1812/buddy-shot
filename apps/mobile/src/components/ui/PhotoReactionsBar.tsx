import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { Image } from "expo-image";

const EMOJI_OPTIONS = ["❤️", "😂", "🔥", "😍", "👏", "😢", "🤩", "💯"];

type ReactionItem = {
  sender: {
    name: string;
    avatar: string;
  };
  emoji: string;
};

interface PhotoReactionsBarProps {
  postId: string;
  canManagePost: boolean;
  hidden?: boolean;
  reactions: ReactionItem[];
  onReact?: (postId: string, emoji: string) => Promise<void> | void;
}

export default function PhotoReactionsBar({
  postId,
  canManagePost,
  hidden = false,
  reactions,
  onReact,
}: PhotoReactionsBarProps) {
  const [isSendingReaction, setIsSendingReaction] = useState(false);
  const [sentEmojiByPostId, setSentEmojiByPostId] = useState<
    Record<string, string>
  >({});
  const [showSentFeedbackByPostId, setShowSentFeedbackByPostId] = useState<
    Record<string, boolean>
  >({});

  const sentEmoji = sentEmojiByPostId[postId] ?? null;
  const showSentFeedback = showSentFeedbackByPostId[postId] ?? false;

  const handleSendEmoji = async (emoji: string) => {
    if (isSendingReaction) {
      return;
    }

    try {
      setIsSendingReaction(true);
      await onReact?.(postId, emoji);

      setSentEmojiByPostId((prev) => ({
        ...prev,
        [postId]: emoji,
      }));

      setShowSentFeedbackByPostId((prev) => ({
        ...prev,
        [postId]: true,
      }));

      setTimeout(() => {
        setShowSentFeedbackByPostId((prev) => ({
          ...prev,
          [postId]: false,
        }));
      }, 1100);
    } catch {
      Alert.alert(
        "Reaction failed",
        "Could not send reaction. Please try again.",
      );
    } finally {
      setIsSendingReaction(false);
    }
  };

  if (hidden) {
    return null;
  }

  return (
    <View className="mt-3 items-center justify-center">
      {canManagePost ? (
        reactions.length > 0 ? (
          <View className="flex-row flex-wrap items-center justify-center gap-2">
            {reactions.map((reaction, index) => (
              <View
                key={`${reaction.sender.name}-${reaction.emoji}-${index}`}
                className="flex-row items-center gap-1.5 rounded-full bg-card/80 px-2.5 py-1.5"
              >
                <Image
                  source={{ uri: reaction.sender.avatar }}
                  style={{ width: 20, height: 20, borderRadius: 999 }}
                  contentFit="cover"
                />
                <Text className="text-xs font-medium text-foreground">
                  {reaction.sender.name}
                </Text>
                <Text className="text-base leading-none">{reaction.emoji}</Text>
              </View>
            ))}
          </View>
        ) : null
      ) : showSentFeedback && sentEmoji ? (
        <View className="flex-row items-center gap-2 rounded-full bg-card/80 px-4 py-2">
          <Text className="text-2xl">{sentEmoji}</Text>
          <Text className="text-xs font-medium text-muted-foreground">
            Sent!
          </Text>
        </View>
      ) : (
        <View className="flex-row items-center gap-1 rounded-full bg-card/80 px-3 py-1.5">
          {EMOJI_OPTIONS.map((emoji) => (
            <View key={emoji} className="items-center px-0.5">
              <Pressable
                onPress={() => void handleSendEmoji(emoji)}
                disabled={isSendingReaction}
                className="p-1 active:scale-95"
              >
                <Text className="text-2xl">{emoji}</Text>
              </Pressable>

              <View
                className="mt-0.5 rounded-full"
                style={{
                  width: 6,
                  height: 6,
                  backgroundColor: sentEmoji === emoji ? "gray" : "transparent",
                }}
              />
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
