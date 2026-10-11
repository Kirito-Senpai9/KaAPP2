import React, {
  forwardRef, memo, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState,
} from 'react';
import {
  View, Text, StyleSheet, useWindowDimensions, Pressable,
  TouchableOpacity, Animated, Easing, Platform,
  type GestureResponderEvent, type LayoutChangeEvent,
} from 'react-native';
import { FlashList, type FlashListProps, type FlashListRef, type ViewToken } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { VideoView, useVideoPlayer } from 'expo-video';
import Ionicons from '@expo/vector-icons/Ionicons';
import Reanimated, { useAnimatedStyle, useSharedValue, type SharedValue } from 'react-native-reanimated';
import { useShortsUiStore } from '@/features/shorts/presentation/store/useShortsUiStore';
import { getTabBarOccupiedHeight } from '@/shared/utils/tabBarLayout';
import { useScreenPlaybackActive } from '@/shared/hooks/useScreenPlaybackActive';
import { createCachedVideoSource } from '@/shared/constants/demoMedia';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackParamList } from '@/app/navigation/types';
import type { Short } from '@/features/shorts/domain/entities/short';
import { useShorts } from '@/features/shorts/presentation/hooks/useShorts';
import { formatCount } from '@/shared/utils/formatCount';


const DOUBLE_TAP_DELAY_MS = 280;

type FloatingHeart = {
  id: number;
  anim: Animated.Value;
  x: number;
  y: number;
  rotate: number;
  size: number;
};

type FloatingHeartsHandle = { spawn: (x: number, y: number) => void };

const FloatingHearts = memo(
  forwardRef<FloatingHeartsHandle>(function FloatingHearts(_props, ref) {
    const [hearts, setHearts] = useState<FloatingHeart[]>([]);
    const idRef = useRef(0);
    const heartAnimations = useRef(new Set<Animated.Value>());
    useEffect(() => () => {
      heartAnimations.current.forEach((animation) => animation.stopAnimation());
      heartAnimations.current.clear();
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        spawn(x: number, y: number) {
          const id = idRef.current++;
          const anim = new Animated.Value(0);
          heartAnimations.current.add(anim);
          const rotate = Math.random() * 28 - 14;
          const size = 88 + Math.round(Math.random() * 14);
          setHearts((prev) => {
            const next = [...prev, { id, anim, x, y, rotate, size }];
            return next.length > 12 ? next.slice(next.length - 12) : next;
          });
          Animated.timing(anim, {
            toValue: 1,
            duration: 720,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }).start(({ finished }) => {
            heartAnimations.current.delete(anim);
            if (!finished) return;
            setHearts((prev) => prev.filter((h) => h.id !== id));
          });
        },
      }),
      []
    );

    return (
      <View pointerEvents="none" style={styles.heartsOverlay}>
        {hearts.map((heart) => (
          <Animated.View
            key={heart.id}
            style={{
              position: 'absolute',
              left: heart.x - heart.size / 2,
              top: heart.y - heart.size / 2,
              opacity: heart.anim.interpolate({ inputRange: [0, 0.12, 0.8, 1], outputRange: [0, 1, 1, 0] }),
              transform: [
                { translateY: heart.anim.interpolate({ inputRange: [0, 1], outputRange: [12, -34] }) },
                { scale: heart.anim.interpolate({ inputRange: [0, 0.16, 0.38, 1], outputRange: [0.2, 1.24, 0.96, 1.04] }) },
                { rotate: `${heart.rotate}deg` },
              ],
            }}
          >
            <Ionicons name="heart" size={heart.size} color="#FF5A8F" />
          </Animated.View>
        ))}
      </View>
    );
  })
);

/* =========================================
   Abas topo (Para você / Seguindo) — só texto
========================================= */
function Tabs({
  mode, onChange, topOffset, onOpenLive,
}: {
  mode: 'forYou' | 'following';
  onChange: (m: 'forYou' | 'following') => void;
  topOffset: number;
  onOpenLive: () => void;
}) {
  return (
    <View style={[styles.tabsWrap, { top: topOffset }]}>
      <TouchableOpacity
        onPress={onOpenLive}
        activeOpacity={0.85}
        style={styles.liveEntryBtn}
        accessibilityRole="button"
        accessibilityLabel="Abrir lives"
      >
        <View style={styles.liveEntryIcon}>
          <Ionicons name="radio-outline" size={20} color="#FFFFFF" />
          <View style={styles.liveEntryDot} />
        </View>
      </TouchableOpacity>
      <View style={styles.tabsOnlyText}>
        <TouchableOpacity onPress={() => onChange('forYou')} activeOpacity={0.9} style={styles.tabTextBtn}>
          <Text style={[styles.tabText, mode === 'forYou' && styles.tabTextActive]}>Para você</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onChange('following')} activeOpacity={0.9} style={styles.tabTextBtn}>
          <Text style={[styles.tabText, mode === 'following' && styles.tabTextActive]}>Seguindo</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* =========================================
   Cartão do Short (cada página)
========================================= */
type ShortVideoProps = { uri: string; playing: boolean; progress: SharedValue<number> };
function ShortVideo(props: ShortVideoProps) {
  const [attempt, setAttempt] = useState(0);
  return <LoadedShortVideo key={props.uri + ':' + attempt} {...props} onRetry={() => setAttempt((value) => value + 1)} />;
}
function LoadedShortVideo({ uri, playing, progress, onRetry }: ShortVideoProps & { onRetry: () => void }) {
  const source = useMemo(() => createCachedVideoSource(uri), [uri]);
  const player = useVideoPlayer(source, (instance) => { instance.loop = true; instance.timeUpdateEventInterval = 0.1; });
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    progress.value = 0;
    setFailed(player.status === 'error');
    const status = player.addListener('statusChange', ({ status: next }) => setFailed(next === 'error'));
    const time = player.addListener('timeUpdate', ({ currentTime }) => {
      progress.value = player.duration > 0 ? Math.min(1, Math.max(0, currentTime / player.duration)) : 0;
    });
    return () => { status.remove(); time.remove(); };
  }, [player, progress]);
  useEffect(() => {
    if (playing && !failed) player.play(); else player.pause();
  }, [failed, player, playing]);
  return <>
    <VideoView player={player} style={styles.video} contentFit="cover" nativeControls={false} surfaceType="textureView" useExoShutter={false} />
    {failed && <View style={styles.mediaError}><Text style={styles.errorText}>Não foi possível carregar o vídeo.</Text><TouchableOpacity onPress={onRetry} accessibilityRole="button" accessibilityLabel="Tentar carregar vídeo novamente"><Text style={styles.retryText}>Tentar novamente</Text></TouchableOpacity></View>}
  </>;
}

const ShortCard = memo(function ShortCard({ item, playing, shouldLoad, width, height, bottomOffset }: {
  item: Short; playing: boolean; shouldLoad: boolean; width: number; height: number; bottomOffset: number;
}) {
  const liked = useShortsUiStore((state) => state.interactions[item.id]?.liked ?? false);
  const userPaused = useShortsUiStore((state) => state.interactions[item.id]?.paused ?? false);
  const follow = useShortsUiStore((state) => state.followingByAuthor[item.user.id] ?? !!item.user.following);
  const update = useShortsUiStore((state) => state.updateInteraction);
  const toggleFollowing = useShortsUiStore((state) => state.toggleFollowing);
  const progress = useSharedValue(0);
  const progressStyle = useAnimatedStyle(() => ({ width: Math.max(0, Math.min(1, progress.value)) * width }));
  const cardRef = useRef<View>(null);
  const likeScale = useRef(new Animated.Value(1)).current;
  const commentScale = useRef(new Animated.Value(1)).current;
  const shareX = useRef(new Animated.Value(0)).current;
  const likeColor = liked ? '#FF5A8F' : '#EDEFFF';

  const heartsRef = useRef<FloatingHeartsHandle>(null);
  const singleTapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // marquee do áudio
  const marquee = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    likeScale.stopAnimation();
    commentScale.stopAnimation();
    shareX.stopAnimation();
    marquee.stopAnimation();
    likeScale.setValue(1);
    commentScale.setValue(1);
    shareX.setValue(0);
    marquee.setValue(0);
    progress.value = 0;
  }, [item.id, likeScale, commentScale, shareX, marquee, progress]);
  useEffect(() => { if (!shouldLoad) progress.value = 0; }, [progress, shouldLoad]);
  useEffect(() => {
    marquee.setValue(0);
    if (!playing || userPaused) return;
    const loop = Animated.loop(
      Animated.timing(marquee, { toValue: 1, duration: 6000, easing: Easing.linear, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [item.id, marquee, playing, userPaused]);

  // helper: anima o coração (ícone)
  const animateHeart = () => {
    Animated.sequence([
      Animated.spring(likeScale, { toValue: 1.25, useNativeDriver: true }),
      Animated.spring(likeScale, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
  };

  const onConfirmedSingleTap = useCallback(() => {
    update(item.id, (current) => ({ paused: !current.paused }));
  }, [item.id, update]);

  const spawnLikeHearts = useCallback((x: number, y: number) => {
    heartsRef.current?.spawn(x, y);
  }, []);

  const onConfirmedDoubleTap = useCallback((x: number, y: number) => {
    update(item.id, () => ({ liked: true }));
    animateHeart();
    spawnLikeHearts(x, y);
  }, [item.id, update, spawnLikeHearts]);

  const handleSingleOrDoubleTap = useCallback((event: GestureResponderEvent) => {
    const { locationX, locationY } = event.nativeEvent;
    if (singleTapTimeoutRef.current) {
      clearTimeout(singleTapTimeoutRef.current);
      singleTapTimeoutRef.current = null;
      onConfirmedDoubleTap(locationX, locationY);
      return;
    }

    singleTapTimeoutRef.current = setTimeout(() => {
      singleTapTimeoutRef.current = null;
      onConfirmedSingleTap();
    }, DOUBLE_TAP_DELAY_MS);
  }, [onConfirmedDoubleTap, onConfirmedSingleTap]);

  useEffect(() => (
    () => {
      if (singleTapTimeoutRef.current) {
        clearTimeout(singleTapTimeoutRef.current);
        singleTapTimeoutRef.current = null;
      }
    }
  ), [item.id]);

  // clicar no coração (ícone) — animação + toggle
  const onHeartPress = (event: GestureResponderEvent) => {
    const { pageX, pageY } = event.nativeEvent;
    const wasLiked = useShortsUiStore.getState().interactions[item.id]?.liked ?? false;
    update(item.id, (current) => ({ liked: !current.liked }));
    if (!wasLiked) cardRef.current?.measureInWindow((x, y) => spawnLikeHearts(pageX - x, pageY - y));
    animateHeart(); // anima SOMENTE o ícone
  };

  const onComment = () => {
    Animated.sequence([
      Animated.spring(commentScale, { toValue: 1.2, useNativeDriver: true }),
      Animated.spring(commentScale, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
    // abrir bottom-sheet futuramente
  };

  const onShare = () => {
    Animated.sequence([
      Animated.timing(shareX, { toValue: 1, duration: 180, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(shareX, { toValue: 0, duration: 180, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
    ]).start();
    // compartilhar futuramente
  };

  const marqueeTx = marquee.interpolate({ inputRange: [0, 1], outputRange: [0, -width * 0.6] });

  // formatar contadores para ocupar menos largura
  const fmt = (n: number) => formatCount(n, 'lower');

  return (
    <View ref={cardRef} style={[styles.page, { width, height }]}>
      {/* vídeo (tap pausa/retoma, duplo toque curte) */}
      <Pressable style={styles.videoTouch} onPress={handleSingleOrDoubleTap}>
        {shouldLoad && <ShortVideo key={item.id} uri={item.videoUrl} playing={playing && !userPaused} progress={progress} />}
      </Pressable>

      {/* gradiente sutil para leitura */}
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(0,0,0,0.0)', 'rgba(0,0,0,0.35)', 'rgba(0,0,0,0.6)']}
        style={StyleSheet.absoluteFill}
      />

      {/* barra de progresso discreta */}
      <View style={[styles.progressTrack, { bottom: bottomOffset + 6 }]}>
        <Reanimated.View style={[styles.progressFill, progressStyle]} />
      </View>

      {/* coluna de ações à direita — acima da bottom bar */}
      <View style={[styles.rightRail, { bottom: bottomOffset + 28 }]}>
        {/* Perfil + seguir */}
        <View style={styles.profileBlock}>
          <Image
            source={{ uri: item.user.avatar }}
            style={styles.avatar}
            contentFit="cover"
            cachePolicy="memory-disk"
            recyclingKey={item.user.avatar}
          />
          <TouchableOpacity
            style={[styles.followBtn, follow && styles.following]}
            onPress={() => toggleFollowing(item.user.id, !!item.user.following)}
            activeOpacity={0.9}
          >
            <Ionicons name={follow ? 'checkmark' : 'add'} size={18} color={follow ? '#DDE1FF' : '#0E0E12'} />
          </TouchableOpacity>
        </View>

        {/* Curtir — Animated apenas no ÍCONE (contador fora) */}
        <View style={{ alignItems: 'center' }}>
          <Animated.View style={{ transform: [{ scale: likeScale }] }}>
            <TouchableOpacity style={styles.iconBtn} onPress={onHeartPress} activeOpacity={0.85}>
              <Ionicons name={liked ? 'heart' : 'heart-outline'} size={28} color={likeColor} />
            </TouchableOpacity>
          </Animated.View>
          <Text style={styles.count}>{fmt(item.likes + (liked ? 1 : 0))}</Text>
        </View>

        {/* Comentar — Animated apenas no ÍCONE */}
        <View style={{ alignItems: 'center' }}>
          <Animated.View style={{ transform: [{ scale: commentScale }] }}>
            <TouchableOpacity style={styles.iconBtn} onPress={onComment} activeOpacity={0.85}>
              <Ionicons name="chatbubble-ellipses-outline" size={26} color="#EDEFFF" />
            </TouchableOpacity>
          </Animated.View>
          <Text style={styles.count}>{fmt(item.comments)}</Text>
        </View>

        {/* Compartilhar — Animated apenas no ÍCONE */}
        <View style={{ alignItems: 'center' }}>
          <Animated.View style={{ transform: [{ translateX: shareX.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }) }] }}>
            <TouchableOpacity style={styles.iconBtn} onPress={onShare} activeOpacity={0.85}>
              <Ionicons name="share-social-outline" size={26} color="#EDEFFF" />
            </TouchableOpacity>
          </Animated.View>
          <Text style={styles.count}>{fmt(item.shares)}</Text>
        </View>
      </View>

      {/* base: usuário, caption, áudio — acima da bottom bar */}
      <View style={[styles.bottomInfo, { bottom: bottomOffset + 12 }]}>
        <Text style={styles.userName}>@{item.user.name.toLowerCase()}</Text>
        <Text style={styles.caption}>{item.caption}</Text>

        <View style={styles.audioRow}>
          <Ionicons name="musical-notes-outline" size={16} color="#DDE1FF" />
          <View style={[styles.marqueeBox, { width: width * 0.6 }]}>
            <Animated.Text
              style={[styles.music, { transform: [{ translateX: marqueeTx }] }]}
              numberOfLines={1}
            >
              ♫ {item.music}  •  {item.music}  •  {item.music}
            </Animated.Text>
          </View>
        </View>
      </View>

      <FloatingHearts key={item.id} ref={heartsRef} />
    </View>
  );
});

/* =========================================
   Tela principal (lista vertical com paging)
========================================= */
export default function Shorts() {
  const isFocused = useIsFocused();
  const playbackActive = useScreenPlaybackActive();
  const dimensions = useWindowDimensions();
  const [viewport, setViewport] = useState({ width: dimensions.width, height: dimensions.height });
  const listRef = useRef<FlashListRef<Short>>(null);
  const lastVisibleId = useRef<string | null>(null);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { mode, setMode, data } = useShorts(isFocused);
  const tabsTopOffset = insets.top;
  const bottomOffset = getTabBarOccupiedHeight(insets.bottom, Platform.OS);

  const [activeId, setActiveId] = useState<string | null>(null);

  const handleModeChange = useCallback((nextMode: 'forYou' | 'following') => {
    if (mode === nextMode) return;
    lastVisibleId.current = null;
    setActiveId(null);
    setMode(nextMode);
  }, [mode, setMode]);
  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0 && height > 0) setViewport((current) => current.width === width && current.height === height ? current : { width, height });
  }, []);
  useEffect(() => {
    const index = data.findIndex((item) => item.id === lastVisibleId.current);
    if (index >= 0) listRef.current?.scrollToOffset({ offset: index * viewport.height, animated: false });
  }, [data, viewport.height, viewport.width]);

  // controlar qual vídeo está visível
  const isShort = (item: unknown): item is Short => (
    !!item
    && typeof item === 'object'
    && 'id' in item
    && typeof item.id === 'string'
  );

  const onViewableItemsChanged = useRef<NonNullable<FlashListProps<Short>['onViewableItemsChanged']>>(({ viewableItems }) => {
    const viewableItem = viewableItems.find((token: ViewToken<Short>) => token.isViewable);

    if (!isShort(viewableItem?.item)) {
      setActiveId(null);
      return;
    }
    lastVisibleId.current = viewableItem.item.id;

    setActiveId((currentId) => (
      currentId === viewableItem.item.id ? currentId : viewableItem.item.id
    ));
  }).current;

  const viewConfigRef = useRef({ itemVisiblePercentThreshold: 80 });

  const activeIndex = Math.max(0, data.findIndex((item) => item.id === (activeId ?? lastVisibleId.current)));
  const renderItem = useCallback(
    ({ item, index }: { item: Short; index: number }) => (
      <ShortCard item={item} playing={playbackActive && item.id === activeId} shouldLoad={index === activeIndex || index === activeIndex + 1} width={viewport.width} height={viewport.height} bottomOffset={bottomOffset} />
    ),
    [activeId, activeIndex, playbackActive, viewport.height, viewport.width, bottomOffset]
  );

  return (
    <View style={styles.root} onLayout={handleLayout}>
      <LinearGradient colors={['#0E0E12', '#11142a', '#0E0E12']} style={StyleSheet.absoluteFill} />
      <Tabs
        mode={mode}
        onChange={handleModeChange}
        topOffset={tabsTopOffset}
        onOpenLive={() => navigation.navigate('Live')}
      />

      <FlashList
        key={mode}
        ref={listRef}
        data={data}
        extraData={activeId + String(playbackActive) + viewport.width + ":" + viewport.height}
        maintainVisibleContentPosition={{ disabled: true }}
        drawDistance={viewport.height}
        keyExtractor={shortKey}
        renderItem={renderItem}
        getItemType={shortType}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewConfigRef.current}
      />
    </View>
  );
}

/* =========================================
   Estilos (identidade Kachan!)
========================================= */
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0E0E12' },

  /* Tabs topo — texto apenas */
  tabsWrap: {
    position: 'absolute',
    left: 0, right: 0, zIndex: 30,
    alignItems: 'center',
  },
  tabsOnlyText: {
    flexDirection: 'row',
    gap: 18,
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 2,
  },
  tabTextBtn: { paddingHorizontal: 6, paddingVertical: 6 },
  tabText: { color: '#A6ADCE', fontWeight: '700', fontSize: 13, letterSpacing: 0.2 },
  tabTextActive: { color: '#FFFFFF' },

  /* Botão de entrada das Lives (esquerda das abas) */
  liveEntryBtn: {
    position: 'absolute',
    left: 6,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    paddingHorizontal: 4,
    zIndex: 2,
  },
  liveEntryIcon: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  liveEntryDot: {
    position: 'absolute',
    top: -1,
    right: -1,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#FF5A8F',
    borderWidth: 1,
    borderColor: '#0E0E12',
  },

  /* Página do vídeo */
  page: { justifyContent: 'center', alignItems: 'center' },
  videoTouch: { ...StyleSheet.absoluteFillObject },
  video: { ...StyleSheet.absoluteFillObject, backgroundColor: '#000' },
  mediaError: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.55)', gap: 8 },
  errorText: { color: '#EDEFFF' },
  retryText: { color: '#C6C2FF', fontWeight: '700', padding: 12 },

  heartsOverlay: { ...StyleSheet.absoluteFillObject },

  /* barra de progresso (discreta, acima da bottom bar) */
  progressTrack: {
    position: 'absolute',
    left: 0, right: 0,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#DDE1FF',
  },

  /* Coluna da direita — acima da bottom bar */
  rightRail: {
    position: 'absolute',
    right: 12,
    alignItems: 'center',
    gap: 16,
  },
  profileBlock: { alignItems: 'center' },
  avatar: { width: 46, height: 46, borderRadius: 23, borderWidth: 2, borderColor: '#6C63FF' },
  followBtn: {
    width: 28, height: 28, borderRadius: 14, marginTop: -12,
    backgroundColor: '#DDE1FF', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#0E0E12',
  },
  following: { backgroundColor: 'rgba(108,99,255,0.28)' },

  iconBtn: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },
  // largura fixa + texto centralizado para os contadores não “pularem”
  count: { color: '#EDEFFF', fontWeight: '700', marginTop: 4, width: 48, textAlign: 'center' },

  /* Base: usuário, caption, áudio — acima da bottom bar */
  bottomInfo: {
    position: 'absolute',
    left: 14, right: 90,
  },
  userName: { color: '#fff', fontWeight: '800', fontSize: 14, marginBottom: 4 },
  caption: { color: '#E6E8F5' },
  audioRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 8 },
  marqueeBox: { overflow: 'hidden' },
  music: { color: '#DDE1FF' },
});

const shortKey = (item: Short) => item.id;
const shortType = () => 'short';
