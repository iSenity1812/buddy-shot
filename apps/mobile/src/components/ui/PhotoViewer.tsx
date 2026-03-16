import { useEffect, useState } from "react";
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
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import { PhotoPost } from "@/src/types/Photo";
import { HttpError } from "@/src/services/http/axios.config";
import { photosApi } from "@/src/services/api/photos.api";
import DownloadImageButton from "../../features/camera/components/download-image-button";

interface Props {
  posts: PhotoPost[];
  initialIndex: number;
  onClose: () => void;
  readOnly?: boolean;
  isOwnPost?: (post: PhotoPost) => boolean;
  onEditMessage?: (postId: string, nextMessage: string) => void;
  onDeletePost?: (postId: string) => void;
}

export default function PhotoViewer({
  posts,
  initialIndex,
  onClose,
  readOnly = false,
  isOwnPost,
  onEditMessage,
  onDeletePost,
}: Props) {
  const [viewPosts, setViewPosts] = useState(posts);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isEditingMessage, setIsEditingMessage] = useState(false);
  const [draftMessage, setDraftMessage] = useState("");
  const [isSavingCaption, setIsSavingCaption] = useState(false);
  const [isDeletingPhoto, setIsDeletingPhoto] = useState(false);
  const { width: screenWidth } = useWindowDimensions();
  const dragOffset = useSharedValue(0);
  const currentIndexSv = useSharedValue(initialIndex);

  useEffect(() => {
    setViewPosts(posts);
    setCurrentIndex(initialIndex);
    currentIndexSv.value = initialIndex;
    setIsEditingMessage(false);
    setDraftMessage("");
  }, [initialIndex, posts, currentIndexSv]);

  const update = (idx: number) => {
    currentIndexSv.value = idx;
    setCurrentIndex(idx);
  };

  const swipePhoto = Gesture.Pan()
    .onUpdate((event) => {
      dragOffset.value = event.translationX;
    })
    .onEnd((event) => {
      const canGoNext = currentIndexSv.value < viewPosts.length - 1;
      const canGoPrev = currentIndexSv.value > 0;

      if (event.translationX < -50 && canGoNext) {
        const nextIdx = currentIndexSv.value + 1;
        dragOffset.value = withTiming(
          -screenWidth,
          { duration: 180 },
          (finished) => {
            if (!finished) return;
            currentIndexSv.value = nextIdx;
            dragOffset.value = 0;
            runOnJS(setCurrentIndex)(nextIdx);
          },
        );
        return;
      }

      if (event.translationX > 50 && canGoPrev) {
        const prevIdx = currentIndexSv.value - 1;
        dragOffset.value = withTiming(
          screenWidth,
          { duration: 180 },
          (finished) => {
            if (!finished) return;
            currentIndexSv.value = prevIdx;
            dragOffset.value = 0;
            runOnJS(setCurrentIndex)(prevIdx);
          },
        );
        return;
      }

      dragOffset.value = withTiming(0, { duration: 180 });
    });

  const animatedPhotoStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: dragOffset.value }],
  }));

  const post = viewPosts[currentIndex];

  if (!post) {
    return null;
  }

  const canManagePost = !readOnly && (isOwnPost?.(post) ?? false);

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
                currentIndexSv.value = nextIndex;
                setCurrentIndex(nextIndex);
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

            <View className="absolute right-4 top-14 z-20 flex-row items-center gap-2 rounded-full bg-card/90 px-2 py-1">
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

            {/* Swipeable photo */}
            {readOnly ? (
              <View className="w-full max-w-sm px-4">
                <View className="bg-card rounded-lg p-3 pb-5 polaroid-shadow">
                  <Image
                    source={{ uri: post.imageUrl }}
                    style={{ width: "100%", aspectRatio: 1, borderRadius: 4 }}
                    contentFit="cover"
                  />

                  <View className="mt-3 px-1">
                    <View className="mb-2 flex-row items-center">
                      <Image
                        source={{ uri: post.sender.avatar }}
                        style={{ width: 28, height: 28, borderRadius: 999 }}
                        contentFit="cover"
                        className="border-2 border-friend-ring"
                      />
                      <Text className="ml-2 text-sm font-semibold text-foreground">
                        {post.sender.name}
                      </Text>
                      <Text className="ml-auto text-xs text-muted-foreground">
                        {post.timestamp.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </Text>
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
                            className="rounded-full bg-muted px-5 py-3 active:scale-95"
                          >
                            <Text className="text-xs font-semibold text-foreground">
                              Cancel
                            </Text>
                          </Pressable>
                          <Pressable
                            onPress={handleSaveEdit}
                            disabled={isSavingCaption}
                            className="rounded-full bg-primary px-5 py-3 active:scale-95"
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
              </View>
            ) : (
              <GestureDetector gesture={swipePhoto}>
                <View className="w-full max-w-sm px-4">
                  <Animated.View style={animatedPhotoStyle}>
                    <View className="bg-card rounded-lg p-3 pb-5 polaroid-shadow">
                      <Image
                        source={{ uri: post.imageUrl }}
                        style={{
                          width: "100%",
                          aspectRatio: 1,
                          borderRadius: 4,
                        }}
                        contentFit="cover"
                      />

                      <View className="mt-3 px-1">
                        <View className="mb-2 flex-row items-center">
                          <Image
                            source={{ uri: post.sender.avatar }}
                            style={{ width: 28, height: 28, borderRadius: 999 }}
                            contentFit="cover"
                            className="border-2 border-friend-ring"
                          />
                          <Text className="ml-2 text-sm font-semibold text-foreground">
                            {post.sender.name}
                          </Text>
                          <Text className="ml-auto text-xs text-muted-foreground">
                            {post.timestamp.toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </Text>
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
                  </Animated.View>
                </View>
              </GestureDetector>
            )}

            {/* Thumbnail strip */}
            {!readOnly && !isEditingMessage && viewPosts.length > 1 && (
              <View className="absolute bottom-8 left-0 right-0 flex-row justify-center gap-2 px-4">
                {viewPosts.map((p, i) => (
                  <Pressable
                    key={p.id}
                    onPress={() => update(i)}
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
