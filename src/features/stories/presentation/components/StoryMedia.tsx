import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { cancelAnimation, Easing, withTiming, type SharedValue } from 'react-native-reanimated';
import type { StoryMediaItem } from '@/features/stories/domain/entities/story';
import { createCachedVideoSource } from '@/shared/constants/demoMedia';
import { createStoryClock } from '@/features/stories/presentation/playback/storyClock';

type Props = {
  story: StoryMediaItem;
  paused: boolean;
  muted: boolean;
  progress: SharedValue<number>;
  onComplete: () => void;
};

export default function StoryMedia(props: Props) {
  const [attempt, setAttempt] = useState(0);
  const retry = () => setAttempt((value) => value + 1);
  return props.story.type === 'image'
    ? <ImageStoryMedia key={attempt} {...props} onRetry={retry} />
    : <VideoStoryMedia key={attempt} {...props} onRetry={retry} />;
}

function MediaError({ onRetry }: { onRetry: () => void }) {
  return <View style={styles.error}>
    <Text style={styles.message}>Não foi possível carregar este story.</Text>
    <TouchableOpacity onPress={onRetry} accessibilityRole="button" accessibilityLabel="Tentar carregar story novamente"><Text style={styles.retry}>Tentar novamente</Text></TouchableOpacity>
  </View>;
}

function ImageStoryMedia({ story, paused, progress, onComplete, onRetry }: Props & { onRetry: () => void }) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const completeRef = useRef(onComplete);
  completeRef.current = onComplete;
  const clockRef = useRef<ReturnType<typeof createStoryClock> | null>(null);

  useEffect(() => {
    progress.value = 0;
    const clock = createStoryClock(story.durationMs, (snapshot) => {
      cancelAnimation(progress);
      progress.value = 1 - snapshot.remainingMs / snapshot.durationMs;
      if (snapshot.running) progress.value = withTiming(1, { duration: snapshot.remainingMs, easing: Easing.linear });
    }, () => completeRef.current());
    clockRef.current = clock;
    return () => { clock.dispose(); clockRef.current = null; cancelAnimation(progress); };
  }, [progress, story.durationMs]);

  useEffect(() => {
    clockRef.current?.setPaused(paused);
    clockRef.current?.setReady(status === 'ready');
  }, [paused, status, story.durationMs]);

  return <>
    <Image source={{ uri: story.uri }} style={styles.media} contentFit="cover" cachePolicy="memory-disk" recyclingKey={story.id + story.uri} onLoad={() => setStatus('ready')} onError={() => setStatus('error')} />
    {status === 'error' && <MediaError onRetry={onRetry} />}
  </>;
}

function VideoStoryMedia({ story, paused, muted, progress, onComplete, onRetry }: Props & { onRetry: () => void }) {
  const source = useMemo(() => createCachedVideoSource(story.uri), [story.uri]);
  const player = useVideoPlayer(source, (instance) => { instance.loop = false; instance.muted = muted; instance.timeUpdateEventInterval = 0.1; });
  const [failed, setFailed] = useState(false);
  const [firstFrame, setFirstFrame] = useState(false);
  const [ended, setEnded] = useState(false);
  const completedRef = useRef(false);
  const completeRef = useRef(onComplete);
  completeRef.current = onComplete;

  useEffect(() => {
    progress.value = 0;
    setFailed(player.status === 'error');
    const status = player.addListener('statusChange', ({ status: next }) => setFailed(next === 'error'));
    const time = player.addListener('timeUpdate', ({ currentTime }) => {
      progress.value = player.duration > 0 ? Math.max(0, Math.min(1, currentTime / player.duration)) : 0;
    });
    const end = player.addListener('playToEnd', () => setEnded(true));
    return () => { status.remove(); time.remove(); end.remove(); };
  }, [player, progress]);
  useEffect(() => { player.muted = muted; }, [muted, player]);
  useEffect(() => {
    if (paused || failed || ended) player.pause();
    else player.play();
  }, [ended, failed, paused, player]);
  useEffect(() => {
    if (ended && !paused && !failed && !completedRef.current) {
      completedRef.current = true;
      completeRef.current();
    }
  }, [ended, failed, paused]);
  return <>
    <VideoView player={player} style={styles.media} contentFit="cover" nativeControls={false} surfaceType="textureView" useExoShutter={false} onFirstFrameRender={() => setFirstFrame(true)} />
    {!!story.thumbnail && (!firstFrame || failed) && <Image source={{ uri: story.thumbnail }} style={styles.media} contentFit="cover" cachePolicy="memory-disk" recyclingKey={story.thumbnail} pointerEvents="none" />}
    {failed && <MediaError onRetry={onRetry} />}
  </>;
}

const styles = StyleSheet.create({
  media: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  error: { position: 'absolute', top: '43%', left: 20, right: 20, zIndex: 20, alignItems: 'center', backgroundColor: 'rgba(7,8,15,0.8)', padding: 16, borderRadius: 12 },
  message: { color: '#F5F6FF', textAlign: 'center' },
  retry: { color: '#C6C2FF', fontWeight: '700', padding: 12 },
});
