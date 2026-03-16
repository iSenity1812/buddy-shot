import { ReactNode, useEffect, useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import { PhotoPost } from "@/src/types/Photo";
import { HttpError } from "@/src/services/http/axios.config";
import { photosApi } from "@/src/services/api/photos.api";
import DownloadImageButton from "../../features/camera/components/download-image-button";
import PhotoReactionsBar from "./PhotoReactionsBar";

interface Props {
  posts: PhotoPost[];
  currentIndex: number;
  onClose: () => void;
  showThumbnailStrip?: boolean;
  renderInteractiveWrapper?: (content: ReactNode) => ReactNode;
  isOwnPost?: (post: PhotoPost) => boolean;
  onEditMessage?: (postId: string, nextMessage: string) => void;
  onDeletePost?: (postId: string) => void;
  onIndexChange?: (index: number) => void;
  reactionsByPostId?: Record<
    string,
    { sender: { name: string; avatar: string }; emoji: string }[]
  >;
  onReact?: (postId: string, emoji: string) => Promise<void> | void;
}

export default function PhotoViewer({
  posts,
  currentIndex,
  onClose,
  showThumbnailStrip = false,
  renderInteractiveWrapper,
  isOwnPost,
  onEditMessage,
  onDeletePost,
  onIndexChange,
  reactionsByPostId,
  onReact,
}: Props) {
  const [viewPosts, setViewPosts] = useState(posts);
  const [isEditingMessage, setIsEditingMessage] = useState(false);
  const [draftMessage, setDraftMessage] = useState("");
  const [isSavingCaption, setIsSavingCaption] = useState(false);
  const [isDeletingPhoto, setIsDeletingPhoto] = useState(false);

  useEffect(() => {
    setViewPosts(posts);
    setIsEditingMessage(false);
    setDraftMessage("");
  }, [posts]);

  const post = viewPosts[currentIndex];

  if (!post) {
    return null;
  }

  const canManagePost = isOwnPost?.(post) ?? false;
  const reactions = reactionsByPostId?.[post.id] ?? [];

  const handleStartEdit = () => {
    setDraftMessage(post.message);
    setIsEditingMessage(true);
  };

  const handleSaveEdit = () => {
    if (isSavingCaption) {
      return;
    }

    const nextMessage = draftMessage.trim();
    if (!nextMessage) {
      Alert.alert("Invalid message", "Message cannot be empty.");
      return;
    }

    void (async () => {
      try {
        setIsSavingCaption(true);

        if (canManagePost) {
          await photosApi.updateMyPhotoCaption(post.id, nextMessage);
        }

        setViewPosts((prev) =>
          prev.map((item) =>
            item.id === post.id ? { ...item, message: nextMessage } : item,
          ),
        );
        onEditMessage?.(post.id, nextMessage);
        setIsEditingMessage(false);
      } catch (error) {
        if (error instanceof HttpError) {
          Alert.alert("Edit caption failed", error.message);
        } else {
          Alert.alert("Edit caption failed", "Please try again.");
        }
      } finally {
        setIsSavingCaption(false);
      }
    })();
  };

  const handleDeletePost = () => {
    if (isDeletingPhoto) {
      return;
    }

    Alert.alert("Delete post?", "This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          void (async () => {
            try {
              setIsDeletingPhoto(true);

              if (canManagePost) {
                await photosApi.deleteMyPhoto(post.id);
              }

              setViewPosts((prev) => {
                const nextPosts = prev.filter((item) => item.id !== post.id);
                onDeletePost?.(post.id);

                if (nextPosts.length === 0) {
                  onClose();
                  return nextPosts;
                }

                const nextIndex = Math.min(currentIndex, nextPosts.length - 1);
                onIndexChange?.(nextIndex);
                return nextPosts;
              });
            } catch (error) {
              if (error instanceof HttpError) {
                Alert.alert("Delete photo failed", error.message);
              } else {
                Alert.alert("Delete photo failed", "Please try again.");
              }
            } finally {
              setIsDeletingPhoto(false);
            }
          })();
        },
      },
    ]);
  };

  const polaroid_card = (
    <View className="w-full max-w-sm px-4">
      <View className="bg-card rounded-lg p-3 pb-5 polaroid-shadow">
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
              <Text className="text-xs text-muted-foreground">
                {post.timestamp.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </Text>

              <Text className="text-xs text-muted-foreground">
                {post.timestamp.getHours()}:
                {post.timestamp.getMinutes().toString().padStart(2, "0")}
              </Text>
            </View>
          </View>

          {isEditingMessage ? (
            <View className="gap-2">
              <TextInput
                value={draftMessage}
                onChangeText={setDraftMessage}
                maxLength={100}
                autoFocus
                className="rounded-lg bg-muted px-3 py-2 text-foreground"
                placeholder="Write your message..."
                placeholderTextColor="hsl(var(--muted-foreground))"
              />

              <View className="flex-row justify-end gap-2">
                <Pressable
                  onPress={() => setIsEditingMessage(false)}
                  disabled={isSavingCaption}
                  className="rounded-full bg-muted px-3 py-1.5 active:scale-95"
                >
                  <Text className="text-xs font-semibold text-foreground">
                    Cancel
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleSaveEdit}
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
            <Text className="font-handwritten text-2xl text-center text-foreground">
              {post.message}
            </Text>
          )}
        </View>
      </View>

      <PhotoReactionsBar
        postId={post.id}
        canManagePost={canManagePost}
        hidden={isEditingMessage}
        reactions={reactions}
        onReact={onReact}
      />
    </View>
  );

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1 bg-foreground/90 items-center justify-center">
            {/* Close action */}
            <Pressable
              style={StyleSheet.absoluteFillObject}
              onPress={onClose}
            />

            <View className="absolute right-4 top-20 z-20 flex-row items-center gap-2 rounded-full bg-card/90 px-2 py-1">
              {canManagePost && !isEditingMessage ? (
                <>
                  <Pressable
                    onPress={handleDeletePost}
                    disabled={isDeletingPhoto || isSavingCaption}
                    className="p-2 active:scale-95"
                  >
                    <Feather name="trash-2" size={18} color="red" />
                  </Pressable>
                  <Pressable
                    onPress={handleStartEdit}
                    disabled={isDeletingPhoto || isSavingCaption}
                    className="p-2 active:scale-95"
                  >
                    <Feather
                      name="edit-2"
                      size={18}
                      color="hsl(var(--muted-foreground))"
                    />
                  </Pressable>
                </>
              ) : null}

              <DownloadImageButton imageUri={post.imageUrl} />
              <Pressable onPress={onClose} className="p-2 active:scale-95">
                <Feather
                  name="x"
                  size={22}
                  color="hsl(var(--muted-foreground))"
                />
              </Pressable>
            </View>

            {renderInteractiveWrapper
              ? renderInteractiveWrapper(polaroid_card)
              : polaroid_card}

            {/* Thumbnail strip */}
            {showThumbnailStrip &&
              !isEditingMessage &&
              viewPosts.length > 1 && (
                <View className="absolute bottom-8 left-0 right-0 flex-row justify-center gap-2 px-4">
                  {viewPosts.map((p, i) => (
                    <Pressable
                      key={p.id}
                      onPress={() => onIndexChange?.(i)}
                      style={[
                        {
                          width: 48,
                          height: 48,
                          borderRadius: 12,
                          overflow: "hidden",
                        },
                        i === currentIndex
                          ? { borderWidth: 2, borderColor: "white" }
                          : { opacity: 0.6 },
                      ]}
                    >
                      <Image
                        source={{ uri: p.imageUrl }}
                        style={{ width: "100%", height: "100%" }}
                        contentFit="cover"
                      />
                    </Pressable>
                  ))}
                </View>
              )}
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}
