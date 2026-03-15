import { useRef, useState } from "react";
import {
  ActivityIndicator,
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
import { useAuthSubmit } from "../hooks/use-auth-submit";
import { AuthModeSwitch } from "../components/auth-mode-switch";

type FocusField = "username" | "email" | "password" | null;

export default function LoginScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const isSignUp = mode === "register";
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const modeAnim = useRef(new Animated.Value(0)).current;
  const [focusField, setFocusField] = useState<FocusField>(null);
  const { isSubmitting, errorMessage, clearError, submitAuth } = useAuthSubmit();

  const handleSubmit = async () => {
    const normalizedEmail = email.trim();
    const normalizedPassword = password.trim();

    if (!normalizedEmail || !normalizedPassword) {
      return;
    }

    const session = await submitAuth({
      mode,
      email: normalizedEmail,
      password: normalizedPassword,
      username,
    });

    if (!session) {
      return;
    }

    router.replace("/(main)");
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

    clearError();
    setMode((prev) => (prev === "login" ? "register" : "login"));
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
              {isSignUp ? (
                <View className="relative">
                  <Feather
                    name="user"
                    size={18}
                    color="hsl(0 0% 40%)"
                    style={{
                      position: "absolute",
                      left: 13,
                      top: 13,
                      zIndex: 1,
                    }}
                  />
                  <TextInput
                    value={username}
                    onChangeText={(text) => {
                      setUsername(text);
                      clearError();
                    }}
                    onFocus={() => setFocusField("username")}
                    onBlur={() => setFocusField(null)}
                    placeholder="Username"
                    placeholderTextColor="hsl(0 0% 40%)"
                    autoCapitalize="none"
                    className={`w-full bg-muted rounded-xl py-3.5 pl-11 pr-4 text-sm text-foreground ${
                      focusField === "username"
                        ? "border-2 border-primary/50"
                        : "border border-transparent"
                    }`}
                  />
                </View>
              ) : null}

              <View className="relative">
                <Feather
                  name="mail"
                  size={18}
                  color="hsl(0 0% 40%)"
                  style={{ position: "absolute", left: 13, top: 13, zIndex: 1 }}
                />
                <TextInput
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    clearError();
                  }}
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
                  onChangeText={(text) => {
                    setPassword(text);
                    clearError();
                  }}
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

              {errorMessage ? (
                <Text className="text-xs text-destructive font-medium px-1">
                  {errorMessage}
                </Text>
              ) : null}

              <Pressable
                onPress={handleSubmit}
                disabled={isSubmitting}
                className={`active:scale-95 w-full bg-primary py-3.5 rounded-full items-center ${
                  isSubmitting ? "opacity-70" : ""
                }`}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="hsl(var(--primary-foreground))" />
                ) : (
                  <Text className="text-base font-semibold text-primary-foreground">
                    {isSignUp ? "Sign Up" : "Log In"}
                  </Text>
                )}
              </Pressable>
            </View>

            <AuthModeSwitch mode={mode} onToggle={toggleAuthMode} />
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
