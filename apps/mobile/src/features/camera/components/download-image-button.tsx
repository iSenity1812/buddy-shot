import { useState } from "react";
import { ActivityIndicator, Alert, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as MediaLibrary from "expo-media-library";
import { Directory, File as ExpoFile, Paths } from "expo-file-system";

interface DownloadImageButtonProps {
  imageUri: string;
  disabled?: boolean;
}

const isLocalAssetUri = (uri: string) => /^(file|content):/i.test(uri);
const isRemoteHttpUri = (uri: string) => /^https?:/i.test(uri);

export default function DownloadImageButton({
  imageUri,
  disabled = false,
}: DownloadImageButtonProps) {
  const [isSaving, setIsSaving] = useState(false);

  const handleDownload = async () => {
    if (isSaving || disabled) return;

    try {
      setIsSaving(true);

      let localUri = imageUri;
      let shouldCleanupDownloadedFile = false;

      if (isRemoteHttpUri(imageUri)) {
        const downloadsDir = new Directory(Paths.cache, "buddy-shot-downloads");
        downloadsDir.create({ intermediates: true, idempotent: true });

        const downloadedFile = await ExpoFile.downloadFileAsync(
          imageUri,
          downloadsDir,
          {
            idempotent: true,
          },
        );
        localUri = downloadedFile.uri;
        shouldCleanupDownloadedFile = true;
      } else if (!isLocalAssetUri(imageUri)) {
        Alert.alert(
          "Download unavailable",
          "This image source is not supported for download.",
        );
        return;
      }

      const permission = await MediaLibrary.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Permission required",
          "Please allow media library access to save photos.",
        );
        return;
      }

      const asset = await MediaLibrary.createAssetAsync(localUri);

      try {
        await MediaLibrary.createAlbumAsync("Buddy Shot", asset, false);
      } catch {
        // Album may already exist, in that case saving asset is enough.
      }

      if (shouldCleanupDownloadedFile) {
        try {
          new ExpoFile(localUri).delete();
        } catch {
          // Best-effort cleanup of cached remote file.
        }
      }

      Alert.alert("Saved", "Photo downloaded to your library.");
    } catch {
      Alert.alert(
        "Save failed",
        "Could not save this photo. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Pressable
      onPress={() => void handleDownload()}
      disabled={isSaving || disabled}
      className="p-2 active:scale-95"
      style={{ opacity: isSaving || disabled ? 0.65 : 1 }}
    >
      {isSaving ? (
        <ActivityIndicator size="small" color="hsl(var(--muted-foreground))" />
      ) : (
        <Feather
          name="download"
          size={22}
          color="hsl(var(--muted-foreground))"
        />
      )}
    </Pressable>
  );
}
