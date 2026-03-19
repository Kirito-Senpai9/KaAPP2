import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image, TouchableOpacity,
  Animated, Dimensions, ImageBackground, Easing, Modal, Pressable, BackHandler
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AVPlaybackStatus, ResizeMode, Video } from 'expo-av';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList, StoryUser } from '@/navigation/types';
import { useFeed } from '@/features/feed/hooks/useFeed';
import CommentsBottomSheet from '@/components/CommentsBottomSheet';
import type { Post } from '@/types/social';

const { width } = Dimensions.get('window');

type MenuAnchor = {
  x: number;
  y: number;
  width: number;
  height: number;
};

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
  onOpenContextMenu: (post: Post, anchor: MenuAnchor) => void;
};

const PostCard = memo(function PostCard({
  item,
  isVisible,
  onOpenComments,
  onOpenContextMenu,
}: PostCardProps) {
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
  const menuButtonRef = useRef<View | null>(null);

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
  const commentOffset  = commentShake.interpolate({ inputRange: [-1, 1], outputRange: [-3, 3] });
  const saveRotateDeg  = saveRotateY.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
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

  const handleOpenContextMenu = () => {
    menuButtonRef.current?.measureInWindow((x, y, measuredWidth, measuredHeight) => {
      onOpenContextMenu(item, { x, y, width: measuredWidth, height: measuredHeight });
    });
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Image source={{ uri: item.avatar }} style={styles.cardAvatar} />
        <View style={{ flex: 1 }}>
          <Text style={styles.cardUser}>{item.user}</Text>
          <Text style={styles.cardSub}>{item.timeLabel} • público</Text>
        </View>
        <TouchableOpacity
          ref={menuButtonRef}
          style={styles.moreButton}
          onPress={handleOpenContextMenu}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={`Abrir menu da postagem de ${item.user}`}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="ellipsis-horizontal" size={18} color="#B9BDD4" />
        </TouchableOpacity>
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
  const { posts, stories } = useFeed();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [visiblePostIds, setVisiblePostIds] = useState<string[]>([]);
  const [menuData, setMenuData] = useState<{ post: Post; anchor: MenuAnchor } | null>(null);
  const [commentsPost, setCommentsPost] = useState<Post | null>(null);
  const menuOpacity = useRef(new Animated.Value(0)).current;
  const menuScale = useRef(new Animated.Value(0.95)).current;

  const isMenuVisible = !!menuData;

  const closeContextMenu = useCallback((onEnd?: () => void) => {
    Animated.parallel([
      Animated.timing(menuOpacity, { toValue: 0, duration: 120, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(menuScale, { toValue: 0.95, duration: 120, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start(() => {
      setMenuData(null);
      onEnd?.();
    });
  }, [menuOpacity, menuScale]);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: Array<{ item: Post }> }) => {
    const ids = viewableItems.map((entry) => entry.item.id);
    setVisiblePostIds(ids);
  }).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 65 }).current;

  const openComments = useCallback((post: Post) => {
    setCommentsPost(post);
  }, []);

  const closeComments = useCallback(() => {
    setCommentsPost(null);
  }, []);

  const openContextMenu = useCallback((post: Post, anchor: MenuAnchor) => {
    menuOpacity.setValue(0);
    menuScale.setValue(0.95);
    setMenuData({ post, anchor });
  }, [menuOpacity, menuScale]);

  useEffect(() => {
    if (!isMenuVisible) return;

    Animated.parallel([
      Animated.timing(menuOpacity, { toValue: 1, duration: 160, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(menuScale, { toValue: 1, duration: 160, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [isMenuVisible, menuOpacity, menuScale]);

  useEffect(() => {
    if (!isMenuVisible) return;

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      closeContextMenu();
      return true;
    });

    return () => subscription.remove();
  }, [closeContextMenu, isMenuVisible]);

  useEffect(() => {
    if (!commentsPost) return;

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      closeComments();
      return true;
    });

    return () => subscription.remove();
  }, [closeComments, commentsPost]);

  const menuPosition = useMemo(() => {
    if (!menuData) return { top: 0, left: 0 };

    const menuWidth = 232;
    const menuHeight = 276;
    const edgeOffset = 10;
    const anchorGap = 8;
    const windowHeight = Dimensions.get('window').height;

    const unclampedLeft = menuData.anchor.x + menuData.anchor.width - menuWidth;
    const left = Math.min(
      Math.max(unclampedLeft, edgeOffset),
      width - menuWidth - edgeOffset,
    );

    const belowTop = menuData.anchor.y + menuData.anchor.height + anchorGap;
    const maxTop = windowHeight - insets.bottom - menuHeight - edgeOffset;
    const top = belowTop > maxTop
      ? Math.max(insets.top + edgeOffset, menuData.anchor.y - menuHeight - anchorGap)
      : belowTop;

    return { top, left };
  }, [insets.bottom, insets.top, menuData]);

  const handleMenuAction = useCallback((action: 'profile' | 'unfollow' | 'interested' | 'not_interested' | 'report') => {
    if (menuData) {
      console.log(`[ContextMenu] ${action} em ${menuData.post.user}`);
    }
    closeContextMenu();
  }, [closeContextMenu, menuData]);


  const openStoryViewer = useCallback((userIndex: number) => {
    navigation.navigate('StoryViewer', {
      users: stories,
      initialUserIndex: userIndex,
      initialStoryIndex: 0,
    });
  }, [navigation]);

  const renderPost = useCallback(
    ({ item }: { item: Post }) => (
      <PostCard
        item={item}
        isVisible={visiblePostIds.includes(item.id)}
        onOpenComments={openComments}
        onOpenContextMenu={openContextMenu}
      />
    ),
    [openComments, openContextMenu, visiblePostIds]
  );

  const FeedHeader = () => (
    <View style={styles.storiesWrap}>
      <FlatList
        horizontal
        data={stories}
        initialNumToRender={4}
        windowSize={3}
        maxToRenderPerBatch={5}
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
        data={posts}
        initialNumToRender={3}
        windowSize={5}
        maxToRenderPerBatch={4}
        keyExtractor={(p) => p.id}
        renderItem={renderPost}
        ListHeaderComponent={FeedHeader}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        removeClippedSubviews={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />

      <CommentsBottomSheet
        visible={!!commentsPost}
        post={
          commentsPost
            ? {
                id: commentsPost.id,
                user: commentsPost.user,
                avatar: commentsPost.avatar,
                text: commentsPost.text,
              }
            : null
        }
        onClose={closeComments}
        autoFocusOnOpen
      />



      <Modal transparent visible={isMenuVisible} animationType="none" onRequestClose={() => closeContextMenu()}>
        <View style={styles.menuOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => closeContextMenu()} />

          <Animated.View
            style={[
              styles.contextMenu,
              {
                top: menuPosition.top,
                left: menuPosition.left,
                opacity: menuOpacity,
                transform: [{ scale: menuScale }],
              },
            ]}
          >
            <Pressable
              style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
              onPress={() => handleMenuAction('profile')}
            >
              <Ionicons name="person-outline" size={18} color="#E4E7FB" />
              <Text style={styles.menuText}>Perfil</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
              onPress={() => handleMenuAction('unfollow')}
            >
              <Ionicons name="person-remove-outline" size={18} color="#E4E7FB" />
              <Text style={styles.menuText}>Deixar de seguir</Text>
            </Pressable>

            <View style={styles.menuDivider} />

            <Pressable
              style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
              onPress={() => handleMenuAction('interested')}
            >
              <Ionicons name="star-outline" size={18} color="#E4E7FB" />
              <Text style={styles.menuText}>Tenho interesse</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
              onPress={() => handleMenuAction('not_interested')}
            >
              <Ionicons name="ban-outline" size={18} color="#E4E7FB" />
              <Text style={styles.menuText}>Não tenho interesse</Text>
            </Pressable>

            <View style={styles.menuDivider} />

            <Pressable
              style={({ pressed }) => [styles.menuItem, styles.reportMenuItem, pressed && styles.reportMenuItemPressed]}
              onPress={() => handleMenuAction('report')}
            >
              <Ionicons name="flag-outline" size={18} color="#FF6C7A" />
              <Text style={styles.reportMenuText}>Denunciar</Text>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>
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
  moreButton: {
    minWidth: 28,
    minHeight: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
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

  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(6, 7, 14, 0.18)',
  },
  contextMenu: {
    position: 'absolute',
    width: 232,
    borderRadius: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(18, 22, 42, 0.95)',
    shadowColor: '#03050F',
    shadowOpacity: 0.34,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 44,
    paddingHorizontal: 14,
  },
  menuItemPressed: {
    backgroundColor: 'rgba(137, 153, 236, 0.14)',
  },
  menuText: {
    color: '#E4E7FB',
    fontSize: 14,
    fontWeight: '600',
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(237, 239, 255, 0.16)',
    marginVertical: 6,
    marginHorizontal: 10,
  },
  reportMenuItem: {
    marginTop: 2,
  },
  reportMenuItemPressed: {
    backgroundColor: 'rgba(255, 108, 122, 0.14)',
  },
  reportMenuText: {
    color: '#FF6C7A',
    fontSize: 14,
    fontWeight: '700',
  },
});
