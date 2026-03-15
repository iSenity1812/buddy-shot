import { useEffect, useRef, useState } from "react";
import { Pressable, Text, useWindowDimensions, View } from "react-native";
import Animated, {
  FadeInLeft,
  FadeInRight,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import type { PhotoPost } from "../../types/Photo";
import PhotoViewer from "../ui/PhotoViewer";
import MonthYearPicker from "../ui/MonthYearPicker";
import { DAY_HEADERS, MONTH_NAMES } from "@/src/constants/time";

interface Props {
  posts: PhotoPost[];
}

const MIN_YEAR = 2025;

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function PhotoCalendar({ posts }: Props) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(currentMonth);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [calendarPosts, setCalendarPosts] = useState(posts);
  const [viewerData, setViewerData] = useState<{
    posts: PhotoPost[];
    index: number;
  } | null>(null);

  useEffect(() => {
    setCalendarPosts(posts);
  }, [posts]);

  // null = first render (no animation)
  const navDirection = useRef<"forward" | "backward" | null>(null);

  const { width: screenWidth } = useWindowDimensions();
  // screen px-4 (32) + card p-4 (32) + 6 gaps of gap-1 (24) = 88px overhead
  const cellSize = Math.floor((screenWidth - 88) / 7);

  const isAtCurrentMonth = year === currentYear && month === currentMonth;
  const isAtMinMonth = year === MIN_YEAR && month === 0;

  const goNext = () => {
    if (isAtCurrentMonth) return;
    navDirection.current = "forward";
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const goPrev = () => {
    if (isAtMinMonth) return;
    navDirection.current = "backward";
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const calendarSwipe = Gesture.Pan().onEnd((e) => {
    if (e.translationX < -50) runOnJS(goNext)();
    else if (e.translationX > 50) runOnJS(goPrev)();
  });

  // Build calendar grid cells
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  // Group posts by day number for the current month/year
  const postsByDay: Record<number, PhotoPost[]> = {};
  calendarPosts.forEach((p) => {
    if (
      p.timestamp.getFullYear() === year &&
      p.timestamp.getMonth() === month
    ) {
      const day = p.timestamp.getDate();
      if (!postsByDay[day]) postsByDay[day] = [];
      postsByDay[day].push(p);
    }
  });

  const handlePickerConfirm = (y: number, m: number) => {
    if (y !== year || m !== month) {
      navDirection.current =
        y * 12 + m > year * 12 + month ? "forward" : "backward";
      setYear(y);
      setMonth(m);
    }
    setPickerVisible(false);
  };

  return (
    <>
      <GestureDetector gesture={calendarSwipe}>
        <View className="bg-card rounded-2xl p-4 shadow-sm">
          {/* Month / nav header */}
          <View className="flex-row items-center justify-between mb-4">
            <Pressable
              onPress={goPrev}
              disabled={isAtMinMonth}
              className={`active:scale-95 p-1 ${isAtMinMonth ? "opacity-30" : ""}`}
            >
              <Feather
                name="chevron-left"
                size={20}
                color="hsl(var(--muted-foreground))"
              />
            </Pressable>

            {/* Tap to open picker */}
            <Pressable
              onPress={() => setPickerVisible(true)}
              className="active:scale-95 flex-row items-center gap-1.5 px-3 py-1 rounded-lg bg-muted/50"
            >
              <Text className="font-bold text-foreground">
                {MONTH_NAMES[month]} {year}
              </Text>
              <Feather
                name="chevron-down"
                size={13}
                color="hsl(var(--muted-foreground))"
              />
            </Pressable>

            <Pressable
              onPress={goNext}
              disabled={isAtCurrentMonth}
              className={`active:scale-95 p-1 ${isAtCurrentMonth ? "opacity-30" : ""}`}
            >
              <Feather
                name="chevron-right"
                size={20}
                color="hsl(var(--muted-foreground))"
              />
            </Pressable>
          </View>

          {/* Day-of-week headers */}
          <View className="flex-row gap-1 mb-1">
            {DAY_HEADERS.map((d, i) => (
              <View key={i} style={{ width: cellSize, alignItems: "center" }}>
                <Text className="text-xs text-muted-foreground font-medium py-1">
                  {d}
                </Text>
              </View>
            ))}
          </View>

          {/* Calendar grid - remounts on month change to trigger entering animation */}
          <View style={{ overflow: "hidden" }}>
            <Animated.View
              key={`${year}-${month}`}
              entering={
                navDirection.current === "forward"
                  ? FadeInRight.duration(280)
                  : navDirection.current === "backward"
                    ? FadeInLeft.duration(280)
                    : undefined
              }
            >
              <View className="flex-row flex-wrap gap-1">
                {cells.map((day, i) => {
                  const dayPosts = day ? postsByDay[day] : undefined;
                  const hasPhoto = !!dayPosts && dayPosts.length > 0;

                  return (
                    <View
                      key={i}
                      style={{ width: cellSize, height: cellSize }}
                      className="items-center justify-center"
                    >
                      {day && hasPhoto ? (
                        <Pressable
                          onPress={() =>
                            setViewerData({ posts: dayPosts, index: 0 })
                          }
                          className="active:scale-95 w-full h-full rounded-xl overflow-hidden"
                        >
                          <Image
                            source={{ uri: dayPosts[0].imageUrl }}
                            style={{ width: "100%", height: "100%" }}
                            contentFit="cover"
                          />
                          {dayPosts.length > 1 && (
                            <View
                              className="absolute bottom-0.5 right-0.5 bg-foreground/70 rounded-full items-center justify-center"
                              style={{ width: 16, height: 16 }}
                            >
                              <Text className="text-primary-foreground text-[9px] font-bold">
                                {dayPosts.length}
                              </Text>
                            </View>
                          )}
                        </Pressable>
                      ) : day ? (
                        <View className="w-3 h-3 rounded-full bg-muted" />
                      ) : null}
                    </View>
                  );
                })}
              </View>
            </Animated.View>
          </View>
        </View>
      </GestureDetector>

      {pickerVisible && (
        <MonthYearPicker
          visible={pickerVisible}
          year={year}
          month={month}
          maxYear={currentYear}
          maxMonth={currentMonth}
          onConfirm={handlePickerConfirm}
          onClose={() => setPickerVisible(false)}
        />
      )}

      {viewerData && (
        <PhotoViewer
          posts={viewerData.posts}
          initialIndex={viewerData.index}
          isOwnPost={() => true}
          onEditMessage={(postId, nextMessage) => {
            setCalendarPosts((prev) =>
              prev.map((post) =>
                post.id === postId ? { ...post, message: nextMessage } : post,
              ),
            );

            setViewerData((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                posts: prev.posts.map((post) =>
                  post.id === postId ? { ...post, message: nextMessage } : post,
                ),
              };
            });
          }}
          onDeletePost={(postId) => {
            setCalendarPosts((prev) =>
              prev.filter((post) => post.id !== postId),
            );

            setViewerData((prev) => {
              if (!prev) return prev;
              const nextPosts = prev.posts.filter((post) => post.id !== postId);
              if (nextPosts.length === 0) {
                return null;
              }

              return {
                posts: nextPosts,
                index: Math.min(prev.index, nextPosts.length - 1),
              };
            });
          }}
          onClose={() => setViewerData(null)}
        />
      )}
    </>
  );
}
