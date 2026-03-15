import { useMemo, useRef } from "react";
import {
  Animated,
  PanResponder,
  PanResponderInstance,
  useWindowDimensions,
} from "react-native";
import { router } from "expo-router";

type MainScreenMode = "camera" | "album" | "profile";

type UseMainScreenSwipeOptions = {
  mode: MainScreenMode;
  disabled?: boolean;
};

const DRAG_RESISTANCE = 0.28;

export default function useMainScreenSwipe({
  mode,
  disabled = false,
}: UseMainScreenSwipeOptions) {
  const { width } = useWindowDimensions();
  const translateX = useRef(new Animated.Value(0)).current;
  const isNavigatingRef = useRef(false);

  const resetPosition = () => {
    Animated.spring(translateX, {
      toValue: 0,
      damping: 20,
      stiffness: 180,
      mass: 0.8,
      useNativeDriver: true,
    }).start();
  };

  const completeNavigation = (direction: "left" | "right") => {
    if (isNavigatingRef.current) return;

    let targetPath:
      | "/(main)/(camera)"
      | "/(main)/(album)"
      | "/(main)/(profile)";

    if (mode === "camera") {
      targetPath =
        direction === "right" ? "/(main)/(album)" : "/(main)/(profile)";
    } else {
      targetPath = "/(main)/(camera)";
    }

    isNavigatingRef.current = true;

    Animated.timing(translateX, {
      toValue: direction === "right" ? width * 0.42 : -width * 0.42,
      duration: 170,
      useNativeDriver: true,
    }).start(() => {
      translateX.setValue(0);
      isNavigatingRef.current = false;
      router.replace(targetPath);
    });
  };

  const isDirectionAllowed = (dx: number) => {
    if (mode === "camera") return true;
    if (mode === "album") return dx < 0;
    return dx > 0;
  };

  const panResponder = useMemo<PanResponderInstance>(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (event, gestureState) => {
          if (disabled || isNavigatingRef.current) return false;

          return (
            event.nativeEvent.touches.length === 1 &&
            Math.abs(gestureState.dx) > Math.abs(gestureState.dy) + 8 &&
            Math.abs(gestureState.dx) > 14 &&
            isDirectionAllowed(gestureState.dx)
          );
        },
        onPanResponderMove: (_, gestureState) => {
          if (!isDirectionAllowed(gestureState.dx)) return;
          translateX.setValue(gestureState.dx * DRAG_RESISTANCE);
        },
        onPanResponderRelease: (_, gestureState) => {
          const threshold = width * 0.16;

          if (!isDirectionAllowed(gestureState.dx)) {
            resetPosition();
            return;
          }

          if (gestureState.dx > threshold) {
            completeNavigation("right");
            return;
          }

          if (gestureState.dx < -threshold) {
            completeNavigation("left");
            return;
          }

          resetPosition();
        },
        onPanResponderTerminate: resetPosition,
      }),
    [disabled, mode, translateX, width],
  );

  const animatedStyle = {
    transform: [
      { translateX },
      {
        scale: translateX.interpolate({
          inputRange: [-120, 0, 120],
          outputRange: [0.985, 1, 0.985],
          extrapolate: "clamp",
        }),
      },
    ],
    opacity: translateX.interpolate({
      inputRange: [-160, 0, 160],
      outputRange: [0.94, 1, 0.94],
      extrapolate: "clamp",
    }),
  };

  return {
    panHandlers: panResponder.panHandlers,
    animatedStyle,
  };
}
