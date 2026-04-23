import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Dimensions, ImageBackground, Modal, Pressable, BackHandler, ScrollView, FlatList,
  type StyleProp, type TextStyle, type ViewStyle,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { VideoView, useVideoPlayer } from 'expo-video';
import Reanimated, {
  Easing as ReanimatedEasing,
  interpolate,
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList, StoryUser } from '@/app/navigation/types';
import { BottomSheetComments, type CommentPostPreview } from '@/features/comments';
import { BottomSheetShare, type SharePostPreview } from '@/features/share';
import { useStories } from '@/features/stories';
import type { Post } from '@/features/feed/domain/entities/post';
import { useFeed } from '@/features/feed/presentation/hooks/useFeed';
import {
  useFeedUiStore,
  type MenuAnchor,
} from '@/features/feed/presentation/store/useFeedUiStore';
import { createCachedVideoSource } from '@/shared/constants/demoMedia';
import { formatCount } from '@/shared/utils/formatCount';

const { width } = Dimensions.get('window');

const TAP_IN_DURATION = 70;
const TAP_OUT_DURATION = 130;
const MENU_ENTER_DURATION = 210;
const MENU_EXIT_DURATION = 130;
const SPRING_CONFIG = {
  damping: 11,
  stiffness: 280,
  mass: 0.7,
};
const ICON_EASE_OUT = ReanimatedEasing.bezier(0.22, 1, 0.36, 1);
const MENU_EASE_OUT = ReanimatedEasing.bezier(0.2, 0.9, 0.18, 1);

function areIdsEqual(left: string[], right: string[]) {
  if (left.length !== right.length) {
    return false;
  }

  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) {
      return false;
    }
  }

  return true;
}

/* --- Stories (rola junto no header) --- */
const StoryCard = memo(function StoryCard({ item, onPress }: { item: StoryUser; onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;
  const storyPreviewUri =
    item.stories[0]?.type === 'video'
      ? item.stories[0].thumbnail ?? item.avatar
      : item.stories[0]?.uri ?? item.avatar;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.95, duration: 90, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1.03, duration: 130, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 90, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.storyItem}
        accessibilityRole="button"
        accessibilityLabel={`Story de ${item.name}`}
        onPress={handlePress}
      >
        <ImageBackground
          source={{ uri: storyPreviewUri }}
          style={styles.storyBg}
          imageStyle={styles.storyBgImage}
          resizeMode="cover"
        >
          <View style={styles.storyAvatarWrap}>
            <Image
              source={{ uri: item.avatar }}
              style={styles.storyAvatar}
              contentFit="cover"
              cachePolicy="memory-disk"
              recyclingKey={item.avatar}
            />
          </View>
        </ImageBackground>
      </TouchableOpacity>
    </Animated.View>
  );
});

const FeedStoriesHeader = memo(function FeedStoriesHeader({
  stories,
  onOpenStory,
}: {
  stories: StoryUser[];
  onOpenStory: (userIndex: number) => void;
}) {
  const storyCards = useMemo(
    () =>
      stories.map((story, index) => (
        <StoryCard
          key={story.id}
          item={story}
          onPress={() => onOpenStory(index)}
        />
      )),
    [onOpenStory, stories]
  );

  return (
    <View style={styles.storiesWrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.storyListContent}
      >
        {storyCards}
      </ScrollView>
    </View>
  );
});

type ContextMenuActionItemProps = {
  iconName: React.ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
  label: string;
  onPress: () => void;
  textStyle?: StyleProp<TextStyle>;
  pressedStyle?: StyleProp<ViewStyle>;
};

const ContextMenuActionItem = memo(function ContextMenuActionItem({
  iconName,
  iconColor,
  label,
  onPress,
  textStyle,
  pressedStyle,
}: ContextMenuActionItemProps) {
  const iconScale = useSharedValue(1);
  const iconShiftX = useSharedValue(0);
  const iconOpacity = useSharedValue(1);

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    opacity: iconOpacity.value,
    transform: [
      { translateX: iconShiftX.value },
      { scale: iconScale.value },
    ],
  }));

  const handlePressIn = useCallback(() => {
    iconScale.value = withTiming(0.94, {
      duration: TAP_IN_DURATION,
      easing: ICON_EASE_OUT,
    });
    iconShiftX.value = withTiming(1.5, {
      duration: TAP_IN_DURATION,
      easing: ICON_EASE_OUT,
    });
    iconOpacity.value = withTiming(0.92, {
      duration: TAP_IN_DURATION,
      easing: ICON_EASE_OUT,
    });
  }, [iconOpacity, iconScale, iconShiftX]);

  const handlePressOut = useCallback(() => {
    iconScale.value = withSequence(
      withSpring(1.07, SPRING_CONFIG),
      withTiming(1, {
        duration: TAP_OUT_DURATION,
        easing: ICON_EASE_OUT,
      })
    );
    iconShiftX.value = withSequence(
      withTiming(3, {
        duration: 80,
        easing: ICON_EASE_OUT,
      }),
      withTiming(0, {
        duration: TAP_OUT_DURATION,
        easing: ICON_EASE_OUT,
      })
    );
    iconOpacity.value = withTiming(1, {
      duration: TAP_OUT_DURATION,
      easing: ICON_EASE_OUT,
    });
  }, [iconOpacity, iconScale, iconShiftX]);

  return (
    <Pressable
      style={({ pressed }) => [styles.menuItem, pressed && pressedStyle]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
    >
      <Reanimated.View style={[styles.menuActionIconWrap, iconAnimatedStyle]}>
        <Ionicons name={iconName} size={18} color={iconColor} />
      </Reanimated.View>
      <Text style={textStyle ?? styles.menuText}>{label}</Text>
    </Pressable>
  );
});

/* --- Card do Post (com animacoes) --- */
type PostCardProps = {
  item: Post;
  commentCount: number;
  shareCount: number;
  isFollowingAuthor: boolean;
  showFollowCta: boolean;
  isVisible: boolean;
  onOpenComments: (post: Post) => void;
  onOpenShare: (post: Post) => void;
  onToggleFollowAuthor: (authorId: string, nextIsFollowing: boolean) => void;
  onOpenContextMenu: (post: Post, anchor: MenuAnchor) => void;
};

const PostCard = memo(function PostCard({
  item,
  commentCount,
  shareCount,
  isFollowingAuthor,
  showFollowCta,
  isVisible,
  onOpenComments,
  onOpenShare,
  onToggleFollowAuthor,
  onOpenContextMenu,
}: PostCardProps) {
  const [liked, setLiked] = useState(false);
  const [reposted, setReposted] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPausedByUser, setIsPausedByUser] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(!item.thumbnail);
  const [hasVideoError, setHasVideoError] = useState(false);
  const videoSource = useMemo(
    () => (item.video ? createCachedVideoSource(item.video) : null),
    [item.video]
  );
  const videoPlayer = useVideoPlayer(videoSource, (player) => {
    player.loop = false;
    player.muted = true;
  });

  const likeScale = useSharedValue(1);
  const commentScale = useSharedValue(1);
  const commentTilt = useSharedValue(0);
  const shareProgress = useSharedValue(0);
  const repostScale = useSharedValue(1);
  const repostTilt = useSharedValue(0);
  const saveRotateY = useSharedValue(0);
  const moreButtonScale = useSharedValue(1);
  const moreButtonOffsetY = useSharedValue(0);
  const moreButtonGlow = useSharedValue(0);
  const followScale = useSharedValue(1);
  const followProgress = useSharedValue(isFollowingAuthor ? 1 : 0);
  const menuButtonRef = useRef<View | null>(null);

  const likeIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: likeScale.value }],
  }));

  const commentIconStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: commentScale.value },
      { rotate: `${commentTilt.value}deg` },
    ],
  }));

  const repostIconStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: repostScale.value },
      { rotate: `${repostTilt.value}deg` },
    ],
  }));

  const shareIconStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(shareProgress.value, [0, 0.6, 1], [0, 7, 0]) },
      { translateY: interpolate(shareProgress.value, [0, 0.6, 1], [0, -4, 0]) },
      { rotate: `${interpolate(shareProgress.value, [0, 0.6, 1], [0, -12, 0])}deg` },
      { scale: interpolate(shareProgress.value, [0, 0.6, 1], [1, 1.04, 1]) },
    ],
  }));

  const saveIconStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 400 },
      { rotateY: `${saveRotateY.value}deg` },
      { scale: interpolate(saveRotateY.value, [0, 90, 180], [1, 0.96, 1]) },
    ],
  }));

  const moreButtonAnimatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      moreButtonGlow.value,
      [0, 1],
      ['rgba(255,255,255,0)', 'rgba(255,255,255,0.08)']
    ),
    transform: [
      { translateY: moreButtonOffsetY.value },
      { scale: moreButtonScale.value },
    ],
  }));

  const followButtonAnimatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      followProgress.value,
      [0, 1],
      ['#6C63FF', 'rgba(255,255,255,0.06)']
    ),
    borderColor: interpolateColor(
      followProgress.value,
      [0, 1],
      ['rgba(124, 111, 255, 0.94)', 'rgba(255,255,255,0.12)']
    ),
    transform: [{ scale: followScale.value }],
  }));

  const followButtonTextAnimatedStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      followProgress.value,
      [0, 1],
      ['#F8F9FF', '#E2E5F7']
    ),
  }));

  const handleLike = () => {
    setLiked(v => !v);
    likeScale.value = withSequence(
      withTiming(0.9, {
        duration: TAP_IN_DURATION,
        easing: ICON_EASE_OUT,
      }),
      withSpring(1.18, SPRING_CONFIG),
      withTiming(1, {
        duration: TAP_OUT_DURATION,
        easing: ICON_EASE_OUT,
      })
    );
  };

  const handleComment = () => {
    commentScale.value = withSequence(
      withTiming(0.94, {
        duration: TAP_IN_DURATION,
        easing: ICON_EASE_OUT,
      }),
      withSpring(1.1, SPRING_CONFIG),
      withTiming(1, {
        duration: TAP_OUT_DURATION,
        easing: ICON_EASE_OUT,
      })
    );
    commentTilt.value = withSequence(
      withTiming(-7, {
        duration: 60,
        easing: ICON_EASE_OUT,
      }),
      withTiming(6, {
        duration: 80,
        easing: ReanimatedEasing.inOut(ReanimatedEasing.cubic),
      }),
      withTiming(0, {
        duration: TAP_OUT_DURATION,
        easing: ICON_EASE_OUT,
      })
    );

    onOpenComments(item);
  };

  const handleShare = () => {
    shareProgress.value = 0;
    shareProgress.value = withSequence(
      withTiming(1, {
        duration: 190,
        easing: ICON_EASE_OUT,
      }),
      withTiming(0, {
        duration: 120,
        easing: ICON_EASE_OUT,
      })
    );
    onOpenShare(item);
  };

  const handleRepost = () => {
    setReposted(v => !v);
    repostScale.value = withSequence(
      withTiming(0.94, {
        duration: TAP_IN_DURATION,
        easing: ICON_EASE_OUT,
      }),
      withSpring(1.12, SPRING_CONFIG),
      withTiming(1, {
        duration: TAP_OUT_DURATION,
        easing: ICON_EASE_OUT,
      })
    );
    repostTilt.value = withSequence(
      withTiming(-10, {
        duration: 60,
        easing: ICON_EASE_OUT,
      }),
      withTiming(9, {
        duration: 85,
        easing: ReanimatedEasing.inOut(ReanimatedEasing.cubic),
      }),
      withTiming(0, {
        duration: TAP_OUT_DURATION,
        easing: ICON_EASE_OUT,
      })
    );
  };

  const handleSave = () => {
    setSaved(v => !v);
    saveRotateY.value = 0;
    saveRotateY.value = withSequence(
      withTiming(96, {
        duration: 120,
        easing: ICON_EASE_OUT,
      }),
      withTiming(180, {
        duration: 130,
        easing: ICON_EASE_OUT,
      }),
      withTiming(0, { duration: 0 })
    );
  };
  const postTags = item.hashtags?.join(' ') ?? '';

  const isVideoPost = item.type === 'video-horizontal' || item.type === 'video-vertical';
  const shouldAutoPlay = isVisible && !isPausedByUser && !hasEnded;

  useEffect(() => {
    setIsVideoReady(!item.thumbnail);
    setHasVideoError(false);
    setIsPlaying(false);
    setIsPausedByUser(false);
    setHasEnded(false);
  }, [item.id, item.thumbnail, item.video]);

  useEffect(() => {
    followProgress.value = withTiming(isFollowingAuthor ? 1 : 0, {
      duration: 180,
      easing: ICON_EASE_OUT,
    });
  }, [followProgress, isFollowingAuthor]);

  useEffect(() => {
    if (!isVideoPost) return;

    const statusSubscription = videoPlayer.addListener(
      'statusChange',
      ({ status, error }) => {
        if (error) {
          setHasVideoError(true);
          setIsVideoReady(false);
          setIsPlaying(false);
          return;
        }

        if (status === 'readyToPlay') {
          setHasVideoError(false);
          setIsVideoReady(true);
        }
      }
    );
    const sourceLoadSubscription = videoPlayer.addListener('sourceLoad', () => {
      setHasVideoError(false);
    });
    const playingSubscription = videoPlayer.addListener('playingChange', ({ isPlaying: nextIsPlaying }) => {
      setIsPlaying(nextIsPlaying);
    });
    const playToEndSubscription = videoPlayer.addListener('playToEnd', () => {
      setHasEnded(true);
      setIsPausedByUser(false);
      setIsPlaying(false);
    });

    return () => {
      statusSubscription.remove();
      sourceLoadSubscription.remove();
      playingSubscription.remove();
      playToEndSubscription.remove();
    };
  }, [isVideoPost, videoPlayer]);

  useEffect(() => {
    if (!isVideoPost) return;

    videoPlayer.muted = isMuted;
  }, [isMuted, isVideoPost, videoPlayer]);

  useEffect(() => {
    if (!isVideoPost) return;

    if (hasVideoError) {
      videoPlayer.pause();
      return;
    }

    if (shouldAutoPlay) {
      videoPlayer.play();
      return;
    }

    videoPlayer.pause();
  }, [hasVideoError, isVideoPost, shouldAutoPlay, videoPlayer]);

  const handleVideoPress = async () => {
    if (!isVideoPost || hasVideoError) return;

    if (hasEnded) {
      setHasEnded(false);
      setIsPausedByUser(false);
      videoPlayer.replay();
      return;
    }

    if (isPlaying) {
      setIsPausedByUser(true);
      return;
    }

    setIsPausedByUser(false);
  };

  const handleReplay = async () => {
    setHasEnded(false);
    setIsPausedByUser(false);
    videoPlayer.replay();
  };

  const renderMedia = () => {
    if (item.type === 'image' && item.image) {
      return (
        <View style={styles.mediaWrap}>
          <Image
            source={{ uri: item.image }}
            style={styles.media}
            contentFit="cover"
            cachePolicy="memory-disk"
            recyclingKey={item.image}
          />
        </View>
      );
    }

    if (isVideoPost && item.video) {
      const isVertical = item.type === 'video-vertical';

      return (
        <TouchableOpacity
          activeOpacity={1}
          style={[styles.videoWrap, isVertical ? styles.verticalVideoWrap : styles.horizontalVideoWrap]}
          onPress={handleVideoPress}
        >
          <VideoView
            player={videoPlayer}
            style={styles.video}
            contentFit="cover"
            nativeControls={false}
            surfaceType="textureView"
            useExoShutter={false}
            onFirstFrameRender={() => {
              setIsVideoReady(true);
              setHasVideoError(false);
            }}
          />
          {!!item.thumbnail && (!isVideoReady || hasVideoError) && (
            <Image
              source={{ uri: item.thumbnail }}
              style={styles.video}
              contentFit="cover"
              cachePolicy="memory-disk"
              recyclingKey={item.thumbnail}
            />
          )}

          <TouchableOpacity
            style={styles.muteButton}
            onPress={() => setIsMuted((prev) => !prev)}
            accessibilityRole="button"
            accessibilityLabel={isMuted ? 'Ativar som' : 'Silenciar video'}
          >
            <Ionicons name={isMuted ? 'volume-mute' : 'volume-high'} size={18} color="#F8F9FF" />
          </TouchableOpacity>

          {!isPlaying && isVisible && isPausedByUser && !hasEnded && (
            <TouchableOpacity
              style={styles.centerButton}
              onPress={handleVideoPress}
              accessibilityRole="button"
              accessibilityLabel="Continuar video"
            >
              <Ionicons name="play" size={30} color="#F8F9FF" />
            </TouchableOpacity>
          )}

          {hasEnded && (
            <TouchableOpacity
              style={styles.centerButton}
              onPress={handleReplay}
              accessibilityRole="button"
              accessibilityLabel="Reproduzir video novamente"
            >
              <Ionicons name="refresh" size={28} color="#F8F9FF" />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      );
    }

    return null;
  };

  const handleMorePressIn = useCallback(() => {
    moreButtonScale.value = withTiming(0.92, {
      duration: TAP_IN_DURATION,
      easing: ICON_EASE_OUT,
    });
    moreButtonOffsetY.value = withTiming(-1, {
      duration: TAP_IN_DURATION,
      easing: ICON_EASE_OUT,
    });
    moreButtonGlow.value = withTiming(1, {
      duration: 110,
      easing: ICON_EASE_OUT,
    });
  }, [moreButtonGlow, moreButtonOffsetY, moreButtonScale]);

  const handleMorePressOut = useCallback(() => {
    moreButtonScale.value = withSequence(
      withSpring(1.04, SPRING_CONFIG),
      withTiming(1, {
        duration: TAP_OUT_DURATION,
        easing: ICON_EASE_OUT,
      })
    );
    moreButtonOffsetY.value = withTiming(0, {
      duration: TAP_OUT_DURATION,
      easing: ICON_EASE_OUT,
    });
    moreButtonGlow.value = withTiming(0, {
      duration: 150,
      easing: ICON_EASE_OUT,
    });
  }, [moreButtonGlow, moreButtonOffsetY, moreButtonScale]);

  const handleFollowPressIn = useCallback(() => {
    followScale.value = withTiming(0.96, {
      duration: TAP_IN_DURATION,
      easing: ICON_EASE_OUT,
    });
  }, [followScale]);

  const handleFollowPressOut = useCallback(() => {
    followScale.value = withSequence(
      withSpring(isFollowingAuthor ? 1.01 : 1.05, SPRING_CONFIG),
      withTiming(1, {
        duration: TAP_OUT_DURATION,
        easing: ICON_EASE_OUT,
      })
    );
  }, [followScale, isFollowingAuthor]);

  const handleFollowPress = useCallback(() => {
    onToggleFollowAuthor(item.authorId, !isFollowingAuthor);
  }, [isFollowingAuthor, item.authorId, onToggleFollowAuthor]);

  const handleOpenContextMenu = () => {
    menuButtonRef.current?.measureInWindow((x, y, measuredWidth, measuredHeight) => {
      onOpenContextMenu(item, { x, y, width: measuredWidth, height: measuredHeight });
    });
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Image
          source={{ uri: item.avatar }}
          style={styles.cardAvatar}
          contentFit="cover"
          cachePolicy="memory-disk"
          recyclingKey={item.avatar}
        />
        <View style={styles.cardMeta}>
          <Text style={styles.cardUser}>{item.user}</Text>
          <Text style={styles.cardSub}>{item.timeLabel} {'\u2022'} publico</Text>
        </View>
        {showFollowCta && (
          <Reanimated.View style={[styles.followButtonWrap, followButtonAnimatedStyle]}>
            <TouchableOpacity
              style={styles.followButtonTouch}
              onPress={handleFollowPress}
              onPressIn={handleFollowPressIn}
              onPressOut={handleFollowPressOut}
              activeOpacity={1}
              accessibilityRole="button"
              accessibilityLabel={isFollowingAuthor ? `Deixar de seguir ${item.user}` : `Seguir ${item.user}`}
            >
              <Reanimated.Text style={[styles.followButtonText, followButtonTextAnimatedStyle]}>
                {isFollowingAuthor ? 'Seguindo' : 'Seguir'}
              </Reanimated.Text>
            </TouchableOpacity>
          </Reanimated.View>
        )}
        <Reanimated.View style={[styles.moreButton, moreButtonAnimatedStyle]}>
          <TouchableOpacity
            ref={menuButtonRef}
            style={styles.moreButtonTouch}
            onPress={handleOpenContextMenu}
            onPressIn={handleMorePressIn}
            onPressOut={handleMorePressOut}
            activeOpacity={1}
            accessibilityRole="button"
            accessibilityLabel={`Abrir menu da postagem de ${item.user}`}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="ellipsis-vertical" size={18} color="#B9BDD4" />
          </TouchableOpacity>
        </Reanimated.View>
      </View>

      {renderMedia()}

      {/* Acoes compactas: curtir, comentar, repostar e compartilhar + salvar */}
      <View style={styles.actions}>
        <View style={styles.actionsLeft}>
          <View style={styles.actionItem}>
            <Reanimated.View style={[styles.actionIconWrap, likeIconStyle]}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={handleLike}
                activeOpacity={0.8}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel={liked ? 'Descurtir' : 'Curtir'}
              >
                <Ionicons name={liked ? 'heart' : 'heart-outline'} size={22} color={liked ? '#FF5A8F' : '#E5E7F4'} />
              </TouchableOpacity>
            </Reanimated.View>
            <Text style={styles.actionCount}>{formatCount(item.likes + (liked ? 1 : 0))}</Text>
          </View>

          <View style={styles.actionItem}>
            <Reanimated.View style={[styles.actionIconWrap, commentIconStyle]}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={handleComment}
                activeOpacity={0.8}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel="Comentar"
              >
                <Ionicons name="chatbubble-outline" size={22} color="#E5E7F4" />
              </TouchableOpacity>
            </Reanimated.View>
            <Text style={styles.actionCount}>{formatCount(commentCount)}</Text>
          </View>

          <View style={styles.actionItem}>
            <Reanimated.View style={[styles.actionIconWrap, repostIconStyle]}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={handleRepost}
                activeOpacity={0.8}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel={reposted ? 'Desfazer repostagem' : 'Repostar'}
              >
                <Ionicons name="repeat" size={22} color={reposted ? '#7AF1A7' : '#E5E7F4'} />
              </TouchableOpacity>
            </Reanimated.View>
            <Text style={styles.actionCount}>{formatCount(item.reposts + (reposted ? 1 : 0))}</Text>
          </View>

          <View style={styles.actionItem}>
            <Reanimated.View style={[styles.actionIconWrap, shareIconStyle]}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={handleShare}
                activeOpacity={0.8}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel="Compartilhar"
              >
                <Ionicons name="paper-plane-outline" size={22} color="#E5E7F4" />
              </TouchableOpacity>
            </Reanimated.View>
            <Text style={styles.actionCount}>{formatCount(shareCount)}</Text>
          </View>
        </View>

        <Reanimated.View style={[styles.actionIconWrap, saveIconStyle]}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleSave}
            activeOpacity={0.85}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={saved ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
          >
            <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={22} color={saved ? '#6C63FF' : '#E5E7F4'} />
          </TouchableOpacity>
        </Reanimated.View>
      </View>

      <Text style={styles.caption}><Text style={styles.cardUser}>{item.user}</Text> {item.text}</Text>
      {!!postTags && <Text style={styles.tags}>{postTags}</Text>}
    </View>
  );
});

export default function Home() {
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const { posts } = useFeed(isFocused);
  const stories = useStories(isFocused);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [visiblePostIds, setVisiblePostIds] = useState<string[]>([]);
  const menuData = useFeedUiStore((state) => state.menuData);
  const commentsPost = useFeedUiStore((state) => state.commentsPost);
  const sharePost = useFeedUiStore((state) => state.sharePost);
  const commentCountOverrides = useFeedUiStore((state) => state.commentCountOverrides);
  const shareCountOverrides = useFeedUiStore((state) => state.shareCountOverrides);
  const followOverridesByAuthor = useFeedUiStore((state) => state.followOverridesByAuthor);
  const storeOpenComments = useFeedUiStore((state) => state.openComments);
  const storeCloseComments = useFeedUiStore((state) => state.closeComments);
  const storeOpenShare = useFeedUiStore((state) => state.openShare);
  const storeCloseShare = useFeedUiStore((state) => state.closeShare);
  const storeOpenContextMenu = useFeedUiStore((state) => state.openContextMenu);
  const storeCloseContextMenu = useFeedUiStore((state) => state.closeContextMenu);
  const syncCommentCount = useFeedUiStore((state) => state.syncCommentCount);
  const syncShareCount = useFeedUiStore((state) => state.syncShareCount);
  const setAuthorFollowState = useFeedUiStore((state) => state.setAuthorFollowState);
  const menuProgress = useSharedValue(0);

  const isMenuVisible = !!menuData;

  const menuAnimatedStyle = useAnimatedStyle(() => ({
    opacity: menuProgress.value,
    transform: [
      { translateY: interpolate(menuProgress.value, [0, 1], [-10, 0]) },
      { scaleX: interpolate(menuProgress.value, [0, 1], [0.965, 1]) },
      { scaleY: interpolate(menuProgress.value, [0, 1], [0.92, 1]) },
    ],
  }));

  const finishCloseContextMenu = useCallback(() => {
    storeCloseContextMenu();
  }, [storeCloseContextMenu]);

  const closeContextMenu = useCallback(() => {
    menuProgress.value = withTiming(0, {
      duration: MENU_EXIT_DURATION,
      easing: MENU_EASE_OUT,
    }, (finished) => {
      if (finished) {
        runOnJS(finishCloseContextMenu)();
      }
    });
  }, [finishCloseContextMenu, menuProgress]);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: Array<{ item: Post }> }) => {
    const ids = viewableItems.map((entry) => entry.item.id);

    setVisiblePostIds((previousIds) => (
      areIdsEqual(previousIds, ids) ? previousIds : ids
    ));
  }).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 65 }).current;

  const openComments = useCallback((post: Post) => {
    storeOpenComments(post);
  }, [storeOpenComments]);

  const closeComments = useCallback(() => {
    storeCloseComments();
  }, [storeCloseComments]);

  const openShare = useCallback((post: Post) => {
    storeOpenShare(post);
  }, [storeOpenShare]);

  const closeShare = useCallback(() => {
    storeCloseShare();
  }, [storeCloseShare]);

  const openContextMenu = useCallback((post: Post, anchor: MenuAnchor) => {
    menuProgress.value = 0;
    storeOpenContextMenu(post, anchor);
  }, [menuProgress, storeOpenContextMenu]);

  useEffect(() => {
    if (!isMenuVisible) return;

    menuProgress.value = withTiming(1, {
      duration: MENU_ENTER_DURATION,
      easing: MENU_EASE_OUT,
    });
  }, [isMenuVisible, menuProgress]);

  useEffect(() => {
    if (!isMenuVisible) return;

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      closeContextMenu();
      return true;
    });

    return () => subscription.remove();
  }, [closeContextMenu, isMenuVisible]);

  useEffect(() => {
    if (!commentsPost) return;

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      closeComments();
      return true;
    });

    return () => subscription.remove();
  }, [closeComments, commentsPost]);

  useEffect(() => {
    if (!sharePost) return;

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      closeShare();
      return true;
    });

    return () => subscription.remove();
  }, [closeShare, sharePost]);

  const menuPosition = useMemo(() => {
    if (!menuData) return { top: 0, left: 0 };

    const menuWidth = 232;
    const menuHeight = 276;
    const edgeOffset = 10;
    const anchorGap = 8;
    const windowHeight = Dimensions.get('window').height;

    const unclampedLeft = menuData.anchor.x + menuData.anchor.width - menuWidth;
    const left = Math.min(
      Math.max(unclampedLeft, edgeOffset),
      width - menuWidth - edgeOffset,
    );

    const belowTop = menuData.anchor.y + menuData.anchor.height + anchorGap;
    const maxTop = windowHeight - insets.bottom - menuHeight - edgeOffset;
    const top = belowTop > maxTop
      ? Math.max(insets.top + edgeOffset, menuData.anchor.y - menuHeight - anchorGap)
      : belowTop;

    return { top, left };
  }, [insets.bottom, insets.top, menuData]);

  const isMenuAuthorFollowing = menuData
    ? followOverridesByAuthor[menuData.post.authorId] ?? menuData.post.isFollowingAuthor
    : false;

  const handleToggleFollowAuthor = useCallback((authorId: string, nextIsFollowing: boolean) => {
    setAuthorFollowState(authorId, nextIsFollowing);
  }, [setAuthorFollowState]);

  const handleMenuAction = useCallback((action: 'profile' | 'follow' | 'unfollow' | 'interested' | 'not_interested' | 'report') => {
    if (menuData) {
      console.log(`[ContextMenu] ${action} em ${menuData.post.user}`);

      if (action === 'follow') {
        setAuthorFollowState(menuData.post.authorId, true);
      }

      if (action === 'unfollow') {
        setAuthorFollowState(menuData.post.authorId, false);
      }
    }

    closeContextMenu();
  }, [closeContextMenu, menuData, setAuthorFollowState]);


  const openStoryViewer = useCallback((userIndex: number) => {
    if (!isFocused) return;

    navigation.navigate('StoryViewer', {
      users: stories,
      initialUserIndex: userIndex,
      initialStoryIndex: 0,
    });
  }, [isFocused, navigation, stories]);

  const renderPost = useCallback(
    ({ item }: { item: Post }) => {
      const commentCount = commentCountOverrides[item.id] ?? item.comments;
      const shareCount = shareCountOverrides[item.id] ?? item.shares;
      const isFollowingAuthor = followOverridesByAuthor[item.authorId] ?? item.isFollowingAuthor;

      return (
        <PostCard
          item={item}
          commentCount={commentCount}
          shareCount={shareCount}
          isFollowingAuthor={isFollowingAuthor}
          showFollowCta={item.isSuggested}
          isVisible={visiblePostIds.includes(item.id)}
          onOpenComments={openComments}
          onOpenShare={openShare}
          onToggleFollowAuthor={handleToggleFollowAuthor}
          onOpenContextMenu={openContextMenu}
        />
      );
    },
    [
      commentCountOverrides,
      followOverridesByAuthor,
      handleToggleFollowAuthor,
      openComments,
      openContextMenu,
      openShare,
      shareCountOverrides,
      visiblePostIds,
    ]
  );

  const feedExtraData = useMemo(
    () => ({
      commentCountOverrides,
      followOverridesByAuthor,
      shareCountOverrides,
      visiblePostIds,
    }),
    [commentCountOverrides, followOverridesByAuthor, shareCountOverrides, visiblePostIds]
  );

  const commentsSheetPost = useMemo<CommentPostPreview | null>(() => {
    if (!commentsPost) {
      return null;
    }

    return {
      id: commentsPost.id,
      authorName: commentsPost.user,
      authorAvatar: commentsPost.avatar,
      text: commentsPost.text,
    };
  }, [commentsPost]);

  const activeCommentCount = commentsPost
    ? commentCountOverrides[commentsPost.id] ?? commentsPost.comments
    : 0;

  const shareSheetPost = useMemo<SharePostPreview | null>(() => {
    if (!sharePost) {
      return null;
    }

    const isImage = sharePost.type === 'image';
    const isVideo =
      sharePost.type === 'video-horizontal' ||
      sharePost.type === 'video-vertical';

    return {
      id: sharePost.id,
      authorName: sharePost.user,
      authorAvatar: sharePost.avatar,
      text: sharePost.text,
      mediaUri: isImage ? sharePost.image : isVideo ? sharePost.video : undefined,
      mediaType: isImage ? 'image' : isVideo ? 'video' : undefined,
      caption: sharePost.text,
    };
  }, [sharePost]);

  const postsById = useMemo(
    () =>
      posts.reduce<Record<string, Post>>((accumulator, post) => {
        accumulator[post.id] = post;
        return accumulator;
      }, {}),
    [posts]
  );

  const handleCommentCountChange = useCallback(
    (count: number) => {
      if (!commentsPost) {
        return;
      }

      syncCommentCount(commentsPost.id, count);
    },
    [commentsPost, syncCommentCount]
  );

  const handleShareIncrement = useCallback(
    (postId: string, amount: number) => {
      const currentCount =
        shareCountOverrides[postId] ?? postsById[postId]?.shares ?? 0;

      syncShareCount(postId, currentCount + amount);
    },
    [postsById, shareCountOverrides, syncShareCount]
  );

  const feedHeader = useMemo(
    () => <FeedStoriesHeader stories={stories} onOpenStory={openStoryViewer} />,
    [openStoryViewer, stories]
  );

  return (
    <SafeAreaView style={styles.root} edges={['left', 'right']}>
      <LinearGradient colors={['#0E0E12', '#11142a', '#0E0E12']} start={[0,0]} end={[1,1]} style={StyleSheet.absoluteFill} />

      {/* Topo fixo: nome + sino */}
      <View style={[styles.topBar, { paddingTop: insets.top }]}>
        <Text style={styles.logo}>KaChan!</Text>
        <View style={{ flex: 1 }} />
        <TouchableOpacity style={{ padding: 6 }} accessibilityLabel="Notificacoes" accessibilityRole="button">
          <MaterialCommunityIcons name="bell-outline" size={22} color="#E5E7F4" />
        </TouchableOpacity>
      </View>

      {/* Feed: Stories no header (sobem juntos) */}
      <FlatList
        data={posts}
        keyExtractor={(p) => p.id}
        renderItem={renderPost}
        ListHeaderComponent={feedHeader}
        extraData={feedExtraData}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.feedContent}
        removeClippedSubviews={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />

      <BottomSheetComments
        visible={!!commentsPost}
        post={commentsSheetPost}
        onClose={closeComments}
        autoFocusOnOpen
        initialCount={activeCommentCount}
        onCountChange={handleCommentCountChange}
      />

      <BottomSheetShare
        visible={!!sharePost}
        post={shareSheetPost}
        onClose={closeShare}
        onShareIncrement={handleShareIncrement}
      />



      <Modal transparent visible={isMenuVisible} animationType="none" onRequestClose={() => closeContextMenu()}>
        <View style={styles.menuOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => closeContextMenu()} />

          <Reanimated.View
            style={[
              styles.contextMenu,
              menuAnimatedStyle,
              {
                top: menuPosition.top,
                left: menuPosition.left,
              },
            ]}
          >
            <ContextMenuActionItem
              iconName="person-outline"
              iconColor="#E4E7FB"
              label="Perfil"
              onPress={() => handleMenuAction('profile')}
              pressedStyle={styles.menuItemPressed}
            />

            <ContextMenuActionItem
              iconName={isMenuAuthorFollowing ? 'person-remove-outline' : 'person-add-outline'}
              iconColor="#E4E7FB"
              label={isMenuAuthorFollowing ? 'Deixar de seguir' : 'Seguir'}
              onPress={() => handleMenuAction(isMenuAuthorFollowing ? 'unfollow' : 'follow')}
              pressedStyle={styles.menuItemPressed}
            />

            <View style={styles.menuDivider} />

            <ContextMenuActionItem
              iconName="star-outline"
              iconColor="#E4E7FB"
              label="Tenho interesse"
              onPress={() => handleMenuAction('interested')}
              pressedStyle={styles.menuItemPressed}
            />

            <ContextMenuActionItem
              iconName="ban-outline"
              iconColor="#E4E7FB"
              label="Não tenho interesse"
              onPress={() => handleMenuAction('not_interested')}
              pressedStyle={styles.menuItemPressed}
            />

            <View style={styles.menuDivider} />

            <ContextMenuActionItem
              iconName="flag-outline"
              iconColor="#FF6C7A"
              label="Denunciar"
              onPress={() => handleMenuAction('report')}
              textStyle={styles.reportMenuText}
              pressedStyle={styles.reportMenuItemPressed}
            />
          </Reanimated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* --- estilos --- */
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0E0E12' },

  // topo fixo
  topBar: { minHeight: 52, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 8 },
  logo: { color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: 0.3 },

  // stories
  storiesWrap: { paddingVertical: 10, marginBottom: 8 },
  storyListContent: { paddingHorizontal: 12 },
  storyItem: { width: 64, height: 89, marginHorizontal: 6, borderRadius: 15, overflow: 'hidden' },
  storyBg: { flex: 1, borderRadius: 15 },
  storyBgImage: { borderRadius: 15 },
  storyAvatarWrap: {
    position: 'absolute', top: 6, right: 8,
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 2, borderColor: '#fff',
    backgroundColor: '#000', overflow: 'hidden',
  },
  storyAvatar: { width: '100%', height: '100%', borderRadius: 14 },

  // cards do feed
  card: {
    width,
    paddingBottom: 12,
    marginBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  feedContent: {
    paddingBottom: 120,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingBottom: 10, paddingTop: 6 },
  cardMeta: { flex: 1, minWidth: 0 },
  moreButton: {
    minWidth: 28,
    minHeight: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followButtonWrap: {
    minWidth: 92,
    height: 30,
    borderRadius: 999,
    borderWidth: 1,
    marginRight: 8,
    overflow: 'hidden',
  },
  followButtonTouch: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  followButtonText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  moreButtonTouch: {
    minWidth: 28,
    minHeight: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  cardUser: { color: '#fff', fontWeight: '700' },
  cardSub: { color: '#A8ACBF', fontSize: 11, marginTop: 2 },

  // midia com aspectRatio (evita reflow)
  mediaWrap: { width, backgroundColor: '#15182f' },
  media: { width: '100%', aspectRatio: 0.9, resizeMode: 'cover' },

  videoWrap: {
    width,
    backgroundColor: '#15182f',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  verticalVideoWrap: { aspectRatio: 4 / 5 },
  horizontalVideoWrap: { aspectRatio: 16 / 9 },
  video: {
    width: '100%',
    height: '100%',
  },
  centerButton: {
    position: 'absolute',
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(14, 14, 18, 0.55)',
  },
  muteButton: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(14, 14, 18, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  actionsLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionItem: { flexDirection: 'row', alignItems: 'center' },
  actionIconWrap: { alignItems: 'center', justifyContent: 'center' },
  actionBtn: { padding: 8, width: 38, alignItems: 'center' },
  actionCount: {
    color: '#BDC1DA',
    fontSize: 12,
    fontWeight: '600',
    minWidth: 22,
    textAlign: 'left',
    marginRight: 2,
  },

  caption: { color: '#E6E8F5', paddingHorizontal: 14, marginTop: 4 },
  tags: { color: '#98A0CA', paddingHorizontal: 14, marginTop: 3, fontWeight: '600' },

  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(6, 7, 14, 0.18)',
  },
  contextMenu: {
    position: 'absolute',
    width: 232,
    borderRadius: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(18, 22, 42, 0.95)',
    shadowColor: '#03050F',
    shadowOpacity: 0.34,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 44,
    paddingHorizontal: 14,
  },
  menuActionIconWrap: {
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemPressed: {
    backgroundColor: 'rgba(137, 153, 236, 0.14)',
  },
  menuText: {
    color: '#E4E7FB',
    fontSize: 14,
    fontWeight: '600',
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(237, 239, 255, 0.16)',
    marginVertical: 6,
    marginHorizontal: 10,
  },
  reportMenuItemPressed: {
    backgroundColor: 'rgba(255, 108, 122, 0.14)',
  },
  reportMenuText: {
    color: '#FF6C7A',
    fontSize: 14,
    fontWeight: '700',
  },
});


