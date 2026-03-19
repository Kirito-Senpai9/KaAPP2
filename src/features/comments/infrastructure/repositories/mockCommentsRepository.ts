import type {
  CommentAuthor,
  CommentNode,
} from '@/features/comments/domain/entities/comment';
import type { CommentsRepository } from '@/features/comments/domain/repositories/commentsRepository';

type CommentFixture = {
  id: string;
  author: CommentAuthor;
  content: string;
  minutesAgo: number;
  likes: number;
  replies?: CommentFixture[];
};

const COMMENT_FIXTURES: Record<string, CommentFixture[]> = {
  p1: [
    {
      id: 'p1-comment-1',
      author: { id: 'luna', username: 'Luna', avatar: 'https://i.pravatar.cc/120?img=32' },
      content: 'Esse mapa novo combinou demais com a identidade do app.',
      minutesAgo: 8,
      likes: 12,
      replies: [
        {
          id: 'p1-reply-1',
          author: { id: 'kai', username: 'Kai', avatar: 'https://i.pravatar.cc/120?img=3' },
          content: 'Tambem achei. Ficou com cara de post em destaque.',
          minutesAgo: 4,
          likes: 4,
        },
      ],
    },
    {
      id: 'p1-comment-2',
      author: { id: 'mina', username: 'Mina', avatar: 'https://i.pravatar.cc/120?img=4' },
      content: 'Quero ver a versao em video desse mesmo layout.',
      minutesAgo: 15,
      likes: 7,
    },
    {
      id: 'p1-comment-3',
      author: { id: 'ayla', username: 'Ayla', avatar: 'https://i.pravatar.cc/120?img=22' },
      content: 'Curti muito o contraste da arte com o fundo escuro.',
      minutesAgo: 29,
      likes: 5,
    },
  ],
  p2: [
    {
      id: 'p2-comment-1',
      author: { id: 'noah', username: 'Noah', avatar: 'https://i.pravatar.cc/120?img=48' },
      content: 'Esse treino ficou liso demais no video vertical.',
      minutesAgo: 7,
      likes: 18,
      replies: [
        {
          id: 'p2-reply-1',
          author: { id: 'luna', username: 'Luna', avatar: 'https://i.pravatar.cc/120?img=32' },
          content: 'A transicao do meio ficou muito boa.',
          minutesAgo: 5,
          likes: 6,
        },
        {
          id: 'p2-reply-2',
          author: { id: 'ethan', username: 'Ethan', avatar: 'https://i.pravatar.cc/120?img=11' },
          content: 'Faz uma versao com highlights mais longos depois.',
          minutesAgo: 3,
          likes: 2,
        },
      ],
    },
    {
      id: 'p2-comment-2',
      author: { id: 'ayla', username: 'Ayla', avatar: 'https://i.pravatar.cc/120?img=22' },
      content: 'A thumbnail tambem ficou forte. Chama bastante atencao.',
      minutesAgo: 19,
      likes: 9,
    },
  ],
  p3: [
    {
      id: 'p3-comment-1',
      author: { id: 'mina', username: 'Mina', avatar: 'https://i.pravatar.cc/120?img=4' },
      content: 'Setup bonito e clean. Parece pronto para live mesmo.',
      minutesAgo: 11,
      likes: 24,
      replies: [
        {
          id: 'p3-reply-1',
          author: { id: 'kai', username: 'Kai', avatar: 'https://i.pravatar.cc/120?img=3' },
          content: 'So faltou mostrar os perifericos em outro angulo.',
          minutesAgo: 9,
          likes: 3,
        },
      ],
    },
    {
      id: 'p3-comment-2',
      author: { id: 'luna', username: 'Luna', avatar: 'https://i.pravatar.cc/120?img=32' },
      content: 'A iluminacao puxou bem a paleta do feed.',
      minutesAgo: 16,
      likes: 10,
    },
    {
      id: 'p3-comment-3',
      author: { id: 'noah', username: 'Noah', avatar: 'https://i.pravatar.cc/120?img=48' },
      content: 'Da para virar capa de perfil facil.',
      minutesAgo: 24,
      likes: 5,
    },
  ],
  p4: [
    {
      id: 'p4-comment-1',
      author: { id: 'ethan', username: 'Ethan', avatar: 'https://i.pravatar.cc/120?img=11' },
      content: 'Os highlights horizontais ficaram com vibe de recap profissional.',
      minutesAgo: 14,
      likes: 13,
    },
    {
      id: 'p4-comment-2',
      author: { id: 'kai', username: 'Kai', avatar: 'https://i.pravatar.cc/120?img=3' },
      content: 'Mandou bem demais no recorte dos melhores momentos.',
      minutesAgo: 21,
      likes: 8,
      replies: [
        {
          id: 'p4-reply-1',
          author: { id: 'ayla', username: 'Ayla', avatar: 'https://i.pravatar.cc/120?img=22' },
          content: 'Tambem achei. O ritmo ficou muito bom.',
          minutesAgo: 17,
          likes: 2,
        },
      ],
    },
  ],
  p5: [
    {
      id: 'p5-comment-1',
      author: { id: 'luna', username: 'Luna', avatar: 'https://i.pravatar.cc/120?img=32' },
      content: 'Agora esse time vai longe no torneio.',
      minutesAgo: 6,
      likes: 27,
      replies: [
        {
          id: 'p5-reply-1',
          author: { id: 'mina', username: 'Mina', avatar: 'https://i.pravatar.cc/120?img=4' },
          content: 'A energia da foto passa muita confianca.',
          minutesAgo: 4,
          likes: 5,
        },
      ],
    },
    {
      id: 'p5-comment-2',
      author: { id: 'noah', username: 'Noah', avatar: 'https://i.pravatar.cc/120?img=48' },
      content: 'Quero ver os bastidores dessa montagem depois.',
      minutesAgo: 18,
      likes: 11,
    },
  ],
};

function fixtureToNode(fixture: CommentFixture): CommentNode {
  return {
    id: fixture.id,
    author: fixture.author,
    content: fixture.content,
    createdAt: Date.now() - fixture.minutesAgo * 60 * 1000,
    likes: fixture.likes,
    liked: false,
    replies: (fixture.replies ?? []).map(fixtureToNode),
  };
}

const mockCommentsRepository: CommentsRepository = {
  getCommentsByPostId(postId) {
    const fixtures = COMMENT_FIXTURES[postId] ?? COMMENT_FIXTURES.p1;
    return fixtures.map(fixtureToNode);
  },
};

export function getCommentsRepository() {
  return mockCommentsRepository;
}
