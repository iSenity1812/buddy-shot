import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeInDown, FadeOutUp } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import UserAvatar from "@/src/components/ui/UserAvatar";
import { FriendRequest } from "@/src/types/User";

const INITIAL_COUNT = 3;

interface FriendRequestListProps {
  requests: FriendRequest[];
  onAccept: (requestId: string) => void;
  onDeny: (requestId: string) => void;
}

export default function FriendRequestList({
  requests,
  onAccept,
  onDeny,
}: FriendRequestListProps) {
  const [showAll, setShowAll] = useState(false);
  const canToggle = requests.length > INITIAL_COUNT;

  const sortedRequests = useMemo(
    () =>
      [...requests].sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      ),
    [requests],
  );

  return (
    <View className="px-4 mt-6">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
          <Feather name="user-check" size={14} color="black" /> Friend Requests
        </Text>
      </View>

      {sortedRequests.length === 0 ? (
        <View className="bg-card rounded-xl p-4">
          <Text className="text-sm text-muted-foreground">
            No pending friend requests.
          </Text>
        </View>
      ) : (
        <View className="gap-2">
          {sortedRequests.map((request, index) => {
            const isExtra = index >= INITIAL_COUNT;

            if (isExtra && !showAll) return null;

            return (
              <Animated.View
                key={request.id}
                entering={
                  isExtra
                    ? FadeInDown.duration(280).delay(
                        (index - INITIAL_COUNT) * 60,
                      )
                    : undefined
                }
                exiting={isExtra ? FadeOutUp.duration(200) : undefined}
              >
                <View className="flex-row items-center bg-card rounded-xl p-3">
                  <View className="flex-row items-center gap-3 flex-1">
                    <UserAvatar avatarUrl={request.sender.avatar} size={44} />
                    <View className="flex-1">
                      <Text className="font-semibold text-md text-foreground">
                        {request.sender.name}
                      </Text>
                      <Text className="text-xs text-muted-foreground">
                        @{request.sender.name.toLowerCase()}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-center gap-2">
                    <Pressable
                      onPress={() => onDeny(request.id)}
                      className="active:scale-95 px-3 py-1.5 rounded-full border border-border"
                    >
                      <Text className="text-xs font-semibold text-muted-foreground">
                        Deny
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => onAccept(request.id)}
                      className="active:scale-95 px-3 py-1.5 rounded-full bg-primary"
                    >
                      <Text className="text-xs font-semibold text-primary-foreground">
                        Accept
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </Animated.View>
            );
          })}
        </View>
      )}

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
