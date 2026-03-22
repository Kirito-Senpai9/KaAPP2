import React, { memo } from 'react';
import { Image } from 'expo-image';
import type {
  CommentListRow,
  CommentNode,
} from '@/features/comments/domain/entities/comment';
import CommentActions from '@/features/comments/presentation/components/BottomSheetComments/CommentActions';
import { formatRelativeTime } from '@/features/comments/presentation/components/BottomSheetComments/formatRelativeTime';
import { StyleSheet, Text, View } from 'react-native';

type CommentItemProps = {
  row: Extract<CommentListRow, { type: 'root-comment' }>;
  showSeparator: boolean;
  onReply: (comment: CommentNode) => void;
  onLike: (commentId: string) => void;
};

function CommentItemComponent({
  row,
  showSeparator,
  onReply,
  onLike,
}: CommentItemProps) {
  const { comment } = row;

  return (
    <View style={[styles.commentRow, showSeparator && styles.separator]}>
      <Image
        source={{ uri: comment.author.avatar }}
        style={styles.avatar}
        contentFit="cover"
        cachePolicy="memory-disk"
        recyclingKey={comment.author.avatar}
      />

      <View style={styles.content}>
        <View style={styles.metaRow}>
          <Text style={styles.username}>{comment.author.username}</Text>
          <Text style={styles.timeLabel}>{formatRelativeTime(comment.createdAt)}</Text>
        </View>

        <Text style={styles.bodyText}>{comment.content}</Text>

        <CommentActions
          likes={comment.likes}
          liked={comment.liked}
          onLike={() => onLike(comment.id)}
          onReply={() => onReply(comment)}
        />
      </View>
    </View>
  );
}

export default memo(CommentItemComponent);

const styles = StyleSheet.create({
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  separator: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  username: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  timeLabel: {
    color: 'rgba(150,162,217,0.76)',
    fontSize: 11.5,
    fontWeight: '500',
  },
  bodyText: {
    color: '#E6E9FA',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 3,
  },
});
