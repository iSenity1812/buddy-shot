import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Animated,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import MainBottomNav from "../../../components/navigation/main-bottom-nav";
import useMainScreenSwipe from "../../../hooks/use-main-screen-swipe";
import FriendSelector from "@/src/components/ui/FriendSelector";
import PolaroidCard from "@/src/components/ui/PolaroidCard";
import FilmStripRow from "@/src/components/ui/FilmStripRow";
import PhotoViewer from "../../../components/ui/PhotoViewer";
import { PhotoPost } from "@/src/types/Photo";
import { Friend } from "@/src/types/User";
import { HttpError } from "@/src/services/http/axios.config";
import { photosApi } from "@/src/services/api/photos.api";
import { socialApi } from "@/src/services/api/social.api";
import { authApi } from "@/src/features/auth/api/auth.api";
import { realtimeSocketClient } from "../../../services/realtime/socket-client";

export default function AlbumScreen() {
  const [posts, setPosts] = useState<PhotoPost[]>([]);
  const [myPosts, setMyPosts] = useState<PhotoPost[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [layout, setLayout] = useState<"grid" | "film">("grid");
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null);
  const [viewerData, setViewerData] = useState<{
    posts: PhotoPost[];
    index: number;
  } | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string>("You");
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string>(
    "https://ui-avatars.com/api/?name=You&background=0D8ABC&color=fff",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const { panHandlers, animatedStyle } = useMainScreenSwipe({
    mode: "album",
    disabled: viewerData !== null,
  });

  const loadAlbumData = useCallback(async () => {
    try {
      setIsLoading(true);

      let meUserId = currentUserId;

      try {
        const me = await authApi.me();
        meUserId = me.id;
        setCurrentUserId(me.id);
        setCurrentUserName(me.username || "You");
        setCurrentUserAvatar(
          `https://ui-avatars.com/api/?name=${encodeURIComponent(me.username || "You")}&background=0D8ABC&color=fff`,
        );
      } catch {
        // Keep viewer in non-owner mode when user identity is unavailable.
      }

      let resolvedFriends: Friend[] = [];
      try {
        resolvedFriends = await socialApi.listFriends();
      } catch {
        // Fallback to feed-derived sender list below.
      }

      const selectedFriendName = selectedFriend
        ? resolvedFriends.find((friend) => friend.id === selectedFriend)?.name
        : undefined;

      const [feed, myFeed] = await Promise.all([
        photosApi.listFeed({
          username: selectedFriendName,
          sort: "desc",
          page: 1,
          limit: 50,
        }),
        photosApi.listMyPhotos({
          sort: "desc",
          page: 1,
          limit: 50,
        }),
      ]);
      // console.log("Loaded feed items:", feed.length);

      setPosts(feed);
      setMyPosts(myFeed);

      if (myFeed.length > 0) {
        const selfSender = myFeed[0].sender;
        if (!meUserId) {
          meUserId = selfSender.id;
          setCurrentUserId(selfSender.id);
        }
        setCurrentUserName(selfSender.name || "You");
        setCurrentUserAvatar(selfSender.avatar);
      }

      if (resolvedFriends.length > 0) {
        setFriends(resolvedFriends);
      } else if (feed.length > 0) {
        const fallbackFriends = Array.from(
          new Map(feed.map((post) => [post.sender.id, post.sender])).values(),
        );
        setFriends(fallbackFriends);
      } else {
        setFriends([]);
      }

      if (
        selectedFriend &&
        !feed.some((post) => post.sender.id === selectedFriend)
      ) {
        setSelectedFriend(null);
      }
    } catch (error) {
      if (error instanceof HttpError) {
        Alert.alert("Load memories failed", error.message);
      } else {
        Alert.alert("Load memories failed", "Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [selectedFriend, currentUserId]);

  useFocusEffect(
    useCallback(() => {
      void loadAlbumData();
    }, [loadAlbumData]),
  );

  useEffect(() => {
    const unsubscribeRecipient = realtimeSocketClient.onPhotoRecipient(() => {
      void loadAlbumData();
    });

    const unsubscribeCaptionUpdated =
      realtimeSocketClient.onPhotoCaptionUpdated(() => {
        void loadAlbumData();
      });

    const unsubscribePhotoDeleted = realtimeSocketClient.onPhotoDeleted(() => {
      void loadAlbumData();
    });

    const unsubscribeReactionUpdated =
      realtimeSocketClient.onPhotoReactionUpdated(() => {
        void loadAlbumData();
      });

    return () => {
      unsubscribeRecipient();
      unsubscribeCaptionUpdated();
      unsubscribePhotoDeleted();
      unsubscribeReactionUpdated();
    };
  }, [loadAlbumData]);

  const filteredPosts = useMemo(
    () =>
      selectedFriend
        ? posts.filter((post) => post.sender.id === selectedFriend)
        : posts,
    [posts, selectedFriend],
  );

  const postsByFriend = useMemo(() => {
    const allPosts = [...posts, ...myPosts];
    const uniquePosts = Array.from(
      new Map(allPosts.map((post) => [post.id, post])).values(),
    );

    const ownRow: Friend | null = currentUserId
      ? {
          id: currentUserId,
          name: currentUserName,
          avatar: currentUserAvatar,
        }
      : null;

    const friendRows = ownRow
      ? [ownRow, ...friends.filter((friend) => friend.id !== ownRow.id)]
      : friends;

    return friendRows
      .filter((friend) => {
        if (!searchQuery) return true;
        return friend.name.toLowerCase().includes(searchQuery.toLowerCase());
      })
      .map((friend) => ({
        friend,
        posts: uniquePosts.filter((post) => post.sender.id === friend.id),
      }))
      .filter(
        (group) => group.posts.length > 0 || group.friend.id === currentUserId,
      );
  }, [
    friends,
    posts,
    myPosts,
    searchQuery,
    currentUserId,
    currentUserName,
    currentUserAvatar,
  ]);

  const openViewer = (post: PhotoPost, postsContext: PhotoPost[]) => {
    const index = postsContext.findIndex(
      (currentPost) => currentPost.id === post.id,
    );
    setViewerData({ posts: postsContext, index: index >= 0 ? index : 0 });
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <Animated.View className="flex-1" style={animatedStyle} {...panHandlers}>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 148 }}
          showsVerticalScrollIndicator={false}
          stickyHeaderIndices={[0]}
        >
          <View className="bg-background border-b border-border">
            <View className="flex-row items-center justify-between px-4 py-3">
              <Text className="text-xl font-bold text-foreground">
                Memories
              </Text>
              <Pressable
                onPress={() =>
                  setLayout((currentLayout) =>
                    currentLayout === "grid" ? "film" : "grid",
                  )
                }
                className="flex-row items-center gap-2 rounded-full bg-muted px-3 py-2 active:scale-95"
              >
                <Feather
                  name={layout === "grid" ? "film" : "grid"}
                  size={16}
                  color="hsl(var(--foreground))"
                />
                <Text className="text-xs font-semibold uppercase tracking-[2px] text-foreground">
                  {layout === "grid" ? "Film" : "Grid"}
                </Text>
              </Pressable>
            </View>

            {layout === "grid" ? (
              <FriendSelector
                friends={friends}
                selected={selectedFriend}
                onSelect={setSelectedFriend}
              />
            ) : (
              <View className="px-4 pb-3">
                <View className="relative justify-center">
                  <View className="absolute left-3 z-10">
                    <Feather
                      name="search"
                      size={16}
                      color="hsl(var(--muted-foreground))"
                    />
                  </View>
                  <TextInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Search friends..."
                    placeholderTextColor="hsl(var(--muted-foreground))"
                    className="w-full bg-muted rounded-xl py-2.5 pl-9 pr-4 text-sm text-foreground"
                  />
                </View>
              </View>
            )}
          </View>

          {layout === "grid" ? (
            <View className="flex-row flex-wrap justify-between px-4 pt-4 gap-y-3">
              {filteredPosts.map((post, index) => (
                <View key={post.id} style={{ width: "48%" }}>
                  <PolaroidCard
                    post={post}
                    index={index}
                    onTap={(currentPost) =>
                      openViewer(currentPost, filteredPosts)
                    }
                  />
                </View>
              ))}

              {filteredPosts.length === 0 ? (
                <View className="w-full bg-card rounded-2xl px-4 py-6 items-center">
                  <Text className="text-sm text-muted-foreground text-center">
                    No memories found for this friend yet.
                  </Text>
                </View>
              ) : null}
            </View>
          ) : (
            <View className="pt-4">
              {postsByFriend.map(({ friend, posts }) => (
                <FilmStripRow
                  key={friend.id}
                  friend={friend}
                  posts={posts}
                  onTap={(currentPost) => openViewer(currentPost, posts)}
                />
              ))}

              {postsByFriend.length === 0 ? (
                <View className="px-4">
                  <View className="bg-card rounded-2xl px-4 py-6 items-center">
                    <Text className="text-sm text-muted-foreground text-center">
                      No posts available yet.
                    </Text>
                  </View>
                </View>
              ) : null}
            </View>
          )}

          {isLoading ? (
            <View className="px-4 pt-3">
              <Text className="text-sm text-muted-foreground">
                Loading memories...
              </Text>
            </View>
          ) : null}
        </ScrollView>

        {viewerData ? (
          <PhotoViewer
            posts={viewerData.posts}
            currentIndex={viewerData.index}
            showThumbnailStrip={false}
            isOwnPost={(post) =>
              Boolean(currentUserId) && post.sender.id === currentUserId
            }
            onIndexChange={(nextIndex) => {
              setViewerData((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  index: Math.max(
                    0,
                    Math.min(nextIndex, prev.posts.length - 1),
                  ),
                };
              });
            }}
            onEditMessage={(postId, nextMessage) => {
              setPosts((prev) =>
                prev.map((post) =>
                  post.id === postId ? { ...post, message: nextMessage } : post,
                ),
              );

              setViewerData((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  posts: prev.posts.map((post) =>
                    post.id === postId
                      ? { ...post, message: nextMessage }
                      : post,
                  ),
                };
              });
            }}
            onDeletePost={(postId) => {
              setPosts((prev) => prev.filter((post) => post.id !== postId));

              setViewerData((prev) => {
                if (!prev) return prev;
                const nextPosts = prev.posts.filter(
                  (post) => post.id !== postId,
                );
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
        ) : null}
      </Animated.View>

      <MainBottomNav mode="album" />
    </SafeAreaView>
  );
}
