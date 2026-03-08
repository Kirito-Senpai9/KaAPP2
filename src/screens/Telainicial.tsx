import React, { memo, useCallback, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image, TouchableOpacity,
  Animated, Dimensions, ImageBackground, Easing
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AVPlaybackStatus, ResizeMode, Video } from 'expo-av';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList, StoryUser } from '@/navigation/types';

const { width } = Dimensions.get('window');

type Post  = {
  id: string;
  type: 'image' | 'video-vertical' | 'video-horizontal';
  user: string;
  avatar: string;
  image?: string;
  video?: string;
  thumbnail?: string;
  text: string;
  hashtags?: string[];
  timeLabel: string;
  likes: number;
  comments: number;
  reposts: number;
  shares: number;
};

/* --- MOCK --- */
const STORIES: StoryUser[] = [
  {
    id: '1',
    name: 'Você',
    avatar: 'https://i.pravatar.cc/150?img=1',
    stories: [
      {
        id: '1-1',
        type: 'image',
        uri: 'https://images.unsplash.com/photo-1520975922284-9d08b6d8f6a0?w=1400&q=80&auto=format&fit=crop',
        postedAt: 'agora',
        overlays: [{ id: 'ov-1', type: 'text', content: 'Partiu ranked ✨' }],
      },
      {
        id: '1-2',
        type: 'video',
        uri: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
        postedAt: 'agora',
      },
    ],
  },
  {
    id: '2',
    name: 'Lua',
    avatar: 'https://i.pravatar.cc/150?img=2',
    stories: [
      {
        id: '2-1',
        type: 'image',
        uri: 'https://images.unsplash.com/photo-1520975594081-3a43b00abd98?w=1400&q=80&auto=format&fit=crop',
        postedAt: 'há 2h',
        overlays: [{ id: 'ov-2', type: 'emoji', content: '🔥' }],
      },
      {
        id: '2-2',
        type: 'image',
        uri: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=1400&q=80&auto=format&fit=crop',
        postedAt: 'há 2h',
        overlays: [{ id: 'ov-3', type: 'text', content: 'Time fechado para o torneio' }],
      },
    ],
  },
  {
    id: '3',
    name: 'Kai',
    avatar: 'https://i.pravatar.cc/150?img=3',
    stories: [
      {
        id: '3-1',
        type: 'video',
        uri: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        postedAt: 'há 45 min',
      },
      {
        id: '3-2',
        type: 'image',
        uri: 'https://images.unsplash.com/photo-1517816743773-6e0fd518b4a6?w=1400&q=80&auto=format&fit=crop',
        postedAt: 'há 42 min',
        overlays: [{ id: 'ov-4', type: 'music', content: 'Lo-fi KaAPP Mix' }],
      },
    ],
  },
  {
    id: '4',
    name: 'Mina',
    avatar: 'https://i.pravatar.cc/150?img=4',
    stories: [
      {
        id: '4-1',
        type: 'image',
        uri: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1400&q=80&auto=format&fit=crop',
        postedAt: 'há 1h',
      },
    ],
  },
];

const POSTS: Post[] = [
  {
    id: 'p1',
    type: 'image',
    user: 'Luna',
    avatar: 'https://i.pravatar.cc/150?img=2',
    image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1600&q=80&auto=format&fit=crop',
    text: 'Explorando um novo mapa hoje! #kachan',
    timeLabel: 'agora',
    likes: 128,
    comments: 14,
    reposts: 8,
    shares: 5,
  },
  {
    id: 'p2',
    type: 'video-vertical',
    user: 'Kai',
    avatar: 'https://i.pravatar.cc/150?img=3',
    video: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1517816743773-6e0fd518b4a6?w=1200&q=80&auto=format&fit=crop',
    text: 'Treino rápido de hoje no competitivo!',
    hashtags: ['#kachan', '#ranked'],
    timeLabel: 'há 3 min',
    likes: 245,
    comments: 30,
    reposts: 11,
    shares: 7,
  },
  {
    id: 'p3',
    type: 'image',
    user: 'Mina',
    avatar: 'https://i.pravatar.cc/150?img=4',
    image: 'https://images.unsplash.com/photo-1520975594081-3a43b00abd98?w=1600&q=80&auto=format&fit=crop',
    text: 'Setup novo pronto para a próxima live ✨',
    timeLabel: 'há 12 min',
    likes: 319,
    comments: 58,
    reposts: 16,
    shares: 10,
  },
  {
    id: 'p4',
    type: 'video-horizontal',
    user: 'Noah',
    avatar: 'https://i.pravatar.cc/150?img=5',
    video: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1400&q=80&auto=format&fit=crop',
    text: 'Highlights da scrim de ontem.',
    hashtags: ['#esports', '#kachan'],
    timeLabel: 'há 25 min',
    likes: 542,
    comments: 77,
    reposts: 23,
    shares: 18,
  },
  {
    id: 'p5',
    type: 'image',
    user: 'Luna',
    avatar: 'https://i.pravatar.cc/150?img=2',
    image: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=1600&q=80&auto=format&fit=crop',
    text: 'Time fechado para o torneio 🏆',
    timeLabel: 'há 1 h',
    likes: 902,
    comments: 129,
    reposts: 48,
    shares: 32,
  },
];

const formatCompact = (value: number, divisor: number, suffix: 'K' | 'M') => {
  const short = Math.round((value / divisor) * 10) / 10;
  const display = Number.isInteger(short) ? `${short}` : `${short}`.replace('.', ',');
  return `${display}${suffix}`;
};

const formatCount = (value: number) => {
  if (value < 1000) return `${value}`;
  if (value < 1_000_000) return formatCompact(value, 1000, 'K');
  return formatCompact(value, 1_000_000, 'M');
};

/* --- Stories (rola junto no header) --- */
const StoryCard = memo(function StoryCard({ item, onPress }: { item: StoryUser; onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;

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
          source={{ uri: item.stories[0]?.uri ?? item.avatar }}
          style={styles.storyBg}
          imageStyle={styles.storyBgImage}
          resizeMode="cover"
        >
          <View style={styles.storyAvatarWrap}>
            <Image source={{ uri: item.avatar }} style={styles.storyAvatar} />
          </View>
        </ImageBackground>
      </TouchableOpacity>
    </Animated.View>
  );
});

/* --- Card do Post (com animações) --- */
type PostCardProps = {
  item: Post;
  isVisible: boolean;
  onOpenComments: (post: Post) => void;
};

const PostCard = memo(function PostCard({ item, isVisible, onOpenComments }: PostCardProps) {
  const [liked, setLiked] = useState(false);
  const [reposted, setReposted] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPausedByUser, setIsPausedByUser] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);
  const videoRef = useRef<Video | null>(null);

  const likeScale    = useRef(new Animated.Value(1)).current;
  const commentScale = useRef(new Animated.Value(1)).current;
  const commentShake = useRef(new Animated.Value(0)).current;
  const shareX       = useRef(new Animated.Value(0)).current;
  const repostScale  = useRef(new Animated.Value(1)).current;
  const saveRotateY  = useRef(new Animated.Value(0)).current;

  const handleLike = () => {
    setLiked(v => !v);
    Animated.sequence([
      Animated.spring(likeScale, { toValue: 1.25, useNativeDriver: true }),
      Animated.spring(likeScale, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
  };

  const handleComment = () => {
    Animated.parallel([
      Animated.sequence([
        Animated.spring(commentScale, { toValue: 1.15, useNativeDriver: true }),
        Animated.spring(commentScale, { toValue: 1, friction: 4, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(commentShake, { toValue: 1, duration: 60, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(commentShake, { toValue: -1, duration: 60, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(commentShake, { toValue: 0, duration: 60, easing: Easing.linear, useNativeDriver: true }),
      ]),
    ]).start();

    onOpenComments(item);
  };

  const handleShare = () => {
    Animated.sequence([
      Animated.timing(shareX, { toValue: 1, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(shareX, { toValue: 0, duration: 220, easing: Easing.in(Easing.cubic),  useNativeDriver: true }),
    ]).start();
  };

  const handleRepost = () => {
    setReposted(v => !v);
    Animated.sequence([
      Animated.spring(repostScale, { toValue: 1.2, useNativeDriver: true }),
      Animated.spring(repostScale, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
  };

  const handleSave = () => {
    setSaved(v => !v);
    Animated.sequence([
      Animated.timing(saveRotateY, { toValue: 1, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(saveRotateY, { toValue: 0, duration: 220, easing: Easing.in(Easing.cubic),  useNativeDriver: true }),
    ]).start();
  };

  const shareTranslate = shareX.interpolate({ inputRange: [0, 1], outputRange: [0, 10] });
  const saveRotateDeg  = saveRotateY.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const commentOffset  = commentShake.interpolate({ inputRange: [-1, 1], outputRange: [-3, 3] });
  const postTags = item.hashtags?.join(' ') ?? '';

  const isVideoPost = item.type === 'video-horizontal' || item.type === 'video-vertical';
  const shouldAutoPlay = isVisible && !isPausedByUser && !hasEnded;

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;

    setIsPlaying(status.isPlaying);

    if (status.didJustFinish) {
      setHasEnded(true);
      setIsPausedByUser(false);
      setIsPlaying(false);
    }
  };

  const handleVideoPress = async () => {
    if (!isVideoPost) return;

    if (hasEnded) {
      setHasEnded(false);
      setIsPausedByUser(false);
      await videoRef.current?.setPositionAsync(0);
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
    await videoRef.current?.setPositionAsync(0);
  };

  const renderMedia = () => {
    if (item.type === 'image' && item.image) {
      return (
        <View style={styles.mediaWrap}>
          <Image source={{ uri: item.image }} style={styles.media} />
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
          <Video
            ref={videoRef}
            source={{ uri: item.video }}
            style={styles.video}
            resizeMode={ResizeMode.COVER}
            shouldPlay={shouldAutoPlay}
            isLooping={false}
            isMuted={isMuted}
            usePoster
            posterSource={item.thumbnail ? { uri: item.thumbnail } : undefined}
            onPlaybackStatusUpdate={onPlaybackStatusUpdate}
          />

          <TouchableOpacity
            style={styles.muteButton}
            onPress={() => setIsMuted((prev) => !prev)}
            accessibilityRole="button"
            accessibilityLabel={isMuted ? 'Ativar som' : 'Silenciar vídeo'}
          >
            <Ionicons name={isMuted ? 'volume-mute' : 'volume-high'} size={18} color="#F8F9FF" />
          </TouchableOpacity>

          {!isPlaying && isVisible && isPausedByUser && !hasEnded && (
            <TouchableOpacity
              style={styles.centerButton}
              onPress={handleVideoPress}
              accessibilityRole="button"
              accessibilityLabel="Continuar vídeo"
            >
              <Ionicons name="play" size={30} color="#F8F9FF" />
            </TouchableOpacity>
          )}

          {hasEnded && (
            <TouchableOpacity
              style={styles.centerButton}
              onPress={handleReplay}
              accessibilityRole="button"
              accessibilityLabel="Reproduzir vídeo novamente"
            >
              <Ionicons name="refresh" size={28} color="#F8F9FF" />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      );
    }

    return null;
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Image source={{ uri: item.avatar }} style={styles.cardAvatar} />
        <View style={{ flex: 1 }}>
          <Text style={styles.cardUser}>{item.user}</Text>
          <Text style={styles.cardSub}>{item.timeLabel} • público</Text>
        </View>
        <Ionicons name="ellipsis-horizontal" size={18} color="#B9BDD4" />
      </View>

      {renderMedia()}

      {/* Ações compactas: curtir, comentar, repostar e compartilhar + salvar */}
      <View style={styles.actions}>
        <View style={styles.actionsLeft}>
          <Animated.View style={[styles.actionItem, { transform: [{ scale: likeScale }] }]}>
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
            <Text style={styles.actionCount}>{formatCount(item.likes + (liked ? 1 : 0))}</Text>
          </Animated.View>

          <Animated.View style={[styles.actionItem, { transform: [{ scale: commentScale }, { translateX: commentOffset }] }]}>
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
            <Text style={styles.actionCount}>{formatCount(item.comments)}</Text>
          </Animated.View>

          <Animated.View style={[styles.actionItem, { transform: [{ scale: repostScale }] }]}>
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
            <Text style={styles.actionCount}>{formatCount(item.reposts + (reposted ? 1 : 0))}</Text>
          </Animated.View>

          <Animated.View style={[styles.actionItem, { transform: [{ translateX: shareTranslate }] }]}>
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
            <Text style={styles.actionCount}>{formatCount(item.shares)}</Text>
          </Animated.View>
        </View>

        <Animated.View style={{ transform: [{ rotateY: saveRotateDeg }] }}>
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
        </Animated.View>
      </View>

      <Text style={styles.caption}><Text style={styles.cardUser}>{item.user}</Text> {item.text}</Text>
      {!!postTags && <Text style={styles.tags}>{postTags}</Text>}
    </View>
  );
});

export default function Home() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [visiblePostIds, setVisiblePostIds] = useState<string[]>([]);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: Array<{ item: Post }> }) => {
    const ids = viewableItems.map((entry) => entry.item.id);
    setVisiblePostIds(ids);
  }).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 65 }).current;

  const openComments = useCallback((post: Post) => {
    navigation.navigate('ComentariosPostagem', {
      post: {
        id: post.id,
        user: post.user,
        avatar: post.avatar,
        text: post.text,
        type: post.type,
      },
    });
  }, [navigation]);


  const openStoryViewer = useCallback((userIndex: number) => {
    navigation.navigate('StoryViewer', {
      users: STORIES,
      initialUserIndex: userIndex,
      initialStoryIndex: 0,
    });
  }, [navigation]);

  const renderPost = useCallback(
    ({ item }: { item: Post }) => (
      <PostCard item={item} isVisible={visiblePostIds.includes(item.id)} onOpenComments={openComments} />
    ),
    [openComments, visiblePostIds]
  );

  const FeedHeader = () => (
    <View style={styles.storiesWrap}>
      <FlatList
        horizontal
        data={STORIES}
        keyExtractor={(s) => s.id}
        renderItem={({ item, index }) => <StoryCard item={item} onPress={() => openStoryViewer(index)} />}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 12 }}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.root} edges={['left', 'right']}>
      <LinearGradient colors={['#0E0E12', '#11142a', '#0E0E12']} start={[0,0]} end={[1,1]} style={StyleSheet.absoluteFill} />

      {/* Topo fixo: nome + sino */}
      <View style={[styles.topBar, { paddingTop: insets.top }]}>
        <Text style={styles.logo}>Kachan!</Text>
        <View style={{ flex: 1 }} />
        <TouchableOpacity style={{ padding: 6 }} accessibilityLabel="Notificações" accessibilityRole="button">
          <MaterialCommunityIcons name="bell-outline" size={22} color="#E5E7F4" />
        </TouchableOpacity>
      </View>

      {/* Feed: Stories no header (sobem juntos) */}
      <FlatList
        data={POSTS}
        keyExtractor={(p) => p.id}
        renderItem={renderPost}
        ListHeaderComponent={FeedHeader}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        removeClippedSubviews={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />
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
  cardHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingBottom: 10, paddingTop: 6 },
  cardAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  cardUser: { color: '#fff', fontWeight: '700' },
  cardSub: { color: '#A8ACBF', fontSize: 11, marginTop: 2 },

  // mídia com aspectRatio (evita reflow)
  mediaWrap: { width, backgroundColor: '#15182f' },
  media: { width: '100%', aspectRatio: 0.9, resizeMode: 'cover' },

  videoWrap: {
    width,
    backgroundColor: '#15182f',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  verticalVideoWrap: { aspectRatio: 9 / 16 },
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
});
