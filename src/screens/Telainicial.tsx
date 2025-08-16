import React, { useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image, TouchableOpacity,
  Animated, Dimensions, SafeAreaView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

type Story = { id: string; name: string; avatar: string; };
type Post = { id: string; user: string; avatar: string; image: string; text: string; likes: number; comments: number; };

const STORIES: Story[] = [
  { id: '1', name: 'Você', avatar: 'https://i.pravatar.cc/150?img=1' },
  { id: '2', name: 'Luna',  avatar: 'https://i.pravatar.cc/150?img=2' },
  { id: '3', name: 'Kai',   avatar: 'https://i.pravatar.cc/150?img=3' },
  { id: '4', name: 'Mina',  avatar: 'https://i.pravatar.cc/150?img=4' },
  { id: '5', name: 'Dex',   avatar: 'https://i.pravatar.cc/150?img=5' },
  { id: '6', name: 'Yumi',  avatar: 'https://i.pravatar.cc/150?img=6' },
];

const POSTS: Post[] = [
  {
    id: 'p1',
    user: 'Luna',
    avatar: 'https://i.pravatar.cc/150?img=2',
    image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=1080&auto=format&fit=crop',
    text: 'Primeiro post do dia! #kachan',
    likes: 128,
    comments: 14,
  },
  {
    id: 'p2',
    user: 'Kai',
    avatar: 'https://i.pravatar.cc/150?img=3',
    image: 'https://images.unsplash.com/photo-1517816743773-6e0fd518b4a6?q=80&w=1080&auto=format&fit=crop',
    text: 'Gameplay hoje às 20h 🎮',
    likes: 245,
    comments: 30,
  },
];

export default function Telainicial({ navigation }: any) {
  const fabScale = useRef(new Animated.Value(1)).current;

  const onFabPressIn = () => Animated.spring(fabScale, { toValue: 0.95, useNativeDriver: true }).start();
  const onFabPressOut = () => Animated.spring(fabScale, { toValue: 1, friction: 3, useNativeDriver: true }).start();

  const renderStory = ({ item }: { item: Story }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      style={styles.storyItem}
      onPress={() => navigation.navigate('StoryViewer', { user: item })}
    >
      <LinearGradient
        colors={['#FF5F6D', '#6C63FF', '#2230C3']}
        start={[0, 0]}
        end={[1, 1]}
        style={styles.storyRing}
      >
        <View style={styles.storyInner}>
          <Image source={{ uri: item.avatar }} style={styles.storyAvatar} />
        </View>
      </LinearGradient>
      <Text numberOfLines={1} style={styles.storyName}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderPost = ({ item }: { item: Post }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Image source={{ uri: item.avatar }} style={styles.cardAvatar} />
        <Text style={styles.cardUser}>{item.user}</Text>
        <View style={{ flex: 1 }} />
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
      <LinearGradient
        colors={['#0E0E12', '#11142a', '#0E0E12']}
        start={[0, 0]} end={[1, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.topBar}>
        <Text style={styles.logo}>Kachan!</Text>
        <View style={{ flex: 1 }} />
        <TouchableOpacity style={{ padding: 6 }}>
          <MaterialCommunityIcons name="bell-outline" size={22} color="#E5E7F4" />
        </TouchableOpacity>
      </View>

      <View style={styles.storiesWrap}>
        <FlatList
          horizontal
          data={STORIES}
          keyExtractor={(s) => s.id}
          renderItem={renderStory}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 14 }}
        />
      </View>

      <FlatList
        data={POSTS}
        keyExtractor={(p) => p.id}
        renderItem={renderPost}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      />

      <Animated.View style={[styles.fabWrap, { transform: [{ scale: fabScale }] }] }>
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

const AVATAR = 62;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0E0E12' },

  topBar: {
    height: 52, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16,
  },
  logo: { color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: 0.3 },

  storiesWrap: { paddingVertical: 10 },

  storyItem: { width: AVATAR + 16, alignItems: 'center', marginHorizontal: 6 },
  storyRing: {
    width: AVATAR, height: AVATAR, borderRadius: AVATAR / 2,
    alignItems: 'center', justifyContent: 'center',
  },
  storyInner: {
    width: AVATAR - 6, height: AVATAR - 6, borderRadius: (AVATAR - 6) / 2,
    backgroundColor: '#0E0E12', alignItems: 'center', justifyContent: 'center',
  },
  storyAvatar: { width: AVATAR - 10, height: AVATAR - 10, borderRadius: (AVATAR - 10) / 2 },
  storyName: { color: '#C9CBE2', fontSize: 11, marginTop: 6, maxWidth: AVATAR + 16 },

  card: {
    width, paddingBottom: 10, marginBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingBottom: 10 },
  cardAvatar: { width: 34, height: 34, borderRadius: 17, marginRight: 10 },
  cardUser: { color: '#fff', fontWeight: '700' },

  mediaWrap: { width, height: width * 1.1, backgroundColor: '#15182f' },
  media: { width: '100%', height: '100%' },

  actions: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingTop: 8 },
  actionsLeft: { flexDirection: 'row', alignItems: 'center' },
  actionBtn: { padding: 8 },

  meta: { color: '#BDC1DA', fontSize: 12, paddingHorizontal: 14, marginTop: 2 },
  caption: { color: '#E6E8F5', paddingHorizontal: 14, marginTop: 4 },

  fabWrap: { position: 'absolute', right: 18, bottom: 28 },
  fab: { borderRadius: 26, overflow: 'hidden' },
  fabBg: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
});

