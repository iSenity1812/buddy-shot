import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Animated,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import MainBottomNav from "../../../components/navigation/main-bottom-nav";
import useMainScreenSwipe from "../../../hooks/use-main-screen-swipe";
import PhotoCalendar from "@/src/components/ui/PhotoCalendar";
import FriendsList from "../components/friend-list";
import UserAvatar from "@/src/components/ui/UserAvatar";
import SettingsSheet from "../components/setting-sheet";
import AddFriendModal from "../components/add-friend-modal";
import FriendRequestList from "../components/friend-request-list";
import { Friend, FriendRequest } from "@/src/types/User";
import { PhotoPost } from "@/src/types/Photo";
import { authApi } from "@/src/features/auth/api/auth.api";
import { HttpError } from "@/src/services/http/axios.config";
import { profileApi } from "@/src/services/api/profile.api";
import { photosApi } from "@/src/services/api/photos.api";
import {
  socialApi,
  type SearchUser,
} from "@/src/services/api/social.api";
import type { ImagePickerAsset } from "expo-image-picker";
import { realtimeSocketClient } from "@/src/services/realtime/socket-client";

export default function ProfileScreen() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddFriendOpen, setIsAddFriendOpen] = useState(false);
  const [username, setUsername] = useState("yourname");
  const [email, setEmail] = useState("you@example.com");
  const [avatarUrl, setAvatarUrl] = useState("https://i.pravatar.cc/150?img=32");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [photoPosts, setPhotoPosts] = useState<PhotoPost[]>([]);
  const [usernameModalOpen, setUsernameModalOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [isAuthActionLoading, setIsAuthActionLoading] = useState(false);
  const [isSocialActionLoading, setIsSocialActionLoading] = useState(false);
  const [isProfileActionLoading, setIsProfileActionLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const { panHandlers, animatedStyle } = useMainScreenSwipe({
    mode: "profile",
    disabled:
      isSettingsOpen ||
      isAddFriendOpen ||
      usernameModalOpen ||
      emailModalOpen ||
      passwordModalOpen ||
      isAuthActionLoading ||
      isSocialActionLoading ||
      isProfileActionLoading,
  });

  const loadProfileData = useCallback(async () => {
    try {
      setIsDataLoading(true);
      const [me, account, fetchedFriends, fetchedRequests, myPhotos] = await Promise.all([
        profileApi.getMe(),
        authApi.me(),
        socialApi.listFriends(),
        socialApi.listIncomingRequests(),
        photosApi.listMyPhotos({
          sort: "desc",
          page: 1,
          limit: 120,
        }),
      ]);

      setUsername(me.username);
      setEmail(account.email);
      setAvatarUrl(me.avatarUrl || "https://i.pravatar.cc/150?img=32");
      setFriends(fetchedFriends);
      setFriendRequests(fetchedRequests);
      setPhotoPosts(myPhotos);
    } catch (error) {
      if (error instanceof HttpError) {
        Alert.alert("Load profile failed", error.message);
      } else {
        Alert.alert("Load profile failed", "Please try again.");
      }
    } finally {
      setIsDataLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadProfileData();
    }, [loadProfileData]),
  );

  useEffect(() => {
    const unsubscribeAvatarChanged = realtimeSocketClient.onProfileAvatarChanged(
      () => {
        void loadProfileData();
      },
    );

    const unsubscribeCaptionUpdated =
      realtimeSocketClient.onPhotoCaptionUpdated(() => {
        void loadProfileData();
      });

    const unsubscribePhotoDeleted = realtimeSocketClient.onPhotoDeleted(() => {
      void loadProfileData();
    });

    return () => {
      unsubscribeAvatarChanged();
      unsubscribeCaptionUpdated();
      unsubscribePhotoDeleted();
    };
  }, [loadProfileData]);

  const friendUsernames = useMemo(
    () => new Set(friends.map((friend) => friend.name.toLowerCase())),
    [friends],
  );

  const requestUsernames = useMemo(
    () =>
      new Set(
        friendRequests.map((request) => request.sender.name.toLowerCase()),
      ),
    [friendRequests],
  );

  const findExactUsernameMatch = (
    users: SearchUser[],
    targetUsername: string,
  ): SearchUser | undefined => {
    const normalized = targetUsername.toLowerCase();
    return users.find((user) => user.username.toLowerCase() === normalized);
  };

  const handleSendFriendRequest = async (
    targetUsername: string,
  ): Promise<{ ok: boolean; errorMessage?: string; successMessage?: string }> => {
    if (isSocialActionLoading) {
      return {
        ok: false,
        errorMessage: "Please wait for the current action to finish.",
      };
    }

    const normalized = targetUsername.toLowerCase();

    if (normalized === username.toLowerCase()) {
      return { ok: false, errorMessage: "You cannot add yourself." };
    }

    if (friendUsernames.has(normalized) || requestUsernames.has(normalized)) {
      return {
        ok: false,
        errorMessage: "Already connected or waiting for this request.",
      };
    }

    try {
      setIsSocialActionLoading(true);

      const matches = await socialApi.searchUsersByUsername(targetUsername, 10);
      const exactMatch = findExactUsernameMatch(matches, targetUsername);

      if (!exactMatch) {
        return {
          ok: false,
          errorMessage: "Username not found.",
        };
      }

      if (exactMatch.relationshipStatus === "FRIEND") {
        return {
          ok: false,
          errorMessage: "You are already friends with this user.",
        };
      }

      if (exactMatch.relationshipStatus === "PENDING_INCOMING") {
        return {
          ok: false,
          errorMessage:
            "This user already sent you a request. Please accept it from the request list.",
        };
      }

      if (exactMatch.relationshipStatus === "PENDING_OUTGOING") {
        return {
          ok: false,
          errorMessage: "Friend request already sent.",
        };
      }

      await socialApi.sendFriendRequest(exactMatch.userId);

      return {
        ok: true,
        successMessage: `Friend request sent to @${exactMatch.username}.`,
      };
    } catch (error) {
      if (error instanceof HttpError) {
        return {
          ok: false,
          errorMessage: error.message,
        };
      }

      return {
        ok: false,
        errorMessage: "Failed to send friend request. Please try again.",
      };
    } finally {
      setIsSocialActionLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    if (isSocialActionLoading) return;

    const acceptedRequest = friendRequests.find(
      (request) => request.id === requestId,
    );

    if (!acceptedRequest) return;

    try {
      setIsSocialActionLoading(true);
      await socialApi.respondToRequest(requestId, "accept");
      setFriends((prev) => [...prev, acceptedRequest.sender]);
      setFriendRequests((prev) =>
        prev.filter((request) => request.id !== requestId),
      );
      Alert.alert(
        "Friend added",
        `${acceptedRequest.sender.name} is now your friend.`,
      );
    } catch (error) {
      if (error instanceof HttpError) {
        Alert.alert("Accept failed", error.message);
      } else {
        Alert.alert("Accept failed", "Please try again.");
      }
    } finally {
      setIsSocialActionLoading(false);
    }
  };

  const handleDenyRequest = (requestId: string) => {
    const deniedRequest = friendRequests.find(
      (request) => request.id === requestId,
    );

    if (!deniedRequest) return;
    Alert.alert(
      "Deny Request?",
      `Are you sure you want to deny ${deniedRequest.sender.name}'s request?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Deny",
          style: "destructive",
          onPress: async () => {
            if (isSocialActionLoading) return;

            try {
              setIsSocialActionLoading(true);
              await socialApi.respondToRequest(requestId, "reject");
              setFriendRequests((prev) =>
                prev.filter((request) => request.id !== requestId),
              );
              Alert.alert(
                "Request denied",
                `You denied ${deniedRequest.sender.name}'s request.`,
              );
            } catch (error) {
              if (error instanceof HttpError) {
                Alert.alert("Deny failed", error.message);
              } else {
                Alert.alert("Deny failed", "Please try again.");
              }
            } finally {
              setIsSocialActionLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleDeleteFriend = async (friend: Friend) => {
    if (isSocialActionLoading) return;

    try {
      setIsSocialActionLoading(true);
      await socialApi.removeFriend(friend.id);
      setFriends((prev) => prev.filter((item) => item.id !== friend.id));
      Alert.alert("Friend removed", `${friend.name} has been removed.`);
    } catch (error) {
      if (error instanceof HttpError) {
        Alert.alert("Remove friend failed", error.message);
      } else {
        Alert.alert("Remove friend failed", "Please try again.");
      }
    } finally {
      setIsSocialActionLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (isAuthActionLoading) return;

    try {
      setIsAuthActionLoading(true);
      await authApi.logout({ allDevices: true });
      setIsSettingsOpen(false);
      router.replace("/(auth)/login");
    } catch (error) {
      if (error instanceof HttpError) {
        Alert.alert("Sign out failed", error.message);
      } else {
        Alert.alert("Sign out failed", "Please try again.");
      }
    } finally {
      setIsAuthActionLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete account unavailable",
      "Server API contract currently does not expose a delete-account endpoint. Please use Sign Out for now.",
    );
  };

  const handleUpdateUsername = async (newUsername: string): Promise<boolean> => {
    if (isProfileActionLoading) {
      return false;
    }

    try {
      setIsProfileActionLoading(true);
      const updated = await profileApi.updateMe({ username: newUsername });
      setUsername(updated.username);
      return true;
    } catch (error) {
      if (error instanceof HttpError) {
        Alert.alert("Update username failed", error.message);
      } else {
        Alert.alert("Update username failed", "Please try again.");
      }
      return false;
    } finally {
      setIsProfileActionLoading(false);
    }
  };

  const handleUpdateEmail = async (_newEmail: string): Promise<boolean> => {
    if (isProfileActionLoading) {
      return false;
    }

    try {
      setIsProfileActionLoading(true);
      const updated = await authApi.updateEmail({ email: _newEmail });
      setEmail(updated.email);
      return true;
    } catch (error) {
      if (error instanceof HttpError) {
        Alert.alert("Update email failed", error.message);
      } else {
        Alert.alert("Update email failed", "Please try again.");
      }
      return false;
    } finally {
      setIsProfileActionLoading(false);
    }
  };

  const handleChangePassword = async (
    currentPassword: string,
    newPassword: string,
  ): Promise<boolean> => {
    if (isProfileActionLoading) {
      return false;
    }

    try {
      setIsProfileActionLoading(true);
      await authApi.changePassword({
        currentPassword,
        newPassword,
      });
      return true;
    } catch (error) {
      if (error instanceof HttpError) {
        if (error.code === "INVALID_CREDENTIALS") {
          Alert.alert("Change password failed", "Current password is incorrect.");
        } else {
          Alert.alert("Change password failed", error.message);
        }
      } else {
        Alert.alert("Change password failed", "Please try again.");
      }
      return false;
    } finally {
      setIsProfileActionLoading(false);
    }
  };

  const handleUpdateAvatar = async (
    asset: ImagePickerAsset,
  ): Promise<boolean> => {
    if (isProfileActionLoading) {
      return false;
    }

    try {
      setIsProfileActionLoading(true);
      const updated = await profileApi.uploadAvatarFromLocalUri(asset.uri);
      setAvatarUrl(updated.avatarUrl || "https://i.pravatar.cc/150?img=32");
      return true;
    } catch (error) {
      if (error instanceof HttpError) {
        Alert.alert("Update avatar failed", error.message);
      } else {
        Alert.alert("Update avatar failed", "Please try again.");
      }
      return false;
    } finally {
      setIsProfileActionLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <Animated.View className="flex-1" style={animatedStyle} {...panHandlers}>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 148 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between px-4 py-3">
            <Text className="text-xl font-bold text-foreground">Profile</Text>
            <Pressable
              onPress={() => setIsSettingsOpen(true)}
              className="active:scale-95 p-2"
            >
              <Feather
                name="settings"
                size={22}
                color="hsl(var(--muted-foreground))"
              />
            </Pressable>
          </View>

          {/* Avatar + Info */}
          <View className="items-center py-6">
            <UserAvatar
              avatarUrl={avatarUrl}
              size={100}
              ringWidth={4}
              ringClassName="border-primary/30"
              className="mb-3"
            />

            <Text className="text-lg font-bold text-foreground">
              {username}
            </Text>

            <View className="mt-3 bg-muted rounded-full px-5 py-1.5 flex-row">
              <Text className="text-sm font-semibold text-foreground">
                {friends.length}
              </Text>
              <Text className="text-sm text-muted-foreground ml-1">
                friends
              </Text>
            </View>
          </View>

          {/* Friends List */}
          <FriendsList
            friends={friends}
            onAddFriend={() => setIsAddFriendOpen(true)}
            onDeleteFriend={(friend) => {
              void handleDeleteFriend(friend);
            }}
          />

          {friendRequests.length > 0 ? (
            <FriendRequestList
              requests={friendRequests}
              onAccept={(requestId) => {
                void handleAcceptRequest(requestId);
              }}
              onDeny={handleDenyRequest}
            />
          ) : null}

          {isDataLoading ? (
            <View className="px-4 mt-3">
              <Text className="text-sm text-muted-foreground">Loading profile data...</Text>
            </View>
          ) : null}

          {/* Photo Calendar */}
          <View className="px-4 mt-6">
            <Text className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">
              Photo Calendar
            </Text>
            <PhotoCalendar posts={photoPosts} />
          </View>
        </ScrollView>

        <SettingsSheet
          open={isSettingsOpen}
          onOpenChange={setIsSettingsOpen}
          avatarUrl={avatarUrl}
          username={username}
          email={email}
          onEditUsername={() => setUsernameModalOpen(true)}
          onEditEmail={() => setEmailModalOpen(true)}
          onEditPassword={() => setPasswordModalOpen(true)}
          usernameModalOpen={usernameModalOpen}
          onUsernameModalClose={() => setUsernameModalOpen(false)}
          onUsernameSave={handleUpdateUsername}
          emailModalOpen={emailModalOpen}
          onEmailModalClose={() => setEmailModalOpen(false)}
          onEmailSave={handleUpdateEmail}
          passwordModalOpen={passwordModalOpen}
          onPasswordModalClose={() => setPasswordModalOpen(false)}
          onPasswordSave={handleChangePassword}
          onAvatarSave={handleUpdateAvatar}
          onSignOut={() => void handleSignOut()}
          onDeleteAccount={handleDeleteAccount}
          authActionLoading={isAuthActionLoading || isProfileActionLoading}
        />

        <AddFriendModal
          visible={isAddFriendOpen}
          onClose={() => setIsAddFriendOpen(false)}
          onSubmit={handleSendFriendRequest}
        />
      </Animated.View>

      <MainBottomNav mode="profile" />
    </SafeAreaView>
  );
}
