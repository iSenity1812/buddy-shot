import { ReactNode, useEffect } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

interface DraggableBottomSheetModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  maxHeightRatio?: number;
  children: ReactNode;
}

export default function DraggableBottomSheetModal({
  visible,
  onClose,
  title,
  maxHeightRatio = 0.9,
  children,
}: DraggableBottomSheetModalProps) {
  const { height: screenHeight } = useWindowDimensions();
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = 0;
    }
  }, [visible, translateY]);

  const dismissSheet = () => {
    translateY.value = withTiming(
      screenHeight + 40,
      { duration: 220 },
      (done) => {
        if (done) runOnJS(onClose)();
      },
    );
  };

  const dragGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateY.value = Math.max(0, e.translationY);
    })
    .onEnd((e) => {
      if (e.translationY > 110 || e.velocityY > 850) {
        translateY.value = withTiming(
          screenHeight + 40,
          { duration: 200 },
          (done) => {
            if (done) runOnJS(onClose)();
          },
        );
      } else {
        translateY.value = withSpring(0, { damping: 20, stiffness: 250 });
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={dismissSheet}
      statusBarTranslucent
    >
      <View
        className="flex-1 justify-end"
        style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      >
        <Pressable
          style={StyleSheet.absoluteFillObject}
          onPress={dismissSheet}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          // keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
          style={{ justifyContent: "flex-end" }}
        >
          <Animated.View
            className="bg-background rounded-t-3xl px-5 pt-4 pb-6"
            style={[
              sheetStyle,
              { maxHeight: `${Math.round(maxHeightRatio * 100)}%` },
            ]}
          >
            <GestureDetector gesture={dragGesture}>
              <View className="items-center pb-3 pt-1">
                <View className="w-10 h-1 rounded-full bg-border" />
              </View>
            </GestureDetector>

            {title ? (
              <Text className="text-xl font-bold text-foreground mb-4">
                {title}
              </Text>
            ) : null}

            {children}
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
