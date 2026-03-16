import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  InteractionManager,
  Keyboard,
  LayoutChangeEvent,
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
import type { PostPreview } from '@/types/social';
import type { CommentItem } from '@/features/comments/types/comments';
import { timeAgo, countRepliesDeep, toggleLikeById, addReplyToThread } from '@/features/comments/utils/commentsUtils';
import { CURRENT_USER, INITIAL_COMMENTS } from '@/features/comments/services/commentsService';

type Props = {
  visible: boolean;
  post: PostPreview | null;
  onClose: () => void;
  autoFocusOnOpen?: boolean;
};


export default function CommentsBottomSheet({
  visible,
  post,
  onClose,
  autoFocusOnOpen = false,
}: Props) {
  const insets = useSafeAreaInsets();
  const modalRef = useRef<BottomSheetModal>(null);
  const inputRef = useRef<React.ComponentRef<typeof BottomSheetTextInput>>(null);
  const focusTaskRef = useRef<ReturnType<typeof InteractionManager.runAfterInteractions> | null>(null);
  const focusFrameRef = useRef<number | null>(null);
  const focusRetryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shouldAutoFocusRef = useRef(false);
  const isInputFocusedRef = useRef(false);
  const isAtFinalSnapRef = useRef(false);
  const snapPoints = useMemo(() => ['50%', '85%', '100%'], []);
  const lastSnapIndex = snapPoints.length - 1;

  const [comments, setComments] = useState<CommentItem[]>(INITIAL_COMMENTS);
  const [input, setInput] = useState('');
  const [expandedThreads, setExpandedThreads] = useState<Record<string, boolean>>({});
  const [replyingTo, setReplyingTo] = useState<CommentItem | null>(null);
  const [composerHeight, setComposerHeight] = useState(0);

  const totalComments = useMemo(
    () => comments.length + comments.reduce((acc, item) => acc + countRepliesDeep(item.replies), 0),
    [comments]
  );
  const composerBottomInset = composerHeight > 0 ? composerHeight + 12 : insets.bottom + 88;

  const clearPendingFocus = useCallback(() => {
    focusTaskRef.current?.cancel();
    focusTaskRef.current = null;

    if (focusFrameRef.current !== null) {
      cancelAnimationFrame(focusFrameRef.current);
      focusFrameRef.current = null;
    }

    if (focusRetryTimeoutRef.current !== null) {
      clearTimeout(focusRetryTimeoutRef.current);
      focusRetryTimeoutRef.current = null;
    }
  }, []);

  const focusComposer = useCallback((attempt = 0, force = false) => {
    if (!visible || !post || !isAtFinalSnapRef.current) return;
    if (!force && isInputFocusedRef.current) return;
    if (focusTaskRef.current || focusFrameRef.current) return;

    focusTaskRef.current = InteractionManager.runAfterInteractions(() => {
      focusTaskRef.current = null;
      focusFrameRef.current = requestAnimationFrame(() => {
        inputRef.current?.focus();
        focusFrameRef.current = null;

        if (!isInputFocusedRef.current && attempt < 4 && visible && post && isAtFinalSnapRef.current) {
          const delay = 70 + attempt * 45;
          focusRetryTimeoutRef.current = setTimeout(() => {
            focusRetryTimeoutRef.current = null;
            focusComposer(attempt + 1, true);
          }, delay);
        }
      });
    });
  }, [post, visible]);

  useEffect(() => {
    if (visible && post) {
      shouldAutoFocusRef.current = autoFocusOnOpen;
      isAtFinalSnapRef.current = false;
      modalRef.current?.present();
      return;
    }

    shouldAutoFocusRef.current = false;
    isAtFinalSnapRef.current = false;
    isInputFocusedRef.current = false;
    clearPendingFocus();
    modalRef.current?.dismiss();
  }, [autoFocusOnOpen, clearPendingFocus, post, visible]);

  useEffect(() => () => clearPendingFocus(), [clearPendingFocus]);

  const handleSheetChange = useCallback((index: number) => {
    isAtFinalSnapRef.current = index === lastSnapIndex;
    if (!shouldAutoFocusRef.current || !isAtFinalSnapRef.current) return;

    focusComposer(0, true);
  }, [focusComposer, lastSnapIndex]);

  const handleScrollBeginDrag = useCallback(() => {
    clearPendingFocus();
    inputRef.current?.blur();
    Keyboard.dismiss();
  }, [clearPendingFocus]);

  const handleInputFocus = useCallback(() => {
    isInputFocusedRef.current = true;
    shouldAutoFocusRef.current = false;
    clearPendingFocus();
  }, [clearPendingFocus]);

  const handleInputBlur = useCallback(() => {
    isInputFocusedRef.current = false;
  }, []);

  const handleDismiss = useCallback(() => {
    shouldAutoFocusRef.current = false;
    isAtFinalSnapRef.current = false;
    isInputFocusedRef.current = false;
    clearPendingFocus();
    Keyboard.dismiss();
    setReplyingTo(null);
    setExpandedThreads({});
    setInput('');
    inputRef.current?.blur();
    onClose();
  }, [clearPendingFocus, onClose]);

  const handleReply = useCallback((comment: CommentItem) => {
    setReplyingTo(comment);
    focusComposer(0, true);
  }, [focusComposer]);

  const handleComposerLayout = useCallback((event: LayoutChangeEvent) => {
    const nextHeight = Math.ceil(event.nativeEvent.layout.height);
    setComposerHeight((prev) => (prev === nextHeight ? prev : nextHeight));
  }, []);

  const sendComment = useCallback(() => {
    const message = input.trim();
    if (!message) return;
    const shouldRestoreFocus = isInputFocusedRef.current;

    const newComment: CommentItem = {
      id: `${Date.now()}`,
      user: CURRENT_USER.name,
      avatar: CURRENT_USER.avatar,
      content: message,
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
    if (shouldRestoreFocus) {
      focusComposer(0, true);
    }
  }, [focusComposer, input, replyingTo]);

  return (
    <BottomSheetModal
      ref={modalRef}
      index={autoFocusOnOpen ? lastSnapIndex : 0}
      snapPoints={snapPoints}
      topInset={insets.top}
      onDismiss={handleDismiss}
      onChange={handleSheetChange}
      enablePanDownToClose
      enableContentPanningGesture
      enableHandlePanningGesture
      enableBlurKeyboardOnGesture={false}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
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
          contentContainerStyle={[styles.listContent, { paddingBottom: composerBottomInset }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          onScrollBeginDrag={handleScrollBeginDrag}
          renderItem={({ item }: ListRenderItemInfo<CommentItem>) => {
            const repliesCount = countRepliesDeep(item.replies);
            const expanded = !!expandedThreads[item.id];

            return (
              <View style={styles.block}>
                <CommentRow
                  comment={item}
                  depth={0}
                  onLike={(id) => setComments((prev) => toggleLikeById(prev, id))}
                  onReply={handleReply}
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
                      onReply={handleReply}
                    />
                  ))}
              </View>
            );
          }}
        />

        <View
          onLayout={handleComposerLayout}
          style={[styles.composerWrap, styles.composerOverlay, { paddingBottom: insets.bottom + 8 }]}
        >
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
              ref={inputRef}
              value={input}
              onChangeText={setInput}
              placeholder={replyingTo ? `Responder ${replyingTo.user}` : 'Escreva um comentário...'}
              placeholderTextColor="#8B94C4"
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
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

        <Text style={[styles.text, isReply && styles.replyText]}>{comment.content}</Text>

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
  content: { flex: 1, position: 'relative' },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 14, paddingTop: 2 },
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
  composerOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
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
