import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import DownloadImageButton from "../components/download-image-button";
import UserAvatar from "@/src/components/ui/UserAvatar";
import { HttpError } from "@/src/services/http/axios.config";
import { cameraApi, type CameraFriendOption } from "../api/camera.api";

export default function SendPhotoScreen() {
  const params = useLocalSearchParams<{ imageUri?: string }>();
  const image =
    typeof params.imageUri === "string" && params.imageUri.length > 0
      ? params.imageUri
      : "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&h=600&fit=crop";
  const [friends, setFriends] = useState<CameraFriendOption[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(true);
  const [message, setMessage] = useState("");
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [allSelected, setAllSelected] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const isLocked = isSending || isSent;
  const recipientIds = allSelected
    ? friends.map((friend) => friend.id)
    : selectedFriends;
  const hasRecipients = recipientIds.length > 0;

  useEffect(() => {
    let isCancelled = false;

    const loadFriends = async () => {
      setIsLoadingFriends(true);

      try {
        const loadedFriends = await cameraApi.listFriends();
        if (!isCancelled) {
          setFriends(loadedFriends);
        }
      } catch {
        if (!isCancelled) {
          Alert.alert("Unable to load friends", "Please try again in a moment.");
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingFriends(false);
        }
      }
    };

    void loadFriends();

    return () => {
      isCancelled = true;
    };
  }, []);

  const toggleFriend = (id: string) => {
    setErrorMessage(null);
    setAllSelected(false);
    setSelectedFriends((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id],
    );
  };

  const selectAll = () => {
    setErrorMessage(null);
    setAllSelected(true);
    setSelectedFriends([]);
  };

  const toUserMessage = (error: unknown): string => {
    if (error instanceof HttpError) {
      if (error.code === "PHOTO_SHARING_VALIDATION_ERROR") {
        return "Please check your caption and recipients, then try again.";
      }

      if (error.code === "PHOTO_SHARING_CONFLICT_ERROR") {
        return "Some selected recipients are no longer eligible to receive this photo.";
      }

      return error.message;
    }

    if (error instanceof Error && error.message) {
      return error.message;
    }

    return "Upload failed. Please try again.";
  };

  const handleSend = async () => {
    if (isLocked) return;

    if (!hasRecipients) {
      setErrorMessage("Select at least one friend to send this memory.");
      return;
    }

    Keyboard.dismiss();
    setErrorMessage(null);
    setIsSending(true);

    try {
      const upload = await cameraApi.uploadPhotoDirect(image);
      setUploadedImageUrl(upload.imageUrl);

      await cameraApi.sendPhoto({
        imageKey: upload.imageKey,
        caption: message.trim() ? message.trim() : undefined,
        recipientIds,
      });

      setIsSent(true);
      await new Promise<void>((resolve) => setTimeout(resolve, 900));
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        router.replace("/(main)");
      });
    } catch (error) {
      setErrorMessage(toUserMessage(error));
      setIsSending(false);
      return;
    }

    setIsSending(false);
  };

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
      <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View
              className="flex-1 pb-6"
              pointerEvents={isLocked ? "none" : "auto"}
            >
              <View className="flex-row items-center justify-between px-4 py-3">
                <Pressable
                  onPress={() => router.back()}
                  className={`p-2 active:scale-95 ${isLocked ? "opacity-30" : ""}`}
                >
                  <Feather name="x" size={24} color="hsl(var(--foreground))" />
                </Pressable>
                <Text className="font-semibold text-foreground">
                  New Memory
                </Text>
                <DownloadImageButton
                  imageUri={uploadedImageUrl ?? image}
                  disabled={!uploadedImageUrl}
                />
              </View>

              <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingBottom: 20 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <View className="px-6 mb-4">
                  <View className="bg-card rounded-lg p-2 pb-4 polaroid-shadow">
                    <Image
                      source={{ uri: image }}
                      style={{ width: "100%", aspectRatio: 1, borderRadius: 6 }}
                      contentFit="cover"
                    />
                    {message ? (
                      <Text className="font-handwritten text-lg text-center mt-2 px-2 text-foreground">
                        {message}
                      </Text>
                    ) : null}
                  </View>
                </View>

                <View className="px-6 mb-4">
                  <TextInput
                    value={message}
                    onChangeText={setMessage}
                    placeholder="Add a message to this memory..."
                    placeholderTextColor="hsl(var(--muted-foreground))"
                    className="w-full bg-muted rounded-xl py-3 px-4 text-base text-foreground"
                    style={{ color: "hsl(var(--foreground))" }}
                    maxLength={40}
                    editable={!isLocked}
                  />
                </View>

                <View className="px-6 mb-4">
                  <Text className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                    Send to
                  </Text>
                  {isLoadingFriends ? (
                    <View className="w-full py-4 items-center justify-center">
                      <ActivityIndicator
                        size="small"
                        color="hsl(var(--muted-foreground))"
                      />
                    </View>
                  ) : null}
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 12 }}
                  >
                    <Pressable
                      onPress={selectAll}
                      className={`w-12 h-12 rounded-full items-center justify-center ${allSelected ? "bg-primary" : "bg-muted"
                        }`}
                    >
                      <Text
                        className={`text-sm font-medium ${allSelected
                          ? "text-primary-foreground"
                          : "text-muted-foreground"
                          }`}
                      >
                        All
                      </Text>
                    </Pressable>

                    {friends.map((friend) => {
                      const isSelected =
                        !allSelected && selectedFriends.includes(friend.id);

                      const getInitials = (name: string): string => {
                        return name
                          .split(" ")
                          .slice(0, 2)
                          .map((word) => word[0]?.toUpperCase())
                          .join("")
                          .slice(0, 2) || "?";
                      };

                      return (
                        <Pressable
                          key={friend.id}
                          onPress={() => toggleFriend(friend.id)}
                          className="relative"
                        >
                          <View
                            style={
                              isSelected ? { transform: [{ scale: 1.1 }] } : undefined
                            }
                          >
                            <UserAvatar
                              avatarUrl={friend.avatar}
                              initials={getInitials(friend.name)}
                              size={44}
                              ringWidth={2}
                              ringClassName={
                                isSelected
                                  ? "border-primary"
                                  : "border-friend-ring"
                              }
                            />
                          </View>
                          {isSelected ? (
                            <View className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-primary rounded-full items-center justify-center">
                              <Feather
                                name="check"
                                size={10}
                                color="hsl(var(--primary-foreground))"
                              />
                            </View>
                          ) : null}
                        </Pressable>
                      );
                    })}

                    {friends.length === 0 ? (
                      <View className="px-1 py-2">
                        <Text className="text-xs text-muted-foreground">
                          No recipients available.
                        </Text>
                      </View>
                    ) : null}
                  </ScrollView>
                </View>

                {errorMessage ? (
                  <View className="px-6 mb-3">
                    <Text className="text-sm text-red-500">{errorMessage}</Text>
                  </View>
                ) : null}

                {!uploadedImageUrl ? (
                  <View className="px-6 mb-3">
                    <Text className="text-xs text-muted-foreground">
                      Download will be available after upload succeeds.
                    </Text>
                  </View>
                ) : null}
              </ScrollView>

              <View className="px-6 mt-auto">
                <Pressable
                  onPress={handleSend}
                  disabled={isLocked || isLoadingFriends || !hasRecipients}
                  className={`w-full py-4 rounded-full flex-row items-center justify-center gap-2 ${isSent ? "bg-green-500" : "bg-primary"
                    } ${!isLocked ? "active:scale-95" : ""}`}
                  style={{
                    opacity: isLocked || isLoadingFriends || !hasRecipients ? 0.65 : 1,
                  }}
                >
                  {isSending ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : isSent ? (
                    <Feather name="check-circle" size={18} color="white" />
                  ) : (
                    <Feather name="send" size={18} color="white" />
                  )}
                  <Text className="text-primary-foreground text-base font-semibold">
                    {isSending
                      ? "Sending..."
                      : isSent
                        ? "Memory Sent!"
                        : "Send Memory"}
                  </Text>
                </Pressable>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Animated.View>
  );
}
