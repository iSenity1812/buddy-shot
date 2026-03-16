import { useEffect, useState } from "react";
import { Redirect, Stack } from "expo-router";
import { authApi } from "@/src/features/auth/api/auth.api";

export default function MainLayout() {
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const verifySession = async () => {
      try {
        await authApi.me();
        if (isMounted) {
          setIsAuthenticated(true);
        }
      } catch {
        if (isMounted) {
          setIsAuthenticated(false);
        }
      } finally {
        if (isMounted) {
          setIsAuthChecking(false);
        }
      }
    };

    verifySession();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isAuthChecking) {
    return null;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "fade",
      }}
    >
      {/* Camera main screen */}
      <Stack.Screen
        name="(camera)"
        options={{
          animation: "none",
        }}
      />

      {/* Album grid (slide up) */}
      <Stack.Screen
        name="(album)"
        options={{
          animation: "slide_from_left",
        }}
      />

      {/* Profile */}
      <Stack.Screen
        name="(profile)"
        options={{
          animation: "slide_from_right",
        }}
      />
    </Stack>
  );
}
