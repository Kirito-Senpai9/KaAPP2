import React, { memo, useSyncExternalStore } from 'react';
import {
  BottomSheetFooter,
  BottomSheetTextInput,
  type BottomSheetFooterProps,
} from '@gorhom/bottom-sheet';
import type { LayoutChangeEvent } from 'react-native';
import type {
  CommentAuthor,
  CommentReplyTarget,
} from '@/features/comments/domain/entities/comment';
import CommentInput from '@/features/comments/presentation/components/BottomSheetComments/CommentInput';

type ComposerFooterSnapshot = {
  postId: string;
  currentUser: CommentAuthor;
  replyingTo: CommentReplyTarget | null;
  bottomPadding: number;
  inputRef: React.RefObject<React.ComponentRef<typeof BottomSheetTextInput> | null>;
  onFocus: () => void;
  onBlur: () => void;
  onCancelReply: () => void;
  onSend: (content: string) => boolean;
  onSendPressIn: () => void;
  onLayout: (event: LayoutChangeEvent) => void;
};

type Listener = () => void;

export function createComposerFooterStore() {
  let snapshot: ComposerFooterSnapshot | null = null;
  const listeners = new Set<Listener>();
  return {
    getSnapshot: () => snapshot,
    subscribe: (listener: Listener) => {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    setSnapshot: (nextSnapshot: ComposerFooterSnapshot | null) => {
      if (snapshot === nextSnapshot) return;
      snapshot = nextSnapshot;
      listeners.forEach((listener) => listener());
    },
  };
}

const CommentsComposerFooter = memo(function CommentsComposerFooter(
  { store, ...props }: BottomSheetFooterProps & { store: ReturnType<typeof createComposerFooterStore> }
) {
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);

  if (!snapshot) {
    return null;
  }

  return (
    <BottomSheetFooter {...props} bottomInset={0}>
      <CommentInput
        key={snapshot.postId}
        ref={snapshot.inputRef}
        currentUser={snapshot.currentUser}
        replyingTo={snapshot.replyingTo}
        bottomPadding={snapshot.bottomPadding}
        onFocus={snapshot.onFocus}
        onBlur={snapshot.onBlur}
        onCancelReply={snapshot.onCancelReply}
        onSend={snapshot.onSend}
        onSendPressIn={snapshot.onSendPressIn}
        onLayout={snapshot.onLayout}
      />
    </BottomSheetFooter>
  );
});

export default CommentsComposerFooter;
