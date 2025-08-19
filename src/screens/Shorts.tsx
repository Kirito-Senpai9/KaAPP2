import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Dimensions, FlatList, Image, Pressable,
  TouchableOpacity, Animated, Easing, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

/** Altura estimada da sua bottom bar custom (KachanTabs). */
const TAB_BAR_HEIGHT = 86;

/* =========================================
   Tipos e dados mock
========================================= */
type User = {
  id: string;
  name: string;
  avatar: string;
  following?: boolean;
};

type ShortItem = {
  id: string;
  user: User;
  caption: string;
  music: string;
  videoUrl: string;
  likes: number;
  comments: number;
  shares: number;
};

const FOR_YOU: ShortItem[] = [
  {
    id: 'fy1',
    user: { id: 'u1', name: 'Lua', avatar: 'https://i.pravatar.cc/150?img=2', following: false },
    caption: 'Novo mapa neon 🎮✨ #kachan',
    music: 'Beat Cyber - DJ K',
    videoUrl: 'https://cdn.coverr.co/videos/coverr-neon-arcade-5723/1080p.mp4',
    likes: 1280, comments: 144, shares: 40,
  },
  {
    id: 'fy2',
    user: { id: 'u2', name: 'Kai', avatar: 'https://i.pravatar.cc/150?img=3', following: false },
    caption: 'Speed run hoje às 20h! ⏱️',
    music: 'Hyper Pulse - Kai',
    videoUrl: 'https://cdn.coverr.co/videos/coverr-synthwave-street-2186/1080p.mp4',
    likes: 930, comments: 88, shares: 22,
  },
];

const FOLLOWING: ShortItem[] = [
  {
    id: 'fo1',
    user: { id: 'u4', name: 'Mina', avatar: 'https://i.pravatar.cc/150?img=4', following: true },
    caption: 'Build novo com shaders 💡',
    music: 'Dream Lights - Mina',
    videoUrl: 'https://cdn.coverr.co/videos/coverr-digital-billboards-4800/1080p.mp4',
    likes: 2200, comments: 320, shares: 120,
  },
];

/* =========================================
   Abas topo (Para você / Seguindo) — só texto
========================================= */
function Tabs({
  mode, onChange,
}: { mode: 'forYou' | 'following'; onChange: (m: 'forYou' | 'following') => void }) {
  return (
    <View style={styles.tabsWrap}>
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
const ShortCard = memo(function ShortCard({
  item, playing, onDoubleLike,
}: {
  item: ShortItem;
  playing: boolean;            // controla qual página está visível
  onDoubleLike?: () => void;
}) {
  const videoRef = useRef<Video | null>(null);

  // estados
  const [liked, setLiked] = useState(false);
  const [follow, setFollow] = useState(!!item.user.following);
  const [userPaused, setUserPaused] = useState(false); // pausa local por tap
  const [progress, setProgress] = useState(0);         // 0..1 barra de progresso

  // animações de ícones (somente ícones – contadores ficam fora!)
  const likeScale = useRef(new Animated.Value(1)).current;
  const commentScale = useRef(new Animated.Value(1)).current;
  const shareX = useRef(new Animated.Value(0)).current;
  const likeColor = liked ? '#FF5A8F' : '#EDEFFF';

  // coração “burst” no meio (duplo toque)
  const burst = useRef(new Animated.Value(0)).current;

  // marquee do áudio
  const marquee = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    marquee.setValue(0);
    const loop = Animated.loop(
      Animated.timing(marquee, { toValue: 1, duration: 6000, easing: Easing.linear, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, []);

  // status do player: atualiza progresso
  const onStatusUpdate = (status: AVPlaybackStatus) => {
    // @ts-ignore – checagem simples
    if (!status?.isLoaded) return;
    // @ts-ignore
    const dur = status.durationMillis ?? 0;
    // @ts-ignore
    const pos = status.positionMillis ?? 0;
    if (dur > 0) setProgress(Math.min(1, Math.max(0, pos / dur)));
  };

  // tocar/pausar conforme página visível + pausa do usuário
  useEffect(() => {
    const run = async () => {
      if (!videoRef.current) return;
      try {
        if (playing && !userPaused) await videoRef.current.playAsync();
        else await videoRef.current.pauseAsync();
      } catch {}
    };
    run();
  }, [playing, userPaused]);

  // helper: anima o coração (ícone)
  const animateHeart = () => {
    Animated.sequence([
      Animated.spring(likeScale, { toValue: 1.25, useNativeDriver: true }),
      Animated.spring(likeScale, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
  };

  // tap vs duplo toque
  const lastTap = useRef<number>(0);
  const onVideoPress = () => {
    const now = Date.now();
    if (now - lastTap.current < 280) {
      // duplo toque = curtir
      if (!liked) setLiked(true);
      onDoubleLike?.();
      animateHeart(); // anima o ícone
      Animated.sequence([
        Animated.timing(burst, { toValue: 1, duration: 200, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(burst, { toValue: 0, duration: 240, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      ]).start();
    } else {
      // toque simples = pausar/retomar
      setUserPaused(p => !p);
    }
    lastTap.current = now;
  };

  // clicar no coração (ícone) — animação + toggle
  const onHeartPress = () => {
    setLiked(v => !v);
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

  const heartStyle = {
    transform: [{ scale: burst.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }) }],
    opacity: burst,
  };

  const marqueeTx = marquee.interpolate({ inputRange: [0, 1], outputRange: [0, -width * 0.6] });

  // formatar contadores para ocupar menos largura
  const fmt = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`);

  return (
    <View style={styles.page}>
      {/* vídeo (tap pausa/retoma, duplo toque curte) */}
      <Pressable style={styles.videoTouch} onPress={onVideoPress}>
        <Video
          ref={(r) => (videoRef.current = r)}
          source={{ uri: item.videoUrl }}
          style={styles.video}
          resizeMode={ResizeMode.COVER}
          shouldPlay={false}
          isLooping
          onPlaybackStatusUpdate={onStatusUpdate}
        />
      </Pressable>

      {/* coração burst (double tap) */}
      <Animated.View style={[styles.centerHeart, heartStyle]}>
        <Ionicons name="heart" size={84} color="#FF5A8F" />
      </Animated.View>

      {/* gradiente sutil para leitura */}
      <LinearGradient
        colors={['rgba(0,0,0,0.0)', 'rgba(0,0,0,0.35)', 'rgba(0,0,0,0.6)']}
        style={StyleSheet.absoluteFill}
      />

      {/* barra de progresso discreta */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: Math.max(0, Math.min(1, progress)) * width }]} />
      </View>

      {/* coluna de ações à direita — acima da bottom bar */}
      <View style={styles.rightRail}>
        {/* Perfil + seguir */}
        <View style={styles.profileBlock}>
          <Image source={{ uri: item.user.avatar }} style={styles.avatar} />
          <TouchableOpacity
            style={[styles.followBtn, follow && styles.following]}
            onPress={() => setFollow(v => !v)}
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
      <View style={styles.bottomInfo}>
        <Text style={styles.userName}>@{item.user.name.toLowerCase()}</Text>
        <Text style={styles.caption}>{item.caption}</Text>

        <View style={styles.audioRow}>
          <Ionicons name="musical-notes-outline" size={16} color="#DDE1FF" />
          <View style={styles.marqueeBox}>
            <Animated.Text
              style={[styles.music, { transform: [{ translateX: marqueeTx }] }]}
              numberOfLines={1}
            >
              ♫ {item.music}  •  {item.music}  •  {item.music}
            </Animated.Text>
          </View>
        </View>
      </View>
    </View>
  );
});

/* =========================================
   Tela principal (lista vertical com paging)
========================================= */
export default function Shorts() {
  const [mode, setMode] = useState<'forYou' | 'following'>('forYou');
  const data = mode === 'forYou' ? FOR_YOU : FOLLOWING;

  const [activeId, setActiveId] = useState<string | null>(data[0]?.id ?? null);

  // controlar qual vídeo está visível
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    const v = viewableItems.find((it: any) => it.isViewable);
    if (v?.item?.id) setActiveId(v.item.id);
  }).current;

  const viewConfigRef = useRef({ itemVisiblePercentThreshold: 80 });

  const renderItem = useCallback(
    ({ item }: { item: ShortItem }) => (
      <ShortCard item={item} playing={item.id === activeId} onDoubleLike={() => {}} />
    ),
    [activeId]
  );

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#0E0E12', '#11142a', '#0E0E12']} style={StyleSheet.absoluteFill} />
      <Tabs mode={mode} onChange={setMode} />

      <FlatList
        data={data}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewConfigRef.current}
        getItemLayout={(_, index) => ({ length: height, offset: height * index, index })}
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
    top: Platform.select({ ios: 12, android: 8 }),
    left: 0, right: 0, zIndex: 30,
    alignItems: 'center',
  },
  tabsOnlyText: {
    flexDirection: 'row',
    gap: 18,
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tabTextBtn: { paddingHorizontal: 6, paddingVertical: 6 },
  tabText: { color: '#A6ADCE', fontWeight: '700', fontSize: 13, letterSpacing: 0.2 },
  tabTextActive: { color: '#FFFFFF' },

  /* Página do vídeo */
  page: { width, height, justifyContent: 'center', alignItems: 'center' },
  videoTouch: { position: 'absolute', width, height },
  video: { width, height, backgroundColor: '#000' },

  centerHeart: { position: 'absolute', alignSelf: 'center', top: height * 0.4 },

  /* barra de progresso (discreta, acima da bottom bar) */
  progressTrack: {
    position: 'absolute',
    left: 0, right: 0,
    bottom: TAB_BAR_HEIGHT + 6,
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
    bottom: TAB_BAR_HEIGHT + 28,
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
    bottom: TAB_BAR_HEIGHT + 12,
  },
  userName: { color: '#fff', fontWeight: '800', fontSize: 14, marginBottom: 4 },
  caption: { color: '#E6E8F5' },
  audioRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 8 },
  marqueeBox: { overflow: 'hidden', width: width * 0.6 },
  music: { color: '#DDE1FF' },
});
