import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Keyboard,
  type LayoutChangeEvent,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetTextInput,
  type BottomSheetBackdropProps,
  type BottomSheetFooterProps,
} from '@gorhom/bottom-sheet';
import type { FlashListRef } from '@shopify/flash-list';
import CommentList from '@/features/comments/presentation/components/BottomSheetComments/CommentList';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CommentsComposerFooter, {
  createComposerFooterStore,
} from '@/features/comments/presentation/components/BottomSheetComments/CommentsComposerFooter';
import { useComments } from '@/features/comments/presentation/hooks/useComments';
import type {
  CommentListRow,
  CommentNode,
  CommentPostPreview,
} from '@/features/comments/domain/entities/comment';

export type BottomSheetCommentsProps = {
  visible: boolean;
  post: CommentPostPreview | null;
  onClose: () => void;
  autoFocusOnOpen?: boolean;
  initialCount?: number;
  onCountChange?: (count: number) => void;
};

export default function BottomSheetComments({
  visible,
  post,
  onClose,
  autoFocusOnOpen = false,
  initialCount = 0,
  onCountChange,
}: BottomSheetCommentsProps) {
  const insets = useSafeAreaInsets();
  const modalRef = useRef<BottomSheetModal>(null);
  const listRef = useRef<FlashListRef<CommentListRow>>(null);
  const inputRef = useRef<React.ComponentRef<typeof BottomSheetTextInput>>(null);
  const [composerStore] = useState(createComposerFooterStore);
  const setComposerFooterSnapshot = composerStore.setSnapshot;
  const renderComposerFooter = useMemo(
    () => function ComposerFooter(props: BottomSheetFooterProps) {
      return <CommentsComposerFooter {...props} store={composerStore} />;
    },
    [composerStore]
  );
  const focusFrameRef = useRef<number | null>(null);
  const focusRetryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingScrollRowIdRef = useRef<string | null>(null);
  const scrollFrameRef = useRef<number | null>(null);
  const shouldAutoFocusRef = useRef(false);
  const isAtFinalSnapRef = useRef(false);
  const isInputFocusedRef = useRef(false);
  const retainFocusOnActionRef = useRef(false);
  const snapPoints = useMemo(() => ['40%', '75%', '95%'], []);
  const lastSnapIndex = snapPoints.length - 1;
  const {
    currentUser,
    rows,
    replyingTo,
    isLoading,
    totalCount,
    sendComment,
    replyToComment,
    cancelReply,
    toggleLike,
    toggleThread,
    resetTransientState,
  } = useComments(post?.id ?? null, initialCount);
  const [isComposerFocused, setIsComposerFocused] = useState(false);
  const [composerHeight, setComposerHeight] = useState(0);
  const [isListReady, setIsListReady] = useState(false);
  const handleListLoad = useCallback(() => setIsListReady(true), []);

  const clearPendingScroll = useCallback(() => {
    pendingScrollRowIdRef.current = null;
    if (scrollFrameRef.current !== null) {
      cancelAnimationFrame(scrollFrameRef.current);
      scrollFrameRef.current = null;
    }
  }, []);

  const clearPendingFocus = useCallback(() => {
    if (focusFrameRef.current !== null) {
      cancelAnimationFrame(focusFrameRef.current);
      focusFrameRef.current = null;
    }

    if (focusRetryTimeoutRef.current !== null) {
      clearTimeout(focusRetryTimeoutRef.current);
      focusRetryTimeoutRef.current = null;
    }
  }, []);

  const clearRetainedFocus = useCallback(() => {
    retainFocusOnActionRef.current = false;
  }, []);

  const scheduleComposerFocus = useCallback(
    (attempt = 0, force = false) => {
      if (!visible || !post || !isAtFinalSnapRef.current) return;
      if (!force && isInputFocusedRef.current) return;

      clearPendingFocus();
      focusFrameRef.current = requestAnimationFrame(() => {
        inputRef.current?.focus();
        focusFrameRef.current = null;

        if (
          !isInputFocusedRef.current &&
          attempt < 4 &&
          visible &&
          !!post &&
          isAtFinalSnapRef.current
        ) {
          focusRetryTimeoutRef.current = setTimeout(() => {
            focusRetryTimeoutRef.current = null;
            scheduleComposerFocus(attempt + 1, true);
          }, 70 + attempt * 45);
        }
      });
    },
    [clearPendingFocus, post, visible]
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

  const handleInputFocus = useCallback(() => {
    isInputFocusedRef.current = true;
    shouldAutoFocusRef.current = false;
    clearRetainedFocus();
    clearPendingFocus();
    setIsComposerFocused(true);
  }, [clearPendingFocus, clearRetainedFocus]);

  const handleInputBlur = useCallback(() => {
    isInputFocusedRef.current = false;

    if (retainFocusOnActionRef.current) {
      ensureComposerFocused(true);
      return;
    }

    setIsComposerFocused(false);
  }, [ensureComposerFocused]);

  const handleReply = useCallback(
    (comment: CommentNode) => {
      retainFocusOnActionRef.current = true;
      replyToComment(comment);
      setIsComposerFocused(true);
      ensureComposerFocused(true);
    },
    [ensureComposerFocused, replyToComment]
  );

  const handleSendPressIn = useCallback(() => {
    retainFocusOnActionRef.current = true;
  }, []);

  const handleSend = useCallback((content: string) => {
    const shouldRestoreFocus =
      isInputFocusedRef.current || retainFocusOnActionRef.current;
    let nextRowId: string | null;
    try {
      nextRowId = sendComment(content);
    } catch {
      clearRetainedFocus();
      Alert.alert('Nao foi possivel comentar', 'Seu texto foi mantido. Tente novamente.');
      return false;
    }

    if (!nextRowId) {
      clearRetainedFocus();
      return false;
    }

    pendingScrollRowIdRef.current = nextRowId;

    if (shouldRestoreFocus) {
      setIsComposerFocused(true);
      ensureComposerFocused(true);
    } else {
      clearRetainedFocus();
      setIsComposerFocused(false);
    }
    return true;
  }, [clearRetainedFocus, ensureComposerFocused, sendComment]);

  const handleSheetChange = useCallback(
    (index: number) => {
      isAtFinalSnapRef.current = index === lastSnapIndex;

      if (!shouldAutoFocusRef.current || !isAtFinalSnapRef.current) {
        return;
      }

      scheduleComposerFocus(0, true);
    },
    [lastSnapIndex, scheduleComposerFocus]
  );

  const handleDismiss = useCallback(() => {
    shouldAutoFocusRef.current = false;
    isAtFinalSnapRef.current = false;
    isInputFocusedRef.current = false;
    clearPendingScroll();
    clearRetainedFocus();
    clearPendingFocus();
    setIsComposerFocused(false);
    setIsListReady(false);
    setComposerFooterSnapshot(null);
    Keyboard.dismiss();
    inputRef.current?.blur();
    resetTransientState();
    onClose();
  }, [clearPendingFocus, clearPendingScroll, clearRetainedFocus, onClose, resetTransientState, setComposerFooterSnapshot]);

  useEffect(() => {
    if (!visible || !post || !onCountChange || isLoading) {
      return;
    }

    onCountChange(totalCount);
  }, [isLoading, onCountChange, post, totalCount, visible]);

  useEffect(() => {
    if (!visible || !post) {
      shouldAutoFocusRef.current = false;
      isAtFinalSnapRef.current = false;
      isInputFocusedRef.current = false;
      clearPendingScroll();
      clearRetainedFocus();
      clearPendingFocus();
      setIsComposerFocused(false);
      setIsListReady(false);
      setComposerFooterSnapshot(null);
      modalRef.current?.dismiss();
      return;
    }

    shouldAutoFocusRef.current = autoFocusOnOpen;
    isAtFinalSnapRef.current = false;
    clearPendingScroll();
    setIsListReady(false);
    modalRef.current?.present();
  }, [
    autoFocusOnOpen,
    clearPendingFocus,
    clearPendingScroll,
    clearRetainedFocus,
    post,
    setComposerFooterSnapshot,
    visible,
  ]);

  useEffect(
    () => () => {
      clearPendingFocus();
      clearPendingScroll();
      setComposerFooterSnapshot(null);
    },
    [clearPendingFocus, clearPendingScroll, setComposerFooterSnapshot]
  );

  useEffect(() => {
    if (!visible || !post || !isListReady || !pendingScrollRowIdRef.current || rows.length === 0) {
      return;
    }

    const targetId = pendingScrollRowIdRef.current;
    const rowIndex = rows.findIndex((row) => row.id === targetId);

    if (rowIndex === -1) {
      return;
    }

    pendingScrollRowIdRef.current = null;
    scrollFrameRef.current = requestAnimationFrame(() => {
      scrollFrameRef.current = null;
      void listRef.current?.scrollToIndex({
        index: rowIndex,
        animated: true,
        viewPosition: 1,
      }).catch(() => {
        // The sheet can close while FlashList is measuring the target.
      });
    });
  }, [isListReady, post, rows, visible]);

  const composerBottomPadding = isComposerFocused ? 8 : insets.bottom + 8;

  useEffect(() => {
    if (!visible || !post) {
      setComposerFooterSnapshot(null);
      return;
    }

    setComposerFooterSnapshot({
      postId: post.id,
      currentUser,
      replyingTo,
      bottomPadding: composerBottomPadding,
      inputRef,
      onFocus: handleInputFocus,
      onBlur: handleInputBlur,
      onCancelReply: cancelReply,
      onSend: handleSend,
      onSendPressIn: handleSendPressIn,
      onLayout: (event: LayoutChangeEvent) => {
        const nextComposerHeight = Math.ceil(event.nativeEvent.layout.height);
        setComposerHeight((currentHeight) => (
          currentHeight === nextComposerHeight ? currentHeight : nextComposerHeight
        ));
      },
    });
  }, [
    cancelReply,
    composerBottomPadding,
    currentUser,
    handleInputBlur,
    handleInputFocus,
    handleSend,
    handleSendPressIn,
    post,
    replyingTo,
    setComposerFooterSnapshot,
    visible,
  ]);

  const listHeader = useMemo(
    () => (
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Comentarios - {totalCount}</Text>
        {!!post && <Text style={styles.headerSubtitle}>Post de {post.authorName}</Text>}
      </View>
    ),
    [post, totalCount]
  );

  return (
    <BottomSheetModal
      ref={modalRef}
      index={autoFocusOnOpen ? lastSnapIndex : 1}
      snapPoints={snapPoints}
      topInset={insets.top}
      bottomInset={insets.bottom}
      onDismiss={handleDismiss}
      onChange={handleSheetChange}
      enablePanDownToClose
      enableDynamicSizing={false}
      enableBlurKeyboardOnGesture={false}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustPan"
      backdropComponent={(props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          pressBehavior="close"
        />
      )}
      handleIndicatorStyle={styles.grabHandle}
      backgroundStyle={styles.sheetBackground}
      footerComponent={renderComposerFooter}
    >
      <CommentList
        key={post?.id ?? 'closed'}
        listRef={listRef}
        rows={rows}
        isLoading={isLoading}
        header={listHeader}
        bottomSpacer={composerHeight + 12}
        onReply={handleReply}
        onLike={toggleLike}
        onToggleThread={toggleThread}
        onLoad={handleListLoad}
      />
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: '#101327',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.12)',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: '#98A1CE',
    fontSize: 12,
    marginTop: 2,
  },
});
