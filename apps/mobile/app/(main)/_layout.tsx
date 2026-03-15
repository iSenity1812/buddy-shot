import { Stack } from "expo-router";

export default function MainLayout() {
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
