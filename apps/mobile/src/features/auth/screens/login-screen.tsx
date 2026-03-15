import { useRef, useState } from "react";
import {
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Pressable,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";

export default function LoginScreen() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const modeAnim = useRef(new Animated.Value(0)).current;
  const [focusField, setFocusField] = useState<"email" | "password" | null>(
    null,
  );

  const handleSubmit = () => {
    // if (!email || !password) {
    //   return;
    // }

    router.replace("/(main)/(camera)");
  };

  const toggleAuthMode = () => {
    Animated.sequence([
      Animated.timing(modeAnim, {
        toValue: 1,
        duration: 140,
        useNativeDriver: true,
      }),
      Animated.timing(modeAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();

    setIsSignUp((prev) => !prev);
  };

  const animatedContentStyle = {
    opacity: modeAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0.25],
    }),
    transform: [
      {
        translateY: modeAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 8],
        }),
      },
    ],
  };

  return (
    <KeyboardAvoidingView className="flex-1 bg-background" behavior="padding">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="flex-1 px-6 justify-around">
          <Animated.View
            style={animatedContentStyle}
            className="flex-1 w-full max-w-sm mx-auto items-center justify-center"
          >
            <Text className="text-2xl font-bold text-foreground mb-1 text-center">
              {isSignUp ? "Create Account" : "Welcome Back"}
            </Text>
            <Text className="text-sm text-muted-foreground mb-8 text-center">
              {isSignUp
                ? "Join the memory circle"
                : "Your memories are waiting"}
            </Text>

            <View className="w-full gap-4">
              <View className="relative">
                <Feather
                  name="mail"
                  size={18}
                  color="hsl(0 0% 40%)"
                  style={{ position: "absolute", left: 13, top: 13, zIndex: 1 }}
                />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setFocusField("email")}
                  onBlur={() => setFocusField(null)}
                  placeholder="Email"
                  placeholderTextColor="hsl(0 0% 40%)"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className={`w-full bg-muted rounded-xl py-3.5 pl-11 pr-4 text-sm text-foreground ${
                    focusField === "email"
                      ? "border-2 border-primary/50"
                      : "border border-transparent"
                  }`}
                />
              </View>

              <View className="relative">
                <Feather
                  name="lock"
                  size={18}
                  color="hsl(0 0% 40%)"
                  style={{ position: "absolute", left: 13, top: 13, zIndex: 1 }}
                />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setFocusField("password")}
                  onBlur={() => setFocusField(null)}
                  placeholder="Password"
                  placeholderTextColor="hsl(0 0% 40%)"
                  secureTextEntry
                  className={`w-full bg-muted rounded-xl py-3.5 pl-11 pr-4 text-sm text-foreground ${
                    focusField === "password"
                      ? "border-2 border-primary/50"
                      : "border border-transparent"
                  }`}
                />
              </View>

              <Pressable
                onPress={handleSubmit}
                className="active:scale-95 w-full bg-primary py-3.5 rounded-full items-center"
              >
                <Text className="text-base font-semibold text-primary-foreground">
                  {isSignUp ? "Sign Up" : "Log In"}
                </Text>
              </Pressable>
            </View>

            <Pressable onPress={toggleAuthMode} className="mt-6">
              <Text className="text-sm text-muted-foreground">
                {isSignUp
                  ? "Already have an account? "
                  : "Don't have an account? "}
                <Text className="text-primary font-semibold">
                  {isSignUp ? "Log In" : "Sign Up"}
                </Text>
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
