import React, { memo } from 'react';
import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import type { CommentNode, CommentListRow } from '@/features/comments/domain/entities/comment';
import CommentActions from '@/features/comments/presentation/components/BottomSheetComments/CommentActions';
import { formatRelativeTime } from '@/features/comments/presentation/components/BottomSheetComments/formatRelativeTime';

type ReplyItemProps = {
  row: Extract<CommentListRow, { type: 'reply' }>;
  onReply: (comment: CommentNode) => void;
  onLike: (commentId: string) => void;
};

function ReplyItemComponent({ row, onReply, onLike }: ReplyItemProps) {
  const { comment } = row;

  return (
    <View style={styles.container}>
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

        <Text style={styles.bodyText}>
          {comment.replyingToUsername ? (
            <Text style={styles.replyContext}>@{comment.replyingToUsername} </Text>
          ) : null}
          {comment.content}
        </Text>

        <CommentActions
          compact
          likes={comment.likes}
          liked={comment.liked}
          onLike={() => onLike(comment.id)}
          onReply={() => onReply(comment)}
        />
      </View>
    </View>
  );
}

export default memo(ReplyItemComponent);

const styles = StyleSheet.create({
  container: {
    marginLeft: 46,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 10,
    paddingBottom: 2,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
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
    fontSize: 13.5,
    fontWeight: '700',
  },
  timeLabel: {
    color: 'rgba(150,162,217,0.76)',
    fontSize: 11,
    fontWeight: '500',
  },
  bodyText: {
    color: '#E6E9FA',
    fontSize: 13.5,
    lineHeight: 19,
    marginTop: 3,
  },
  replyContext: {
    color: '#B9C3FF',
    fontWeight: '700',
  },
});
