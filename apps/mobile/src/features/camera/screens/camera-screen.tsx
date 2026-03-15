import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  GestureResponderEvent,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import MainBottomNav from "../../../components/navigation/main-bottom-nav";
import useMainScreenSwipe from "../../../hooks/use-main-screen-swipe";
import CameraControls from "../components/camera-controls";

const zoomPresets = [
  { label: "0.5x", value: 0 },
  { label: "1x", value: 0.2 },
  { label: "2x", value: 0.4 },
] as const;

const flashModes = ["off", "on", "auto"] as const;
const MAX_ZOOM = 0.4;
const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export default function CameraScreen() {
  const cameraRef = useRef<CameraView | null>(null);
  const switchFallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const [facing, setFacing] = useState<CameraType>("back");
  const [isCapturing, setIsCapturing] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isSwitchingCamera, setIsSwitchingCamera] = useState(false);
  const [zoom, setZoom] = useState<number>(zoomPresets[1].value);
  const [flashMode, setFlashMode] =
    useState<(typeof flashModes)[number]>("off");
  const [permission, requestPermission] = useCameraPermissions();
  const { width: screenWidth } = useWindowDimensions();
  const previewSize = Math.min(screenWidth - 20, 380);
  const pinchStartDistanceRef = useRef<number | null>(null);
  const pinchStartZoomRef = useRef(zoom);
  const minZoom = zoomPresets[0].value;
  const isFrontCamera = facing === "front";
  const { panHandlers, animatedStyle } = useMainScreenSwipe({
    mode: "camera",
    disabled: isCapturing || isSwitchingCamera,
  });

  useEffect(() => {
    return () => {
      if (switchFallbackTimerRef.current) {
        clearTimeout(switchFallbackTimerRef.current);
      }
    };
  }, []);

  const openSendScreen = (imageUri: string) => {
    router.push({
      pathname: "/(main)/(camera)/send",
      params: { imageUri },
    });
  };

  const handleCapture = async () => {
    if (!cameraRef.current || isCapturing) return;

    try {
      setIsCapturing(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.92,
        skipProcessing: true,
      });

      if (!photo?.uri) return;
      openSendScreen(photo.uri);
    } catch {
      Alert.alert(
        "Capture failed",
        "Could not take a photo. Please try again.",
      );
    } finally {
      setIsCapturing(false);
    }
  };

  const handleCameraReady = () => {
    if (switchFallbackTimerRef.current) {
      clearTimeout(switchFallbackTimerRef.current);
      switchFallbackTimerRef.current = null;
    }
    setIsCameraReady(true);
    setIsSwitchingCamera(false);
  };

  const toggleCameraFacing = () => {
    if (isSwitchingCamera) return;

    if (switchFallbackTimerRef.current) {
      clearTimeout(switchFallbackTimerRef.current);
      switchFallbackTimerRef.current = null;
    }

    setIsSwitchingCamera(true);
    setIsCameraReady(false);
    setFacing((currentFacing) => {
      const nextFacing = currentFacing === "back" ? "front" : "back";
      if (nextFacing === "front") {
        setZoom(minZoom);
        pinchStartDistanceRef.current = null;
      }
      return nextFacing;
    });

    // Some devices do not fire onCameraReady reliably after switching.
    switchFallbackTimerRef.current = setTimeout(() => {
      setIsCameraReady(true);
      setIsSwitchingCamera(false);
      switchFallbackTimerRef.current = null;
    }, 1200);
  };

  const cycleFlashMode = () => {
    const currentIndex = flashModes.indexOf(flashMode);
    const nextMode = flashModes[(currentIndex + 1) % flashModes.length];
    setFlashMode(nextMode);
  };

  const setZoomWithinRange = (nextZoom: number) => {
    if (isFrontCamera) {
      setZoom(minZoom);
      return;
    }
    setZoom(clamp(nextZoom, 0, MAX_ZOOM));
  };

  const handlePinch = (event: GestureResponderEvent) => {
    if (isFrontCamera) {
      pinchStartDistanceRef.current = null;
      return;
    }

    const touches = event.nativeEvent.touches;
    if (touches.length !== 2) {
      pinchStartDistanceRef.current = null;
      return;
    }

    const [firstTouch, secondTouch] = touches;
    const dx = secondTouch.pageX - firstTouch.pageX;
    const dy = secondTouch.pageY - firstTouch.pageY;
    const currentDistance = Math.hypot(dx, dy);

    if (!pinchStartDistanceRef.current) {
      pinchStartDistanceRef.current = currentDistance;
      pinchStartZoomRef.current = zoom;
      return;
    }

    const distanceDelta = currentDistance - pinchStartDistanceRef.current;
    const nextZoom = pinchStartZoomRef.current + distanceDelta / 350;
    setZoomWithinRange(nextZoom);
  };

  const resetPinchState = () => {
    pinchStartDistanceRef.current = null;
  };

  const handlePickFromLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permission required",
        "Please allow photo access to choose an image.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.92,
      aspect: [1, 1],
    });

    if (result.canceled) return;
    openSendScreen(result.assets[0].uri);
  };

  if (!permission) {
    return (
      <SafeAreaView className="flex-1 bg-foreground/95" edges={["top"]}>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-muted-foreground text-base">
            Loading camera...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView className="flex-1 bg-foreground/95" edges={["top"]}>
        <View className="flex-1 items-center justify-center px-6 gap-4">
          <Feather
            name="camera-off"
            size={42}
            color="hsl(var(--muted-foreground))"
          />
          <Text className="text-muted-foreground text-center text-base">
            Camera permission is required to take photos.
          </Text>
          <Pressable
            onPress={() => void requestPermission()}
            className="px-5 py-3 rounded-full bg-primary active:scale-95"
          >
            <Text className="text-primary-foreground font-semibold">
              Grant Permission
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-foreground" edges={["top"]}>
      <Animated.View
        className="flex-1 items-center pb-40"
        style={animatedStyle}
        {...panHandlers}
      >
        <View className="w-full flex-1 items-center justify-center px-3 pt-12">
          <View
            className="rounded-2xl overflow-hidden"
            style={{ width: previewSize, height: previewSize }}
            onTouchMove={handlePinch}
            onTouchEnd={resetPinchState}
            onTouchCancel={resetPinchState}
          >
            <CameraView
              key={facing}
              ref={cameraRef}
              style={{ flex: 1 }}
              facing={facing}
              mode="picture"
              zoom={zoom}
              flash={flashMode}
              onCameraReady={handleCameraReady}
            />

            {!isCameraReady ? (
              <View className="absolute inset-0 items-center justify-center bg-foreground/30">
                <Text className="text-primary-foreground/85 text-sm">
                  Opening camera...
                </Text>
              </View>
            ) : null}
          </View>

          <CameraControls
            flashMode={flashMode}
            onCycleFlashMode={cycleFlashMode}
            zoom={zoom}
            zoomPresets={zoomPresets}
            onSelectZoom={setZoomWithinRange}
            zoomDisabled={isFrontCamera}
            onPickFromLibrary={() => void handlePickFromLibrary()}
            onCapture={() => void handleCapture()}
            onToggleCameraFacing={toggleCameraFacing}
            captureDisabled={isCapturing || isSwitchingCamera || !isCameraReady}
          />
        </View>
      </Animated.View>

      <MainBottomNav mode="camera" />
    </SafeAreaView>
  );
}
