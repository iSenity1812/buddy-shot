import { View } from "react-native";
import { Image } from "expo-image";

interface Props {
  avatarUrl: string;
  size: number;
  ringWidth?: number;
  ringClassName?: string;
  className?: string;
}

export default function UserAvatar({
  avatarUrl,
  size,
  ringWidth = 2,
  ringClassName = "border-friend-ring",
  className,
}: Props) {
  const innerSize = Math.max(size - ringWidth * 2 - 3, 0);

  return (
    <View
      className={`rounded-full items-center justify-center ${ringClassName} ${className ?? ""}`}
      style={{ width: size, height: size, borderWidth: ringWidth }}
    >
      <Image
        source={{ uri: avatarUrl }}
        style={{ width: innerSize, height: innerSize, borderRadius: 9999 }}
        contentFit="cover"
      />
    </View>
  );
}
