import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Keyboard,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { AVPlaybackStatus, ResizeMode, Video } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackScreenProps } from '@/navigation/types';

type Props = RootStackScreenProps<'StoryViewer'>;

const IMAGE_DURATION_MS = 5000;
const REACTIONS = ['❤️', '😂', '🔥', '😮', '👏'];

export default function StoryViewer({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { users, initialStoryIndex, initialUserIndex } = route.params;

  const [currentUserIndex, setCurrentUserIndex] = useState(initialUserIndex);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(initialStoryIndex);
  const [isPaused, setIsPaused] = useState(false);
  const [input, setInput] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [videoDurationMs, setVideoDurationMs] = useState(0);
  const [videoPositionMs, setVideoPositionMs] = useState(0);
  const [emojiFx, setEmojiFx] = useState<string | null>(null);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  const progress = useRef(new Animated.Value(0)).current;
  const contentFade = useRef(new Animated.Value(0)).current;
  const storyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const storyStartAtRef = useRef<number>(0);
  const storyRemainingRef = useRef<number>(IMAGE_DURATION_MS);

  const currentUser = users[currentUserIndex];
  const currentStories = currentUser?.stories ?? [];
  const currentStory = currentStories[currentStoryIndex];

  const clearStoryTimer = useCallback(() => {
    if (storyTimerRef.current) {
      clearTimeout(storyTimerRef.current);
      storyTimerRef.current = null;
    }
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
  }, [currentStories.length, currentStoryIndex, currentUserIndex, navigation, users.length]);

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

  const startImageProgress = useCallback((durationMs: number) => {
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
  }, [clearStoryTimer, goNext, progress]);

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
  }, [goNext, progress]);

  useEffect(() => {
    if (!currentStory) {
      navigation.goBack();
      return;
    }

    setVideoDurationMs(0);
    setVideoPositionMs(0);
    progress.stopAnimation();
    progress.setValue(0);

    Animated.sequence([
      Animated.timing(contentFade, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(contentFade, { toValue: 1, duration: 280, useNativeDriver: true }),
    ]).start();

    if (currentStory.type === 'image' && !isPaused) {
      startImageProgress(currentStory.durationMs ?? IMAGE_DURATION_MS);
    }

    return () => {
      clearStoryTimer();
      progress.stopAnimation();
    };
  }, [clearStoryTimer, contentFade, currentStory, isPaused, navigation, progress, startImageProgress]);

  useEffect(() => {
    if (!currentStory) return;

    const nextStory = currentStories[currentStoryIndex + 1];
    if (nextStory?.type === 'image') {
      Image.prefetch(nextStory.uri);
    }
  }, [currentStories, currentStory, currentStoryIndex]);

  useEffect(() => () => clearStoryTimer(), [clearStoryTimer]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = Keyboard.addListener(showEvent, (event) => {
      const offset = Math.max(event.endCoordinates.height - insets.bottom + 10, 0);
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

  const onVideoStatus = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;

    setVideoDurationMs(status.durationMillis ?? 0);
    setVideoPositionMs(status.positionMillis ?? 0);

    const normalizedProgress =
      status.durationMillis && status.durationMillis > 0
        ? status.positionMillis / status.durationMillis
        : 0;

    progress.setValue(normalizedProgress);

    if (status.didJustFinish) {
      goNext();
    }
  }, [goNext, progress]);

  const panResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 25,
    onPanResponderRelease: (_, gesture) => {
      if (gesture.dx < -70) {
        goNextUser();
      } else if (gesture.dx > 70) {
        goPreviousUser();
      }
    },
  }), [goNextUser, goPreviousUser]);

  const showReactionFx = useCallback((emoji: string) => {
    setEmojiFx(emoji);
    setTimeout(() => setEmojiFx(null), 700);
  }, []);

  const handleHoldStart = () => {
    setIsPaused(true);
    if (currentStory?.type === 'image') pauseImageProgress();
  };

  const handleHoldEnd = () => {
    setIsPaused(false);
    if (currentStory?.type === 'image') resumeImageProgress();
  };

  if (!currentStory || !currentUser) {
    return null;
  }

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom', 'left', 'right']}>
      <LinearGradient colors={['#07080f', '#11142a', '#07080f']} style={StyleSheet.absoluteFill} />

      <Animated.View style={[styles.contentLayer, { opacity: contentFade }]} {...panResponder.panHandlers}>
        {currentStory.type === 'video' ? (
          <Video
            source={{ uri: currentStory.uri }}
            style={styles.media}
            resizeMode={ResizeMode.COVER}
            shouldPlay={!isPaused}
            isLooping={false}
            isMuted={isMuted}
            onPlaybackStatusUpdate={onVideoStatus}
            usePoster
            posterSource={currentStory.thumbnail ? { uri: currentStory.thumbnail } : undefined}
          />
        ) : (
          <Image source={{ uri: currentStory.uri }} style={styles.media} resizeMode="cover" />
        )}

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
                  {filled && <View style={[styles.segmentFill, { width: '100%' }]} />}
                  {active && <Animated.View style={[styles.segmentFill, { width: widthInterpolate }]} />}
                </View>
              );
            })}
          </View>

          <View style={[styles.header, { marginTop: insets.top + 4 }]}>
            <View style={styles.userInfo}>
              <Image source={{ uri: currentUser.avatar }} style={styles.avatar} />
              <Text style={styles.userText}>{currentUser.name} • {currentStory.postedAt}</Text>
            </View>

            <View style={styles.headerActions}>
              {currentStory.type === 'video' && (
                <TouchableOpacity onPress={() => setIsMuted((value) => !value)} style={styles.iconBtn}>
                  <Ionicons name={isMuted ? 'volume-mute' : 'volume-high'} color="#fff" size={18} />
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.iconBtn}>
                <Ionicons name="ellipsis-horizontal" size={18} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                <Ionicons name="close" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View pointerEvents="box-none" style={styles.tapZones}>
          <Pressable style={styles.tapSide} onPress={goPrevious} onPressIn={handleHoldStart} onPressOut={handleHoldEnd} />
          <Pressable style={styles.tapSide} onPress={goNext} onPressIn={handleHoldStart} onPressOut={handleHoldEnd} />
        </View>

        <View style={[styles.bottomArea, { bottom: 12 + keyboardOffset }]}>
          {!!currentStory.overlays?.length && (
            <View style={styles.overlayBadgeWrap}>
              {currentStory.overlays.map((overlay) => (
                <View key={overlay.id} style={styles.overlayBadge}>
                  <Text style={styles.overlayBadgeText}>{overlay.content}</Text>
                </View>
              ))}
            </View>
          )}

          <BlurView intensity={45} tint="dark" style={styles.interactionBar}>
            <TextInput
              value={input}
              onChangeText={setInput}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              placeholder="Enviar mensagem..."
              placeholderTextColor="#AEB2C8"
              style={styles.input}
            />
            <View style={styles.reactionRow}>
              {isInputFocused && (
                <View style={styles.suggestionWrap}>
                  {REACTIONS.map((emoji) => (
                    <TouchableOpacity key={emoji} onPress={() => showReactionFx(emoji)} style={styles.reactionBtn}>
                      <Text style={styles.reactionText}>{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              <TouchableOpacity style={styles.shareBtn}>
                <Ionicons name="paper-plane-outline" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>

        {emojiFx && (
          <Animated.View style={styles.emojiFx}>
            <Text style={styles.emojiFxText}>{emojiFx}</Text>
          </Animated.View>
        )}

        {currentStory.type === 'video' && (
          <View style={styles.videoMeta}>
            <Text style={styles.videoMetaText}>
              {Math.floor(videoPositionMs / 1000)}s / {Math.max(1, Math.floor(videoDurationMs / 1000))}s
            </Text>
          </View>
        )}
      </Animated.View>
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
  overlayTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingTop: 10,
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
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  userText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
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
  tapZones: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    top: 110,
    bottom: 160,
  },
  tapSide: { flex: 1 },
  bottomArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 12,
    paddingHorizontal: 12,
  },
  overlayBadgeWrap: {
    marginBottom: 10,
    gap: 8,
  },
  overlayBadge: {
    alignSelf: 'flex-start',
    borderRadius: 14,
    backgroundColor: 'rgba(17,20,42,0.58)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  overlayBadgeText: {
    color: '#fff',
    fontWeight: '600',
  },
  interactionBar: {
    borderRadius: 22,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    backgroundColor: 'rgba(14,16,33,0.52)',
    overflow: 'hidden',
  },
  input: {
    color: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    backgroundColor: 'rgba(255,255,255,0.14)',
    minHeight: 44,
    paddingHorizontal: 14,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 10,
  },
  reactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 36,
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
  shareBtn: {
    marginLeft: 'auto',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(108,99,255,0.38)',
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
  videoMeta: {
    position: 'absolute',
    right: 14,
    bottom: 120,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  videoMetaText: {
    color: '#E6E8F5',
    fontSize: 12,
    fontWeight: '600',
  },
});
