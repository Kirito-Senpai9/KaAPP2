export type CommentAuthor = {
  id: string;
  username: string;
  avatar: string;
};

export type CommentNode = {
  id: string;
  author: CommentAuthor;
  content: string;
  createdAt: number;
  likes: number;
  liked: boolean;
  replies: CommentNode[];
};

export type CommentReplyTarget = {
  id: string;
  username: string;
};

export type CommentPostPreview = {
  id: string;
  authorName: string;
  authorAvatar: string;
  text: string;
};

export type CommentListRow =
  | {
      id: string;
      type: 'comment';
      depth: number;
      comment: CommentNode;
    }
  | {
      id: string;
      type: 'thread-toggle';
      depth: number;
      parentId: string;
      expanded: boolean;
      repliesCount: number;
    };
