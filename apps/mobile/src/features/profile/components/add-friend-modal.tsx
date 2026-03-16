import { useEffect, useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import DraggableBottomSheetModal from "@/src/components/ui/DraggableBottomSheetModal";

interface AddFriendModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (
    username: string,
  ) => Promise<{ ok: boolean; errorMessage?: string; successMessage?: string }>;
}

export default function AddFriendModal({
  visible,
  onClose,
  onSubmit,
}: AddFriendModalProps) {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setUsername("");
      setError("");
    }
  }, [visible]);

  const validate = (value: string): string => {
    const trimmed = value.trim();
    if (!trimmed) return "Username is required";
    if (trimmed.length < 3) return "Username must be at least 3 characters";
    if (trimmed.length > 30) return "Username must be less than 30 characters";
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      return "Only letters, numbers, and underscores";
    }
    return "";
  };

  const handleAddFriend = async () => {
    if (isSubmitting) {
      return;
    }

    const validationError = validate(username);
    if (validationError) {
      setError(validationError);
      return;
    }

    const trimmed = username.trim();
    try {
      setIsSubmitting(true);
      const result = await onSubmit(trimmed);

      if (!result.ok) {
        setError(
          result.errorMessage ??
            "Cannot send request. Username not found or already connected.",
        );
        return;
      }

      onClose();
      Alert.alert(
        "Request sent",
        result.successMessage ?? `Friend request sent to @${trimmed}.`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DraggableBottomSheetModal
      visible={visible}
      onClose={onClose}
      title="Add Friend"
    >
      <View className="gap-4 px-1 pb-4">
        <Text className="text-sm text-muted-foreground -mt-2">
          Find and add a friend by their username.
        </Text>

        <View className="gap-1.5">
          <Text className="text-sm font-medium text-foreground">Username</Text>
          <TextInput
            autoFocus
            value={username}
            onChangeText={(value) => {
              setUsername(value);
              setError("");
            }}
            placeholder="enter_username"
            placeholderTextColor="hsl(var(--muted-foreground))"
            autoCapitalize="none"
            autoCorrect={false}
            className="bg-background border border-border rounded-xl px-4 py-3 text-foreground"
          />
          {error ? (
            <Text className="text-xs text-destructive font-medium">
              {error}
            </Text>
          ) : null}
        </View>

        <Pressable
          onPress={() => void handleAddFriend()}
          disabled={isSubmitting}
          className="w-full rounded-full bg-primary py-3.5 items-center active:scale-95"
          style={{ opacity: isSubmitting ? 0.6 : 1 }}
        >
          <Text className="font-semibold text-primary-foreground">
            {isSubmitting ? "Sending..." : "Send Request"}
          </Text>
        </Pressable>
      </View>
    </DraggableBottomSheetModal>
  );
}
