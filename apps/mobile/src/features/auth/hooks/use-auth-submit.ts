import { useCallback, useState } from "react";
import { Platform } from "react-native";
import { authApi } from "../api/auth.api";
import type { AuthMode, AuthSession } from "../types/auth.types";
import { HttpError } from "@/src/services/http/axios.config";

interface SubmitAuthParams {
  mode: AuthMode;
  email: string;
  password: string;
  username?: string;
}

function resolveDevicePlatform(): "IOS" | "ANDROID" | "DESKTOP" {
  if (Platform.OS === "ios") {
    return "IOS";
  }

  if (Platform.OS === "android") {
    return "ANDROID";
  }

  return "DESKTOP";
}

function toUserMessage(error: unknown): string {
  if (error instanceof HttpError) {
    if (error.code === "EMAIL_VALIDATION_ERROR") {
      return "Email is invalid or already in use.";
    }

    if (error.code === "INVALID_CREDENTIALS") {
      return "Incorrect email or password.";
    }

    return error.message;
  }

  return "Unable to complete authentication. Please try again.";
}

export function useAuthSubmit() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setErrorMessage(null);
  }, []);

  const submitAuth = useCallback(
    async (params: SubmitAuthParams): Promise<AuthSession | null> => {
      setIsSubmitting(true);
      setErrorMessage(null);

      try {
        if (params.mode === "register") {
          const username = params.username?.trim();
          if (!username) {
            setErrorMessage("Username is required for sign up.");
            return null;
          }

          const session = await authApi.register({
            email: params.email.trim().toLowerCase(),
            password: params.password,
            username,
            device: {
              platform: resolveDevicePlatform(),
            },
          });

          return session;
        }

        const session = await authApi.login({
          email: params.email.trim().toLowerCase(),
          password: params.password,
          device: {
            platform: resolveDevicePlatform(),
          },
        });

        return session;
      } catch (error) {
        setErrorMessage(toUserMessage(error));
        return null;
      } finally {
        setIsSubmitting(false);
      }
    },
    [],
  );

  return {
    clearError,
    errorMessage,
    isSubmitting,
    submitAuth,
  };
}
