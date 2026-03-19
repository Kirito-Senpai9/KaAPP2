import React, { forwardRef } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import type { CommentAuthor, CommentReplyTarget } from '@/types/comment';

type CommentInputProps = {
  currentUser: CommentAuthor;
  value: string;
  replyingTo: CommentReplyTarget | null;
  bottomPadding: number;
  onChangeText: (value: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  onCancelReply: () => void;
  onSend: () => void;
  onSendPressIn: () => void;
};

const CommentInput = forwardRef<
  React.ComponentRef<typeof BottomSheetTextInput>,
  CommentInputProps
>(function CommentInput(
  {
    currentUser,
    value,
    replyingTo,
    bottomPadding,
    onChangeText,
    onFocus,
    onBlur,
    onCancelReply,
    onSend,
    onSendPressIn,
  },
  ref
) {
  const canSend = value.trim().length > 0;

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: bottomPadding,
        },
      ]}
    >
      {!!replyingTo && (
        <View style={styles.replyBadge}>
          <Text style={styles.replyText}>Respondendo {replyingTo.username}</Text>
          <Pressable onPress={onCancelReply}>
            <Ionicons name="close" size={16} color="#E4E8FF" />
          </Pressable>
        </View>
      )}

      <View style={styles.row}>
        <Image source={{ uri: currentUser.avatar }} style={styles.avatar} />

        <BottomSheetTextInput
          ref={ref}
          value={value}
          onChangeText={onChangeText}
          placeholder={
            replyingTo ? `Responder ${replyingTo.username}` : 'Adicione um comentario...'
          }
          placeholderTextColor="#8B94C4"
          onFocus={onFocus}
          onBlur={onBlur}
          blurOnSubmit={false}
          style={styles.input}
        />

        <TouchableOpacity style={styles.emojiButton} activeOpacity={0.8}>
          <Ionicons name="happy-outline" size={20} color="#D6DBF6" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
          activeOpacity={0.85}
          disabled={!canSend}
          onPressIn={onSendPressIn}
          onPress={onSend}
        >
          <Ionicons name="paper-plane" size={16} color="#FAFBFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
});

export default CommentInput;

const styles = StyleSheet.create({
  container: {
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
  replyText: {
    color: '#E8ECFF',
    fontSize: 12,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    minHeight: 48,
    paddingHorizontal: 8,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 6,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  emojiButton: {
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
  sendButtonDisabled: {
    opacity: 0.45,
  },
});
