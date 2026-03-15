import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import DraggableBottomSheetModal from "@/src/components/ui/DraggableBottomSheetModal";

interface PasswordInputProps {
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  placeholder: string;
  autoFocus?: boolean;
}

function PasswordInput({
  value,
  onChange,
  show,
  onToggle,
  placeholder,
  autoFocus,
}: PasswordInputProps) {
  return (
    <View className="relative">
      <TextInput
        secureTextEntry={!show}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="hsl(var(--muted-foreground))"
        autoFocus={autoFocus}
        className="pr-10 bg-background border border-border rounded-xl px-4 py-3 text-foreground"
      />
      <Pressable
        onPress={onToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2"
      >
        <Feather
          name={show ? "eye-off" : "eye"}
          size={16}
          color="hsl(var(--muted-foreground))"
        />
      </Pressable>
    </View>
  );
}

interface UpdatePasswordModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function UpdatePasswordModal({
  visible,
  onClose,
}: UpdatePasswordModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (visible) {
      setStep(1);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowCurrent(false);
      setShowNew(false);
      setShowConfirm(false);
      setErrors({});
    }
  }, [visible]);

  const handleContinue = () => {
    if (!currentPassword) {
      setErrors({ currentPassword: "Enter your current password" });
      return;
    }
    // Mock verification — replace with real API call
    if (currentPassword !== "password123") {
      setErrors({ currentPassword: "Incorrect current password" });
      return;
    }
    setErrors({});
    setStep(2);
  };

  const validateNewPasswords = (): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (!newPassword) {
      errs.newPassword = "Enter a new password";
    } else if (newPassword.length < 8) {
      errs.newPassword = "Password must be at least 8 characters";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      errs.newPassword = "Must include uppercase, lowercase, and a number";
    }
    if (!confirmPassword) {
      errs.confirmPassword = "Please confirm your new password";
    } else if (newPassword !== confirmPassword) {
      errs.confirmPassword = "Passwords do not match";
    }
    return errs;
  };

  const handleUpdate = () => {
    const errs = validateNewPasswords();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    Alert.alert("Password changed", "Your password has been updated.");
    onClose();
  };

  return (
    <DraggableBottomSheetModal
      visible={visible}
      onClose={onClose}
      title="Change Password"
    >
      <ScrollView bounces={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <View>
          {step === 1 ? (
            <View className="gap-4 px-1 pb-10">
              <Text className="text-sm text-muted-foreground -mt-2">
                Please verify your current password to continue.
              </Text>

              <View className="gap-1.5">
                <Text className="text-sm font-medium text-foreground">
                  Current Password
                </Text>
                <PasswordInput
                  autoFocus
                  value={currentPassword}
                  onChange={(v) => {
                    setCurrentPassword(v);
                    setErrors((prev) => ({ ...prev, currentPassword: "" }));
                  }}
                  show={showCurrent}
                  onToggle={() => setShowCurrent((s) => !s)}
                  placeholder="Enter current password"
                />
                {errors.currentPassword ? (
                  <Text className="text-xs text-destructive font-medium">
                    {errors.currentPassword}
                  </Text>
                ) : null}
              </View>

              <Pressable
                onPress={handleContinue}
                className="w-full rounded-full bg-primary py-3.5 items-center active:scale-95"
              >
                <Text className="font-semibold text-primary-foreground">
                  Continue
                </Text>
              </Pressable>
            </View>
          ) : (
            <View className="gap-4 px-1 pb-4">
              <View className="gap-1.5">
                <Text className="text-sm font-medium text-foreground">
                  New Password
                </Text>
                <PasswordInput
                  autoFocus
                  value={newPassword}
                  onChange={(v) => {
                    setNewPassword(v);
                    setErrors((prev) => ({ ...prev, newPassword: "" }));
                  }}
                  show={showNew}
                  onToggle={() => setShowNew((s) => !s)}
                  placeholder="At least 8 characters"
                />
                {errors.newPassword ? (
                  <Text className="text-xs text-destructive font-medium">
                    {errors.newPassword}
                  </Text>
                ) : null}
              </View>

              <View className="gap-1.5">
                <Text className="text-sm font-medium text-foreground">
                  Confirm New Password
                </Text>
                <PasswordInput
                  value={confirmPassword}
                  onChange={(v) => {
                    setConfirmPassword(v);
                    setErrors((prev) => ({ ...prev, confirmPassword: "" }));
                  }}
                  show={showConfirm}
                  onToggle={() => setShowConfirm((s) => !s)}
                  placeholder="Re-enter new password"
                />
                {errors.confirmPassword ? (
                  <Text className="text-xs text-destructive font-medium">
                    {errors.confirmPassword}
                  </Text>
                ) : null}
              </View>

              <Pressable
                onPress={handleUpdate}
                className="w-full rounded-full bg-primary py-3.5 items-center active:scale-95"
              >
                <Text className="font-semibold text-primary-foreground">
                  Update Password
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  setStep(1);
                  setNewPassword("");
                  setConfirmPassword("");
                  setErrors({});
                }}
                className="w-full rounded-full border border-border py-3 items-center active:scale-95"
              >
                <Text className="font-medium text-muted-foreground">Back</Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>
    </DraggableBottomSheetModal>
  );
}
