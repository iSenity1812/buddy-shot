import { useMemo, useState } from "react";
import {
  Alert,
  Animated,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  friends as initialFriends,
  incomingFriendRequests,
  photoPosts,
} from "@/src/data/mockData";
import MainBottomNav from "../../../components/navigation/main-bottom-nav";
import useMainScreenSwipe from "../../../hooks/use-main-screen-swipe";
import PhotoCalendar from "@/src/components/ui/PhotoCalendar";
import FriendsList from "../components/friend-list";
import UserAvatar from "@/src/components/ui/UserAvatar";
import SettingsSheet from "../components/setting-sheet";
import AddFriendModal from "../components/add-friend-modal";
import FriendRequestList from "../components/friend-request-list";
import { FriendRequest } from "@/src/types/User";

export default function ProfileScreen() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddFriendOpen, setIsAddFriendOpen] = useState(false);
  const [username, setUsername] = useState("yourname");
  const [email, setEmail] = useState("you@example.com");
  const [friends, setFriends] = useState(initialFriends);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>(
    incomingFriendRequests,
  );
  const [usernameModalOpen, setUsernameModalOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const { panHandlers, animatedStyle } = useMainScreenSwipe({
    mode: "profile",
    disabled:
      isSettingsOpen ||
      isAddFriendOpen ||
      usernameModalOpen ||
      emailModalOpen ||
      passwordModalOpen,
  });

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

  const handleSendFriendRequest = (targetUsername: string): boolean => {
    const normalized = targetUsername.toLowerCase();

    if (normalized === username.toLowerCase()) {
      return false;
    }

    if (friendUsernames.has(normalized) || requestUsernames.has(normalized)) {
      return false;
    }

    return true;
  };

  const handleAcceptRequest = (requestId: string) => {
    const acceptedRequest = friendRequests.find(
      (request) => request.id === requestId,
    );

    if (!acceptedRequest) return;

    setFriends((prev) => [...prev, acceptedRequest.sender]);
    setFriendRequests((prev) =>
      prev.filter((request) => request.id !== requestId),
    );
    Alert.alert(
      "Friend added",
      `${acceptedRequest.sender.name} is now your friend.`,
    );
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
          onPress: () => {
            setFriendRequests((prev) =>
              prev.filter((request) => request.id !== requestId),
            );
            Alert.alert(
              "Request denied",
              `You denied ${deniedRequest.sender.name}'s request.`,
            );
          },
        },
      ],
    );
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
              avatarUrl={"https://i.pravatar.cc/150?img=32"}
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
          />

          {friendRequests.length > 0 ? (
            <FriendRequestList
              requests={friendRequests}
              onAccept={handleAcceptRequest}
              onDeny={handleDenyRequest}
            />
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
          username={username}
          email={email}
          onEditUsername={() => setUsernameModalOpen(true)}
          onEditEmail={() => setEmailModalOpen(true)}
          onEditPassword={() => setPasswordModalOpen(true)}
          usernameModalOpen={usernameModalOpen}
          onUsernameModalClose={() => setUsernameModalOpen(false)}
          onUsernameSave={setUsername}
          emailModalOpen={emailModalOpen}
          onEmailModalClose={() => setEmailModalOpen(false)}
          onEmailSave={setEmail}
          passwordModalOpen={passwordModalOpen}
          onPasswordModalClose={() => setPasswordModalOpen(false)}
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
