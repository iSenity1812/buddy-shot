import { Pressable, ScrollView, Text, View } from "react-native";
import UserAvatar from "@/src/components/ui/UserAvatar";
import { Friend } from "@/src/types/User";

interface Props {
  friends: Friend[];
  selected: string | null;
  onSelect: (id: string | null) => void;
}

const FriendSelector = ({ friends, selected, onSelect }: Props) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
      className="border-t border-border"
    >
      <View className="flex-row items-center gap-3">
        <Pressable
          onPress={() => onSelect(null)}
          className={`w-12 h-12 items-center justify-center rounded-full ${
            selected === null
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          }`}
        >
          <Text
            className={`text-sm font-medium ${
              selected === null
                ? "text-primary-foreground"
                : "text-muted-foreground"
            }`}
          >
            All
          </Text>
        </Pressable>

        {friends.map((friend) => (
          <Pressable
            key={friend.id}
            onPress={() => onSelect(friend.id)}
            className="items-center gap-1"
          >
            <View
              style={
                selected === friend.id
                  ? { transform: [{ scale: 1.08 }] }
                  : undefined
              }
            >
              <UserAvatar
                avatarUrl={friend.avatar}
                size={44}
                ringWidth={selected === friend.id ? 3 : 2}
                ringClassName={
                  selected === friend.id
                    ? "border-primary"
                    : "border-friend-ring"
                }
              />
            </View>
            <Text className="text-[10px] font-medium text-foreground">
              {friend.name}
            </Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
};

export default FriendSelector;
