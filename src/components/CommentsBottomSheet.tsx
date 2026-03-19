import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  InteractionManager,
  Keyboard,
  type KeyboardEvent,
  type LayoutChangeEvent,
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

type Props = {
  visible: boolean;
  post: PostPreview | null;
  onClose: () => void;
  autoFocusOnOpen?: boolean;
};

type CommentNode = {
  id: string;
  user: string;
  avatar: string;
  content: string;
  createdAt: number;
  likes: number;
  liked?: boolean;
  replies: CommentNode[];
};

const CURRENT_USER = {
  name: 'Voce',
  avatar: 'https://i.pravatar.cc/120?img=15',
};

const buildInitialComments = (): CommentNode[] => [
  {
    id: 'comment-1',
    user: 'Luna',
    avatar: 'https://i.pravatar.cc/120?img=32',
    content: 'Esse post ficou lindo, a vibe combinou muito com o feed.',
    createdAt: Date.now() - 1000 * 60 * 18,
    likes: 12,
    liked: false,
    replies: [
      {
        id: 'reply-1',
        user: 'Noah',
        avatar: 'https://i.pravatar.cc/120?img=48',
        content: 'Tambem achei, ficou com cara de app pronto.',
        createdAt: Date.now() - 1000 * 60 * 11,
        likes: 3,
        liked: false,
        replies: [],
      },
    ],
  },
  {
    id: 'comment-2',
    user: 'Ayla',
    avatar: 'https://i.pravatar.cc/120?img=22',
    content: 'Curti bastante a direcao visual dessa tela.',
    createdAt: Date.now() - 1000 * 60 * 42,
    likes: 7,
    liked: false,
    replies: [],
  },
  {
    id: 'comment-3',
    user: 'Ethan',
    avatar: 'https://i.pravatar.cc/120?img=11',
    content: 'Se quiser, depois testa com um video maior tambem.',
    createdAt: Date.now() - 1000 * 60 * 65,
    likes: 4,
    liked: false,
    replies: [],
  },
];

const getHiddenKeyboardTop = () =>
  Math.max(Dimensions.get('screen').height, Dimensions.get('window').height);

function countRepliesDeep(replies: CommentNode[]): number {
  return replies.reduce((total, reply) => {
    return total + 1 + countRepliesDeep(reply.replies);
  }, 0);
}

function addReplyToThread(
  comments: CommentNode[],
  targetId: string,
  reply: CommentNode
): CommentNode[] {
  return comments.map((comment) => {
    if (comment.id === targetId) {
      return {
        ...comment,
        replies: [...comment.replies, reply],
      };
    }

    if (comment.replies.length === 0) {
      return comment;
    }

    return {
      ...comment,
      replies: addReplyToThread(comment.replies, targetId, reply),
    };
  });
}

function toggleLikeById(comments: CommentNode[], targetId: string): CommentNode[] {
  return comments.map((comment) => {
    if (comment.id === targetId) {
      const liked = !comment.liked;
      return {
        ...comment,
        liked,
        likes: Math.max(0, comment.likes + (liked ? 1 : -1)),
      };
    }

    if (comment.replies.length === 0) {
      return comment;
    }

    return {
      ...comment,
      replies: toggleLikeById(comment.replies, targetId),
    };
  });
}

function timeAgo(timestamp: number) {
  const minutes = Math.max(1, Math.floor((Date.now() - timestamp) / (1000 * 60)));

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} h`;
  }

  const days = Math.floor(hours / 24);
  return `${days} d`;
}

export default function CommentsBottomSheet({
  visible,
  post,
  onClose,
  autoFocusOnOpen = false,
}: Props) {
  const insets = useSafeAreaInsets();
  const modalRef = useRef<BottomSheetModal>(null);
  const sheetBodyRef = useRef<View>(null);
  const inputRef = useRef<React.ComponentRef<typeof BottomSheetTextInput>>(null);
  const focusTaskRef = useRef<ReturnType<
    typeof InteractionManager.runAfterInteractions
  > | null>(null);
  const focusFrameRef = useRef<number | null>(null);
  const focusRetryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const measureTaskRef = useRef<ReturnType<
    typeof InteractionManager.runAfterInteractions
  > | null>(null);
  const measureFrameRef = useRef<number | null>(null);
  const shouldAutoFocusRef = useRef(false);
  const isInputFocusedRef = useRef(false);
  const isAtFinalSnapRef = useRef(false);
  const retainFocusOnActionRef = useRef(false);
  const keyboardStateRef = useRef({
    visible: false,
    top: getHiddenKeyboardTop(),
  });
  const snapPoints = useMemo(() => ['50%', '85%', '100%'], []);
  const lastSnapIndex = snapPoints.length - 1;

  const [comments, setComments] = useState<CommentNode[]>(() => buildInitialComments());
  const [input, setInput] = useState('');
  const [replyingTo, setReplyingTo] = useState<CommentNode | null>(null);
  const [expandedThreads, setExpandedThreads] = useState<Record<string, boolean>>(
    {}
  );
  const [composerHeight, setComposerHeight] = useState(0);
  const [composerBottomOffset, setComposerBottomOffset] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const totalComments = useMemo(
    () =>
      comments.length +
      comments.reduce((total, comment) => total + countRepliesDeep(comment.replies), 0),
    [comments]
  );

  useEffect(() => {
    setComments(buildInitialComments());
    setExpandedThreads({});
    setReplyingTo(null);
    setInput('');
  }, [post?.id]);

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

  const clearPendingMeasurement = useCallback(() => {
    measureTaskRef.current?.cancel();
    measureTaskRef.current = null;

    if (measureFrameRef.current !== null) {
      cancelAnimationFrame(measureFrameRef.current);
      measureFrameRef.current = null;
    }
  }, []);

  const clearRetainedFocus = useCallback(() => {
    retainFocusOnActionRef.current = false;
  }, []);

  const updateComposerOffset = useCallback(() => {
    if (!visible || !post) {
      setComposerBottomOffset(0);
      return;
    }

    const keyboardState = keyboardStateRef.current;
    if (!keyboardState.visible) {
      setComposerBottomOffset(0);
      return;
    }

    sheetBodyRef.current?.measureInWindow((_x, y, _width, height) => {
      if (!height) {
        return;
      }

      const sheetBottom = y + height;
      const nextOffset = Math.max(0, sheetBottom - keyboardState.top);

      setComposerBottomOffset((currentOffset) =>
        Math.abs(currentOffset - nextOffset) < 1 ? currentOffset : nextOffset
      );
    });
  }, [post, visible]);

  const scheduleComposerMeasurement = useCallback(() => {
    clearPendingMeasurement();

    if (!visible || !post) {
      setComposerBottomOffset(0);
      return;
    }

    const measureOnNextFrame = () => {
      measureFrameRef.current = requestAnimationFrame(() => {
        measureFrameRef.current = null;
        updateComposerOffset();
      });
    };

    measureOnNextFrame();
    measureTaskRef.current = InteractionManager.runAfterInteractions(() => {
      measureTaskRef.current = null;
      measureOnNextFrame();
    });
  }, [clearPendingMeasurement, post, updateComposerOffset, visible]);

  const scheduleComposerFocus = useCallback(
    (attempt = 0, force = false) => {
      if (!visible || !post || !isAtFinalSnapRef.current) return;
      if (!force && isInputFocusedRef.current) return;

      clearPendingFocus();
      focusTaskRef.current = InteractionManager.runAfterInteractions(() => {
        focusTaskRef.current = null;
        focusFrameRef.current = requestAnimationFrame(() => {
          inputRef.current?.focus();
          focusFrameRef.current = null;
          scheduleComposerMeasurement();

          if (
            !isInputFocusedRef.current &&
            attempt < 4 &&
            visible &&
            !!post &&
            isAtFinalSnapRef.current
          ) {
            const delay = 70 + attempt * 45;
            focusRetryTimeoutRef.current = setTimeout(() => {
              focusRetryTimeoutRef.current = null;
              scheduleComposerFocus(attempt + 1, true);
            }, delay);
          }
        });
      });
    },
    [clearPendingFocus, post, scheduleComposerMeasurement, visible]
  );

  const ensureComposerFocused = useCallback(
    (force = false) => {
      if (!visible || !post) return;

      if (!isAtFinalSnapRef.current) {
        shouldAutoFocusRef.current = true;
        modalRef.current?.snapToIndex(lastSnapIndex);
        return;
      }

      scheduleComposerFocus(0, force);
    },
    [lastSnapIndex, post, scheduleComposerFocus, visible]
  );

  const resetKeyboardState = useCallback(() => {
    keyboardStateRef.current = {
      visible: false,
      top: getHiddenKeyboardTop(),
    };
    setIsKeyboardVisible(false);
    setComposerBottomOffset(0);
  }, []);

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
    clearRetainedFocus();
    clearPendingFocus();
    clearPendingMeasurement();
    resetKeyboardState();
    modalRef.current?.dismiss();
  }, [
    autoFocusOnOpen,
    clearPendingFocus,
    clearPendingMeasurement,
    clearRetainedFocus,
    post,
    resetKeyboardState,
    visible,
  ]);

  useEffect(
    () => () => {
      clearPendingFocus();
      clearPendingMeasurement();
    },
    [clearPendingFocus, clearPendingMeasurement]
  );

  useEffect(() => {
    const handleKeyboardShow = (event: KeyboardEvent) => {
      keyboardStateRef.current = {
        visible: true,
        top: event.endCoordinates.screenY,
      };
      setIsKeyboardVisible(true);
      scheduleComposerMeasurement();
    };

    const handleKeyboardHide = () => {
      resetKeyboardState();
      scheduleComposerMeasurement();
    };

    const subscriptions =
      Platform.OS === 'ios'
        ? [
            Keyboard.addListener('keyboardWillShow', handleKeyboardShow),
            Keyboard.addListener('keyboardWillHide', handleKeyboardHide),
            Keyboard.addListener('keyboardDidShow', handleKeyboardShow),
            Keyboard.addListener('keyboardDidHide', handleKeyboardHide),
          ]
        : [
            Keyboard.addListener('keyboardDidShow', handleKeyboardShow),
            Keyboard.addListener('keyboardDidHide', handleKeyboardHide),
          ];

    return () => {
      subscriptions.forEach((subscription) => subscription.remove());
    };
  }, [resetKeyboardState, scheduleComposerMeasurement]);

  const handleSheetChange = useCallback(
    (index: number) => {
      isAtFinalSnapRef.current = index === lastSnapIndex;
      scheduleComposerMeasurement();

      if (!shouldAutoFocusRef.current || !isAtFinalSnapRef.current) return;

      scheduleComposerFocus(0, true);
    },
    [lastSnapIndex, scheduleComposerFocus, scheduleComposerMeasurement]
  );

  const handleSheetBodyLayout = useCallback(() => {
    scheduleComposerMeasurement();
  }, [scheduleComposerMeasurement]);

  const handleComposerLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const nextHeight = event.nativeEvent.layout.height;
      setComposerHeight((currentHeight) =>
        currentHeight === nextHeight ? currentHeight : nextHeight
      );
      scheduleComposerMeasurement();
    },
    [scheduleComposerMeasurement]
  );

  const handleInputFocus = useCallback(() => {
    isInputFocusedRef.current = true;
    shouldAutoFocusRef.current = false;
    clearRetainedFocus();
    clearPendingFocus();
    scheduleComposerMeasurement();
  }, [clearPendingFocus, clearRetainedFocus, scheduleComposerMeasurement]);

  const handleInputBlur = useCallback(() => {
    isInputFocusedRef.current = false;

    if (retainFocusOnActionRef.current) {
      ensureComposerFocused(true);
      return;
    }

    scheduleComposerMeasurement();
  }, [ensureComposerFocused, scheduleComposerMeasurement]);

  const handleScrollBeginDrag = useCallback(() => {
    shouldAutoFocusRef.current = false;
    clearRetainedFocus();
    clearPendingFocus();
    inputRef.current?.blur();
    Keyboard.dismiss();
  }, [clearPendingFocus, clearRetainedFocus]);

  const handleDismiss = useCallback(() => {
    shouldAutoFocusRef.current = false;
    isAtFinalSnapRef.current = false;
    isInputFocusedRef.current = false;
    clearRetainedFocus();
    clearPendingFocus();
    clearPendingMeasurement();
    resetKeyboardState();
    Keyboard.dismiss();
    setExpandedThreads({});
    setReplyingTo(null);
    setInput('');
    setComposerHeight(0);
    inputRef.current?.blur();
    onClose();
  }, [
    clearPendingFocus,
    clearPendingMeasurement,
    clearRetainedFocus,
    onClose,
    resetKeyboardState,
  ]);

  const clearReply = useCallback(() => {
    setReplyingTo(null);
    scheduleComposerMeasurement();
  }, [scheduleComposerMeasurement]);

  const handleReply = useCallback(
    (comment: CommentNode) => {
      retainFocusOnActionRef.current = true;
      setReplyingTo(comment);
      ensureComposerFocused(true);
      scheduleComposerMeasurement();
    },
    [ensureComposerFocused, scheduleComposerMeasurement]
  );

  const handleSendPressIn = useCallback(() => {
    retainFocusOnActionRef.current = true;
  }, []);

  const sendComment = useCallback(() => {
    const message = input.trim();
    const shouldRestoreFocus =
      isInputFocusedRef.current || retainFocusOnActionRef.current;

    if (!message) {
      if (shouldRestoreFocus) {
        ensureComposerFocused(true);
      }
      scheduleComposerMeasurement();
      return;
    }

    const nextComment: CommentNode = {
      id: `comment-${Date.now()}`,
      user: CURRENT_USER.name,
      avatar: CURRENT_USER.avatar,
      content: message,
      createdAt: Date.now(),
      likes: 0,
      liked: false,
      replies: [],
    };

    setComments((previousComments) => {
      if (replyingTo) {
        return addReplyToThread(previousComments, replyingTo.id, nextComment);
      }

      return [...previousComments, nextComment];
    });

    setInput('');
    setReplyingTo(null);

    if (shouldRestoreFocus) {
      ensureComposerFocused(true);
    } else {
      clearRetainedFocus();
    }

    scheduleComposerMeasurement();
  }, [
    clearRetainedFocus,
    ensureComposerFocused,
    input,
    replyingTo,
    scheduleComposerMeasurement,
  ]);

  const composerPaddingBottom = isKeyboardVisible ? 8 : insets.bottom + 8;
  const composerReservedSpace =
    composerHeight > 0 ? composerHeight : 84 + composerPaddingBottom;
  const listContentStyle = useMemo(
    () => [
      styles.listContent,
      {
        paddingBottom: composerReservedSpace + 12,
      },
    ],
    [composerReservedSpace]
  );

  return (
    <BottomSheetModal
      ref={modalRef}
      index={autoFocusOnOpen ? lastSnapIndex : 0}
      snapPoints={snapPoints}
      topInset={insets.top}
      bottomInset={insets.bottom}
      onDismiss={handleDismiss}
      onChange={handleSheetChange}
      enablePanDownToClose
      enableContentPanningGesture
      enableHandlePanningGesture
      enableBlurKeyboardOnGesture={false}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      backdropComponent={(props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          pressBehavior="close"
        />
      )}
      handleIndicatorStyle={styles.grabHandle}
      backgroundStyle={styles.sheetBackground}
    >
      <BottomSheetView style={styles.content}>
        <View
          ref={sheetBodyRef}
          collapsable={false}
          onLayout={handleSheetBodyLayout}
          style={styles.sheetBody}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Comentarios - {totalComments}</Text>
            {!!post && <Text style={styles.headerSub}>Post de {post.user}</Text>}
          </View>

          <BottomSheetFlatList
            data={comments}
            keyExtractor={(item: CommentNode) => item.id}
            renderItem={({ item }: { item: CommentNode }) => {
              const repliesCount = countRepliesDeep(item.replies);
              const expanded = !!expandedThreads[item.id];

              return (
                <View style={styles.block}>
                  <CommentRow
                    comment={item}
                    depth={0}
                    onLike={(id) =>
                      setComments((previousComments) =>
                        toggleLikeById(previousComments, id)
                      )
                    }
                    onReply={handleReply}
                  />

                  {repliesCount > 0 && (
                    <Pressable
                      style={styles.repliesButton}
                      onPress={() =>
                        setExpandedThreads((previousThreads) => ({
                          ...previousThreads,
                          [item.id]: !previousThreads[item.id],
                        }))
                      }
                    >
                      <Text style={styles.repliesButtonText}>
                        {expanded
                          ? 'Ocultar respostas'
                          : `Ver respostas (${repliesCount})`}
                      </Text>
                    </Pressable>
                  )}

                  {expanded &&
                    item.replies.map((reply: CommentNode) => (
                      <CommentRow
                        key={reply.id}
                        comment={reply}
                        depth={1}
                        onLike={(id) =>
                          setComments((previousComments) =>
                            toggleLikeById(previousComments, id)
                          )
                        }
                        onReply={handleReply}
                      />
                    ))}
                </View>
              );
            }}
            style={styles.list}
            contentContainerStyle={listContentStyle}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            onScrollBeginDrag={handleScrollBeginDrag}
          />

          <View
            pointerEvents="box-none"
            style={[
              styles.composerOverlay,
              {
                bottom: composerBottomOffset,
              },
            ]}
          >
            <View
              onLayout={handleComposerLayout}
              style={[
                styles.composerWrap,
                {
                  paddingBottom: composerPaddingBottom,
                },
              ]}
            >
              {!!replyingTo && (
                <View style={styles.replyBadge}>
                  <Text style={styles.replyBadgeText}>
                    Respondendo {replyingTo.user}
                  </Text>
                  <Pressable onPress={clearReply}>
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
                  placeholder={
                    replyingTo
                      ? `Responder ${replyingTo.user}`
                      : 'Escreva um comentario...'
                  }
                  placeholderTextColor="#8B94C4"
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                  blurOnSubmit={false}
                  style={styles.input}
                />
                <TouchableOpacity style={styles.iconButton}>
                  <Ionicons name="happy-outline" size={20} color="#D6DBF6" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.sendButton}
                  onPressIn={handleSendPressIn}
                  onPress={sendComment}
                >
                  <Ionicons name="paper-plane" size={16} color="#FAFBFF" />
                </TouchableOpacity>
              </View>
            </View>
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
  comment: CommentNode;
  depth: number;
  onReply: (comment: CommentNode) => void;
  onLike: (id: string) => void;
}) {
  const isReply = depth > 0;

  return (
    <View style={[styles.commentRow, isReply && styles.replyRow]}>
      <Image
        source={{ uri: comment.avatar }}
        style={[styles.avatar, isReply && styles.replyAvatar]}
      />

      <View style={styles.commentBody}>
        <View style={styles.metaRow}>
          <Text style={[styles.user, isReply && styles.replyUser]}>
            {comment.user}
          </Text>
          <Text style={styles.time}>{timeAgo(comment.createdAt)}</Text>
        </View>

        <Text style={[styles.text, isReply && styles.replyText]}>
          {comment.content}
        </Text>

        <View style={styles.rowActions}>
          <Pressable onPress={() => onReply(comment)}>
            <Text style={styles.actionGhost}>Responder</Text>
          </Pressable>
          <View style={styles.likeWrap}>
            <TouchableOpacity onPress={() => onLike(comment.id)}>
              <Ionicons
                name={comment.liked ? 'heart' : 'heart-outline'}
                size={16}
                color={comment.liked ? '#FF658D' : '#AEB4D6'}
              />
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
  content: {
    flex: 1,
  },
  sheetBody: {
    flex: 1,
    position: 'relative',
  },
  header: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.12)',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  headerSub: {
    color: '#98A1CE',
    fontSize: 12,
    marginTop: 2,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 14,
    paddingTop: 2,
  },
  block: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  replyRow: {
    marginLeft: 26,
    marginTop: 8,
    opacity: 0.95,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  replyAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  commentBody: {
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  user: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  replyUser: {
    fontSize: 13,
  },
  time: {
    color: '#96A2D9',
    fontSize: 11,
  },
  text: {
    color: '#E6E9FA',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  replyText: {
    fontSize: 13,
    lineHeight: 18,
  },
  rowActions: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionGhost: {
    color: '#AEB4D6',
    fontSize: 12,
    fontWeight: '600',
  },
  likeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  likeText: {
    color: '#AEB4D6',
    fontSize: 11,
    fontWeight: '600',
  },
  repliesButton: {
    marginLeft: 46,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  repliesButtonText: {
    color: '#9AA7E2',
    fontSize: 12,
    fontWeight: '700',
  },
  composerOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
  },
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
  replyBadgeText: {
    color: '#E8ECFF',
    fontSize: 12,
    fontWeight: '600',
  },
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
  meAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 6,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    paddingHorizontal: 6,
  },
  iconButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6C63FF',
  },
});
