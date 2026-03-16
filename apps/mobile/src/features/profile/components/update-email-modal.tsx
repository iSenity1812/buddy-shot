import { useEffect, useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import DraggableBottomSheetModal from "@/src/components/ui/DraggableBottomSheetModal";

interface UpdateEmailModalProps {
  visible: boolean;
  onClose: () => void;
  currentEmail: string;
  onSave: (newEmail: string) => Promise<boolean>;
}

export default function UpdateEmailModal({
  visible,
  onClose,
  currentEmail,
  onSave,
}: UpdateEmailModalProps) {
  const [email, setEmail] = useState(currentEmail);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setEmail(currentEmail);
      setError("");
    }
  }, [visible, currentEmail]);

  const validate = (value: string): string => {
    if (!value.trim()) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
      return "Invalid email address";
    return "";
  };

  const handleSave = async () => {
    if (isSaving) {
      return;
    }

    const err = validate(email);
    if (err) {
      setError(err);
      return;
    }

    try {
      setIsSaving(true);
      const ok = await onSave(email.trim());
      if (!ok) {
        return;
      }

      onClose();
      Alert.alert("Email updated", "Your email has been saved.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DraggableBottomSheetModal
      visible={visible}
      onClose={onClose}
      title="Update Email"
    >
      <View className="gap-4 px-1 pb-10">
        <View className="gap-1.5">
          <Text className="text-sm font-medium text-foreground">New Email</Text>
          <TextInput
            autoFocus
            value={email}
            onChangeText={(v) => {
              setEmail(v);
              setError("");
            }}
            placeholder="you@example.com"
            placeholderTextColor="hsl(var(--muted-foreground))"
            keyboardType="email-address"
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
