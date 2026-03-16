import { useEffect, useState } from "react";
import { Alert } from "react-native";
import type { PhotoPost } from "@/src/types/Photo";
import { HttpError } from "@/src/services/http/axios.config";
import { photosApi } from "@/src/services/api/photos.api";
import { realtimeSocketClient } from "@/src/services/realtime/socket-client";
import {
  applyDesiredReactionState,
  applyRealtimeReactionUpdate,
} from "./reaction-utils";

interface UsePhotoViewerStateParams {
  posts: PhotoPost[];
  currentIndex: number;
  onClose: () => void;
  isOwnPost?: (post: PhotoPost) => boolean;
  onEditMessage?: (postId: string, nextMessage: string) => void;
  onDeletePost?: (postId: string) => void;
  onIndexChange?: (index: number) => void;
  onReact?: (postId: string, emoji: string) => Promise<void> | void;
}

export default function usePhotoViewerState({
  posts,
  currentIndex,
  onClose,
  isOwnPost,
  onEditMessage,
  onDeletePost,
  onIndexChange,
  onReact,
}: UsePhotoViewerStateParams) {
  const [viewPosts, setViewPosts] = useState(posts);
  const [activeIndex, setActiveIndex] = useState(currentIndex);
  const [isEditingMessage, setIsEditingMessage] = useState(false);
  const [draftMessage, setDraftMessage] = useState("");
  const [isSavingCaption, setIsSavingCaption] = useState(false);
  const [isDeletingPhoto, setIsDeletingPhoto] = useState(false);
  const [isReacting, setIsReacting] = useState(false);

  useEffect(() => {
    setViewPosts(posts);
    setActiveIndex(() =>
      Math.max(0, Math.min(currentIndex, Math.max(posts.length - 1, 0))),
    );
    setIsEditingMessage(false);
    setDraftMessage("");
  }, [posts, currentIndex]);

  useEffect(() => {
    setActiveIndex(() =>
      Math.max(0, Math.min(currentIndex, Math.max(viewPosts.length - 1, 0))),
    );
  }, [currentIndex, viewPosts.length]);

  useEffect(() => {
    const unsubscribeReactionUpdated = realtimeSocketClient.onPhotoReactionUpdated(
      (payload) => {
        setViewPosts((prev) => {
          if (!prev.some((item) => item.id === payload.photoId)) {
            return prev;
          }

          return prev.map((item) => applyRealtimeReactionUpdate(item, payload));
        });
      },
    );

    return () => {
      unsubscribeReactionUpdated();
    };
  }, []);

  const post = viewPosts[activeIndex];
  const canManagePost = post ? (isOwnPost?.(post) ?? false) : false;

  const commitIndex = (nextIndex: number) => {
    const clampedIndex = Math.max(0, Math.min(nextIndex, viewPosts.length - 1));
    setActiveIndex(clampedIndex);
    onIndexChange?.(clampedIndex);
  };

  const startEdit = () => {
    if (!post) {
      return;
    }

    setDraftMessage(post.message);
    setIsEditingMessage(true);
  };

  const saveEdit = () => {
    if (!post || isSavingCaption) {
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

  const deletePost = () => {
    if (!post || isDeletingPhoto) {
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

                const nextIndex = Math.min(activeIndex, nextPosts.length - 1);
                setActiveIndex(nextIndex);
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

  const react = (emoji: string) => {
    if (!post || isReacting || !post.photoRecipientId) {
      return;
    }

    const photoRecipientId = post.photoRecipientId;
    const intendedReaction = post.myReaction === emoji ? null : emoji;

    void (async () => {
      try {
        setIsReacting(true);

        if (intendedReaction === null) {
          await photosApi.removeReactionFromPhotoRecipient(photoRecipientId);
        } else {
          await photosApi.reactToPhotoRecipient(photoRecipientId, emoji);
          await onReact?.(post.id, emoji);
        }

        setViewPosts((prev) =>
          prev.map((item) =>
            item.id === post.id
              ? applyDesiredReactionState(item, intendedReaction)
              : item,
          ),
        );
      } catch (error) {
        if (error instanceof HttpError) {
          Alert.alert("Reaction failed", error.message);
        } else {
          Alert.alert("Reaction failed", "Please try again.");
        }
      } finally {
        setIsReacting(false);
      }
    })();
  };

  return {
    viewPosts,
    activeIndex,
    post,
    canManagePost,
    isEditingMessage,
    draftMessage,
    isSavingCaption,
    isDeletingPhoto,
    isReacting,
    setIsEditingMessage,
    setDraftMessage,
    commitIndex,
    startEdit,
    saveEdit,
    deletePost,
    react,
  };
}
