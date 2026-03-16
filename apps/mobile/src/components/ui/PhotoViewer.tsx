import { ReactNode } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { PhotoPost } from "@/src/types/Photo";
import PhotoViewerCard from "./photo-viewer/PhotoViewerCard";
import PhotoViewerEmojiBar from "./photo-viewer/PhotoViewerEmojiBar";
import PhotoViewerHeader from "./photo-viewer/PhotoViewerHeader";
import PhotoViewerThumbnails from "./photo-viewer/PhotoViewerThumbnails";
import usePhotoViewerState from "./photo-viewer/usePhotoViewerState";

const QUICK_REACTIONS = ["❤️", "😂", "🔥", "😮", "👍", "👏", "🎉"] as const;

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
  const {
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
  } = usePhotoViewerState({
    posts,
    currentIndex,
    onClose,
    isOwnPost,
    onEditMessage,
    onDeletePost,
    onIndexChange,
    onReact,
  });

  if (!post) {
    return null;
  }
  const reactions = reactionsByPostId?.[post.id] ?? [];

  const viewerCard = (
    <View className="w-full items-center px-3">
      <PhotoViewerCard
        post={post}
        isEditingMessage={isEditingMessage}
        draftMessage={draftMessage}
        isSavingCaption={isSavingCaption}
        onCancelEdit={() => setIsEditingMessage(false)}
        onDraftMessageChange={setDraftMessage}
        onSaveEdit={saveEdit}
      />

      <PhotoViewerEmojiBar
        hidden={isEditingMessage}
        canManagePost={canManagePost}
        quickReactions={QUICK_REACTIONS}
        myReaction={post.myReaction}
        reactionSummary={post.reactionSummary}
        reactions={reactions}
        isReacting={isReacting}
        onReact={react}
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

            <PhotoViewerHeader
              canManagePost={canManagePost}
              isEditingMessage={isEditingMessage}
              isDeletingPhoto={isDeletingPhoto}
              isSavingCaption={isSavingCaption}
              imageUri={post.imageUrl}
              onClose={onClose}
              onDelete={deletePost}
              onStartEdit={startEdit}
            />

            {renderInteractiveWrapper
              ? renderInteractiveWrapper(viewerCard)
              : viewerCard}

            {/* Thumbnail strip */}
            {showThumbnailStrip &&
              !isEditingMessage &&
              viewPosts.length > 1 && (
                <PhotoViewerThumbnails
                  posts={viewPosts}
                  currentIndex={activeIndex}
                  onSelect={commitIndex}
                />
              )}
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}
