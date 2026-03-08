import React, { useMemo, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ComentariosPostagem'>;

type CommentItem = {
  id: string;
  user: string;
  avatar: string;
  content: string;
  createdAt: number;
  likes: number;
  liked?: boolean;
  replies: CommentItem[];
  sticker?: {
    label: string;
    uri: string;
    animated?: boolean;
  };
};

type FlattenedComment = {
  comment: CommentItem;
  depth: number;
  parentId?: string;
};

const CURRENT_USER = {
  name: 'Você',
  avatar: 'https://i.pravatar.cc/150?img=11',
};

type StickerCategoryId = 'recentes' | 'favoritos' | 'packs' | 'animados' | 'estaticos';

type StickerItem = {
  id: string;
  label: string;
  uri: string;
  category: StickerCategoryId;
  animated?: boolean;
};

const STICKER_CATEGORIES: { id: StickerCategoryId; label: string }[] = [
  { id: 'recentes', label: 'Recentes' },
  { id: 'favoritos', label: 'Favoritos' },
  { id: 'packs', label: 'Packs' },
  { id: 'animados', label: 'Animados' },
  { id: 'estaticos', label: 'Estáticos' },
];

const STICKERS: StickerItem[] = [
  {
    id: 's1',
    label: 'KaAPP Glow',
    uri: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcWhxczB5d2x6dDR0YW53Z29hamU2ejI5cjRheDFqaW9iM2x0MjNqaiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/xUPGcvDelgloOjwuFG/giphy.gif',
    category: 'animados',
    animated: true,
  },
  {
    id: 's2',
    label: 'GG',
    uri: 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92eee?auto=format&fit=crop&w=220&q=80',
    category: 'estaticos',
  },
  {
    id: 's3',
    label: 'KaAPP Heart',
    uri: 'https://images.unsplash.com/photo-1614332287897-cdc485fa562d?auto=format&fit=crop&w=220&q=80',
    category: 'favoritos',
  },
  {
    id: 's4',
    label: 'Party',
    uri: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcHp2N2V4N3c1enA3a21jOG44M2RhZnRhaW9ya2VjaW9mdzNlOWo3aSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/YnBntKOgnUSBkV7bQH/giphy.gif',
    category: 'recentes',
    animated: true,
  },
  {
    id: 's5',
    label: 'Foco',
    uri: 'https://images.unsplash.com/photo-1617791160505-6f00504e3519?auto=format&fit=crop&w=220&q=80',
    category: 'packs',
  },
  {
    id: 's6',
    label: 'KaAPP Fire',
    uri: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3BydDZ6eXQ2Y2FyZ2N6dzVwaG81M2J0d2RmcjNlNDhtOWR5NGQ0dSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/5VKbvrjxpVJCM/giphy.gif',
    category: 'animados',
    animated: true,
  },
  {
    id: 's7',
    label: 'Vibe',
    uri: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=220&q=80',
    category: 'recentes',
  },
  {
    id: 's8',
    label: 'Ranked',
    uri: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=220&q=80',
    category: 'packs',
  },
];

const INITIAL_COMMENTS: CommentItem[] = [
  {
    id: 'c1',
    user: 'Ayla',
    avatar: 'https://i.pravatar.cc/150?img=17',
    content: 'FPS estava travando no início, mas depois ficou liso!',
    createdAt: Date.now() - 1000 * 60 * 42,
    likes: 112,
    replies: [
      {
        id: 'c1-r1',
        user: 'Kai',
        avatar: 'https://i.pravatar.cc/150?img=3',
        content: 'Esse patch ajudou demais no desempenho.',
        createdAt: Date.now() - 1000 * 60 * 33,
        likes: 28,
        replies: [],
      },
    ],
  },
  {
    id: 'c2',
    user: 'Noah',
    avatar: 'https://i.pravatar.cc/150?img=5',
    content: 'Partiu mais uma ranked hoje à noite?',
    createdAt: Date.now() - 1000 * 60 * 24,
    likes: 63,
    replies: [],
  },
  {
    id: 'c3',
    user: 'Luna',
    avatar: 'https://i.pravatar.cc/150?img=2',
    content: 'Não estou arrumando desculpas 😅',
    createdAt: Date.now() - 1000 * 60 * 15,
    likes: 48,
    replies: [],
  },
];

const sortChronologically = (items: CommentItem[]): CommentItem[] =>
  [...items]
    .sort((a, b) => a.createdAt - b.createdAt)
    .map((item) => ({ ...item, replies: sortChronologically(item.replies) }));

const flattenComments = (items: CommentItem[], depth = 0, parentId?: string): FlattenedComment[] => {
  return items.flatMap((item) => [
    { comment: item, depth, parentId },
    ...flattenComments(item.replies, depth + 1, item.id),
  ]);
};

const addReplyToThread = (items: CommentItem[], parentId: string, reply: CommentItem): CommentItem[] => {
  return items.map((item) => {
    if (item.id === parentId) {
      return { ...item, replies: sortChronologically([...item.replies, reply]) };
    }

    return {
      ...item,
      replies: addReplyToThread(item.replies, parentId, reply),
    };
  });
};

const toggleLikeById = (items: CommentItem[], id: string): CommentItem[] => {
  return items.map((item) => {
    if (item.id === id) {
      const liked = !item.liked;
      return {
        ...item,
        liked,
        likes: liked ? item.likes + 1 : item.likes - 1,
      };
    }

    return { ...item, replies: toggleLikeById(item.replies, id) };
  });
};

const timeAgo = (createdAt: number) => {
  const minutes = Math.max(1, Math.floor((Date.now() - createdAt) / 60000));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h`;
  return `${Math.floor(hours / 24)} d`;
};

function CommentRow({
  entry,
  onReply,
  onLike,
}: {
  entry: FlattenedComment;
  onReply: (comment: CommentItem) => void;
  onLike: (id: string) => void;
}) {
  const pulse = useRef(new Animated.Value(1)).current;

  const animateLike = () => {
    Animated.sequence([
      Animated.spring(pulse, { toValue: 1.22, useNativeDriver: true }),
      Animated.spring(pulse, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
    onLike(entry.comment.id);
  };

  return (
    <View style={[styles.commentRow, { marginLeft: entry.depth * 22 }]}> 
      {entry.depth > 0 && <View style={styles.threadLine} />}

      <Image source={{ uri: entry.comment.avatar }} style={styles.commentAvatar} />

      <View style={styles.commentBubble}>
        <View style={styles.commentMetaRow}>
          <Text style={styles.commentUser}>{entry.comment.user}</Text>
          <Text style={styles.commentTime}>{timeAgo(entry.comment.createdAt)}</Text>
        </View>

        {!!entry.comment.sticker ? (
          <View style={styles.stickerCommentWrap}>
            <Image source={{ uri: entry.comment.sticker.uri }} style={styles.stickerImage} resizeMode="cover" />
            <Text style={styles.stickerCaption}>{entry.comment.sticker.label}</Text>
          </View>
        ) : (
          <Text style={styles.commentText}>{entry.comment.content}</Text>
        )}

        <View style={styles.commentActions}>
          <Animated.View style={{ transform: [{ scale: pulse }] }}>
            <TouchableOpacity style={styles.actionGhostBtn} onPress={animateLike}>
              <Ionicons
                name={entry.comment.liked ? 'heart' : 'heart-outline'}
                size={16}
                color={entry.comment.liked ? '#FF658D' : '#AEB4D6'}
              />
              <Text style={styles.actionGhostText}>{entry.comment.likes}</Text>
            </TouchableOpacity>
          </Animated.View>

          <Pressable onPress={() => onReply(entry.comment)}>
            <Text style={styles.actionGhostText}>Responder</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default function ComentariosPostagem({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const [comments, setComments] = useState<CommentItem[]>(sortChronologically(INITIAL_COMMENTS));
  const [input, setInput] = useState('');
  const [showStickers, setShowStickers] = useState(false);
  const [replyingTo, setReplyingTo] = useState<CommentItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<StickerCategoryId>('recentes');

  const flattened = useMemo(() => flattenComments(comments), [comments]);
  const filteredStickers = useMemo(() => {
    if (selectedCategory === 'animados') {
      return STICKERS.filter((sticker) => sticker.animated);
    }

    if (selectedCategory === 'estaticos') {
      return STICKERS.filter((sticker) => !sticker.animated);
    }

    return STICKERS.filter((sticker) => sticker.category === selectedCategory);
  }, [selectedCategory]);

  const sendComment = (sticker?: CommentItem['sticker']) => {
    const message = input.trim();
    if (!sticker && !message) return;

    const newComment: CommentItem = {
      id: `${Date.now()}`,
      user: CURRENT_USER.name,
      avatar: CURRENT_USER.avatar,
      content: sticker ? '' : message,
      sticker,
      likes: 0,
      liked: false,
      replies: [],
      createdAt: Date.now(),
    };

    setComments((prev) => {
      if (replyingTo) {
        return sortChronologically(addReplyToThread(prev, replyingTo.id, newComment));
      }

      return sortChronologically([...prev, newComment]);
    });

    setInput('');
    setShowStickers(false);
    setReplyingTo(null);
  };

  const toggleStickerPanel = () => {
    Keyboard.dismiss();
    setShowStickers((prev) => !prev);
  };

  return (
    <SafeAreaView style={styles.root} edges={['left', 'right']}>
      <LinearGradient colors={['#0E0E12', '#121532', '#0E0E12']} start={[0, 0]} end={[1, 1]} style={StyleSheet.absoluteFill} />

      <View style={[styles.header, { paddingTop: insets.top }]}> 
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color="#E9EBFA" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Comentários</Text>
          <Text style={styles.headerSubtitle}>Post de {route.params.post.user}</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 56 : 0}
        enabled
      >
        <FlatList
          data={flattened}
          keyExtractor={(item) => item.comment.id}
          renderItem={({ item }) => (
            <CommentRow
              entry={item}
              onReply={(comment) => {
                setReplyingTo(comment);
                setShowStickers(false);
              }}
              onLike={(id) => setComments((prev) => toggleLikeById(prev, id))}
            />
          )}
          style={styles.commentList}
          contentContainerStyle={{
            padding: 14,
            paddingBottom: 120 + insets.bottom,
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          showsVerticalScrollIndicator={false}
        />

        <View style={[styles.composerWrap, { paddingBottom: insets.bottom + 10 }]}> 
          {!!replyingTo && (
            <View style={styles.replyBadge}>
              <Text style={styles.replyBadgeText}>Respondendo {replyingTo.user}</Text>
              <Pressable onPress={() => setReplyingTo(null)}>
                <Ionicons name="close" size={16} color="#D5DAF6" />
              </Pressable>
            </View>
          )}

          <View style={styles.composerRow}>
            <TouchableOpacity style={styles.emojiBtn} onPress={toggleStickerPanel}>
              <Ionicons name="happy-outline" size={22} color="#D6DBF6" />
            </TouchableOpacity>
            <TextInput
              value={input}
              onChangeText={(text) => {
                setInput(text);
                if (showStickers) setShowStickers(false);
              }}
              onFocus={() => {
                setShowStickers(false);
              }}
              placeholder={replyingTo ? `Responder ${replyingTo.user}` : 'Escreva um comentário...'}
              placeholderTextColor="#8790BC"
              style={styles.input}
            />
            <TouchableOpacity style={styles.sendBtn} onPress={() => sendComment()}>
              <Ionicons name="paper-plane" size={18} color="#F7F8FF" />
            </TouchableOpacity>
          </View>

          {showStickers && (
            <View style={styles.stickerPanel}>
              <FlatList
                data={STICKER_CATEGORIES}
                horizontal
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryBar}
                renderItem={({ item }) => (
                  <Pressable
                    style={[styles.categoryChip, selectedCategory === item.id && styles.categoryChipActive]}
                    onPress={() => setSelectedCategory(item.id)}
                  >
                    <Text style={[styles.categoryChipText, selectedCategory === item.id && styles.categoryChipTextActive]}>
                      {item.label}
                    </Text>
                  </Pressable>
                )}
              />

              <FlatList
                data={filteredStickers}
                keyExtractor={(item) => item.id}
                numColumns={4}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.stickersGrid}
                columnWrapperStyle={styles.stickersGridRow}
                renderItem={({ item }) => (
                  <Pressable
                    style={styles.stickerCard}
                    onPress={() => sendComment({ label: item.label, uri: item.uri, animated: item.animated })}
                  >
                    <Image source={{ uri: item.uri }} style={styles.stickerCardImage} resizeMode="cover" />
                    <Text style={styles.stickerCardLabel} numberOfLines={1}>
                      {item.label}
                    </Text>
                  </Pressable>
                )}
              />
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0E0E12' },
  content: { flex: 1 },
  header: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  headerSubtitle: { color: '#98A1CE', fontSize: 12, marginTop: 2 },
  commentList: { flex: 1 },
  commentRow: { flexDirection: 'row', marginBottom: 16 },
  threadLine: {
    position: 'absolute',
    left: -11,
    top: 8,
    bottom: -8,
    width: 2,
    backgroundColor: 'rgba(141,151,204,0.45)',
    borderRadius: 4,
  },
  commentAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10, marginTop: 2 },
  commentBubble: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: 10,
  },
  commentMetaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  commentUser: { color: '#FFFFFF', fontWeight: '700' },
  commentTime: { color: '#94A0CD', fontSize: 11 },
  commentText: { color: '#E6E9FA', fontSize: 15, lineHeight: 21, marginTop: 4 },
  stickerCommentWrap: {
    marginTop: 8,
    gap: 6,
  },
  stickerImage: {
    width: 132,
    height: 132,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  stickerCaption: { color: '#C8D0F5', fontSize: 12, fontWeight: '600' },
  commentActions: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 8 },
  actionGhostBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionGhostText: { color: '#AEB4D6', fontSize: 12, fontWeight: '600' },
  composerWrap: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(13,16,35,0.97)',
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  replyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(108,99,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(108,99,255,0.38)',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  replyBadgeText: { color: '#DCE1FF', fontSize: 12, fontWeight: '600' },
  composerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    paddingHorizontal: 8,
    minHeight: 48,
  },
  input: { flex: 1, color: '#FFFFFF', fontSize: 15, paddingHorizontal: 8, paddingVertical: 10 },
  emojiBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  stickerPanel: {
    marginTop: 10,
    maxHeight: 280,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(11,14,28,0.98)',
    overflow: 'hidden',
  },
  categoryBar: {
    paddingHorizontal: 8,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.14)',
  },
  categoryChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  categoryChipActive: {
    backgroundColor: 'rgba(108,99,255,0.28)',
    borderColor: 'rgba(108,99,255,0.66)',
  },
  categoryChipText: { color: '#D5DBF9', fontSize: 12, fontWeight: '600' },
  categoryChipTextActive: { color: '#F2F4FF' },
  stickersGrid: {
    padding: 10,
    gap: 10,
  },
  stickersGridRow: {
    justifyContent: 'space-between',
    gap: 10,
  },
  stickerCard: {
    flex: 1,
    maxWidth: '25%',
    borderRadius: 10,
    padding: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  stickerCardImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
  },
  stickerCardLabel: {
    color: '#E7EBFF',
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6C63FF',
  },
});
