import { PhotoPost } from "@/src/types/Photo";
import { Friend } from "@/src/types/User";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";

interface Props {
  friend: Friend;
  posts: PhotoPost[];
  onTap: (post: PhotoPost) => void;
}

const PERF_COUNT = 24;

const FilmStripRow = ({ friend, posts, onTap }: Props) => {
  return (
    <View className="mb-3">
      <Text className="text-foreground font-handwritten px-4 mb-0.5 text-2xl">
        {friend.name.charAt(0).toUpperCase() + friend.name.slice(1)}
      </Text>

      <View className="relative bg-film-strip overflow-hidden py-5">
        <View className="absolute left-0 right-0 top-0 flex-row justify-between px-2 pt-1">
          {Array.from({ length: PERF_COUNT }).map((_, i) => (
            <View
              key={`t${i}`}
              className="bg-background/80 rounded-full"
              style={{ width: 7, height: 4 }}
            />
          ))}
        </View>

        <View className="absolute bottom-0 left-0 right-0 flex-row justify-between px-2 pb-1">
          {Array.from({ length: PERF_COUNT }).map((_, i) => (
            <View
              key={`b${i}`}
              className="bg-background/80 rounded-full"
              style={{ width: 7, height: 4 }}
            />
          ))}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}
        >
          {posts.map((post) => (
            <Pressable key={post.id} onPress={() => onTap(post)}>
              <View className="bg-card/10 border border-white/20 rounded-[2px] overflow-hidden">
                <Image
                  source={{ uri: post.imageUrl }}
                  style={{ width: 128, height: 96 }}
                  contentFit="cover"
                />
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

export default FilmStripRow;
