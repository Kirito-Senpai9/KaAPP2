import React, { useEffect, useRef, useState } from 'react';
import { Alert, View, Text, StyleSheet, TouchableOpacity, TextInput, Animated, useWindowDimensions, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { RootStackScreenProps } from '@/app/navigation/types';
import * as ImagePicker from 'expo-image-picker';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useScreenPlaybackActive } from '@/shared/hooks/useScreenPlaybackActive';
import { classifyShortDuration, loadShortVideo } from '@/features/shorts/presentation/utils/videoSelection';

export default function CriarShorts({ navigation }: RootStackScreenProps<'CriarShorts'>) {
  const [selection, setSelection] = useState<{ uri: string; durationMs: number } | null>(null);
  const video = selection?.uri ?? null;
  const [pendingVideo, setPendingVideo] = useState<string | null>(null);
  const [isPicking, setIsPicking] = useState(false);
  const pickerBusy = useRef(false);
  const mounted = useRef(true);
  const validation = useRef<AbortController | null>(null);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const previewSize = { height: Math.max(1, width - insets.left - insets.right) * 0.56 };
  const playbackActive = useScreenPlaybackActive();
  const [videoPreviewError, setVideoPreviewError] = useState(false);
  const [caption, setCaption] = useState('');
  const anim = useRef(new Animated.Value(1)).current;
  const previewPlayer = useVideoPlayer(null, (player) => {
    player.loop = false;
    player.muted = true;
  });

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      validation.current?.abort();
    };
  }, []);

  useEffect(() => {
    // The preview is a silent first frame, including after focus/AppState changes.
    previewPlayer.pause();
  }, [playbackActive, previewPlayer]);

  useEffect(() => {
    const subscription = previewPlayer.addListener('statusChange', ({ status }) => {
      if (status === 'error') {
        setVideoPreviewError(true);
      } else if (status === 'readyToPlay') {
        setVideoPreviewError(false);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [previewPlayer]);

  const pickVideo = async () => {
    if (pickerBusy.current) return;
    pickerBusy.current = true;
    setIsPicking(true);
    let replacedSource = false;
    const controller = new AbortController();
    validation.current = controller;
    try {
      if (Platform.OS === 'ios') {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) throw new Error('Permita acesso à galeria para escolher um vídeo.');
      }
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['videos'], quality: 1 });
      if (!mounted.current || res.canceled || !res.assets?.[0]?.uri) return;
      const asset = res.assets[0];
      if (classifyShortDuration(asset.duration) === 'too-long') throw new Error('Escolha um vídeo com até 60 segundos.');
      setPendingVideo(asset.uri);
      setVideoPreviewError(false);
      previewPlayer.pause();
      replacedSource = true;
      const durationMs = await loadShortVideo(previewPlayer, asset.uri, controller.signal);
      if (mounted.current && !controller.signal.aborted) {
        setSelection({ uri: asset.uri, durationMs });
        previewPlayer.currentTime = 0;
      }
    } catch (error) {
      if (!mounted.current || controller.signal.aborted) return;
      if (replacedSource) {
        try {
          if (selection) await loadShortVideo(previewPlayer, selection.uri, controller.signal);
          else await previewPlayer.replaceAsync(null);
        } catch {
          if (mounted.current) setVideoPreviewError(true);
        }
      }
      if (mounted.current && !controller.signal.aborted) Alert.alert('Vídeo indisponível', error instanceof Error ? error.message : 'Tente selecionar outro vídeo.');
    } finally {
      if (validation.current === controller) validation.current = null;
      pickerBusy.current = false;
      if (mounted.current) {
        setPendingVideo(null);
        setIsPicking(false);
      }
    }
  };

  const canPublish = !!selection && !isPicking && !videoPreviewError;

  const onPublish = () => {
    if (!canPublish) return;
    Animated.sequence([
      Animated.spring(anim, { toValue: 0.96, useNativeDriver: true }),
      Animated.spring(anim, { toValue: 1, friction: 3, useNativeDriver: true }),
    ]).start();
    // TODO: enviar para backend
    // payload: { type:'short', video, caption }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <LinearGradient colors={['#0E0E12','#11142a','#0E0E12']} style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.hBtn}>
          <Ionicons name="chevron-back" size={22} color="#EDEFFF" />
        </TouchableOpacity>
        <Text style={styles.hTitle}>Criar Shorts</Text>
        <View style={styles.hBtn} />
      </View>

      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 + insets.bottom }}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Vídeo</Text>
          {video || pendingVideo ? (
            <TouchableOpacity onPress={pickVideo} disabled={isPicking} activeOpacity={0.9} style={[styles.mediaPreview, previewSize]}>
              {!videoPreviewError ? (
                <VideoView
                  player={previewPlayer}
                  style={styles.previewVideo}
                  contentFit="cover"
                  nativeControls={false}
                  surfaceType="textureView"
                  useExoShutter={false}
                />
              ) : (
                <View style={styles.videoFallback}>
                  <Ionicons name="alert-circle-outline" size={22} color="#cfd3ff" />
                  <Text style={styles.fallbackTxt}>Não foi possível gerar preview</Text>
                </View>
              )}
              {pendingVideo && <View style={[StyleSheet.absoluteFill, styles.videoFallback]}><ActivityIndicator color="#cfd3ff" accessibilityLabel="Verificando vídeo" /></View>}

              <View style={styles.badge}>
                <Ionicons name="play" size={12} color="#0E0E12" />
                <Text style={styles.badgeTxt}>VÍDEO</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={pickVideo} disabled={isPicking} activeOpacity={0.9} style={[styles.mediaPlaceholder, previewSize]}>
              <Ionicons name="videocam-outline" size={26} color="#cfd3ff" />
              <Text style={styles.phTxt}>Selecionar vídeo vertical</Text>
            </TouchableOpacity>
          )}

          <Text style={[styles.cardTitle, { marginTop: 18 }]}>Legenda (opcional)</Text>
          <TextInput
            value={caption}
            onChangeText={setCaption}
            style={styles.input}
            placeholder="Legenda curta…"
            placeholderTextColor="#9aa0c6"
            maxLength={120}
          />
        </View>

        <Animated.View style={{ transform: [{ scale: anim }] }}>
          <TouchableOpacity onPress={onPublish} disabled={!canPublish} style={[styles.primary, !canPublish && { opacity: 0.5 }]} activeOpacity={0.9}>
            <LinearGradient colors={['#6C63FF', '#2230C3']} style={styles.primaryBg} start={[0,0]} end={[1,1]}>
              <Ionicons name="send" size={18} color="#fff" />
              <Text style={styles.primaryTxt}>Publicar Shorts</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0E0E12' },
  header: { height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10 },
  hBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  hTitle: { color: '#fff', fontWeight: '800', fontSize: 16 },
  card: { backgroundColor: 'rgba(21,24,47,0.65)', borderRadius: 18, padding: 14, marginTop: 12 },
  cardTitle: { color: '#cfd3ff', fontWeight: '700', marginBottom: 8 },
  mediaPlaceholder: { borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 8 },
  mediaPreview: { borderRadius: 14, overflow: 'hidden' },
  previewVideo: { width: '100%', height: '100%' },
  videoFallback: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.25)', gap: 8 },
  fallbackTxt: { color: '#cfd3ff', fontWeight: '600' },
  phTxt: { color: '#cfd3ff' },
  badge: { position: 'absolute', right: 8, top: 8, backgroundColor: '#DDE1FF', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 11, flexDirection: 'row', alignItems: 'center', gap: 4 },
  badgeTxt: { color: '#0E0E12', fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },
  input: { minHeight: 48, borderRadius: 12, padding: 12, backgroundColor: 'rgba(0,0,0,0.25)', color: '#fff' },
  primary: { marginTop: 18, borderRadius: 14, overflow: 'hidden' },
  primaryBg: { height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 },
  primaryTxt: { color: '#fff', fontWeight: '800' },
});
