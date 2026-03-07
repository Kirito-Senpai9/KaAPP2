import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image, TouchableOpacity,
  Animated, Dimensions, ImageBackground, Easing
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ResizeMode, Video } from 'expo-av';

const { width } = Dimensions.get('window');

type Story = { id: string; name: string; cover: string; avatar: string; };
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
const STORIES: Story[] = [
  { id: '1', name: 'Você', cover: 'https://images.unsplash.com/photo-1520975922284-9d08b6d8f6a0?w=1200&q=80&auto=format&fit=crop', avatar: 'https://i.pravatar.cc/150?img=1' },
  { id: '2', name: 'Lua',  cover: 'https://images.unsplash.com/photo-1520975594081-3a43b00abd98?w=1200&q=80&auto=format&fit=crop', avatar: 'https://i.pravatar.cc/150?img=2' },
  { id: '3', name: 'Kai',  cover: 'https://images.unsplash.com/photo-1517816743773-6e0fd518b4a6?w=1200&q=80&auto=format&fit=crop', avatar: 'https://i.pravatar.cc/150?img=3' },
  { id: '4', name: 'Mina', cover: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&q=80&auto=format&fit=crop', avatar: 'https://i.pravatar.cc/150?img=4' },
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
const StoryCard = memo(function StoryCard({ item }: { item: Story }) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      style={styles.storyItem}
      accessibilityRole="button"
      accessibilityLabel={`Story de ${item.name}`}
    >
      <ImageBackground
        source={{ uri: item.cover }}
        style={styles.storyBg}
        imageStyle={styles.storyBgImage}
        resizeMode="cover"
      >
        <View style={styles.storyAvatarWrap}>
          <Image source={{ uri: item.avatar }} style={styles.storyAvatar} />
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
});

/* --- Card do Post (com animações) --- */
type PostCardProps = { item: Post; isVisible: boolean };

const PostCard = memo(function PostCard({ item, isVisible }: PostCardProps) {
  const [liked, setLiked] = useState(false);
  const [reposted, setReposted] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isHorizontalPlaying, setIsHorizontalPlaying] = useState(false);

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

  useEffect(() => {
    if (!isVisible && isHorizontalPlaying) {
      setIsHorizontalPlaying(false);
    }
  }, [isHorizontalPlaying, isVisible]);

  const renderMedia = () => {
    if (item.type === 'image' && item.image) {
      return (
        <View style={styles.mediaWrap}>
          <Image source={{ uri: item.image }} style={styles.media} />
        </View>
      );
    }

    if (item.type === 'video-vertical' && item.video) {
      return (
        <View style={styles.verticalVideoWrap}>
          <Video
            source={{ uri: item.video }}
            style={styles.verticalVideo}
            resizeMode={ResizeMode.COVER}
            shouldPlay={isVisible}
            isLooping
            isMuted
            usePoster
            posterSource={item.thumbnail ? { uri: item.thumbnail } : undefined}
          />
        </View>
      );
    }

    if (item.type === 'video-horizontal' && item.video) {
      return (
        <View style={styles.horizontalVideoWrap}>
          <Video
            source={{ uri: item.video }}
            style={styles.horizontalVideo}
            resizeMode={ResizeMode.COVER}
            shouldPlay={isHorizontalPlaying}
            usePoster
            posterSource={item.thumbnail ? { uri: item.thumbnail } : undefined}
            onPlaybackStatusUpdate={(status) => {
              if (status.isLoaded && status.didJustFinish) {
                setIsHorizontalPlaying(false);
              }
            }}
          />

          {!isHorizontalPlaying && (
            <TouchableOpacity
              style={styles.playButton}
              onPress={() => setIsHorizontalPlaying(true)}
              accessibilityRole="button"
              accessibilityLabel="Reproduzir vídeo"
            >
              <Ionicons name="play" size={30} color="#F8F9FF" />
            </TouchableOpacity>
          )}
        </View>
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
  const [visiblePostIds, setVisiblePostIds] = useState<string[]>([]);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: Array<{ item: Post }> }) => {
    const ids = viewableItems.map((entry) => entry.item.id);
    setVisiblePostIds(ids);
  }).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 65 }).current;

  const renderPost = useCallback(
    ({ item }: { item: Post }) => <PostCard item={item} isVisible={visiblePostIds.includes(item.id)} />,
    [visiblePostIds]
  );

  const FeedHeader = () => (
    <View style={styles.storiesWrap}>
      <FlatList
        horizontal
        data={STORIES}
        keyExtractor={(s) => s.id}
        renderItem={({ item }) => <StoryCard item={item} />}
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

  verticalVideoWrap: {
    width,
    alignItems: 'center',
    backgroundColor: '#15182f',
    paddingVertical: 10,
  },
  verticalVideo: {
    width: width * 0.74,
    aspectRatio: 9 / 16,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#0A0C1A',
  },

  horizontalVideoWrap: {
    width,
    aspectRatio: 16 / 9,
    backgroundColor: '#15182f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  horizontalVideo: {
    width: '100%',
    height: '100%',
  },
  playButton: {
    position: 'absolute',
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(14, 14, 18, 0.55)',
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
