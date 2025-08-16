import React, { useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image, TouchableOpacity,
  Animated, Dimensions, SafeAreaView, ImageBackground
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

type Story = { id: string; name: string; cover: string; avatar: string; };
type Post = { id: string; user: string; avatar: string; image: string; text: string; likes: number; comments: number; };

const STORIES: Story[] = [
  {
    id: '1',
    name: 'Você',
    cover: 'https://images.unsplash.com/photo-1520975922284-9d08b6d8f6a0?w=1200&q=80&auto=format&fit=crop',
    avatar: 'https://i.pravatar.cc/150?img=1',
  },
  {
    id: '2',
    name: 'Lua',
    cover: 'https://images.unsplash.com/photo-1520975594081-3a43b00abd98?w=1200&q=80&auto=format&fit=crop',
    avatar: 'https://i.pravatar.cc/150?img=2',
  },
  {
    id: '3',
    name: 'Kai',
    cover: 'https://images.unsplash.com/photo-1517816743773-6e0fd518b4a6?w=1200&q=80&auto=format&fit=crop',
    avatar: 'https://i.pravatar.cc/150?img=3',
  },
  {
    id: '4',
    name: 'Mina',
    cover: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&q=80&auto=format&fit=crop',
    avatar: 'https://i.pravatar.cc/150?img=4',
  },
  {
    id: '5',
    name: 'Dex',
    cover: 'https://images.unsplash.com/photo-1517816428104-797678c7cf0c?w=1200&q=80&auto=format&fit=crop',
    avatar: 'https://i.pravatar.cc/150?img=5',
  },
];

const POSTS: Post[] = [
  {
    id: 'p1',
    user: 'Luna',
    avatar: 'https://i.pravatar.cc/150?img=2',
    image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1600&q=80&auto=format&fit=crop',
    text: 'Explorando um novo mapa hoje! #kachan',
    likes: 128,
    comments: 14,
  },
  {
    id: 'p2',
    user: 'Kai',
    avatar: 'https://i.pravatar.cc/150?img=3',
    image: 'https://images.unsplash.com/photo-1517816743773-6e0fd518b4a6?w=1600&q=80&auto=format&fit=crop',
    text: 'Live às 20h 🎮 cola lá!',
    likes: 245,
    comments: 30,
  },
];

/** ===== Story no estilo Facebook: cover com radius 15 + avatar topo-direito + nome no rodapé ===== */
function StoryCard({ item, onPress }: { item: Story; onPress: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.9} style={styles.storyItem} onPress={onPress}>
      <ImageBackground
        source={{ uri: item.cover }}
        style={styles.storyBg}
        imageStyle={styles.storyBgImage}
        resizeMode="cover"
      >
        {/* Avatar circular no canto superior-direito */}
        <View style={styles.storyAvatarWrap}>
          <Image source={{ uri: item.avatar }} style={styles.storyAvatar} />
        </View>

        {/* Nome do usuário no rodapé */}
        <Text style={styles.storyName} numberOfLines={1}>{item.name}</Text>
      </ImageBackground>
    </TouchableOpacity>
  );
}

export default function Telainicial({ navigation }: any) {
  const fabScale = useRef(new Animated.Value(1)).current;
  const onFabPressIn = () => Animated.spring(fabScale, { toValue: 0.95, useNativeDriver: true }).start();
  const onFabPressOut = () => Animated.spring(fabScale, { toValue: 1, friction: 3, useNativeDriver: true }).start();

  const renderStory = ({ item }: { item: Story }) => (
    <StoryCard
      item={item}
      onPress={() => navigation.navigate('StoryViewer', { user: { name: item.name, avatar: item.avatar } })}
    />
  );

  const renderPost = ({ item }: { item: Post }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Image source={{ uri: item.avatar }} style={styles.cardAvatar} />
        <View style={{ flex: 1 }}>
          <Text style={styles.cardUser}>{item.user}</Text>
          <Text style={styles.cardSub}>agora • público</Text>
        </View>
        <Ionicons name="ellipsis-horizontal" size={18} color="#B9BDD4" />
      </View>

      <View style={styles.mediaWrap}>
        <Image source={{ uri: item.image }} style={styles.media} />
      </View>

      <View style={styles.actions}>
        <View style={styles.actionsLeft}>
          <TouchableOpacity style={styles.actionBtn}><Ionicons name="heart-outline" size={22} color="#E5E7F4" /></TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}><Ionicons name="chatbubble-outline" size={22} color="#E5E7F4" /></TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}><Ionicons name="paper-plane-outline" size={22} color="#E5E7F4" /></TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.actionBtn}><Ionicons name="bookmark-outline" size={22} color="#E5E7F4" /></TouchableOpacity>
      </View>

      <Text style={styles.meta}>{item.likes} curtidas • {item.comments} comentários</Text>
      <Text style={styles.caption}><Text style={styles.cardUser}>{item.user}</Text> {item.text}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.root}>
      {/* Fundo gradiente sutil */}
      <LinearGradient
        colors={['#0E0E12', '#11142a', '#0E0E12']}
        start={[0, 0]} end={[1, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Top bar */}
      <View style={styles.topBar}>
        <Text style={styles.logo}>Kachan!</Text>
        <View style={{ flex: 1 }} />
        <TouchableOpacity style={{ padding: 6 }}>
          <MaterialCommunityIcons name="bell-outline" size={22} color="#E5E7F4" />
        </TouchableOpacity>
      </View>

      {/* Stories */}
      <View style={styles.storiesWrap}>
        <FlatList
          horizontal
          data={STORIES}
          keyExtractor={(s) => s.id}
          renderItem={renderStory}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12 }}
        />
      </View>

      {/* Feed */}
      <FlatList
        data={POSTS}
        keyExtractor={(p) => p.id}
        renderItem={renderPost}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      />

      {/* FAB */}
      <Animated.View style={[styles.fabWrap, { transform: [{ scale: fabScale }] }]}> 
        <TouchableOpacity
          activeOpacity={0.9}
          onPressIn={onFabPressIn}
          onPressOut={onFabPressOut}
          onPress={() => {}}
          style={styles.fab}
        >
          <LinearGradient colors={['#6C63FF', '#2230C3']} start={[0,0]} end={[1,1]} style={styles.fabBg}>
            <Ionicons name="add" size={26} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

/** ===== estilos ===== */
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0E0E12' },

  topBar: {
    height: 52, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16,
  },
  logo: { color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: 0.3 },

  /** Stories — estilo Facebook */
  storiesWrap: { paddingVertical: 10 },
  storyItem: { width: 100, height: 130, marginHorizontal: 6 },
  storyBg: { flex: 1, borderRadius: 15, overflow: 'hidden', justifyContent: 'flex-end' },
  storyBgImage: { borderRadius: 15 },

  storyAvatarWrap: {
    position: 'absolute',
    top: 6,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  storyAvatar: { width: '100%', height: '100%', borderRadius: 14 },

  storyName: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 6,
    paddingVertical: 4,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },

  /** Cards do feed */
  card: {
    width, paddingBottom: 12, marginBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingBottom: 10 },
  cardAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  cardUser: { color: '#fff', fontWeight: '700' },
  cardSub: { color: '#A8ACBF', fontSize: 11, marginTop: 2 },

  mediaWrap: { width, height: width * 1.1, backgroundColor: '#15182f' },
  media: { width: '100%', height: '100%' },

  actions: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingTop: 8 },
  actionsLeft: { flexDirection: 'row', alignItems: 'center' },
  actionBtn: { padding: 8 },

  meta: { color: '#BDC1DA', fontSize: 12, paddingHorizontal: 14, marginTop: 2 },
  caption: { color: '#E6E8F5', paddingHorizontal: 14, marginTop: 4 },

  /** FAB */
  fabWrap: { position: 'absolute', right: 18, bottom: 28 },
  fab: { borderRadius: 26, overflow: 'hidden' },
  fabBg: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
});

