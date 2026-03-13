import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  ListRenderItemInfo,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetModal,
  BottomSheetTextInput,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type PostPreview = {
  id: string;
  user: string;
  avatar: string;
  text: string;
};

type CommentItem = {
  id: string;
  user: string;
  avatar: string;
  text: string;
  createdAt: number;
  likes: number;
  liked?: boolean;
  replies: CommentItem[];
};

type Props = {
  visible: boolean;
  post: PostPreview | null;
  onClose: () => void;
};

const CURRENT_USER = {
  name: 'Você',
  avatar: 'https://i.pravatar.cc/150?img=11',
};

const INITIAL_COMMENTS: CommentItem[] = [
  {
    id: 'c1',
    user: 'Ayla',
    avatar: 'https://i.pravatar.cc/150?img=17',
    text: 'FPS estava travando no início, mas depois ficou liso!',
    createdAt: Date.now() - 1000 * 60 * 42,
    likes: 112,
    replies: [
      {
        id: 'c1-r1',
        user: 'Kai',
        avatar: 'https://i.pravatar.cc/150?img=3',
        text: 'Esse patch ajudou demais no desempenho.',
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
    text: 'Partiu mais uma ranked hoje à noite?',
    createdAt: Date.now() - 1000 * 60 * 24,
    likes: 63,
    replies: [],
  },
  {
    id: 'c3',
    user: 'Luna',
    avatar: 'https://i.pravatar.cc/150?img=2',
    text: 'Não estou arrumando desculpas 😅',
    createdAt: Date.now() - 1000 * 60 * 15,
    likes: 48,
    replies: [],
  },
];

const timeAgo = (createdAt: number) => {
  const minutes = Math.max(1, Math.floor((Date.now() - createdAt) / 60000));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h`;
  return `${Math.floor(hours / 24)} d`;
};

const countDeepReplies = (items: CommentItem[]): number =>
  items.reduce((acc, item) => acc + 1 + countDeepReplies(item.replies), 0);

const toggleLikeById = (items: CommentItem[], id: string): CommentItem[] =>
  items.map((item) => {
    if (item.id === id) {
      const liked = !item.liked;
      return {
        ...item,
        liked,
        likes: liked ? item.likes + 1 : Math.max(0, item.likes - 1),
      };
    }

    return { ...item, replies: toggleLikeById(item.replies, id) };
  });

const addReplyToThread = (items: CommentItem[], parentId: string, reply: CommentItem): CommentItem[] =>
  items.map((item) => {
    if (item.id === parentId) {
      return { ...item, replies: [...item.replies, reply] };
    }

    return {
      ...item,
      replies: addReplyToThread(item.replies, parentId, reply),
    };
  });

export default function CommentsBottomSheet({ visible, post, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const modalRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['50%', '85%', '100%'], []);

  const [comments, setComments] = useState<CommentItem[]>(INITIAL_COMMENTS);
  const [input, setInput] = useState('');
  const [expandedThreads, setExpandedThreads] = useState<Record<string, boolean>>({});
  const [replyingTo, setReplyingTo] = useState<CommentItem | null>(null);

  const totalComments = useMemo(
    () => comments.length + comments.reduce((acc, item) => acc + countDeepReplies(item.replies), 0),
    [comments]
  );

  useEffect(() => {
    if (visible && post) {
      modalRef.current?.present();
      return;
    }

    modalRef.current?.dismiss();
  }, [post, visible]);

  const handleDismiss = useCallback(() => {
    setReplyingTo(null);
    setInput('');
    onClose();
  }, [onClose]);

  const sendComment = () => {
    const message = input.trim();
    if (!message) return;

    const newComment: CommentItem = {
      id: `${Date.now()}`,
      user: CURRENT_USER.name,
      avatar: CURRENT_USER.avatar,
      text: message,
      createdAt: Date.now(),
      likes: 0,
      replies: [],
    };

    setComments((prev) => {
      if (replyingTo) return addReplyToThread(prev, replyingTo.id, newComment);
      return [...prev, newComment];
    });

    setInput('');
    setReplyingTo(null);
  };

  return (
    <BottomSheetModal
      ref={modalRef}
      index={0}
      snapPoints={snapPoints}
      onDismiss={handleDismiss}
      enablePanDownToClose
      enableContentPanningGesture
      enableHandlePanningGesture
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustPan"
      backdropComponent={(props: BottomSheetBackdropProps) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" />}
      handleIndicatorStyle={styles.grabHandle}
      backgroundStyle={styles.sheetBackground}
    >
      <BottomSheetView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Comentários • {totalComments}</Text>
          {!!post && <Text style={styles.headerSub}>Post de {post.user}</Text>}
        </View>

        <BottomSheetFlatList
          data={comments}
          keyExtractor={(item: CommentItem) => item.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }: ListRenderItemInfo<CommentItem>) => {
            const repliesCount = countDeepReplies(item.replies);
            const expanded = !!expandedThreads[item.id];

            return (
              <View style={styles.block}>
                <CommentRow
                  comment={item}
                  depth={0}
                  onLike={(id) => setComments((prev) => toggleLikeById(prev, id))}
                  onReply={setReplyingTo}
                />

                {repliesCount > 0 && (
                  <Pressable
                    style={styles.repliesBtn}
                    onPress={() =>
                      setExpandedThreads((prev) => ({
                        ...prev,
                        [item.id]: !prev[item.id],
                      }))
                    }
                  >
                    <Text style={styles.repliesBtnText}>{expanded ? 'Ocultar respostas' : `Ver respostas (${repliesCount})`}</Text>
                  </Pressable>
                )}

                {expanded &&
                  item.replies.map((reply) => (
                    <CommentRow
                      key={reply.id}
                      comment={reply}
                      depth={1}
                      onLike={(id) => setComments((prev) => toggleLikeById(prev, id))}
                      onReply={setReplyingTo}
                    />
                  ))}
              </View>
            );
          }}
        />

        <View style={[styles.composerWrap, { paddingBottom: insets.bottom + 8 }]}>
          {!!replyingTo && (
            <View style={styles.replyBadge}>
              <Text style={styles.replyBadgeText}>Respondendo {replyingTo.user}</Text>
              <Pressable onPress={() => setReplyingTo(null)}>
                <Ionicons name="close" size={16} color="#E4E8FF" />
              </Pressable>
            </View>
          )}

          <View style={styles.composerRow}>
            <Image source={{ uri: CURRENT_USER.avatar }} style={styles.meAvatar} />
            <BottomSheetTextInput
              value={input}
              onChangeText={setInput}
              placeholder={replyingTo ? `Responder ${replyingTo.user}` : 'Escreva um comentário...'}
              placeholderTextColor="#8B94C4"
              style={styles.input}
            />
            <TouchableOpacity style={styles.iconBtn}>
              <Ionicons name="happy-outline" size={20} color="#D6DBF6" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.sendBtn} onPress={sendComment}>
              <Ionicons name="paper-plane" size={16} color="#FAFBFF" />
            </TouchableOpacity>
          </View>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
}

function CommentRow({
  comment,
  depth,
  onReply,
  onLike,
}: {
  comment: CommentItem;
  depth: number;
  onReply: (comment: CommentItem) => void;
  onLike: (id: string) => void;
}) {
  const isReply = depth > 0;

  return (
    <View style={[styles.commentRow, isReply && styles.replyRow]}>
      <Image source={{ uri: comment.avatar }} style={[styles.avatar, isReply && styles.replyAvatar]} />

      <View style={styles.commentBody}>
        <View style={styles.metaRow}>
          <Text style={[styles.user, isReply && styles.replyUser]}>{comment.user}</Text>
          <Text style={styles.time}>{timeAgo(comment.createdAt)}</Text>
        </View>

        <Text style={[styles.text, isReply && styles.replyText]}>{comment.text}</Text>

        <View style={styles.rowActions}>
          <Pressable onPress={() => onReply(comment)}>
            <Text style={styles.actionGhost}>Responder</Text>
          </Pressable>
          <View style={styles.likeWrap}>
            <TouchableOpacity onPress={() => onLike(comment.id)}>
              <Ionicons name={comment.liked ? 'heart' : 'heart-outline'} size={16} color={comment.liked ? '#FF658D' : '#AEB4D6'} />
            </TouchableOpacity>
            <Text style={styles.likeText}>{comment.likes}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: '#101327',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  grabHandle: {
    width: 44,
    height: 5,
    borderRadius: 99,
    backgroundColor: 'rgba(220,227,255,0.45)',
  },
  header: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.12)',
  },
  headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  headerSub: { color: '#98A1CE', fontSize: 12, marginTop: 2 },
  content: { flex: 1 },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 14, paddingBottom: 12 },
  block: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  commentRow: { flexDirection: 'row', alignItems: 'flex-start' },
  replyRow: { marginLeft: 26, marginTop: 8, opacity: 0.95 },
  avatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  replyAvatar: { width: 30, height: 30, borderRadius: 15 },
  commentBody: { flex: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  user: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  replyUser: { fontSize: 13 },
  time: { color: '#96A2D9', fontSize: 11 },
  text: { color: '#E6E9FA', fontSize: 14, lineHeight: 20, marginTop: 4 },
  replyText: { fontSize: 13, lineHeight: 18 },
  rowActions: { marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  actionGhost: { color: '#AEB4D6', fontSize: 12, fontWeight: '600' },
  likeWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  likeText: { color: '#AEB4D6', fontSize: 11, fontWeight: '600' },
  repliesBtn: { marginLeft: 46, marginTop: 8, alignSelf: 'flex-start' },
  repliesBtnText: { color: '#9AA7E2', fontSize: 12, fontWeight: '700' },
  composerWrap: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingTop: 10,
    backgroundColor: 'rgba(12,15,34,0.98)',
  },
  replyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(108,99,255,0.45)',
    backgroundColor: 'rgba(108,99,255,0.22)',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  replyBadgeText: { color: '#E8ECFF', fontSize: 12, fontWeight: '600' },
  composerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    minHeight: 48,
    paddingHorizontal: 8,
  },
  meAvatar: { width: 30, height: 30, borderRadius: 15, marginRight: 6 },
  input: { flex: 1, color: '#FFFFFF', fontSize: 15, paddingVertical: Platform.OS === 'ios' ? 10 : 8, paddingHorizontal: 6 },
  iconBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  sendBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6C63FF',
  },
});
