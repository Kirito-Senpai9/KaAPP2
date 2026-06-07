import React, {
  forwardRef, memo, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState,
} from 'react';
import {
  View, Text, StyleSheet, Dimensions, Pressable,
  TouchableOpacity, Animated, Easing, TextInput, Keyboard,
  type GestureResponderEvent,
} from 'react-native';
import Reanimated, {
  Easing as ReaEasing,
  FadeIn, FadeOut, KeyboardState, LinearTransition,
  useAnimatedKeyboard, useAnimatedStyle, useDerivedValue, withTiming,
} from 'react-native-reanimated';
import { FlashList, type FlashListProps, type ViewToken } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets, type EdgeInsets } from 'react-native-safe-area-context';
import type { RootStackScreenProps } from '@/app/navigation/types';
import type { LiveChatItem, LiveStream } from '@/features/live/domain/entities/live';
import { useLives } from '@/features/live/presentation/hooks/useLives';
import { formatCount } from '@/shared/utils/formatCount';

const { width, height } = Dimensions.get('window');

const CHIPS = [
  { id: 'rank', icon: 'flame' as const, label: 'Ranking' },
];

const KEYBOARD_OPEN_DURATION = 240;
const KEYBOARD_CLOSE_DURATION = 220;
const CHAT_ENTERING = FadeIn.duration(180);
const CHAT_EXITING = FadeOut.duration(120);
const CHAT_LAYOUT = LinearTransition.duration(180).easing(ReaEasing.out(ReaEasing.quad));

/** Usuário atual (comentários enviados aparecem com avatar + nome). */
const SELF = { name: 'Você', avatar: 'https://i.pravatar.cc/150?img=1' };

/** Pool para gerar a linha de interação (entrou/saiu/curtiu). */
const INTERACTION_NAMES = [
  'Lua', 'Kai', 'Mina', 'Noah', 'Ayla', 'Luna', 'Ethan',
  'Coral', 'Jota', 'Bia', 'Théo', 'Rui', 'Caqui', 'Nina',
];

let interactionSeq = 0;
function genInteraction(): LiveChatItem {
  const id = `it-${interactionSeq++}`;
  const user = INTERACTION_NAMES[Math.floor(Math.random() * INTERACTION_NAMES.length)];
  const roll = Math.floor(Math.random() * 3);
  if (roll === 0) return { id, kind: 'join', user };
  if (roll === 1) return { id, kind: 'leave', user };
  return { id, kind: 'like', user };
}

type FloatingHeart = {
  id: number;
  anim: Animated.Value;
  x: number;
  y: number;
  driftX: number;
  rotate: number;
  size: number;
};

type FloatingHeartsHandle = { spawn: (x: number, y: number) => void };

/* =========================================
   Corações flutuantes — isolado (spawn imperativo)
   Não re-renderiza com o card; garante a animação
   mesmo com toques rápidos / muitos comentários.
========================================= */
const FloatingHearts = memo(
  forwardRef<FloatingHeartsHandle>(function FloatingHearts(_props, ref) {
    const [hearts, setHearts] = useState<FloatingHeart[]>([]);
    const idRef = useRef(0);

    useImperativeHandle(
      ref,
      () => ({
        spawn(x: number, y: number) {
          const id = idRef.current++;
          const anim = new Animated.Value(0);
          const driftX = Math.random() * 80 - 40;
          const rotate = Math.random() * 36 - 18;
          const size = 22 + Math.round(Math.random() * 12);
          setHearts((prev) => {
            const next = [...prev, { id, anim, x, y, driftX, rotate, size }];
            return next.length > 40 ? next.slice(next.length - 40) : next;
          });
          Animated.timing(anim, {
            toValue: 1,
            duration: 1400 + Math.random() * 300,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }).start(() => {
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
                { translateY: heart.anim.interpolate({ inputRange: [0, 1], outputRange: [0, -150] }) },
                { translateX: heart.anim.interpolate({ inputRange: [0, 1], outputRange: [0, heart.driftX] }) },
                { scale: heart.anim.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0.3, 1.2, 0.9] }) },
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
   Chat ao vivo (cada item)
========================================= */
function ChatRow({ item }: { item: LiveChatItem }) {
  if (item.kind === 'message') {
    return (
      <View style={styles.chatMsg}>
        {item.avatar ? (
          <Image source={{ uri: item.avatar }} style={styles.chatAvatar} contentFit="cover" cachePolicy="memory-disk" />
        ) : null}
        <View style={styles.chatBubble}>
          <View style={styles.chatHead}>
            {item.badge ? (
              <View style={styles.chatBadge}>
                <Text style={styles.chatBadgeTxt}>{item.badge}</Text>
              </View>
            ) : null}
            {typeof item.level === 'number' ? (
              <View style={styles.chatLevel}>
                <Text style={styles.chatLevelTxt}>{item.level}</Text>
              </View>
            ) : null}
            <Text style={styles.chatUser}>{item.user}</Text>
          </View>
          <Text style={styles.chatText}>{item.text}</Text>
        </View>
      </View>
    );
  }

  if (item.kind === 'join') {
    return (
      <View style={styles.chatEvent}>
        <Ionicons name="hand-left-outline" size={13} color="#A6ADCE" />
        <Text style={styles.chatEventTxt}>
          <Text style={styles.chatEventUser}>{item.user}</Text> entrou
        </Text>
      </View>
    );
  }

  if (item.kind === 'leave') {
    return (
      <View style={styles.chatEvent}>
        <Ionicons name="log-out-outline" size={13} color="#8A90B0" />
        <Text style={styles.chatEventTxt}>
          <Text style={styles.chatEventUser}>{item.user}</Text> saiu
        </Text>
      </View>
    );
  }

  if (item.kind === 'like') {
    return (
      <View style={styles.chatEvent}>
        <Ionicons name="heart" size={13} color="#FF5A8F" />
        <Text style={styles.chatEventTxt}>
          <Text style={styles.chatEventUser}>{item.user}</Text> curtiu a LIVE
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.chatEvent}>
      <Ionicons name={(item.icon ?? 'game-controller-outline') as keyof typeof Ionicons.glyphMap} size={13} color="#7A72FF" />
      <Text style={styles.chatEventTxt}>{item.text}</Text>
    </View>
  );
}

/* =========================================
   Lista de comentários (memoizada)
   Só re-renderiza quando os comentários mudam —
   curtidas/contadores/interação não a afetam.
========================================= */
const ChatList = memo(function ChatList({ messages }: { messages: LiveChatItem[] }) {
  return (
    <View style={styles.chatStream}>
      {messages.map((m) => (
        <Reanimated.View
          key={m.id}
          entering={CHAT_ENTERING}
          exiting={CHAT_EXITING}
          layout={CHAT_LAYOUT}
        >
          <ChatRow item={m} />
        </Reanimated.View>
      ))}
    </View>
  );
});

/* =========================================
   Card da Live (cada página)
========================================= */
const LiveCard = memo(function LiveCard({
  item, playing, insets, onClose,
}: {
  item: LiveStream;
  playing: boolean;
  insets: EdgeInsets;
  onClose: () => void;
}) {
  const player = useVideoPlayer(item.videoUrl, (videoPlayer) => {
    videoPlayer.loop = true;
  });

  const [follow, setFollow] = useState(!!item.host.following);
  const [likeCount, setLikeCount] = useState(item.host.likes);
  const [viewers, setViewers] = useState(item.viewers);
  const [input, setInput] = useState('');
  const [chat, setChat] = useState<LiveChatItem[]>(item.chat);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [currentInteraction, setCurrentInteraction] = useState<LiveChatItem>(() => genInteraction());

  const livePulse = useRef(new Animated.Value(0)).current;
  const msgIdRef = useRef(0);
  const heartsRef = useRef<FloatingHeartsHandle>(null);

  // teclado animado (UI thread) — eleva a base suavemente junto com o teclado
  const keyboard = useAnimatedKeyboard();
  const keyboardOffset = useDerivedValue(() => {
    const target = -Math.max(keyboard.height.value - insets.bottom, 0);
    const isClosing = keyboard.state.value === KeyboardState.CLOSING || keyboard.state.value === KeyboardState.CLOSED;

    return withTiming(target, {
      duration: isClosing ? KEYBOARD_CLOSE_DURATION : KEYBOARD_OPEN_DURATION,
      easing: ReaEasing.out(ReaEasing.quad),
    });
  }, [insets.bottom]);

  const bottomAnimStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: keyboardOffset.value },
      ],
    };
  });

  // pulsar do ponto "AO VIVO"
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(livePulse, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(livePulse, { toValue: 0, duration: 800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [livePulse]);

  // tocar/pausar conforme página visível + foco da tela
  useEffect(() => {
    if (playing) {
      player.play();
      return;
    }
    player.pause();
  }, [player, playing]);

  // resync ao reciclar a página (FlashList) para outra live
  useEffect(() => {
    setChat(item.chat);
    setLikeCount(item.host.likes);
    setViewers(item.viewers);
    setFollow(!!item.host.following);
    setInput('');
    setIsInputFocused(false);
    setCurrentInteraction(genInteraction());
  }, [item.id, item.chat, item.host.likes, item.host.following, item.viewers]);

  useEffect(() => {
    const subscription = Keyboard.addListener('keyboardDidHide', () => {
      setIsInputFocused(false);
    });

    return () => subscription.remove();
  }, []);

  // simulação de live: alterna a interação e mexe nos contadores (só na página ativa)
  useEffect(() => {
    if (!playing) return;
    const interval = setInterval(() => {
      setCurrentInteraction(genInteraction());
      setViewers((value) => Math.max(50, value + Math.round(Math.random() * 44 - 20)));
      setLikeCount((value) => value + 3 + Math.floor(Math.random() * 13));
    }, 2800);
    return () => clearInterval(interval);
  }, [playing]);

  const registerLike = useCallback((x: number, y: number) => {
    setLikeCount((value) => value + 1);
    heartsRef.current?.spawn(x, y);
    // mantém o efeito de coração na lateral
    heartsRef.current?.spawn(width - 38, height - insets.bottom - 160);
  }, [insets.bottom]);

  const onVideoPress = useCallback((event: GestureResponderEvent) => {
    if (isInputFocused) {
      Keyboard.dismiss();
      return;
    }
    const { locationX, locationY } = event.nativeEvent;
    registerLike(locationX, locationY);
  }, [isInputFocused, registerLike]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    setChat((prev) => [
      ...prev,
      { id: `me-${msgIdRef.current++}`, kind: 'message', user: SELF.name, avatar: SELF.avatar, text },
    ]);
    setInput('');
  }, [input]);

  const visibleMessages = useMemo(() => {
    const msgs = chat.filter((c) => c.kind === 'message');
    return msgs.slice(isInputFocused ? -3 : -5);
  }, [chat, isInputFocused]);

  const livePulseStyle = {
    opacity: livePulse.interpolate({ inputRange: [0, 1], outputRange: [1, 0.3] }),
    transform: [{ scale: livePulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.5] }) }],
  };

  return (
    <View style={styles.page}>
      {/* vídeo (tap em qualquer lugar curte no ponto do toque) */}
      <Pressable style={styles.videoTouch} onPress={onVideoPress}>
        <VideoView
          player={player}
          style={styles.video}
          contentFit="cover"
          nativeControls={false}
          surfaceType="textureView"
          useExoShutter={false}
        />
      </Pressable>

      {/* gradientes de leitura (topo e base) */}
      <LinearGradient
        colors={['rgba(0,0,0,0.55)', 'rgba(0,0,0,0.0)']}
        style={styles.topShade}
        pointerEvents="none"
      />
      <LinearGradient
        colors={['rgba(0,0,0,0.0)', 'rgba(0,0,0,0.35)', 'rgba(0,0,0,0.72)']}
        style={styles.bottomShade}
        pointerEvents="none"
      />

      {/* ====== TOPO: host + espectadores + fechar + chips ====== */}
      <View style={[styles.topWrap, { top: insets.top + 8 }]}>
        <View style={styles.topRow}>
          {/* card do host */}
          <View style={styles.hostCard}>
            <Image source={{ uri: item.host.avatar }} style={styles.hostAvatar} contentFit="cover" cachePolicy="memory-disk" />
            <View style={styles.hostMeta}>
              <Text style={styles.hostName} numberOfLines={1}>{item.host.name}</Text>
              <View style={styles.hostSub}>
                <View style={styles.liveBadge}>
                  <Animated.View style={[styles.liveDot, livePulseStyle]} />
                  <Text style={styles.liveBadgeTxt}>AO VIVO</Text>
                </View>
                <Ionicons name="heart" size={10} color="#FF7BA5" />
                <Text style={styles.hostLikes}>{formatCount(likeCount)}</Text>
              </View>
            </View>
            {follow ? (
              <TouchableOpacity style={[styles.followBtn, styles.following]} onPress={() => setFollow(false)} activeOpacity={0.9}>
                <Ionicons name="checkmark" size={15} color="#DDE1FF" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.followBtn} onPress={() => setFollow(true)} activeOpacity={0.9}>
                <Ionicons name="add" size={15} color="#0E0E12" />
                <Text style={styles.followTxt}>Seguir</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* espectadores + fechar */}
          <View style={styles.topRight}>
            <View style={styles.viewersPill}>
              <Ionicons name="eye" size={13} color="#EDEFFF" />
              <Text style={styles.viewersTxt}>{formatCount(viewers)}</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.85}>
              <Ionicons name="close" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* chips (visual, inspirado nos eventos de live) */}
        <View style={styles.chipsRow}>
          {CHIPS.map((chip) => (
            <TouchableOpacity key={chip.id} style={styles.chip} activeOpacity={0.85}>
              <Ionicons name={chip.icon} size={13} color="#DDE1FF" />
              <Text style={styles.chipTxt}>{chip.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ====== BASE: comentários → linha de interação → barra ====== */}
      <Reanimated.View style={[styles.bottomWrap, { paddingBottom: Math.max(insets.bottom, 10) + 8 }, bottomAnimStyle]}>
        <ChatList messages={visibleMessages} />

        {/* linha única de interação (alterna no mesmo lugar, não sobe) */}
        <View style={styles.interactionLine}>
          <Reanimated.View
            key={currentInteraction.id}
            entering={FadeIn.duration(280)}
            exiting={FadeOut.duration(220)}
            style={styles.interactionItem}
          >
            <ChatRow item={currentInteraction} />
          </Reanimated.View>
        </View>

        <View style={styles.commentBar}>
          <View style={styles.commentField}>
            <TextInput
              value={input}
              onChangeText={setInput}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              onSubmitEditing={handleSend}
              returnKeyType="send"
              submitBehavior="submit"
              placeholder="Comentar..."
              placeholderTextColor="#A6ADCE"
              style={styles.commentInput}
            />
            {isInputFocused && (
              <TouchableOpacity style={styles.emojiInsideBtn} activeOpacity={0.85}>
                <Ionicons name="happy-outline" size={22} color="#C8CEEC" />
              </TouchableOpacity>
            )}
          </View>

          {isInputFocused ? (
            <TouchableOpacity
              style={styles.sendBtn}
              activeOpacity={0.85}
              onPress={handleSend}
              accessibilityLabel="Enviar comentário"
            >
              <Ionicons name="send" size={18} color="#fff" />
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity style={styles.barIconBtn} activeOpacity={0.85}>
                <Ionicons name="happy-outline" size={22} color="#EDEFFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.barIconBtn} activeOpacity={0.85}>
                <Ionicons name="gift-outline" size={22} color="#FF7BA5" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.sendBtn} activeOpacity={0.85} accessibilityLabel="Compartilhar live">
                <Ionicons name="arrow-redo-outline" size={20} color="#fff" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </Reanimated.View>

      {/* corações flutuantes por cima de tudo (isolado) */}
      <FloatingHearts ref={heartsRef} />
    </View>
  );
});

/* =========================================
   Tela principal (lista vertical com paging)
========================================= */
export default function Live({ navigation }: RootStackScreenProps<'Live'>) {
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const { data } = useLives(isFocused);

  const [activeId, setActiveId] = useState<string | null>(data[0]?.id ?? null);

  useEffect(() => {
    setActiveId((current) => current ?? data[0]?.id ?? null);
  }, [data]);

  const isLive = (item: unknown): item is LiveStream => (
    !!item
    && typeof item === 'object'
    && 'id' in item
    && typeof item.id === 'string'
  );

  const onViewableItemsChanged = useRef<NonNullable<FlashListProps<LiveStream>['onViewableItemsChanged']>>(({ viewableItems }) => {
    const viewableItem = viewableItems.find((token: ViewToken<LiveStream>) => token.isViewable);

    if (!isLive(viewableItem?.item)) {
      return;
    }

    setActiveId((currentId) => (
      currentId === viewableItem.item.id ? currentId : viewableItem.item.id
    ));
  }).current;

  const viewConfigRef = useRef({ itemVisiblePercentThreshold: 80 });

  const handleClose = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const renderItem = useCallback(
    ({ item }: { item: LiveStream }) => (
      <LiveCard
        item={item}
        playing={isFocused && item.id === activeId}
        insets={insets}
        onClose={handleClose}
      />
    ),
    [activeId, handleClose, insets, isFocused]
  );

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#0E0E12', '#11142a', '#0E0E12']} style={StyleSheet.absoluteFill} />

      <FlashList
        data={data}
        drawDistance={height}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        getItemType={() => 'live'}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
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

  /* Página da live */
  page: { width, height, justifyContent: 'center', alignItems: 'center' },
  videoTouch: { position: 'absolute', width, height },
  video: { width, height, backgroundColor: '#000' },

  topShade: { position: 'absolute', top: 0, left: 0, right: 0, height: 200 },
  bottomShade: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 360 },

  /* ===== Topo ===== */
  topWrap: { position: 'absolute', left: 10, right: 10, zIndex: 30 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },

  hostCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 5,
    paddingLeft: 5,
    paddingRight: 6,
    borderRadius: 30,
    backgroundColor: 'rgba(18,22,43,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(147,154,255,0.16)',
    flexShrink: 1,
  },
  hostAvatar: { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: '#6C63FF' },
  hostMeta: { flexShrink: 1, gap: 2, overflow: 'hidden' },
  hostName: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  hostSub: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  liveBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8,
    backgroundColor: '#FF5A8F',
  },
  liveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#FFFFFF' },
  liveBadgeTxt: { color: '#FFFFFF', fontSize: 9, fontWeight: '900', letterSpacing: 0.4 },
  hostLikes: { color: '#DDE1FF', fontSize: 11, fontWeight: '700' },

  followBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    height: 30, paddingHorizontal: 12, borderRadius: 15,
    backgroundColor: '#DDE1FF',
    flexShrink: 0,
  },
  followTxt: { color: '#0E0E12', fontWeight: '800', fontSize: 12 },
  following: { backgroundColor: 'rgba(108,99,255,0.28)', paddingHorizontal: 0, width: 30, justifyContent: 'center' },

  topRight: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 },
  viewersPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 11, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.38)',
    borderWidth: 1, borderColor: 'rgba(147,154,255,0.14)',
  },
  viewersTxt: { color: '#EDEFFF', fontWeight: '700', fontSize: 12 },
  closeBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.38)',
    alignItems: 'center', justifyContent: 'center',
  },

  chipsRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14,
    backgroundColor: 'rgba(18,22,43,0.5)',
    borderWidth: 1, borderColor: 'rgba(147,154,255,0.14)',
  },
  chipTxt: { color: '#DDE1FF', fontWeight: '700', fontSize: 12 },

  /* ===== Corações flutuantes ===== */
  heartsOverlay: { ...StyleSheet.absoluteFillObject },

  /* ===== Base: chat + interação + barra ===== */
  bottomWrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 12 },
  chatStream: { maxWidth: width * 0.72, gap: 7, marginBottom: 10 },
  chatMsg: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  chatAvatar: { width: 26, height: 26, borderRadius: 13, marginTop: 1 },
  chatBubble: {
    flexShrink: 1,
  },
  chatHead: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 1 },
  chatBadge: { backgroundColor: '#FF5A8F', borderRadius: 6, paddingHorizontal: 5, paddingVertical: 1 },
  chatBadgeTxt: { color: '#FFFFFF', fontSize: 9, fontWeight: '900' },
  chatLevel: {
    minWidth: 16, height: 16, borderRadius: 8, paddingHorizontal: 4,
    backgroundColor: 'rgba(108,99,255,0.6)', alignItems: 'center', justifyContent: 'center',
  },
  chatLevelTxt: { color: '#FFFFFF', fontSize: 9, fontWeight: '800' },
  chatUser: {
    color: '#C8CEEC', fontSize: 12, fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3,
  },
  chatText: {
    color: '#FFFFFF', fontSize: 13.5, fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3,
  },

  chatEvent: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chatEventTxt: {
    color: '#D3D8F4', fontSize: 12.5, fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3,
  },
  chatEventUser: { color: '#AEB5F2', fontWeight: '800' },

  /* linha única de interação (altura fixa; cross-fade no mesmo lugar) */
  interactionLine: { height: 22, marginBottom: 8, justifyContent: 'center' },
  interactionItem: { position: 'absolute', left: 0, right: 0 },

  commentBar: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  commentField: {
    flex: 1, minHeight: 44, borderRadius: 22,
    paddingLeft: 16, paddingRight: 8,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  commentInput: { flex: 1, color: '#FFFFFF', fontSize: 14, fontWeight: '500', paddingVertical: 0, minHeight: 44 },
  emojiInsideBtn: { paddingHorizontal: 4, paddingVertical: 4 },
  barIconBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.32)',
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(108,99,255,0.45)',
  },
});
