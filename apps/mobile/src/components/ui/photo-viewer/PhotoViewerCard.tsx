import { Text, TextInput, Pressable, View } from "react-native";
import { Image } from "expo-image";
import type { PhotoPost } from "@/src/types/Photo";

interface PhotoViewerCardProps {
  post: PhotoPost;
  isEditingMessage: boolean;
  draftMessage: string;
  isSavingCaption: boolean;
  onDraftMessageChange: (value: string) => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
}

function formatPostTimestamp(date: Date): { dateLabel: string; timeLabel: string } {
  const dateLabel = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const timeLabel = `${date.getHours()}:${date.getMinutes().toString().padStart(2, "0")}`;
  return { dateLabel, timeLabel };
}

export default function PhotoViewerCard({
  post,
  isEditingMessage,
  draftMessage,
  isSavingCaption,
  onDraftMessageChange,
  onCancelEdit,
  onSaveEdit,
}: PhotoViewerCardProps) {
  const { dateLabel, timeLabel } = formatPostTimestamp(post.timestamp);

  return (
    <View className="w-full max-w-sm px-4">
      <View className="rounded-lg bg-card p-3 pb-5 polaroid-shadow">
        <Image
          source={{ uri: post.imageUrl }}
          style={{ width: "100%", aspectRatio: 1, borderRadius: 4 }}
          contentFit="cover"
        />

        <View className="mt-3 px-1">
          <View className="mb-3 flex-row items-center">
            <Image
              source={{ uri: post.sender.avatar }}
              style={{ width: 28, height: 28, borderRadius: 999 }}
              contentFit="cover"
              className="border-2 border-friend-ring"
            />

            <Text className="ml-2 text-sm font-semibold text-foreground">
              {post.sender.name}
            </Text>

            <View className="ml-auto flex-col items-end">
              <Text className="text-xs text-muted-foreground">{dateLabel}</Text>
              <Text className="text-xs text-muted-foreground">{timeLabel}</Text>
            </View>
          </View>

          {isEditingMessage ? (
            <View className="gap-2">
              <TextInput
                value={draftMessage}
                onChangeText={onDraftMessageChange}
                maxLength={100}
                autoFocus
                className="rounded-lg bg-muted px-3 py-2 text-foreground"
                placeholder="Write your message..."
                placeholderTextColor="hsl(var(--muted-foreground))"
              />

              <View className="flex-row justify-end gap-2">
                <Pressable
                  onPress={onCancelEdit}
                  disabled={isSavingCaption}
                  className="rounded-full bg-muted px-3 py-1.5 active:scale-95"
                >
                  <Text className="text-xs font-semibold text-foreground">
                    Cancel
                  </Text>
                </Pressable>

                <Pressable
                  onPress={onSaveEdit}
                  disabled={isSavingCaption}
                  className="rounded-full bg-primary px-3 py-1.5 active:scale-95"
                >
                  <Text className="text-xs font-semibold text-primary-foreground">
                    Save
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Text className="text-center font-handwritten text-2xl text-foreground">
              {post.message}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}
