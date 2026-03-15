import { Pressable, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";

interface ZoomPreset {
  label: string;
  value: number;
}

interface CameraControlsProps {
  flashMode: "off" | "on" | "auto";
  onCycleFlashMode: () => void;
  zoom: number;
  zoomPresets: readonly ZoomPreset[];
  onSelectZoom: (zoom: number) => void;
  zoomDisabled?: boolean;
  onPickFromLibrary: () => void;
  onCapture: () => void;
  onToggleCameraFacing: () => void;
  captureDisabled: boolean;
}

export default function CameraControls({
  flashMode,
  onCycleFlashMode,
  zoom,
  zoomPresets,
  onSelectZoom,
  zoomDisabled = false,
  onPickFromLibrary,
  onCapture,
  onToggleCameraFacing,
  captureDisabled,
}: CameraControlsProps) {
  return (
    <>
      <View className="w-full flex-row mt-4 px-4 items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={onCycleFlashMode}
            className={`px-4 py-2 rounded-full border active:scale-95 ${
              flashMode === "off"
                ? "bg-muted border-muted"
                : "bg-primary border-primary"
            }`}
          >
            <Text
              className={`text-sm font-semibold ${
                flashMode === "off"
                  ? "text-muted-foreground"
                  : "text-primary-foreground"
              }`}
            >
              Flash: {flashMode.toUpperCase()}
            </Text>
          </Pressable>
        </View>

        <View className="flex-row items-center gap-2">
          {zoomPresets.map((preset) => {
            const isActive = Math.abs(zoom - preset.value) < 0.001;

            return (
              <Pressable
                key={preset.label}
                disabled={zoomDisabled}
                onPress={() => onSelectZoom(preset.value)}
                className={`px-4 py-2 rounded-full border active:scale-95 ${
                  isActive
                    ? "bg-primary border-primary"
                    : "bg-muted border-muted"
                }`}
                style={{ opacity: zoomDisabled ? 0.45 : 1 }}
              >
                <Text
                  className={`text-sm font-semibold ${
                    isActive
                      ? "text-primary-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {preset.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View className="flex-row items-center justify-center gap-8 py-8 pt-20">
        <Pressable
          onPress={onPickFromLibrary}
          className="w-12 h-12 rounded-full bg-primary items-center justify-center active:scale-95"
        >
          <Feather
            name="image"
            size={22}
            color="hsl(var(--primary-foreground))"
          />
        </Pressable>

        <Pressable
          onPress={onCapture}
          disabled={captureDisabled}
          className="w-20 h-20 rounded-full border-4 border-primary items-center justify-center active:scale-95"
        >
          <View
            className="w-16 h-16 rounded-full bg-primary-foreground"
            style={{ opacity: captureDisabled ? 0.55 : 1 }}
          />
        </Pressable>

        <Pressable
          onPress={onToggleCameraFacing}
          className="w-12 h-12 rounded-full bg-primary items-center justify-center active:scale-95"
        >
          <Feather
            name="refresh-cw"
            size={22}
            color="hsl(var(--primary-foreground))"
          />
        </Pressable>
      </View>
    </>
  );
}
