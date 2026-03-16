import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { Image } from "expo-image";

interface Props {
  avatarUrl?: string | null;
  initials?: string;
  username?: string;
  size: number;
  ringWidth?: number;
  ringClassName?: string;
  className?: string;
}

export default function UserAvatar({
  avatarUrl,
  initials,
  username,
  size,
  ringWidth = 2,
  ringClassName = "border-friend-ring",
  className,
}: Props) {
  const [hasImageError, setHasImageError] = useState(false);
  const innerSize = Math.max(size - ringWidth * 2 - 3, 0);
  const normalizedAvatarUrl = avatarUrl?.trim() ?? "";
  const shouldShowImage = normalizedAvatarUrl.length > 0 && !hasImageError;

  useEffect(() => {
    setHasImageError(false);
  }, [normalizedAvatarUrl]);

  const resolvedInitials = (
    initials?.trim() ||
    username
      ?.trim()
      .slice(0, 2)
      .toLowerCase() ||
    "?"
  ).slice(0, 2);

  return (
    <View
      className={`rounded-full items-center justify-center ${ringClassName} ${className ?? ""}`}
      style={{ width: size, height: size, borderWidth: ringWidth }}
    >
      {shouldShowImage ? (
        <Image
          source={{ uri: normalizedAvatarUrl }}
          style={{ width: innerSize, height: innerSize, borderRadius: 9999 }}
          contentFit="cover"
          onError={() => {
            setHasImageError(true);
          }}
        />
      ) : (
        <View
          className="rounded-full bg-muted items-center justify-center"
          style={{ width: innerSize, height: innerSize }}
        >
          <Text className="text-xs font-semibold text-muted-foreground uppercase">
            {resolvedInitials}
          </Text>
        </View>
      )}
    </View>
  );
}
