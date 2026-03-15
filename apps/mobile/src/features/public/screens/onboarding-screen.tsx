import { View, Text, Image, Pressable } from "react-native";
import { useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";

import welcomingImg from "@/assets/images/welcoming.png";

export default function OnboardingScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 items-center px-8 bg-secondary/40">
      <Animated.View
        entering={FadeInDown.duration(300)}
        className="flex-1 items-center justify-center max-w-xs w-full"
      >
        <Image
          source={welcomingImg}
          resizeMode="contain"
          className="w-56 h-56 mb-6"
        />

        <Text className="text-3xl font-bold text-center mb-2 text-foreground">
          Share Moments,{"\n"}Not Posts
        </Text>

        <Text className="text-muted-foreground text-center text-base mb-8 leading-relaxed">
          Send real photos to your closest friends. No filters, no likes — just
          real memories.
        </Text>

        <Pressable
          onPress={() => router.replace("/(auth)/login")}
          className="w-full bg-primary py-4 rounded-full items-center active:scale-95"
        >
          <Text className="text-primary-foreground text-lg font-semibold">
            Get Started
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}
