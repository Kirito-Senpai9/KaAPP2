import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  InteractionManager,
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  View,
  type KeyboardEvent,
  type LayoutChangeEvent,
} from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetModal,
  BottomSheetTextInput,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CommentInput from '@/components/BottomSheetComments/CommentInput';
import CommentItem from '@/components/BottomSheetComments/CommentItem';
import { useComments } from '@/hooks/useComments';
import type { CommentListRow, CommentNode, CommentPostPreview } from '@/types/comment';

export type BottomSheetCommentsProps = {
  visible: boolean;
  post: CommentPostPreview | null;
  onClose: () => void;
  autoFocusOnOpen?: boolean;
  initialCount?: number;
  onCountChange?: (count: number) => void;
};

const getHiddenKeyboardTop = () =>
  Math.max(Dimensions.get('screen').height, Dimensions.get('window').height);

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
  const pendingScrollRowIdRef = useRef<string | null>(null);
  const shouldAutoFocusRef = useRef(false);
  const isAtFinalSnapRef = useRef(false);
  const isInputFocusedRef = useRef(false);
  const retainFocusOnActionRef = useRef(false);
  const keyboardStateRef = useRef({
    visible: false,
    top: getHiddenKeyboardTop(),
  });
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
  const [composerHeight, setComposerHeight] = useState(0);
  const [composerBottomOffset, setComposerBottomOffset] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

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

  const resetKeyboardState = useCallback(() => {
    keyboardStateRef.current = {
      visible: false,
      top: getHiddenKeyboardTop(),
    };
    setIsKeyboardVisible(false);
    setComposerBottomOffset(0);
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
            focusRetryTimeoutRef.current = setTimeout(() => {
              focusRetryTimeoutRef.current = null;
              scheduleComposerFocus(attempt + 1, true);
            }, 70 + attempt * 45);
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
      clearRetainedFocus();
      clearPendingFocus();
      clearPendingMeasurement();
      resetKeyboardState();
      modalRef.current?.dismiss();
      return;
    }

    shouldAutoFocusRef.current = autoFocusOnOpen;
    isAtFinalSnapRef.current = false;
    modalRef.current?.present();
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
    requestAnimationFrame(() => {
      listRef.current?.scrollToIndex?.({
        index: rowIndex,
        animated: true,
        viewPosition: 1,
      });
    });
  }, [rows]);

  const handleSheetChange = useCallback(
    (index: number) => {
      isAtFinalSnapRef.current = index === lastSnapIndex;
      scheduleComposerMeasurement();

      if (!shouldAutoFocusRef.current || !isAtFinalSnapRef.current) {
        return;
      }

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
    pendingScrollRowIdRef.current = null;
    clearRetainedFocus();
    clearPendingFocus();
    clearPendingMeasurement();
    resetKeyboardState();
    Keyboard.dismiss();
    inputRef.current?.blur();
    setComposerHeight(0);
    resetTransientState();
    onClose();
  }, [
    clearPendingFocus,
    clearPendingMeasurement,
    clearRetainedFocus,
    onClose,
    resetKeyboardState,
    resetTransientState,
  ]);

  const handleReply = useCallback(
    (comment: CommentNode) => {
      retainFocusOnActionRef.current = true;
      replyToComment(comment);
      ensureComposerFocused(true);
      scheduleComposerMeasurement();
    },
    [ensureComposerFocused, replyToComment, scheduleComposerMeasurement]
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
      ensureComposerFocused(true);
    } else {
      clearRetainedFocus();
    }

    scheduleComposerMeasurement();
  }, [
    clearRetainedFocus,
    ensureComposerFocused,
    scheduleComposerMeasurement,
    sendComment,
  ]);

  const composerPaddingBottom = isKeyboardVisible ? 8 : insets.bottom + 8;
  const composerReservedSpace =
    composerHeight > 0 ? composerHeight : 84 + composerPaddingBottom;
  const listContentStyle = useMemo(
    () => [
      styles.listContent,
      {
        paddingBottom: composerReservedSpace + 14,
      },
    ],
    [composerReservedSpace]
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
      android_keyboardInputMode="adjustResize"
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
    >
      <BottomSheetView style={styles.content}>
        <View
          ref={sheetBodyRef}
          collapsable={false}
          onLayout={handleSheetBodyLayout}
          style={styles.sheetBody}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Comentarios - {totalCount}</Text>
            {!!post && <Text style={styles.headerSubtitle}>Post de {post.authorName}</Text>}
          </View>

          {isLoading ? (
            <View style={styles.skeletonList}>
              {Array.from({ length: 4 }).map((_, index) => (
                <View key={`skeleton-${index}`} style={styles.skeletonRow}>
                  <View style={styles.skeletonAvatar} />
                  <View style={styles.skeletonContent}>
                    <View style={[styles.skeletonLine, styles.skeletonLineShort]} />
                    <View style={styles.skeletonLine} />
                    <View style={[styles.skeletonLine, styles.skeletonLineMedium]} />
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <BottomSheetFlatList
              ref={listRef}
              data={rows}
              keyExtractor={(item: CommentListRow) => item.id}
              renderItem={({ item }: { item: CommentListRow }) => (
                <View style={styles.rowBlock}>
                  <CommentItem
                    row={item}
                    onReply={handleReply}
                    onLike={toggleLike}
                    onToggleThread={toggleThread}
                  />
                </View>
              )}
              style={styles.list}
              contentContainerStyle={listContentStyle}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
              onScrollBeginDrag={handleScrollBeginDrag}
              onScrollToIndexFailed={() => {
                requestAnimationFrame(() => {
                  listRef.current?.scrollToEnd?.({ animated: true });
                });
              }}
              removeClippedSubviews={Platform.OS === 'android'}
            />
          )}

          <View
            pointerEvents="box-none"
            style={[
              styles.composerOverlay,
              {
                bottom: composerBottomOffset,
              },
            ]}
          >
            <CommentInput
              ref={inputRef}
              currentUser={currentUser}
              value={input}
              replyingTo={replyingTo}
              bottomPadding={composerPaddingBottom}
              onLayout={handleComposerLayout}
              onChangeText={setInput}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              onCancelReply={cancelReply}
              onSend={handleSend}
              onSendPressIn={handleSendPressIn}
            />
          </View>
        </View>
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
  sheetBody: {
    flex: 1,
    position: 'relative',
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
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 14,
    paddingTop: 8,
  },
  rowBlock: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  composerOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
  },
  skeletonList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  skeletonAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginRight: 10,
  },
  skeletonContent: {
    flex: 1,
    gap: 8,
  },
  skeletonLine: {
    height: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    width: '100%',
  },
  skeletonLineShort: {
    width: '38%',
  },
  skeletonLineMedium: {
    width: '62%',
  },
});
