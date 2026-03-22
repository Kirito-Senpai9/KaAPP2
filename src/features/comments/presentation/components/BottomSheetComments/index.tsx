import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  InteractionManager,
  Keyboard,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetTextInput,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import CommentList from '@/features/comments/presentation/components/BottomSheetComments/CommentList';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CommentsComposerFooter, {
  setComposerFooterSnapshot,
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
  const listRef = useRef<any>(null);
  const inputRef = useRef<React.ComponentRef<typeof BottomSheetTextInput>>(null);
  const focusTaskRef = useRef<ReturnType<
    typeof InteractionManager.runAfterInteractions
  > | null>(null);
  const focusFrameRef = useRef<number | null>(null);
  const focusRetryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingScrollRowIdRef = useRef<string | null>(null);
  const pendingScrollIndexRef = useRef<number | null>(null);
  const shouldAutoFocusRef = useRef(false);
  const isAtFinalSnapRef = useRef(false);
  const isInputFocusedRef = useRef(false);
  const retainFocusOnActionRef = useRef(false);
  const snapPoints = useMemo(() => ['40%', '75%', '95%'], []);
  const lastSnapIndex = snapPoints.length - 1;
  const {
    currentUser,
    rows,
    input,
    setInput,
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

  const clearRetainedFocus = useCallback(() => {
    retainFocusOnActionRef.current = false;
  }, []);

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

  const handleSend = useCallback(() => {
    const shouldRestoreFocus =
      isInputFocusedRef.current || retainFocusOnActionRef.current;
    const nextRowId = sendComment();

    if (nextRowId) {
      pendingScrollRowIdRef.current = nextRowId;
    }

    if (shouldRestoreFocus) {
      setIsComposerFocused(true);
      ensureComposerFocused(true);
    } else {
      clearRetainedFocus();
      setIsComposerFocused(false);
    }
  }, [clearRetainedFocus, ensureComposerFocused, sendComment]);

  const handleScrollBeginDrag = useCallback(() => {
    shouldAutoFocusRef.current = false;
    clearRetainedFocus();
    clearPendingFocus();
    setIsComposerFocused(false);
    inputRef.current?.blur();
    Keyboard.dismiss();
  }, [clearPendingFocus, clearRetainedFocus]);

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
    pendingScrollRowIdRef.current = null;
    pendingScrollIndexRef.current = null;
    clearRetainedFocus();
    clearPendingFocus();
    setIsComposerFocused(false);
    setComposerFooterSnapshot(null);
    Keyboard.dismiss();
    inputRef.current?.blur();
    resetTransientState();
    onClose();
  }, [clearPendingFocus, clearRetainedFocus, onClose, resetTransientState]);

  useEffect(() => {
    if (!post || !onCountChange || isLoading) {
      return;
    }

    onCountChange(totalCount);
  }, [isLoading, onCountChange, post, totalCount]);

  useEffect(() => {
    if (!visible || !post) {
      shouldAutoFocusRef.current = false;
      isAtFinalSnapRef.current = false;
      isInputFocusedRef.current = false;
      pendingScrollRowIdRef.current = null;
      pendingScrollIndexRef.current = null;
      clearRetainedFocus();
      clearPendingFocus();
      setIsComposerFocused(false);
      setComposerFooterSnapshot(null);
      modalRef.current?.dismiss();
      return;
    }

    shouldAutoFocusRef.current = autoFocusOnOpen;
    isAtFinalSnapRef.current = false;
    modalRef.current?.present();
  }, [
    autoFocusOnOpen,
    clearPendingFocus,
    clearRetainedFocus,
    post,
    visible,
  ]);

  useEffect(
    () => () => {
      clearPendingFocus();
      setComposerFooterSnapshot(null);
    },
    [clearPendingFocus]
  );

  useEffect(() => {
    if (!pendingScrollRowIdRef.current || rows.length === 0) {
      return;
    }

    const targetId = pendingScrollRowIdRef.current;
    const rowIndex = rows.findIndex((row) => row.id === targetId);

    if (rowIndex === -1) {
      return;
    }

    pendingScrollRowIdRef.current = null;
    pendingScrollIndexRef.current = rowIndex;
    requestAnimationFrame(() => {
      listRef.current?.scrollToIndex?.({
        index: rowIndex,
        animated: true,
        viewPosition: 1,
      });
    });
  }, [rows]);

  const composerBottomPadding = isComposerFocused ? 8 : insets.bottom + 8;

  useEffect(() => {
    if (!visible || !post) {
      setComposerFooterSnapshot(null);
      return;
    }

    setComposerFooterSnapshot({
      currentUser,
      input,
      replyingTo,
      bottomPadding: composerBottomPadding,
      inputRef,
      onChangeText: setInput,
      onFocus: handleInputFocus,
      onBlur: handleInputBlur,
      onCancelReply: cancelReply,
      onSend: handleSend,
      onSendPressIn: handleSendPressIn,
    });
  }, [
    cancelReply,
    composerBottomPadding,
    currentUser,
    handleInputBlur,
    handleInputFocus,
    handleSend,
    handleSendPressIn,
    input,
    post,
    replyingTo,
    setInput,
    visible,
  ]);

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
      footerComponent={CommentsComposerFooter}
    >
      <BottomSheetView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Comentarios - {totalCount}</Text>
          {!!post && <Text style={styles.headerSubtitle}>Post de {post.authorName}</Text>}
        </View>

        <CommentList
          listRef={listRef}
          rows={rows}
          isLoading={isLoading}
          onReply={handleReply}
          onLike={toggleLike}
          onToggleThread={toggleThread}
          onScrollBeginDrag={handleScrollBeginDrag}
          onScrollToIndexFailed={(info: {
            index: number;
            highestMeasuredFrameIndex: number;
            averageItemLength: number;
          }) => {
            const targetIndex = pendingScrollIndexRef.current ?? info.index;

            requestAnimationFrame(() => {
              listRef.current?.scrollToOffset?.({
                offset: Math.max(0, info.averageItemLength * targetIndex),
                animated: false,
              });
            });

            setTimeout(() => {
              listRef.current?.scrollToIndex?.({
                index: targetIndex,
                animated: true,
                viewPosition: 1,
              });
            }, 60);
          }}
        />
      </BottomSheetView>
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
  content: {
    flex: 1,
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
