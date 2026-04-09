import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  BackHandler,
  Dimensions,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Reanimated, {
  Easing as ReanimatedEasing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackScreenProps } from '@/app/navigation/types';
import { createCachedVideoSource } from '@/shared/constants/demoMedia';
import BottomSheetStoryPrivacy from '@/features/stories/presentation/BottomSheetStoryPrivacy';
import BottomSheetStoryViewers from '@/features/stories/presentation/BottomSheetStoryViewers';
import { useStories } from '@/features/stories/presentation/hooks/useStories';
import { getStoriesRepository } from '@/features/stories/infrastructure/repositories/mockStoriesRepository';
import { BottomSheetShare, type SharePostPreview } from '@/features/share';

type Props = RootStackScreenProps<'StoryViewer'>;

const IMAGE_DURATION_MS = 5000;
const REACTIONS = ['â¤ï¸', 'ðŸ˜‚', 'ðŸ”¥', 'ðŸ˜®', 'ðŸ‘'];
const SCREEN_WIDTH = Dimensions.get('window').width;

const MENU_ENTER_DURATION = 210;
const MENU_EXIT_DURATION = 130;
const MENU_EASE_OUT = ReanimatedEasing.bezier(0.2, 0.9, 0.18, 1);

export default function StoryViewer({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const {
    users: initialUsers,
    initialStoryIndex,
    initialUserIndex,
  } = route.params;
  const liveUsers = useStories(true);
  const storiesRepository = useMemo(() => getStoriesRepository(), []);
  const users = liveUsers.length > 0 ? liveUsers : initialUsers;

  const [currentUserIndex, setCurrentUserIndex] = useState(initialUserIndex);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(initialStoryIndex);
  const [input, setInput] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [emojiFx, setEmojiFx] = useState<string | null>(null);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const [emojiInsertFx, setEmojiInsertFx] = useState<string | null>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [hasVideoError, setHasVideoError] = useState(false);
  const [isPressPaused, setIsPressPaused] = useState(false);
  const [likedStories, setLikedStories] = useState<Record<string, boolean>>({});
  const [isPrivacySheetVisible, setIsPrivacySheetVisible] = useState(false);
  const [isViewersSheetVisible, setIsViewersSheetVisible] = useState(false);
  const [isStoryShareVisible, setIsStoryShareVisible] = useState(false);
  const [isOptionsMenuVisible, setIsOptionsMenuVisible] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState({ top: 0, left: 0 });

  const progress = useRef(new Animated.Value(0)).current;
  const contentFade = useRef(new Animated.Value(0)).current;
  const userSlideX = useRef(new Animated.Value(0)).current;
  const userOpacity = useRef(new Animated.Value(1)).current;
  const emojiInsertAnim = useRef(new Animated.Value(0)).current;
  const previousUserIndexRef = useRef(initialUserIndex);
  const storyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const storyStartAtRef = useRef<number>(0);
  const storyRemainingRef = useRef<number>(IMAGE_DURATION_MS);
  const videoSourceKeyRef = useRef<string | null>(null);
  const menuBtnRef = useRef<React.ElementRef<typeof TouchableOpacity>>(null);
  const likeBurstScale = useSharedValue(0.6);
  const likeBurstOpacity = useSharedValue(0);
  const heartButtonScale = useSharedValue(1);
  const menuProgress = useSharedValue(0);
  const videoPlayer = useVideoPlayer(null, (player) => {
    player.loop = false;
    player.muted = false;
    player.timeUpdateEventInterval = 0.25;
  });

  const currentUser = users[currentUserIndex];
  const currentStories = currentUser?.stories ?? [];
  const currentStory = currentStories[currentStoryIndex];
  const isOwnStory = !!currentUser?.isOwnStory;
  const canMessageCurrentStory = !isOwnStory;
  const isPaused =
    isPressPaused ||
    isInputFocused ||
    isPrivacySheetVisible ||
    isViewersSheetVisible ||
    isStoryShareVisible ||
    isOptionsMenuVisible;
  const isCurrentStoryLiked = currentStory
    ? !!likedStories[currentStory.id]
    : false;
  const currentStoryViewers = currentStory?.viewers ?? [];
  const previewViewers = currentStoryViewers.slice(0, 3);
  const storySharePreview = useMemo<SharePostPreview | null>(() => {
    if (!isOwnStory || !currentStory || !currentUser) {
      return null;
    }

    return {
      id: currentStory.id,
      authorName: currentUser.name,
      authorAvatar: currentUser.avatar,
      text: `Story publicado ${currentStory.postedAt}.`,
      mediaUri: currentStory.uri,
      mediaType: currentStory.type === 'video' ? 'video' : 'image',
      caption: currentStory.postedAt,
    };
  }, [currentStory, currentUser, isOwnStory]);
  const currentVideoSource = useMemo(
    () =>
      currentStory?.type === 'video'
        ? createCachedVideoSource(currentStory.uri)
        : null,
    [currentStory?.id, currentStory?.type, currentStory?.uri]
  );

  const clearStoryTimer = useCallback(() => {
    if (storyTimerRef.current) {
      clearTimeout(storyTimerRef.current);
      storyTimerRef.current = null;
    }
  }, []);

  const likeBurstStyle = useAnimatedStyle(() => ({
    opacity: likeBurstOpacity.value,
    transform: [{ scale: likeBurstScale.value }],
  }));

  const heartButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartButtonScale.value }],
  }));

  const menuAnimatedStyle = useAnimatedStyle(() => ({
    opacity: menuProgress.value,
    transform: [{ translateY: interpolate(menuProgress.value, [0, 1], [-8, 0]) }],
  }));

  const triggerHeartBurst = useCallback(() => {
    likeBurstScale.value = 0.64;
    likeBurstOpacity.value = 0;
    likeBurstOpacity.value = withSequence(
      withTiming(1, { duration: 90 }),
      withDelay(260, withTiming(0, { duration: 180 }))
    );
    likeBurstScale.value = withSequence(
      withSpring(1.12, { damping: 12, stiffness: 220 }),
      withTiming(1, { duration: 140 })
    );
  }, [likeBurstOpacity, likeBurstScale]);

  const animateHeartButton = useCallback(() => {
    heartButtonScale.value = withSequence(
      withTiming(0.84, { duration: 70 }),
      withSpring(1, { damping: 10, stiffness: 240 })
    );
  }, [heartButtonScale]);

  const closeOptionsMenu = useCallback(() => {
    menuProgress.value = withTiming(0, { duration: MENU_EXIT_DURATION, easing: MENU_EASE_OUT });
    setTimeout(() => setIsOptionsMenuVisible(false), MENU_EXIT_DURATION + 10);
  }, [menuProgress]);

  const openOptionsMenu = useCallback(() => {
    menuBtnRef.current?.measure((_x: number, _y: number, w: number, h: number, pageX: number, pageY: number) => {
      const menuWidth = 190;
      setMenuAnchor({ top: pageY + h + 6, left: pageX - menuWidth + w });
      menuProgress.value = 0;
      setIsOptionsMenuVisible(true);
    });
  }, [menuProgress]);

  const toggleStoryLike = useCallback(
    (forceLike = false) => {
      if (!currentStory) return;

      let shouldBurst = false;

      setLikedStories((currentLikedStories) => {
        const currentLiked = !!currentLikedStories[currentStory.id];
        const nextLiked = forceLike ? true : !currentLiked;

        shouldBurst = forceLike || nextLiked;

        if (currentLiked === nextLiked) {
          return currentLikedStories;
        }

        return {
          ...currentLikedStories,
          [currentStory.id]: nextLiked,
        };
      });

      animateHeartButton();

      if (shouldBurst) {
        triggerHeartBurst();
      }
    },
    [animateHeartButton, currentStory, triggerHeartBurst]
  );

  const setStoryPressPaused = useCallback((nextPaused: boolean) => {
    setIsPressPaused((currentValue) =>
      currentValue === nextPaused ? currentValue : nextPaused
    );
  }, []);

  const goNext = useCallback(() => {
    const isLastStoryFromUser = currentStoryIndex >= currentStories.length - 1;
    if (!isLastStoryFromUser) {
      setCurrentStoryIndex((value) => value + 1);
      return;
    }

    if (currentUserIndex < users.length - 1) {
      setCurrentUserIndex((value) => value + 1);
      setCurrentStoryIndex(0);
      return;
    }

    navigation.goBack();
  }, [
    currentStories.length,
    currentStoryIndex,
    currentUserIndex,
    navigation,
    users.length,
  ]);

  const goPrevious = useCallback(() => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex((value) => value - 1);
      return;
    }

    if (currentUserIndex > 0) {
      const previousUserIndex = currentUserIndex - 1;
      const previousStoriesCount = users[previousUserIndex]?.stories.length ?? 1;
      setCurrentUserIndex(previousUserIndex);
      setCurrentStoryIndex(Math.max(previousStoriesCount - 1, 0));
    }
  }, [currentStoryIndex, currentUserIndex, users]);

  const goNextUser = useCallback(() => {
    if (currentUserIndex < users.length - 1) {
      setCurrentUserIndex((value) => value + 1);
      setCurrentStoryIndex(0);
      return;
    }

    navigation.goBack();
  }, [currentUserIndex, navigation, users.length]);

  const goPreviousUser = useCallback(() => {
    if (currentUserIndex > 0) {
      const previousUserIndex = currentUserIndex - 1;
      setCurrentUserIndex(previousUserIndex);
      setCurrentStoryIndex(0);
    }
  }, [currentUserIndex]);

  const runUserTransition = useCallback(
    (direction: 'next' | 'previous') => {
      userSlideX.stopAnimation();
      userOpacity.stopAnimation();
      userSlideX.setValue(direction === 'next' ? 28 : -28);
      userOpacity.setValue(0.7);

      Animated.parallel([
        Animated.timing(userSlideX, {
          toValue: 0,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(userOpacity, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
      ]).start();
    },
    [userOpacity, userSlideX]
  );

  const startImageProgress = useCallback(
    (durationMs: number) => {
      clearStoryTimer();

      storyRemainingRef.current = durationMs;
      storyStartAtRef.current = Date.now();
      progress.stopAnimation();

      Animated.timing(progress, {
        toValue: 1,
        duration: durationMs,
        useNativeDriver: false,
      }).start();

      storyTimerRef.current = setTimeout(goNext, durationMs);
    },
    [clearStoryTimer, goNext, progress]
  );

  const pauseImageProgress = useCallback(() => {
    clearStoryTimer();
    progress.stopAnimation((currentProgressValue) => {
      const elapsed = Date.now() - storyStartAtRef.current;
      const nextRemaining = Math.max(storyRemainingRef.current - elapsed, 0);
      storyRemainingRef.current = nextRemaining;
      progress.setValue(currentProgressValue);
    });
  }, [clearStoryTimer, progress]);

  const resumeImageProgress = useCallback(() => {
    clearStoryTimer();
    const remaining = Math.max(storyRemainingRef.current, 0);
    if (remaining <= 0) {
      goNext();
      return;
    }

    storyStartAtRef.current = Date.now();
    Animated.timing(progress, {
      toValue: 1,
      duration: remaining,
      useNativeDriver: false,
    }).start();

    storyTimerRef.current = setTimeout(goNext, remaining);
  }, [clearStoryTimer, goNext, progress]);

  useEffect(() => {
    if (!currentStory) {
      navigation.goBack();
      return;
    }

    setIsVideoReady(currentStory.type !== 'video');
    setHasVideoError(false);
    progress.stopAnimation();
    progress.setValue(0);

    Animated.sequence([
      Animated.timing(contentFade, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(contentFade, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start();

    if (currentStory.type === 'image') {
      videoPlayer.pause();
      videoSourceKeyRef.current = null;
      void videoPlayer.replaceAsync(null);
      storyRemainingRef.current = currentStory.durationMs ?? IMAGE_DURATION_MS;
      storyStartAtRef.current = Date.now();

      if (!isPaused) {
        startImageProgress(currentStory.durationMs ?? IMAGE_DURATION_MS);
      }
    } else {
      clearStoryTimer();

      const nextSource = currentStory.uri;
      let isStale = false;

      const loadVideo = async () => {
        try {
          if (videoSourceKeyRef.current !== nextSource) {
            videoSourceKeyRef.current = nextSource;
            await videoPlayer.replaceAsync(currentVideoSource);
          }

          if (isStale) return;

          videoPlayer.muted = isMuted;

          if (isPaused) {
            videoPlayer.pause();
          } else {
            videoPlayer.play();
          }
        } catch {
          if (!isStale) {
            setHasVideoError(true);
            setIsVideoReady(false);
          }
        }
      };

      void loadVideo();

      return () => {
        isStale = true;
        clearStoryTimer();
        progress.stopAnimation();
      };
    }

    return () => {
      clearStoryTimer();
      progress.stopAnimation();
    };
  }, [
    clearStoryTimer,
    contentFade,
    currentStory,
    isMuted,
    isPaused,
    navigation,
    currentVideoSource,
    progress,
    startImageProgress,
    videoPlayer,
  ]);

  useEffect(() => {
    if (!currentStory) return;

    const nextStory = currentStories[currentStoryIndex + 1];
    if (nextStory?.type === 'image') {
      void Image.prefetch(nextStory.uri);
    }
  }, [currentStories, currentStory, currentStoryIndex]);

  useEffect(() => () => clearStoryTimer(), [clearStoryTimer]);

  useEffect(() => {
    if (!currentStory || currentStory.type !== 'image') {
      return;
    }

    if (isPaused) {
      pauseImageProgress();
      return;
    }

    resumeImageProgress();
  }, [
    currentStory?.id,
    currentStory?.type,
    isPaused,
    pauseImageProgress,
    resumeImageProgress,
  ]);

  useEffect(() => {
    if (currentStory?.type !== 'video') return;

    const statusSubscription = videoPlayer.addListener(
      'statusChange',
      ({ status, error }) => {
        if (error) {
          setHasVideoError(true);
          setIsVideoReady(false);
          return;
        }

        if (status === 'readyToPlay') {
          setHasVideoError(false);
          setIsVideoReady(true);
        }
      }
    );
    const sourceLoadSubscription = videoPlayer.addListener(
      'sourceLoad',
      () => {
        setHasVideoError(false);
      }
    );
    const timeUpdateSubscription = videoPlayer.addListener(
      'timeUpdate',
      ({ currentTime }) => {
        const durationMs = Math.max(videoPlayer.duration, 0) * 1000;
        const positionMs = Math.max(currentTime, 0) * 1000;

        progress.setValue(durationMs > 0 ? positionMs / durationMs : 0);
      }
    );
    const playToEndSubscription = videoPlayer.addListener('playToEnd', () => {
      goNext();
    });

    return () => {
      statusSubscription.remove();
      sourceLoadSubscription.remove();
      timeUpdateSubscription.remove();
      playToEndSubscription.remove();
    };
  }, [currentStory?.id, currentStory?.type, goNext, progress, videoPlayer]);

  useEffect(() => {
    if (currentStory?.type !== 'video') return;

    videoPlayer.muted = isMuted;
  }, [currentStory?.type, isMuted, videoPlayer]);

  useEffect(() => {
    if (currentStory?.type !== 'video' || hasVideoError) return;

    if (isPaused) {
      videoPlayer.pause();
      return;
    }

    if (isVideoReady) {
      videoPlayer.play();
    }
  }, [currentStory?.id, currentStory?.type, hasVideoError, isPaused, isVideoReady, videoPlayer]);

  useEffect(() => {
    if (currentUserIndex === previousUserIndexRef.current) return;

    const direction =
      currentUserIndex > previousUserIndexRef.current ? 'next' : 'previous';
    runUserTransition(direction);
    previousUserIndexRef.current = currentUserIndex;
  }, [currentUserIndex, runUserTransition]);

  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = Keyboard.addListener(showEvent, (event) => {
      const offset = Math.max(
        event.endCoordinates.height - insets.bottom + 10,
        0
      );
      setKeyboardOffset(offset);
    });

    const onHide = Keyboard.addListener(hideEvent, () => {
      setKeyboardOffset(0);
    });

    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, [insets.bottom]);

  const showReactionFx = useCallback(
    (emoji: string) => {
      setInput((value) => `${value}${emoji}`);
      setEmojiFx(emoji);
      setEmojiInsertFx(emoji);
      emojiInsertAnim.stopAnimation();
      emojiInsertAnim.setValue(0);

      Animated.sequence([
        Animated.timing(emojiInsertAnim, {
          toValue: 1,
          duration: 210,
          useNativeDriver: true,
        }),
        Animated.delay(120),
        Animated.timing(emojiInsertAnim, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setEmojiInsertFx(null);
      });

      setTimeout(() => setEmojiFx(null), 520);
    },
    [emojiInsertAnim]
  );

  const handleSend = useCallback(() => {
    const payload = input.trim();
    if (!payload) return;
    setInput('');
    setIsInputFocused(false);
    Keyboard.dismiss();
  }, [input]);

  const handleOpenPrivacy = useCallback(() => {
    if (!currentUser?.isOwnStory || !currentStory) {
      return;
    }

    Keyboard.dismiss();
    setIsInputFocused(false);
    setIsPrivacySheetVisible(true);
  }, [currentStory, currentUser?.isOwnStory]);

  const handleOpenViewers = useCallback(() => {
    if (!isOwnStory || !currentStory) {
      return;
    }

    setIsViewersSheetVisible(true);
  }, [currentStory, isOwnStory]);

  const handleOpenStoryShare = useCallback(() => {
    if (!isOwnStory || !currentStory) {
      return;
    }

    setIsStoryShareVisible(true);
  }, [currentStory, isOwnStory]);

  const handleDeleteCurrentStory = useCallback(() => {
    if (!isOwnStory || !currentStory || !currentUser) {
      return;
    }

    Alert.alert(
      'Excluir story?',
      'Esse story sera removido e nao podera ser recuperado depois.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            const nextStories = storiesRepository.deleteStory(
              currentUser.id,
              currentStory.id
            );
            const remainingOwnStories = nextStories.find(
              (storyUser) => storyUser.id === currentUser.id
            );

            queryClient.setQueryData(['stories'], nextStories);
            setIsPrivacySheetVisible(false);
            setIsViewersSheetVisible(false);
            setIsStoryShareVisible(false);
            setLikedStories((currentLikedState) => {
              if (!currentLikedState[currentStory.id]) {
                return currentLikedState;
              }

              const nextLikedState = { ...currentLikedState };
              delete nextLikedState[currentStory.id];
              return nextLikedState;
            });

            if (!remainingOwnStories) {
              navigation.goBack();
              return;
            }

            setCurrentStoryIndex((currentIndexValue) =>
              Math.min(currentIndexValue, remainingOwnStories.stories.length - 1)
            );
          },
        },
      ]
    );
  }, [
    currentStory,
    currentUser,
    isOwnStory,
    navigation,
    queryClient,
    storiesRepository,
  ]);

  useEffect(() => {
    if (
      !currentUser?.isOwnStory &&
      (isPrivacySheetVisible || isViewersSheetVisible || isStoryShareVisible)
    ) {
      setIsPrivacySheetVisible(false);
      setIsViewersSheetVisible(false);
      setIsStoryShareVisible(false);
    }
  }, [
    currentUser?.isOwnStory,
    isPrivacySheetVisible,
    isStoryShareVisible,
    isViewersSheetVisible,
  ]);

  useEffect(() => {
    if (canMessageCurrentStory || !isInputFocused) {
      return;
    }

    setIsInputFocused(false);
    Keyboard.dismiss();
  }, [canMessageCurrentStory, isInputFocused]);

  useEffect(() => {
    if (!isOptionsMenuVisible) return;
    menuProgress.value = withTiming(1, { duration: MENU_ENTER_DURATION, easing: MENU_EASE_OUT });
  }, [isOptionsMenuVisible, menuProgress]);

  useEffect(() => {
    if (!isOptionsMenuVisible) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      closeOptionsMenu();
      return true;
    });
    return () => sub.remove();
  }, [isOptionsMenuVisible, closeOptionsMenu]);

  const storyGestures = useMemo(() => {
    const singleTapGesture = Gesture.Tap()
      .maxDuration(250)
      .onEnd((event, success) => {
        if (!success) return;

        if (event.x < SCREEN_WIDTH / 2) {
          runOnJS(goPrevious)();
          return;
        }

        runOnJS(goNext)();
      });

    const doubleTapGesture = Gesture.Tap()
      .numberOfTaps(2)
      .maxDuration(220)
      .maxDelay(240)
      .onEnd((_, success) => {
        if (!success) return;
        if (currentUser?.isOwnStory) return;
        runOnJS(toggleStoryLike)(true);
      });

    const horizontalPanGesture = Gesture.Pan()
      .activeOffsetX([-40, 40])
      .failOffsetY([-28, 28])
      .onEnd((event) => {
        if (event.translationX <= -55) {
          runOnJS(goNextUser)();
          return;
        }

        if (event.translationX >= 55) {
          runOnJS(goPreviousUser)();
        }
      });

    const longPressGesture = Gesture.LongPress()
      .minDuration(160)
      .maxDistance(16)
      .onStart(() => {
        runOnJS(setStoryPressPaused)(true);
      })
      .onFinalize(() => {
        runOnJS(setStoryPressPaused)(false);
      });

    return Gesture.Simultaneous(
      Gesture.Exclusive(doubleTapGesture, singleTapGesture),
      horizontalPanGesture,
      longPressGesture
    );
  }, [
    goNext,
    goNextUser,
    goPrevious,
    goPreviousUser,
    currentUser?.isOwnStory,
    setStoryPressPaused,
    toggleStoryLike,
  ]);

  if (!currentStory || !currentUser) {
    return null;
  }

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom', 'left', 'right']}>
      <LinearGradient
        colors={['#07080f', '#11142a', '#07080f']}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View
        style={[
          styles.contentLayer,
          {
            opacity: Animated.multiply(contentFade, userOpacity),
            transform: [{ translateX: userSlideX }],
          },
        ]}
      >
        {currentStory.type === 'video' ? (
          <>
            <VideoView
              player={videoPlayer}
              style={styles.media}
              contentFit="cover"
              nativeControls={false}
              surfaceType="textureView"
              useExoShutter={false}
              onFirstFrameRender={() => {
                setIsVideoReady(true);
                setHasVideoError(false);
              }}
            />
            {!!currentStory.thumbnail && (!isVideoReady || hasVideoError) && (
              <Image
                source={{ uri: currentStory.thumbnail }}
                style={styles.media}
                contentFit="cover"
                cachePolicy="memory-disk"
                recyclingKey={currentStory.thumbnail}
              />
            )}
          </>
        ) : (
          <Image
            source={{ uri: currentStory.uri }}
            style={styles.media}
            contentFit="cover"
            cachePolicy="memory-disk"
            recyclingKey={currentStory.uri}
          />
        )}

        <GestureDetector gesture={storyGestures}>
          <View
            style={[
              styles.gestureSurface,
              {
                bottom: canMessageCurrentStory
                  ? (isInputFocused ? 148 : 108) + keyboardOffset
                  : 96,
              },
            ]}
          />
        </GestureDetector>

        <View style={styles.overlayTop}>
          <View style={styles.progressRow}>
            {currentStories.map((story, index) => {
              const filled = index < currentStoryIndex;
              const active = index === currentStoryIndex;
              const widthInterpolate = progress.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              });

              return (
                <View key={story.id} style={styles.segmentTrack}>
                  {filled && (
                    <View style={[styles.segmentFill, { width: '100%' }]} />
                  )}
                  {active && (
                    <Animated.View
                      style={[styles.segmentFill, { width: widthInterpolate }]}
                    />
                  )}
                </View>
              );
            })}
          </View>

          <View style={styles.header}>
            <View style={styles.userInfo}>
              <Image
                source={{ uri: currentUser.avatar }}
                style={styles.avatar}
                contentFit="cover"
                cachePolicy="memory-disk"
                recyclingKey={currentUser.avatar}
              />
              <View style={styles.userMeta}>
                <Text style={styles.userName}>{currentUser.name}</Text>
                <Text style={styles.userTime}>{currentStory.postedAt}</Text>
              </View>
            </View>

            <View style={styles.headerActions}>
              {currentStory.type === 'video' && (
                <TouchableOpacity
                  onPress={() => setIsMuted((value) => !value)}
                  style={styles.iconBtn}
                >
                  <Ionicons
                    name={isMuted ? 'volume-mute' : 'volume-high'}
                    color="#fff"
                    size={18}
                  />
                </TouchableOpacity>
              )}
              {!isOwnStory && (
                <TouchableOpacity
                  ref={menuBtnRef}
                  style={styles.iconBtn}
                  onPress={openOptionsMenu}
                >
                  <Ionicons name="ellipsis-horizontal" size={18} color="#fff" />
                </TouchableOpacity>
              )}
              {currentUser.isOwnStory && (
                <TouchableOpacity
                  onPress={handleOpenPrivacy}
                  style={styles.iconBtn}
                >
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={18}
                    color="#fff"
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {canMessageCurrentStory && (
          <View style={[styles.bottomArea, { bottom: 12 + keyboardOffset }]}>
            <BlurView intensity={45} tint="dark" style={styles.interactionBar}>
              {emojiInsertFx && (
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.emojiInsertFx,
                    {
                      opacity: emojiInsertAnim.interpolate({
                        inputRange: [0, 0.2, 1],
                        outputRange: [0, 1, 0],
                      }),
                      transform: [
                        {
                          translateX: emojiInsertAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [54, 0],
                          }),
                        },
                        {
                          scale: emojiInsertAnim.interpolate({
                            inputRange: [0, 0.35, 1],
                            outputRange: [0.7, 1.1, 1],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <Text style={styles.emojiInsertText}>{emojiInsertFx}</Text>
                </Animated.View>
              )}
              <TextInput
                value={input}
                onChangeText={setInput}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
                placeholder="Enviar mensagem..."
                placeholderTextColor="#AEB2C8"
                style={styles.input}
              />
              <Reanimated.View style={heartButtonStyle}>
                <TouchableOpacity
                  style={styles.heartBtn}
                  onPress={() => toggleStoryLike()}
                  accessibilityRole="button"
                  accessibilityLabel={
                    isCurrentStoryLiked ? 'Descurtir story' : 'Curtir story'
                  }
                >
                  <Ionicons
                    name={isCurrentStoryLiked ? 'heart' : 'heart-outline'}
                    size={20}
                    color={isCurrentStoryLiked ? '#FF7BA5' : '#FFFFFF'}
                  />
                </TouchableOpacity>
              </Reanimated.View>
              <TouchableOpacity style={styles.shareBtn} onPress={handleSend}>
                <Ionicons name="paper-plane" size={18} color="#fff" />
              </TouchableOpacity>
            </BlurView>

            {isInputFocused && (
              <View style={styles.reactionRow}>
                <View style={styles.suggestionWrap}>
                  {REACTIONS.map((emoji) => (
                    <TouchableOpacity
                      key={emoji}
                      onPress={() => showReactionFx(emoji)}
                      style={styles.reactionBtn}
                    >
                      <Text style={styles.reactionText}>{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {isOwnStory && (
          <View style={styles.bottomArea}>
            <BlurView intensity={45} tint="dark" style={styles.ownStoryDock}>
              <TouchableOpacity
                onPress={handleOpenViewers}
                activeOpacity={0.84}
                style={styles.viewsSummary}
              >
                <View style={styles.viewsAvatarStack}>
                  {previewViewers.map((viewer, index) => (
                    <Image
                      key={viewer.id}
                      source={{ uri: viewer.avatar }}
                      style={[
                        styles.viewsAvatar,
                        { marginLeft: index === 0 ? 0 : -10 },
                      ]}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                      recyclingKey={viewer.avatar}
                    />
                  ))}
                  {previewViewers.length === 0 && (
                    <View style={styles.viewsAvatarEmpty}>
                      <Ionicons name="eye-outline" size={15} color="#BFC7F3" />
                    </View>
                  )}
                </View>

                <View style={styles.viewsCopy}>
                  <View style={styles.viewsLabelRow}>
                    <Ionicons name="eye-outline" size={14} color="#DCE1FF" />
                    <Text style={styles.viewsLabel}>Visualizacoes</Text>
                  </View>
                  <Text style={styles.viewsValue}>
                    {currentStoryViewers.length === 0
                      ? 'Sem visualizacoes'
                      : currentStoryViewers.length === 1
                        ? '1 pessoa viu'
                        : `${currentStoryViewers.length} pessoas viram`}
                  </Text>
                </View>
              </TouchableOpacity>

              <View style={styles.ownStoryActions}>
                <TouchableOpacity
                  onPress={handleOpenStoryShare}
                  activeOpacity={0.84}
                  style={styles.ownStoryActionBtn}
                >
                  <Ionicons
                    name="paper-plane-outline"
                    size={20}
                    color="#F5F7FF"
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleDeleteCurrentStory}
                  activeOpacity={0.84}
                  style={[styles.ownStoryActionBtn, styles.deleteActionBtn]}
                >
                  <Ionicons name="trash-outline" size={20} color="#FF8D9F" />
                </TouchableOpacity>
              </View>
            </BlurView>
          </View>
        )}

        {emojiFx && (
          <Animated.View style={styles.emojiFx}>
            <Text style={styles.emojiFxText}>{emojiFx}</Text>
          </Animated.View>
        )}

        {!isOwnStory && (
          <Reanimated.View
            pointerEvents="none"
            style={[styles.likeBurst, likeBurstStyle]}
          >
            <Ionicons name="heart" size={104} color="#FF7BA5" />
          </Reanimated.View>
        )}

      </Animated.View>

      <BottomSheetStoryPrivacy
        visible={isPrivacySheetVisible}
        ownerId={currentUser.isOwnStory ? currentUser.id : null}
        storyId={currentStory.id}
        currentPreset={currentStory.privacyPreset}
        onClose={() => setIsPrivacySheetVisible(false)}
      />
      <BottomSheetStoryViewers
        visible={isViewersSheetVisible}
        viewers={currentStoryViewers}
        onClose={() => setIsViewersSheetVisible(false)}
      />
      <BottomSheetShare
        visible={isStoryShareVisible}
        post={storySharePreview}
        onClose={() => setIsStoryShareVisible(false)}
        showAddToStoryAction={false}
        shareContextLabel="Story"
      />

      <Modal
        transparent
        visible={isOptionsMenuVisible}
        animationType="none"
        onRequestClose={closeOptionsMenu}
      >
        <View style={styles.storyMenuOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeOptionsMenu} />
          <Reanimated.View
            style={[styles.storyContextMenu, menuAnimatedStyle, menuAnchor]}
          >
            <TouchableOpacity
              style={styles.storyMenuItem}
              onPress={closeOptionsMenu}
              activeOpacity={0.7}
            >
              <Ionicons name="flag-outline" size={18} color="#FF6C7A" />
              <Text style={[styles.storyMenuLabel, styles.storyMenuLabelDanger]}>Denunciar</Text>
            </TouchableOpacity>

            <View style={styles.storyMenuDivider} />

            <TouchableOpacity
              style={styles.storyMenuItem}
              onPress={closeOptionsMenu}
              activeOpacity={0.7}
            >
              <Ionicons name="notifications-off-outline" size={18} color="#E4E7FB" />
              <Text style={styles.storyMenuLabel}>Silenciar</Text>
            </TouchableOpacity>
          </Reanimated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  contentLayer: { flex: 1 },
  media: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  gestureSurface: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 86,
  },
  overlayTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 4,
  },
  segmentTrack: {
    flex: 1,
    height: 3,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
  },
  segmentFill: {
    height: '100%',
    backgroundColor: '#F5F6FF',
    borderRadius: 3,
  },
  header: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  userMeta: {
    gap: 2,
    flexShrink: 1,
  },
  userName: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  userTime: {
    color: 'rgba(244,246,255,0.72)',
    fontWeight: '600',
    fontSize: 11,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(17,20,42,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 12,
    paddingHorizontal: 12,
  },
  interactionBar: {
    borderRadius: 30,
    minHeight: 56,
    paddingLeft: 16,
    paddingRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    backgroundColor: 'rgba(14,16,33,0.52)',
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
  },
  ownStoryDock: {
    borderRadius: 28,
    minHeight: 74,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(14,16,33,0.52)',
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    minHeight: 44,
    paddingVertical: 8,
    fontSize: 15,
    fontWeight: '600',
  },
  heartBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginLeft: 8,
  },
  shareBtn: {
    marginLeft: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(108,99,255,0.38)',
  },
  viewsSummary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  viewsAvatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 52,
  },
  viewsAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: '#101327',
  },
  viewsAvatarEmpty: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  viewsCopy: {
    flex: 1,
  },
  viewsLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  viewsLabel: {
    color: '#DCE1FF',
    fontSize: 12,
    fontWeight: '800',
  },
  viewsValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  ownStoryActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ownStoryActionBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  deleteActionBtn: {
    backgroundColor: 'rgba(255,88,122,0.08)',
    borderColor: 'rgba(255,141,159,0.18)',
  },
  reactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 34,
    marginTop: 8,
  },
  suggestionWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reactionBtn: {
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  reactionText: {
    fontSize: 18,
  },
  emojiFx: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: 220,
    padding: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(17,20,42,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  emojiFxText: {
    fontSize: 30,
  },
  emojiInsertFx: {
    position: 'absolute',
    right: 98,
    alignSelf: 'center',
  },
  emojiInsertText: {
    fontSize: 20,
  },
  likeBurst: {
    position: 'absolute',
    top: '46%',
    alignSelf: 'center',
    marginTop: -52,
  },

  storyMenuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(6, 7, 14, 0.25)',
  },
  storyContextMenu: {
    position: 'absolute',
    width: 190,
    borderRadius: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(18, 22, 42, 0.97)',
    shadowColor: '#03050F',
    shadowOpacity: 0.38,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  storyMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 44,
    paddingHorizontal: 14,
  },
  storyMenuLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E4E7FB',
  },
  storyMenuLabelDanger: {
    color: '#FF6C7A',
  },
  storyMenuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(237, 239, 255, 0.16)',
    marginVertical: 6,
    marginHorizontal: 10,
  },
});
