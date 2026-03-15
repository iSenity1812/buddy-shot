import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type MainBottomNavMode = "camera" | "album" | "profile";

type MainBottomNavProps = {
  mode: MainBottomNavMode;
};

type IconName = React.ComponentProps<typeof Feather>["name"];

function SideAction({
  icon,
  active = false,
  disabled = false,
  onPress,
}: {
  icon: IconName;
  active?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      className={`items-center justify-center rounded-full border px-4 py-4 active:scale-95 ${
        active ? "border-primary bg-primary" : "border-border bg-card/80"
      }`}
    >
      <Feather
        name={icon}
        size={20}
        color={
          active
            ? "hsl(var(--primary-foreground))"
            : "hsl(var(--muted-foreground))"
        }
      />
    </Pressable>
  );
}

export default function MainBottomNav({ mode }: MainBottomNavProps) {
  const insets = useSafeAreaInsets();

  const openAlbum = () => {
    if (mode === "album") return;
    router.replace("/(main)/(album)");
  };

  const openCamera = () => {
    if (mode === "camera") return;
    router.replace("/(main)/(camera)");
  };

  const openProfile = () => {
    if (mode === "profile") return;
    router.replace("/(main)/(profile)");
  };

  const isCameraMode = mode === "camera";

  return (
    <View
      pointerEvents="box-none"
      className="absolute inset-x-20 bottom-10"
    >
      <View
        className="rounded-full border border-border bg-background/50 px-5 shadow-lg"
        style={{ paddingTop: 16, paddingBottom: 16 }}
      >
        <View className="flex-row items-center justify-between">
          <SideAction
            icon="grid"
            active={mode === "album"}
            onPress={openAlbum}
          />

          {isCameraMode ? (
            <SideAction icon="home" active disabled onPress={() => undefined} />
          ) : (
            <SideAction icon="camera" onPress={openCamera} />
          )}

          <SideAction
            icon="user"
            active={mode === "profile"}
            onPress={openProfile}
          />
        </View>
      </View>
    </View>
  );
}
