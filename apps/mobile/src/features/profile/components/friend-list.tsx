import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import Animated, { FadeInDown, FadeOutUp } from "react-native-reanimated";
import { Entypo, Feather } from "@expo/vector-icons";
import UserAvatar from "@/src/components/ui/UserAvatar";
import { Friend } from "@/src/types/User";

const INITIAL_COUNT = 3;

interface Props {
  friends: Friend[];
  onAddFriend?: () => void;
  onDeleteFriend?: () => void;
  avatarSize?: number;
}

export default function FriendsList({
  friends,
  onAddFriend,
  avatarSize = 46,
}: Props) {
  const [showAll, setShowAll] = useState(false);
  const canToggle = friends.length > INITIAL_COUNT;

  const handleDeleteFriend = (name: string) => {
    Alert.alert(
      "Delete your friend?",
      `Are you sure you want to delete ${name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Alert.alert("Friend deleted", ` ${name} has been removed.`);
          },
        },
      ],
    );
  };

  return (
    <View className="px-4">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
          <Feather name="users" size={14} color="black" />
          Your Friends
        </Text>

        <Pressable
          onPress={onAddFriend}
          className="active:scale-95 flex-row items-center gap-1 bg-primary px-3 py-1.5 rounded-full"
        >
          <Feather name="user-plus" size={14} color="white" />
          <Text className="text-xs font-semibold text-primary-foreground">
            Add
          </Text>
        </Pressable>
      </View>

      <View className="gap-2">
        {friends.map((friend, index) => {
          const isExtra = index >= INITIAL_COUNT;

          if (isExtra && !showAll) return null;

          return (
            <Animated.View
              key={friend.id}
              entering={
                isExtra
                  ? FadeInDown.duration(280).delay((index - INITIAL_COUNT) * 60)
                  : undefined
              }
              exiting={isExtra ? FadeOutUp.duration(200) : undefined}
            >
              <View className="flex-row items-center bg-card rounded-xl p-3">
                <View className="flex-row items-center gap-3 flex-1">
                  <UserAvatar avatarUrl={friend.avatar} size={avatarSize} />
                  <Text className="font-semibold text-md text-foreground">
                    {friend.name}
                  </Text>
                </View>
                <Pressable
                  onPress={() => handleDeleteFriend(friend.name)}
                  className="active:scale-95 flex-row items-center gap-1 bg-primary px-3 py-1.5 rounded-full"
                >
                  <Entypo name="cross" size={14} color="white" />
                </Pressable>
              </View>
            </Animated.View>
          );
        })}
      </View>

      {canToggle && (
        <View className="flex-row items-center gap-4 mt-5">
          <View className="h-[2px] bg-muted flex-1" />
          <Pressable
            onPress={() => setShowAll((prev) => !prev)}
            className="active:scale-95 bg-muted px-6 py-2.5 rounded-full"
          >
            <Text className="text-base font-semibold text-muted-foreground">
              {showAll ? "Show less" : "Show all"}
            </Text>
          </Pressable>
          <View className="h-[2px] bg-muted flex-1" />
        </View>
      )}
    </View>
  );
}
