import React, { memo, useSyncExternalStore } from 'react';
import {
  BottomSheetFooter,
  BottomSheetTextInput,
  type BottomSheetFooterProps,
} from '@gorhom/bottom-sheet';
import CommentInput from '@/components/BottomSheetComments/CommentInput';
import type { CommentAuthor, CommentReplyTarget } from '@/types/comment';

type ComposerFooterSnapshot = {
  currentUser: CommentAuthor;
  input: string;
  replyingTo: CommentReplyTarget | null;
  bottomPadding: number;
  inputRef: React.RefObject<React.ComponentRef<typeof BottomSheetTextInput> | null>;
  onChangeText: (value: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  onCancelReply: () => void;
  onSend: () => void;
  onSendPressIn: () => void;
};

type Listener = () => void;

let composerFooterSnapshot: ComposerFooterSnapshot | null = null;
const listeners = new Set<Listener>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return composerFooterSnapshot;
}

export function setComposerFooterSnapshot(
  nextSnapshot: ComposerFooterSnapshot | null
) {
  composerFooterSnapshot = nextSnapshot;
  emitChange();
}

const CommentsComposerFooter = memo(function CommentsComposerFooter(
  props: BottomSheetFooterProps
) {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  if (!snapshot) {
    return null;
  }

  return (
    <BottomSheetFooter {...props} bottomInset={0}>
      <CommentInput
        ref={snapshot.inputRef}
        currentUser={snapshot.currentUser}
        value={snapshot.input}
        replyingTo={snapshot.replyingTo}
        bottomPadding={snapshot.bottomPadding}
        onChangeText={snapshot.onChangeText}
        onFocus={snapshot.onFocus}
        onBlur={snapshot.onBlur}
        onCancelReply={snapshot.onCancelReply}
        onSend={snapshot.onSend}
        onSendPressIn={snapshot.onSendPressIn}
      />
    </BottomSheetFooter>
  );
});

export default CommentsComposerFooter;
