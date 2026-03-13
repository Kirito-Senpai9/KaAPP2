import React, { useMemo, useRef } from 'react';
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
import { useComments } from '@/features/comments/hooks/useComments';
import type { CommentItem } from '@/features/comments/types/comments';
import { STICKER_CATEGORIES, STICKERS } from '@/features/comments/services/commentsService';
import { countRepliesDeep, timeAgo } from '@/features/comments/utils/commentsUtils';

type Props = NativeStackScreenProps<RootStackParamList, 'ComentariosPostagem'>;

function CommentRow({
  comment,
  depth,
  showConnector,
  onReply,
  onLike,
}: {
  comment: CommentItem;
  depth: number;
  showConnector?: boolean;
  onReply: (comment: CommentItem) => void;
  onLike: (id: string) => void;
}) {
  const pulse = useRef(new Animated.Value(1)).current;
  const isReply = depth > 0;

  const animateLike = () => {
    Animated.sequence([
      Animated.spring(pulse, { toValue: 1.22, useNativeDriver: true }),
      Animated.spring(pulse, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
    onLike(comment.id);
  };

  return (
    <View
      style={[
        styles.commentRow,
        isReply && styles.replyRow,
        { marginLeft: depth * 18 },
      ]}
    >
      {!!showConnector && <View style={styles.firstReplyConnector} />}

      <Image source={{ uri: comment.avatar }} style={[styles.commentAvatar, isReply && styles.replyAvatar]} />

      <View style={styles.commentContentWrap}>
        <View style={styles.commentMetaRow}>
          <Text style={[styles.commentUser, isReply && styles.replyUser]}>{comment.user}</Text>
          <Text style={[styles.commentTime, isReply && styles.replyMeta]}>{timeAgo(comment.createdAt)}</Text>
        </View>

        {!!comment.sticker ? (
          <View style={styles.stickerCommentWrap}>
            <Image source={{ uri: comment.sticker.uri }} style={styles.stickerImage} resizeMode="cover" />
            <Text style={[styles.stickerCaption, isReply && styles.replyMeta]}>{comment.sticker.label}</Text>
          </View>
        ) : (
          <Text style={[styles.commentText, isReply && styles.replyText]}>{comment.content}</Text>
        )}

        <View style={styles.commentActions}>
          <Pressable onPress={() => onReply(comment)}>
            <Text style={[styles.actionGhostText, isReply && styles.replyMeta]}>Responder</Text>
          </Pressable>

          <View style={styles.likeColumn}>
            <Animated.View style={{ transform: [{ scale: pulse }] }}>
              <TouchableOpacity style={styles.likeBtnOnlyIcon} onPress={animateLike}>
                <Ionicons
                  name={comment.liked ? 'heart' : 'heart-outline'}
                  size={16}
                  color={comment.liked ? '#FF658D' : '#AEB4D6'}
                />
              </TouchableOpacity>
            </Animated.View>
            <Text style={[styles.likeCountText, isReply && styles.replyMeta]}>{comment.likes}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export default function ComentariosPostagem({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const {
    comments,
    input,
    setInput,
    expandedThreads,
    setExpandedThreads,
    replyingTo,
    setReplyingTo,
    showStickers,
    setShowStickers,
    selectedCategory,
    setSelectedCategory,
    sendComment,
    toggleLike,
  } = useComments();

  const filteredStickers = useMemo(() => {
    if (selectedCategory === 'animados') {
      return STICKERS.filter((sticker) => sticker.animated);
    }

    if (selectedCategory === 'estaticos') {
      return STICKERS.filter((sticker) => !sticker.animated);
    }

    return STICKERS.filter((sticker) => sticker.category === selectedCategory);
  }, [selectedCategory]);

  const toggleStickerPanel = () => {
    Keyboard.dismiss();
    setShowStickers((prev) => !prev);
  };

  const renderReplies = (replies: CommentItem[], depth = 1, showConnectorOnFirst = false): React.ReactNode => {
    return replies.map((reply, index) => (
      <View key={reply.id}>
        <CommentRow
          comment={reply}
          depth={depth}
          showConnector={showConnectorOnFirst && index === 0}
          onReply={(comment) => {
            setReplyingTo(comment);
            setShowStickers(false);
          }}
          onLike={toggleLike}
        />
        {reply.replies.length > 0 ? renderReplies(reply.replies, depth + 1, false) : null}
      </View>
    ));
  };

  const keyboardOffset = insets.top + 56;

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
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? keyboardOffset : 0}
        enabled
      >
        <FlatList
          data={comments}
          initialNumToRender={6}
          windowSize={6}
          maxToRenderPerBatch={8}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const totalReplies = countRepliesDeep(item.replies);
            const isExpanded = !!expandedThreads[item.id];

            return (
              <View style={styles.rootCommentBlock}>
                <CommentRow
                  comment={item}
                  depth={0}
                  onReply={(comment) => {
                    setReplyingTo(comment);
                    setShowStickers(false);
                  }}
                  onLike={toggleLike}
                />

                {totalReplies > 0 && (
                  <Pressable
                    style={styles.toggleRepliesBtn}
                    onPress={() =>
                      setExpandedThreads((prev) => ({
                        ...prev,
                        [item.id]: !prev[item.id],
                      }))
                    }
                  >
                    <Text style={styles.toggleRepliesText}>
                      {isExpanded ? 'Ocultar respostas' : `Ver mais ${totalReplies} respostas`}
                    </Text>
                  </Pressable>
                )}

                {isExpanded && item.replies.length > 0 ? renderReplies(item.replies, 1, true) : null}
              </View>
            );
          }}
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
                initialNumToRender={8}
                windowSize={5}
                maxToRenderPerBatch={10}
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
  rootCommentBlock: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.12)',
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  replyRow: {
    marginTop: 8,
  },
  firstReplyConnector: {
    position: 'absolute',
    left: -9,
    top: -28,
    width: 2,
    height: 44,
    backgroundColor: 'rgba(141,151,204,0.52)',
    borderRadius: 4,
  },
  commentAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10, marginTop: 2 },
  replyAvatar: { width: 32, height: 32, borderRadius: 16 },
  commentContentWrap: { flex: 1 },
  commentMetaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  commentUser: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  replyUser: { fontSize: 13 },
  commentTime: { color: '#94A0CD', fontSize: 11 },
  commentText: { color: '#E6E9FA', fontSize: 15, lineHeight: 21, marginTop: 4 },
  replyText: { fontSize: 14, lineHeight: 19 },
  replyMeta: { fontSize: 11 },
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
  commentActions: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  likeColumn: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 26,
    gap: 2,
  },
  likeBtnOnlyIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 20,
    height: 20,
  },
  likeCountText: { color: '#AEB4D6', fontSize: 11, fontWeight: '600' },
  actionGhostText: { color: '#AEB4D6', fontSize: 12, fontWeight: '600' },
  toggleRepliesBtn: {
    marginLeft: 46,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  toggleRepliesText: {
    color: '#96A2D9',
    fontSize: 12,
    fontWeight: '700',
  },
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
