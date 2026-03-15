import { getRelativeTime } from "@/src/libs/getRelativeTime";
import { PhotoPost } from "@/src/types/Photo";
import { Pressable, Text } from "react-native";
import { Image } from "expo-image";

interface Props {
  post: PhotoPost;
  index: number;
  onTap: (post: PhotoPost) => void;
}

const rotations = [-1.5, 1, -0.5, 2];

const PolaroidCard = ({ post, index, onTap }: Props) => {
  return (
    <Pressable
      onPress={() => onTap(post)}
      className="bg-card rounded-sm p-1.5 pb-3 polaroid-shadow"
      // style={{ transform: [{ rotate: `${rotations[index % 4]}deg` }] }}
    >
      <Image
        source={{ uri: post.imageUrl }}
        style={{ width: "100%", aspectRatio: 1, borderRadius: 2 }}
        contentFit="cover"
      />
      <Text
        className="font-handwritten text-base text-foreground mt-2 px-1 text-center leading-tight"
        numberOfLines={1}
      >
        {post.message}
      </Text>
      <Text className="text-[10px] text-muted-foreground mt-0.5 px-1 text-center">
        {getRelativeTime(post.timestamp)}
      </Text>
    </Pressable>
  );
};

export default PolaroidCard;
