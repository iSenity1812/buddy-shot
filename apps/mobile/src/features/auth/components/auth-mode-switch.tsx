import { Pressable, Text } from "react-native";
import type { AuthMode } from "../types/auth.types";

interface AuthModeSwitchProps {
  mode: AuthMode;
  onToggle: () => void;
}

export function AuthModeSwitch({ mode, onToggle }: AuthModeSwitchProps) {
  const isRegister = mode === "register";

  return (
    <Pressable onPress={onToggle} className="mt-6">
      <Text className="text-sm text-muted-foreground">
        {isRegister ? "Already have an account? " : "Don't have an account? "}
        <Text className="text-primary font-semibold">
          {isRegister ? "Log In" : "Sign Up"}
        </Text>
      </Text>
    </Pressable>
  );
}
