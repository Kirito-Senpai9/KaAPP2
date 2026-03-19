import React, { memo } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { CommentListRow, CommentNode } from '@/types/comment';

type CommentItemProps = {
  row: CommentListRow;
  onReply: (comment: CommentNode) => void;
  onLike: (commentId: string) => void;
  onToggleThread: (commentId: string) => void;
};

function formatRelativeTime(timestamp: number) {
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

function CommentItemComponent({
  row,
  onReply,
  onLike,
  onToggleThread,
}: CommentItemProps) {
  if (row.type === 'thread-toggle') {
    return (
      <Pressable
        style={[
          styles.threadToggle,
          {
            marginLeft: 50 + Math.min(row.depth, 3) * 18,
          },
        ]}
        onPress={() => onToggleThread(row.parentId)}
      >
        <Text style={styles.threadToggleText}>
          {row.expanded
            ? 'Ocultar respostas'
            : `Ver respostas (${row.repliesCount})`}
        </Text>
      </Pressable>
    );
  }

  const { comment } = row;
  const indent = Math.min(row.depth, 3) * 18;

  return (
    <View
      style={[
        styles.commentRow,
        {
          marginLeft: indent,
        },
      ]}
    >
      <Image source={{ uri: comment.author.avatar }} style={styles.avatar} />

      <View style={styles.content}>
        <View style={styles.metaRow}>
          <Text style={styles.username}>{comment.author.username}</Text>
          <Text style={styles.timeLabel}>{formatRelativeTime(comment.createdAt)}</Text>
        </View>

        <Text style={styles.bodyText}>{comment.content}</Text>

        <View style={styles.actionsRow}>
          <Pressable onPress={() => onReply(comment)}>
            <Text style={styles.replyAction}>Responder</Text>
          </Pressable>

          <View style={styles.likeWrap}>
            <TouchableOpacity onPress={() => onLike(comment.id)} activeOpacity={0.85}>
              <Ionicons
                name={comment.liked ? 'heart' : 'heart-outline'}
                size={16}
                color={comment.liked ? '#FF658D' : '#AEB4D6'}
              />
            </TouchableOpacity>
            <Text style={styles.likeCount}>{comment.likes}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export default memo(CommentItemComponent);

const styles = StyleSheet.create({
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  content: {
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  username: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  timeLabel: {
    color: '#96A2D9',
    fontSize: 11,
  },
  bodyText: {
    color: '#E6E9FA',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  actionsRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  replyAction: {
    color: '#AEB4D6',
    fontSize: 12,
    fontWeight: '600',
  },
  likeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  likeCount: {
    color: '#AEB4D6',
    fontSize: 11,
    fontWeight: '600',
  },
  threadToggle: {
    paddingTop: 8,
  },
  threadToggleText: {
    color: '#9AA7E2',
    fontSize: 12,
    fontWeight: '700',
  },
});
