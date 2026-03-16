import { Pressable, View } from "react-native";
import { Image } from "expo-image";
import type { PhotoPost } from "@/src/types/Photo";

interface PhotoViewerThumbnailsProps {
  posts: PhotoPost[];
  currentIndex: number;
  onSelect: (index: number) => void;
}

export default function PhotoViewerThumbnails({
  posts,
  currentIndex,
  onSelect,
}: PhotoViewerThumbnailsProps) {
  return (
    <View className="absolute bottom-8 left-0 right-0 flex-row justify-center gap-2 px-4">
      {posts.map((post, index) => (
        <Pressable
          key={post.id}
          onPress={() => onSelect(index)}
          style={[
            {
              width: 48,
              height: 48,
              borderRadius: 12,
              overflow: "hidden",
            },
            index === currentIndex
              ? { borderWidth: 2, borderColor: "white" }
              : { opacity: 0.6 },
          ]}
        >
          <Image
            source={{ uri: post.imageUrl }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
          />
        </Pressable>
      ))}
    </View>
  );
}
