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
import { Friend } from "@/src/types/User";
import DownloadImageButton from "../components/download-image-button";
import { HttpError } from "@/src/services/http/axios.config";
import { socialApi } from "@/src/services/api/social.api";

export default function SendPhotoScreen() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const params = useLocalSearchParams<{ imageUri?: string }>();
  const image =
    typeof params.imageUri === "string" && params.imageUri.length > 0
      ? params.imageUri
      : "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&h=600&fit=crop";
  const [message, setMessage] = useState("");
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [allSelected, setAllSelected] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const isLocked = isSending || isSent;

  useEffect(() => {
    let isMounted = true;

    const loadRecipients = async () => {
      try {
        const data = await socialApi.listFriends();
        if (isMounted) {
          setFriends(data);
        }
      } catch (error) {
        if (!isMounted) return;

        if (error instanceof HttpError) {
          Alert.alert("Load recipients failed", error.message);
        } else {
          Alert.alert("Load recipients failed", "Please try again.");
        }
      }
    };

    void loadRecipients();

    return () => {
      isMounted = false;
    };
  }, []);

  const toggleFriend = (id: string) => {
    setAllSelected(false);
    setSelectedFriends((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id],
    );
  };

  const selectAll = () => {
    setAllSelected(true);
    setSelectedFriends([]);
  };

  const handleSend = async () => {
    if (isLocked) return;
    Keyboard.dismiss();
    setIsSending(true);
    // simulate network request
    await new Promise<void>((resolve) => setTimeout(resolve, 1800));
    setIsSending(false);
    setIsSent(true);
    await new Promise<void>((resolve) => setTimeout(resolve, 900));
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start(() => {
      router.replace("/(main)");
    });
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
                <DownloadImageButton imageUri={image} />
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
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 12 }}
                  >
                    <Pressable
                      onPress={selectAll}
                      className={`w-12 h-12 rounded-full items-center justify-center ${
                        allSelected ? "bg-primary" : "bg-muted"
                      }`}
                    >
                      <Text
                        className={`text-sm font-medium ${
                          allSelected
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

                      return (
                        <Pressable
                          key={friend.id}
                          onPress={() => toggleFriend(friend.id)}
                          className="relative"
                        >
                          <Image
                            source={{ uri: friend.avatar }}
                            style={{ width: 44, height: 44, borderRadius: 999 }}
                            contentFit="cover"
                            className={
                              isSelected
                                ? "border-2 border-primary"
                                : "border-2 border-friend-ring opacity-60"
                            }
                          />
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
              </ScrollView>

              <View className="px-6 mt-auto">
                <Pressable
                  onPress={handleSend}
                  disabled={isLocked}
                  className={`w-full py-4 rounded-full flex-row items-center justify-center gap-2 ${
                    isSent ? "bg-green-500" : "bg-primary"
                  } ${!isLocked ? "active:scale-95" : ""}`}
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
