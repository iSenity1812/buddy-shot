import { useEffect, useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import DraggableBottomSheetModal from "@/src/components/ui/DraggableBottomSheetModal";

interface UpdateUsernameModalProps {
  visible: boolean;
  onClose: () => void;
  currentUsername: string;
  onSave: (newUsername: string) => Promise<boolean>;
}

export default function UpdateUsernameModal({
  visible,
  onClose,
  currentUsername,
  onSave,
}: UpdateUsernameModalProps) {
  const [username, setUsername] = useState(currentUsername);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setUsername(currentUsername);
      setError("");
    }
  }, [visible, currentUsername]);

  const validate = (value: string): string => {
    if (!value.trim()) return "Username is required";
    if (value.length < 3) return "Username must be at least 3 characters";
    if (value.length > 30) return "Username must be less than 30 characters";
    if (!/^[a-zA-Z0-9_]+$/.test(value))
      return "Only letters, numbers, and underscores";
    return "";
  };

  const handleSave = async () => {
    if (isSaving) {
      return;
    }

    const err = validate(username);
    if (err) {
      setError(err);
      return;
    }

    try {
      setIsSaving(true);
      const ok = await onSave(username.trim());
      if (!ok) {
        return;
      }

      onClose();
      Alert.alert("Username updated", "Your username has been saved.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DraggableBottomSheetModal
      visible={visible}
      onClose={onClose}
      title="Update Username"
    >
      <View className="gap-4 px-1 pb-10">
        <View className="gap-1.5">
          <Text className="text-sm font-medium text-foreground">
            New Username
          </Text>
          <TextInput
            autoFocus
            value={username}
            onChangeText={(v) => {
              setUsername(v);
              setError("");
            }}
            placeholder="your_username"
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
          onPress={() => void handleSave()}
          disabled={isSaving}
          className="w-full rounded-full bg-primary py-3.5 items-center active:scale-95"
          style={{ opacity: isSaving ? 0.6 : 1 }}
        >
          <Text className="font-semibold text-primary-foreground">
            {isSaving ? "Saving..." : "Save"}
          </Text>
        </Pressable>
      </View>
    </DraggableBottomSheetModal>
  );
}
