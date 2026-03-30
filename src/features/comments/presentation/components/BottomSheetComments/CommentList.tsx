import React, { memo, type ReactElement } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  BottomSheetFlatList,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import type {
  CommentListRow,
  CommentNode,
} from '@/features/comments/domain/entities/comment';
import CommentItem from '@/features/comments/presentation/components/BottomSheetComments/CommentItem';
import ReplyItem from '@/features/comments/presentation/components/BottomSheetComments/ReplyItem';

type CommentListProps = {
  listRef: React.RefObject<any>;
  rows: CommentListRow[];
  isLoading: boolean;
  onReply: (comment: CommentNode) => void;
  onLike: (commentId: string) => void;
  onToggleThread: (commentId: string) => void;
  onScrollToIndexFailed: (info: {
    index: number;
    highestMeasuredFrameIndex: number;
    averageItemLength: number;
  }) => void;
  header: ReactElement | null;
  bottomSpacer: number;
};

function CommentListComponent({
  listRef,
  rows,
  isLoading,
  onReply,
  onLike,
  onToggleThread,
  onScrollToIndexFailed,
  header,
  bottomSpacer,
}: CommentListProps) {
  if (isLoading) {
    return (
      <BottomSheetView style={styles.skeletonList} enableFooterMarginAdjustment>
        {header}
        {Array.from({ length: 4 }).map((_, index) => (
          <View
            key={`skeleton-${index}`}
            style={[styles.skeletonRow, index > 0 && styles.rootSeparator]}
          >
            <View style={styles.skeletonAvatar} />
            <View style={styles.skeletonContent}>
              <View style={[styles.skeletonLine, styles.skeletonLineShort]} />
              <View style={styles.skeletonLine} />
              <View style={[styles.skeletonLine, styles.skeletonLineMedium]} />
            </View>
            <View style={styles.skeletonLikeRail}>
              <View style={styles.skeletonLikeIcon} />
              <View style={styles.skeletonLikeCount} />
            </View>
          </View>
        ))}
      </BottomSheetView>
    );
  }

  return (
    <BottomSheetFlatList
      ref={listRef}
      data={rows}
      keyExtractor={(item: CommentListRow) => item.id}
      renderItem={({ item, index }: { item: CommentListRow; index: number }) => {
        if (item.type === 'thread-toggle') {
          return (
            <View style={styles.threadToggleWrap}>
              <View style={styles.threadToggleRow}>
                <View style={styles.threadToggleLine} />
                <Pressable hitSlop={8} onPress={() => onToggleThread(item.parentId)}>
                  <Text style={styles.threadToggleText}>
                    {item.expanded
                      ? 'Ocultar respostas'
                      : `Ver respostas (${item.repliesCount})`}
                  </Text>
                </Pressable>
              </View>
            </View>
          );
        }

        if (item.type === 'reply') {
          return (
            <ReplyItem
              row={item}
              onReply={onReply}
              onLike={onLike}
            />
          );
        }

        return (
          <CommentItem
            row={item}
            showSeparator={index > 0}
            onReply={onReply}
            onLike={onLike}
          />
        );
      }}
      style={styles.list}
      contentContainerStyle={[
        styles.listContent,
        { paddingBottom: bottomSpacer },
      ]}
      ListHeaderComponent={header}
      enableFooterMarginAdjustment
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      removeClippedSubviews={Platform.OS === 'android'}
      onScrollToIndexFailed={onScrollToIndexFailed}
    />
  );
}

export default memo(CommentListComponent);

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  rootSeparator: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  threadToggleWrap: {
    marginLeft: 46,
    paddingTop: 2,
    paddingBottom: 6,
  },
  threadToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  threadToggleLine: {
    width: 28,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  threadToggleText: {
    color: '#9AA7E2',
    fontSize: 12,
    fontWeight: '700',
  },
  skeletonList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  skeletonAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginRight: 12,
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
    width: '36%',
  },
  skeletonLineMedium: {
    width: '64%',
  },
  skeletonLikeRail: {
    width: 28,
    marginLeft: 12,
    alignItems: 'center',
    gap: 6,
  },
  skeletonLikeIcon: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  skeletonLikeCount: {
    width: 16,
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
});
