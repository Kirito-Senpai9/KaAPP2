import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert, Platform, View, Text, StyleSheet, TouchableOpacity, TextInput, Animated, useWindowDimensions, ScrollView
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { RootStackScreenProps } from '@/app/navigation/types';
import * as ImagePicker from 'expo-image-picker';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useScreenPlaybackActive } from '@/shared/hooks/useScreenPlaybackActive';

const AUDIENCES = [
  { value: 'publico', label: 'Público' },
  { value: 'amigos', label: 'Amigos' },
  { value: 'privado', label: 'Privado' },
] as const;

function StoryVideoPreview({ uri, onError }: { uri: string; onError: (failed: boolean) => void }) {
  const active = useScreenPlaybackActive();
  const [failed, setFailed] = useState(false);
  const source = useMemo(() => ({ uri, useCaching: /^https?:\/\//i.test(uri) }), [uri]);
  const player = useVideoPlayer(source, (instance) => {
    instance.loop = true;
    instance.muted = true;
    instance.staysActiveInBackground = false;
  });

  useEffect(() => {
    const updateError = (isError: boolean) => {
      setFailed(isError);
      onError(isError);
    };
    updateError(player.status === 'error');
    const subscription = player.addListener('statusChange', ({ status }) => {
      if (status === 'error') updateError(true);
      else if (status === 'readyToPlay') updateError(false);
    });
    return () => subscription.remove();
  }, [onError, player]);

  useEffect(() => {
    if (active && !failed) player.play();
    else player.pause();
  }, [active, failed, player]);

  if (failed) return (
    <View style={styles.videoFallback}>
      <Ionicons name="alert-circle-outline" size={22} color="#cfd3ff" />
      <Text style={styles.phTxt}>Não foi possível abrir o vídeo</Text>
    </View>
  );
  return <VideoView player={player} style={styles.previewImg} contentFit="cover" nativeControls={false} surfaceType="textureView" useExoShutter={false} />;
}

export default function CriarStories({
  navigation,
  route,
}: RootStackScreenProps<'CriarStories'>) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const previewSize = { height: Math.max(1, width - insets.left - insets.right) * 0.56 };
  const pickerBusy = useRef(false);
  const mounted = useRef(true);
  const [isPicking, setIsPicking] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  const [media, setMedia] = useState<{ uri: string; type: 'image'|'video' } | null>(() => {
    if (!route.params?.uri || !route.params.type) {
      return null;
    }

    return {
      uri: route.params.uri,
      type: route.params.type,
    };
  });
  const [caption, setCaption] = useState(route.params?.caption ?? '');
  const [audience, setAudience] = useState<'publico'|'amigos'|'privado'>('publico');

  const canPublish = !!media && !isPicking && !previewError;
  const publishScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    setPreviewError(false);
    if (route.params?.uri && route.params.type) {
      setMedia({
        uri: route.params.uri,
        type: route.params.type,
      });
    } else {
      setMedia(null);
    }

    setCaption(route.params?.caption ?? '');
  }, [route.params?.caption, route.params?.type, route.params?.uri]);

  const pickMedia = async () => {
    if (pickerBusy.current) return;
    pickerBusy.current = true;
    setIsPicking(true);
    try {
      if (Platform.OS === 'ios') {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) throw new Error('Permita acesso à galeria para selecionar vídeos.');
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'], quality: 0.9, allowsMultipleSelection: false,
      });
      if (mounted.current && !res.canceled && res.assets?.[0]?.uri) {
        const asset = res.assets[0];
        setPreviewError(false);
        setMedia({ uri: asset.uri, type: asset.type === 'video' ? 'video' : 'image' });
      }
    } catch (error) {
      if (mounted.current) Alert.alert('Mídia indisponível', error instanceof Error ? error.message : 'Tente selecionar outro arquivo.');
    } finally {
      pickerBusy.current = false;
      if (mounted.current) setIsPicking(false);
    }
  };

  const onPublish = () => {
    if (!canPublish) return;
    Animated.sequence([
      Animated.spring(publishScale, { toValue: 0.96, useNativeDriver: true }),
      Animated.spring(publishScale, { toValue: 1, friction: 3, useNativeDriver: true }),
    ]).start();
    // TODO: integrar com backend
    // payload: { type:'story', media, caption, audience }
  };

  const preview = !media ? (
      <TouchableOpacity style={[styles.mediaPlaceholder, previewSize]} onPress={pickMedia} disabled={isPicking} activeOpacity={0.9}>
        <Ionicons name="image-outline" size={28} color="#cfd3ff" />
        <Text style={styles.phTxt}>Selecionar imagem ou vídeo</Text>
      </TouchableOpacity>
    ) : (
      <TouchableOpacity style={[styles.mediaPreview, previewSize]} onPress={pickMedia} disabled={isPicking} activeOpacity={0.9}>
        {media.type === 'video' ? <StoryVideoPreview key={media.uri} uri={media.uri} onError={setPreviewError} /> : <Image
          source={{ uri: media.uri }}
          style={styles.previewImg}
          contentFit="cover"
          cachePolicy="memory-disk"
          recyclingKey={media.uri}
          onError={() => setPreviewError(true)}
          onLoad={() => setPreviewError(false)}
        />}
        <View style={styles.badge}>
          <Ionicons name={media.type === 'video' ? 'videocam' : 'image'} size={14} color="#0E0E12" />
        </View>
      </TouchableOpacity>
    );

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <LinearGradient colors={['#0E0E12','#11142a','#0E0E12']} style={StyleSheet.absoluteFill} />

      {/* header simples */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.hBtn}>
          <Ionicons name="chevron-back" size={22} color="#EDEFFF" />
        </TouchableOpacity>
        <Text style={styles.hTitle}>Criar Stories</Text>
        <View style={styles.hBtn} />
      </View>

      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 + insets.bottom }}>
        {/* card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Mídia</Text>
          {preview}

          <Text style={[styles.cardTitle, { marginTop: 18 }]}>Legenda (opcional)</Text>
          <TextInput
            value={caption}
            onChangeText={setCaption}
            style={styles.input}
            placeholder="Escreva algo..."
            placeholderTextColor="#9aa0c6"
            multiline
            maxLength={140}
          />

          <Text style={[styles.cardTitle, { marginTop: 18 }]}>Audiência</Text>
          <View style={styles.row}>
            {AUDIENCES.map(({ value, label }) => (
              <TouchableOpacity key={value} onPress={() => setAudience(value)} style={[styles.chip, audience === value && styles.chipActive]} activeOpacity={0.85}>
                <Text style={[styles.chipTxt, audience === value && styles.chipTxtActive]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* publicar */}
        <Animated.View style={{ transform: [{ scale: publishScale }] }}>
          <TouchableOpacity
            onPress={onPublish}
            disabled={!canPublish}
            style={[styles.primary, !canPublish && { opacity: 0.5 }]}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#6C63FF', '#2230C3']}
              style={styles.primaryBg}
              start={[0,0]} end={[1,1]}
            >
              <Ionicons name="send" size={18} color="#fff" />
              <Text style={styles.primaryTxt}>Publicar Story</Text>
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
  videoFallback: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#12162B', gap: 8 },
  previewImg: { width: '100%', height: '100%' },
  badge: { position: 'absolute', right: 8, top: 8, backgroundColor: '#DDE1FF', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 10 },
  phTxt: { color: '#cfd3ff' },
  input: { minHeight: 64, borderRadius: 12, padding: 12, backgroundColor: 'rgba(0,0,0,0.25)', color: '#fff' },
  row: { flexDirection: 'row', gap: 10 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.06)' },
  chipActive: { backgroundColor: 'rgba(108,99,255,0.28)' },
  chipTxt: { color: '#b9c1ff', fontWeight: '700' },
  chipTxtActive: { color: '#fff' },
  primary: { marginTop: 18, borderRadius: 14, overflow: 'hidden' },
  primaryBg: { height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 },
  primaryTxt: { color: '#fff', fontWeight: '800' },
});
