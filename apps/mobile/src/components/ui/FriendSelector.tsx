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
      {/* 1. Đổi items-center thành items-start để căn đều đỉnh đầu */}
      <View className="flex-row items-start gap-3">

        {/* Nút ALL */}
        <Pressable
          onPress={() => onSelect(null)}
          className="items-center gap-1" // Giống hệt cấu trúc của Friend bên dưới
        >
          {/* Căn chỉnh lại size w-11 (tương đương size 44 của avatar) để khớp hoàn hảo */}
          <View
            className={`w-[44px] h-[44px] items-center justify-center rounded-full ${selected === null
              ? "bg-primary"
              : "bg-muted"
              }`}
          >
            <Text
              className={`text-xs font-bold ${selected === null ? "text-primary-foreground" : "text-muted-foreground"
                }`}
            >
              All
            </Text>
          </View>

          {/* 2. Thêm Text ẩn này để chiếm không gian bằng với tên của friend */}
          <Text className="text-[10px] opacity-0">Placeholder</Text>
        </Pressable>

        {/* Danh sách FRIENDS */}
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
                // Đừng quên dùng PUBLIC_R2 như bạn đã định nhé
                avatarUrl={friend.avatar}
                username={friend.name}
                size={44}
                ringWidth={selected === friend.id ? 3 : 2}
                ringClassName={
                  selected === friend.id
                    ? "border-primary"
                    : "border-friend-ring"
                }
              />
            </View>
            <Text
              numberOfLines={1}
              className="text-[10px] font-medium text-foreground w-12 text-center"
            >
              {friend.name}
            </Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
};

export default FriendSelector;
