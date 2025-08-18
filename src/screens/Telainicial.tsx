import React, { memo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image, TouchableOpacity,
  Animated, Dimensions, SafeAreaView, ImageBackground, Easing
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

type Story = { id: string; name: string; cover: string; avatar: string; };
type Post  = { id: string; user: string; avatar: string; image: string; text: string; likes: number; comments: number; };

/* --- MOCK --- */
const STORIES: Story[] = [
  { id: '1', name: 'Você', cover: 'https://images.unsplash.com/photo-1520975922284-9d08b6d8f6a0?w=1200&q=80&auto=format&fit=crop', avatar: 'https://i.pravatar.cc/150?img=1' },
  { id: '2', name: 'Lua',  cover: 'https://images.unsplash.com/photo-1520975594081-3a43b00abd98?w=1200&q=80&auto=format&fit=crop', avatar: 'https://i.pravatar.cc/150?img=2' },
  { id: '3', name: 'Kai',  cover: 'https://images.unsplash.com/photo-1517816743773-6e0fd518b4a6?w=1200&q=80&auto=format&fit=crop', avatar: 'https://i.pravatar.cc/150?img=3' },
  { id: '4', name: 'Mina', cover: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&q=80&auto=format&fit=crop', avatar: 'https://i.pravatar.cc/150?img=4' },
];

const POSTS: Post[] = [
  { id: 'p1', user: 'Luna', avatar: 'https://i.pravatar.cc/150?img=2', image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1600&q=80&auto=format&fit=crop', text: 'Explorando um novo mapa hoje! #kachan', likes: 128, comments: 14 },
  { id: 'p2', user: 'Kai',  avatar: 'https://i.pravatar.cc/150?img=3', image: 'https://images.unsplash.com/photo-1517816743773-6e0fd518b4a6?w=1600&q=80&auto=format&fit=crop', text: 'Live às 20h 🎮 cola lá!', likes: 245, comments: 30 },
];

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
const PostCard = memo(function PostCard({ item }: { item: Post }) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  const likeScale    = useRef(new Animated.Value(1)).current;
  const commentScale = useRef(new Animated.Value(1)).current;
  const commentShake = useRef(new Animated.Value(0)).current;
  const shareX       = useRef(new Animated.Value(0)).current;
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

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Image source={{ uri: item.avatar }} style={styles.cardAvatar} />
        <View style={{ flex: 1 }}>
          <Text style={styles.cardUser}>{item.user}</Text>
          <Text style={styles.cardSub}>agora • público</Text>
        </View>
        <Ionicons name="ellipsis-horizontal" size={18} color="#B9BDD4" />
      </View>

      {/* mídia: usa aspectRatio para evitar reflow no web */}
      <View style={styles.mediaWrap}>
        <Image source={{ uri: item.image }} style={styles.media} />
      </View>

      {/* Ações: esquerda (curtir/comentar/compartilhar) | direita (favoritar) */}
      <View style={styles.actions}>
        <View style={styles.actionsLeft}>
          <Animated.View style={{ transform: [{ scale: likeScale }] }}>
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
          </Animated.View>

          <Animated.View style={{ transform: [{ scale: commentScale }, { translateX: commentOffset }] }}>
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
          </Animated.View>

          <Animated.View style={{ transform: [{ translateX: shareTranslate }] }}>
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

      <Text style={styles.meta}>{item.likes + (liked ? 1 : 0)} curtidas • {item.comments} comentários</Text>
      <Text style={styles.caption}><Text style={styles.cardUser}>{item.user}</Text> {item.text}</Text>
    </View>
  );
});

export default function Home() {
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
    <SafeAreaView style={styles.root}>
      <LinearGradient colors={['#0E0E12', '#11142a', '#0E0E12']} start={[0,0]} end={[1,1]} style={StyleSheet.absoluteFill} />

      {/* Topo fixo: nome + sino */}
      <View style={styles.topBar}>
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
        renderItem={({ item }) => <PostCard item={item} />}
        ListHeaderComponent={FeedHeader}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        removeClippedSubviews={false}
      />
    </SafeAreaView>
  );
}

/* --- estilos --- */
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0E0E12' },

  // topo fixo
  topBar: { height: 52, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
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

  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8, paddingTop: 8,
  },
  actionsLeft: { flexDirection: 'row', alignItems: 'center' },
  actionBtn: { padding: 8 },

  meta: { color: '#BDC1DA', fontSize: 12, paddingHorizontal: 14, marginTop: 2 },
  caption: { color: '#E6E8F5', paddingHorizontal: 14, marginTop: 4 },
});
