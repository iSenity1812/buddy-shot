import { Pressable, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import DownloadImageButton from "@/src/features/camera/components/download-image-button";

interface PhotoViewerHeaderProps {
  canManagePost: boolean;
  isEditingMessage: boolean;
  isDeletingPhoto: boolean;
  isSavingCaption: boolean;
  imageUri: string;
  onDelete: () => void;
  onStartEdit: () => void;
  onClose: () => void;
}

export default function PhotoViewerHeader({
  canManagePost,
  isEditingMessage,
  isDeletingPhoto,
  isSavingCaption,
  imageUri,
  onDelete,
  onStartEdit,
  onClose,
}: PhotoViewerHeaderProps) {
  return (
    <View className="absolute right-4 top-20 z-20 flex-row items-center gap-2 rounded-full bg-card/90 px-2 py-1">
      {canManagePost && !isEditingMessage ? (
        <>
          <Pressable
            onPress={onDelete}
            disabled={isDeletingPhoto || isSavingCaption}
            className="p-2 active:scale-95"
          >
            <Feather name="trash-2" size={18} color="red" />
          </Pressable>

          <Pressable
            onPress={onStartEdit}
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

      <DownloadImageButton imageUri={imageUri} />

      <Pressable onPress={onClose} className="p-2 active:scale-95">
        <Feather name="x" size={22} color="hsl(var(--muted-foreground))" />
      </Pressable>
    </View>
  );
}
