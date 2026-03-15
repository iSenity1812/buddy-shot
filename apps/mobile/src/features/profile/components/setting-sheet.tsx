import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import DraggableBottomSheetModal from "@/src/components/ui/DraggableBottomSheetModal";
import UserAvatar from "@/src/components/ui/UserAvatar";
import UpdateUsernameModal from "./update-username-modal";
import UpdateEmailModal from "./update-email-modal";
import UpdatePasswordModal from "./update-password-modal";

interface SettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  username: string;
  email: string;
  onEditUsername: () => void;
  onEditEmail: () => void;
  onEditPassword: () => void;
  usernameModalOpen: boolean;
  onUsernameModalClose: () => void;
  onUsernameSave: (v: string) => void;
  emailModalOpen: boolean;
  onEmailModalClose: () => void;
  onEmailSave: (v: string) => void;
  passwordModalOpen: boolean;
  onPasswordModalClose: () => void;
}

export default function SettingsSheet({
  open,
  onOpenChange,
  username,
  email,
  onEditUsername,
  onEditEmail,
  onEditPassword,
  usernameModalOpen,
  onUsernameModalClose,
  onUsernameSave,
  emailModalOpen,
  onEmailModalClose,
  onEmailSave,
  passwordModalOpen,
  onPasswordModalClose,
}: SettingsSheetProps) {
  const [avatarPreview, setAvatarPreview] = useState(
    "https://i.pravatar.cc/150?img=32",
  );

  const applyAvatarAsset = (asset: ImagePicker.ImagePickerAsset) => {
    if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
      Alert.alert("File too large", "Avatar must be under 5MB");
      return;
    }
    setAvatarPreview(asset.uri);
  };

  const pickAvatarFromLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permission required",
        "Please allow photo access to change your avatar.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.9,
      aspect: [1, 1],
    });

    if (result.canceled) return;
    applyAvatarAsset(result.assets[0]);
  };

  const takeAvatarWithCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permission required",
        "Please allow camera access to take an avatar photo.",
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.9,
      aspect: [1, 1],
    });

    if (result.canceled) return;
    applyAvatarAsset(result.assets[0]);
  };

  const handleAvatarChange = () => {
    Alert.alert("Change Avatar", "Choose image source", [
      { text: "Camera", onPress: () => void takeAvatarWithCamera() },
      { text: "Photo Library", onPress: () => void pickAvatarFromLibrary() },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () => {
          Alert.alert("Signed out", "You have been signed out.");
          onOpenChange(false);
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete your account?",
      "All your photos, friends, and data will be lost forever.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Forever",
          style: "destructive",
          onPress: () => {
            Alert.alert("Account deleted", "Your account has been removed.");
            onOpenChange(false);
          },
        },
      ],
    );
  };

  return (
    <DraggableBottomSheetModal
      visible={open}
      onClose={() => onOpenChange(false)}
      title="Settings"
    >
      <ScrollView
        className="pb-24"
        showsVerticalScrollIndicator={false}
        // contentContainerStyle={{ paddingBottom: 0 }}
      >
        <View className="flex-col gap-3 px-1">
          <Text className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Account Information
          </Text>

          <View className="flex-row items-center gap-4">
            <View className="relative">
              <UserAvatar
                avatarUrl={avatarPreview}
                size={80}
                ringWidth={2}
                ringClassName="border-primary"
              />
              <Pressable
                onPress={handleAvatarChange}
                className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1.5 active:scale-95"
              >
                <Feather
                  name="camera"
                  size={14}
                  color="hsl(var(--primary-foreground))"
                />
              </Pressable>
            </View>

            {/* Right section */}
            <View className="flex-1 gap-4">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-medium text-foreground">
                  Username
                </Text>
                <Pressable
                  onPress={onEditUsername}
                  className="flex-row items-center gap-1"
                >
                  <Text className="font-semibold text-muted-foreground">
                    {username}
                  </Text>
                  <Feather
                    name="chevron-right"
                    size={15}
                    color="hsl(var(--muted-foreground))"
                  />
                </Pressable>
              </View>

              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-medium text-foreground">
                  Email
                </Text>
                <Pressable
                  onPress={onEditEmail}
                  className="flex-row items-center gap-1"
                >
                  <Text className="font-semibold text-muted-foreground">
                    {email}
                  </Text>
                  <Feather
                    name="chevron-right"
                    size={15}
                    color="hsl(var(--muted-foreground))"
                  />
                </Pressable>
              </View>

              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-medium text-foreground">
                  Password
                </Text>
                <Pressable
                  onPress={onEditPassword}
                  className="flex-row items-center gap-1"
                >
                  <Text className="font-semibold text-muted-foreground">
                    change password
                  </Text>
                  <Feather
                    name="chevron-right"
                    size={15}
                    color="hsl(var(--muted-foreground))"
                  />
                </Pressable>
              </View>
            </View>
          </View>
        </View>

        <View className="my-6 h-px bg-border" />

        <View className="flex-col gap-3 px-4 py-4 border-2 border-destructive/40 rounded-2xl">
          <Text className="text-sm font-semibold text-destructive uppercase tracking-wider">
            Danger Zone
          </Text>

          <Pressable
            onPress={handleSignOut}
            className="w-full rounded-full border border-destructive/30 py-3.5 items-center active:scale-95"
          >
            <View className="flex-row items-center gap-2">
              <Feather
                name="log-out"
                size={16}
                color="hsl(var(--destructive))"
              />
              <Text className="font-semibold text-destructive">Sign Out</Text>
            </View>
          </Pressable>

          <Pressable
            onPress={handleDeleteAccount}
            className="w-full rounded-full bg-destructive py-3.5 items-center active:scale-95"
          >
            <View className="flex-row items-center gap-2">
              <Feather
                name="trash-2"
                size={16}
                color="hsl(var(--destructive-foreground))"
              />
              <Text className="font-semibold text-destructive-foreground">
                Delete Account
              </Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>

      <UpdateUsernameModal
        visible={usernameModalOpen}
        onClose={onUsernameModalClose}
        currentUsername={username}
        onSave={onUsernameSave}
      />

      <UpdateEmailModal
        visible={emailModalOpen}
        onClose={onEmailModalClose}
        currentEmail={email}
        onSave={onEmailSave}
      />

      <UpdatePasswordModal
        visible={passwordModalOpen}
        onClose={onPasswordModalClose}
      />
    </DraggableBottomSheetModal>
  );
}
