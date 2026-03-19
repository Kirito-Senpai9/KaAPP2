import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type CommentActionsProps = {
  likes: number;
  liked: boolean;
  onLike: () => void;
  onReply: () => void;
  compact?: boolean;
};

function CommentActionsComponent({
  likes,
  liked,
  onLike,
  onReply,
  compact = false,
}: CommentActionsProps) {
  return (
    <View style={[styles.row, compact && styles.rowCompact]}>
      <Pressable hitSlop={8} onPress={onReply}>
        <Text style={[styles.replyAction, compact && styles.replyActionCompact]}>
          Responder
        </Text>
      </Pressable>

      <View style={styles.likeRail}>
        <TouchableOpacity hitSlop={8} onPress={onLike} activeOpacity={0.85}>
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={16}
            color={liked ? '#FF658D' : '#AEB4D6'}
          />
        </TouchableOpacity>
        <Text style={styles.likeCount}>{likes}</Text>
      </View>
    </View>
  );
}

export default memo(CommentActionsComponent);

const styles = StyleSheet.create({
  row: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  rowCompact: {
    marginTop: 6,
  },
  replyAction: {
    color: '#AEB4D6',
    fontSize: 12,
    fontWeight: '600',
  },
  replyActionCompact: {
    fontSize: 11.5,
  },
  likeRail: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 4,
  },
  likeCount: {
    color: '#8D97C8',
    fontSize: 11,
    fontWeight: '700',
  },
});
