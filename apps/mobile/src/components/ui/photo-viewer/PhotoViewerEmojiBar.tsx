import { useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import type { ReactionItem } from "./types";

interface PhotoViewerEmojiBarProps {
  hidden: boolean;
  canManagePost: boolean;
  quickReactions: readonly string[];
  myReaction: string | null;
  reactionSummary: { emoji: string; count: number }[];
  reactions: ReactionItem[];
  isReacting: boolean;
  onReact: (emoji: string) => void;
}

export default function PhotoViewerEmojiBar({
  hidden,
  canManagePost,
  quickReactions,
  myReaction,
  reactionSummary,
  reactions,
  isReacting,
  onReact,
}: PhotoViewerEmojiBarProps) {
  const [showSentFeedback, setShowSentFeedback] = useState(false);
  const [sentEmoji, setSentEmoji] = useState<string | null>(null);
  const [feedbackLabel, setFeedbackLabel] = useState<"Sent!" | "Unsent!">(
    "Sent!",
  );
  const sentTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (sentTimerRef.current) {
        clearTimeout(sentTimerRef.current);
      }
    };
  }, []);

  if (hidden) {
    return null;
  }

  const handleReactPress = (emoji: string) => {
    if (isReacting) {
      return;
    }

    const isRemovingReaction = myReaction === emoji;

    onReact(emoji);
    setSentEmoji(emoji);
    setFeedbackLabel(isRemovingReaction ? "Unsent!" : "Sent!");
    setShowSentFeedback(true);

    if (sentTimerRef.current) {
      clearTimeout(sentTimerRef.current);
    }

    sentTimerRef.current = setTimeout(() => {
      setShowSentFeedback(false);
    }, 1100);
  };

  return (
    <View className="mt-3 items-center justify-center px-4">
      {canManagePost ? (
        reactions.length > 0 ? (
          <View className="flex-row flex-wrap items-center justify-center gap-2">
            {reactions.slice(0, 8).map((reaction, index) => (
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
        ) : reactionSummary.length > 0 ? (
          <View className="flex-row flex-wrap items-center justify-center gap-2">
            {reactionSummary.map((item) => (
              <View
                key={item.emoji}
                className="flex-row items-center gap-1 rounded-full bg-card/80 px-2.5 py-1.5"
              >
                <Text className="text-sm leading-none">{item.emoji}</Text>
                <Text className="text-xs font-medium text-foreground">
                  {item.count}
                </Text>
              </View>
            ))}
          </View>
        ) : null
      ) : showSentFeedback && sentEmoji ? (
        <View className="flex-row items-center gap-2 rounded-full bg-card/80 px-4 py-2">
          <Text className="text-2xl">{sentEmoji}</Text>
          <Text className="text-xs font-medium text-muted-foreground">
            {feedbackLabel}
          </Text>
        </View>
      ) : (
        <View className="flex-row items-center gap-1 rounded-full bg-card/80 px-3 py-1.5">
          {quickReactions.map((emoji) => (
            <View key={emoji} className="items-center px-0.5">
              <Pressable
                onPress={() => handleReactPress(emoji)}
                disabled={isReacting}
                className="p-1 active:scale-95"
              >
                <Text className="text-2xl">{emoji}</Text>
              </Pressable>

              <View
                className="mt-0.5 rounded-full"
                style={{
                  width: 6,
                  height: 6,
                  backgroundColor:
                    myReaction === emoji ? "hsl(0 0% 70%)" : "transparent",
                }}
              />
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
