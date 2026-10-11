import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { createCachedVideoSource } from '@/shared/constants/demoMedia';
import { useFeedUiStore } from '@/features/feed/presentation/store/useFeedUiStore';

export type FeedVideoHandle = { togglePlayback: () => void };
type Props = { id: string; uri: string; thumbnail?: string; playing: boolean };

export const FeedVideoMedia = forwardRef<FeedVideoHandle, Props>(function FeedVideoMedia(props, ref) {
  const [attempt, setAttempt] = useState(0);
  return <LoadedFeedVideo key={`${props.id}:${props.uri}:${attempt}`} {...props} ref={ref} onRetry={() => setAttempt((value) => value + 1)} />;
});

const LoadedFeedVideo = forwardRef<FeedVideoHandle, Props & { onRetry: () => void }>(function LoadedFeedVideo({ id, uri, thumbnail, playing, onRetry }, ref) {
  const muted = useFeedUiStore((state) => state.postInteractions[id]?.muted ?? true);
  const paused = useFeedUiStore((state) => state.postInteractions[id]?.paused ?? false);
  const update = useFeedUiStore((state) => state.updatePostInteraction);
  const [ended, setEnded] = useState(false);
  const [firstFrame, setFirstFrame] = useState(false);
  const [failed, setFailed] = useState(false);
  const source = useMemo(() => createCachedVideoSource(uri), [uri]);
  const player = useVideoPlayer(source, (instance) => { instance.loop = false; instance.muted = muted; });

  useEffect(() => {
    setFailed(player.status === 'error');
    const status = player.addListener('statusChange', ({ status: next }) => setFailed(next === 'error'));
    const end = player.addListener('playToEnd', () => setEnded(true));
    return () => { status.remove(); end.remove(); };
  }, [player]);

  useEffect(() => { player.muted = muted; }, [muted, player]);
  useEffect(() => {
    if (playing && !paused && !ended && !failed) player.play();
    else player.pause();
  }, [ended, failed, paused, player, playing]);

  const togglePlayback = useCallback(() => {
    if (failed || !playing) return;
    if (ended) {
      player.currentTime = 0;
      setEnded(false);
      update(id, () => ({ paused: false }));
    } else {
      update(id, (current) => ({ paused: !current.paused }));
    }
  }, [ended, failed, id, player, playing, update]);
  useImperativeHandle(ref, () => ({ togglePlayback }), [togglePlayback]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} surfaceType="textureView" useExoShutter={false} onFirstFrameRender={() => setFirstFrame(true)} />
      {!!thumbnail && (!firstFrame || failed) && <Image source={{ uri: thumbnail }} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" recyclingKey={thumbnail} pointerEvents="none" />}
      {failed ? (
        <View style={styles.error}>
          <Text style={styles.errorText}>Não foi possível carregar o vídeo.</Text>
          <TouchableOpacity onPress={onRetry} accessibilityRole="button" accessibilityLabel="Tentar carregar vídeo novamente"><Text style={styles.retry}>Tentar novamente</Text></TouchableOpacity>
        </View>
      ) : (
        <>
          <TouchableOpacity style={styles.mute} onPress={() => update(id, (current) => ({ muted: !current.muted }))} accessibilityRole="button" accessibilityLabel={muted ? 'Ativar som' : 'Silenciar video'}><Ionicons name={muted ? 'volume-mute' : 'volume-high'} size={18} color="#F8F9FF" /></TouchableOpacity>
          {playing && (paused || ended) && <TouchableOpacity style={styles.center} onPress={togglePlayback} accessibilityRole="button" accessibilityLabel={ended ? 'Reproduzir video novamente' : 'Continuar video'}><Ionicons name={ended ? 'refresh' : 'play'} size={30} color="#F8F9FF" /></TouchableOpacity>}
        </>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  mute: { position: 'absolute', right: 12, bottom: 12, width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(14,14,18,0.55)', justifyContent: 'center', alignItems: 'center' },
  center: { position: 'absolute', left: '50%', top: '50%', marginLeft: -31, marginTop: -31, width: 62, height: 62, borderRadius: 31, backgroundColor: 'rgba(14,14,18,0.55)', alignItems: 'center', justifyContent: 'center' },
  error: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(14,14,18,0.55)', gap: 8 },
  errorText: { color: '#F8F9FF' },
  retry: { color: '#C6C2FF', fontWeight: '700', padding: 12 },
});
