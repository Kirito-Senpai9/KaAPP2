import React from 'react';
import {
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';
import { GestureDetector, type PanGesture } from 'react-native-gesture-handler';
import Reanimated, {
  Easing as ReanimatedEasing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const ACTION_TIMING = {
  duration: 110,
  easing: ReanimatedEasing.out(ReanimatedEasing.quad),
};

const ACTION_SPRING = {
  damping: 12,
  mass: 0.7,
  stiffness: 240,
};

type KzonePostMedia =
  | {
      id: string;
      type: 'image';
      uri: string;
      alt: string;
      aspectRatio: number;
    }
  | {
      id: string;
      type: 'video';
      thumbnail: string;
      alt: string;
      aspectRatio: number;
      duration: string;
    };

type KzonePreviewPost = {
  id: string;
  author: string;
  handle: string;
  time: string;
  avatar: string;
  avatarAlt: string;
  body: string;
  repliesCount: number;
  repostsCount: number;
  likesCount: number;
  viewsCount: number;
  sharesCount: number;
  media?: KzonePostMedia[];
};

const KZONE_POSTS: KzonePreviewPost[] = [
  {
    id: 'ai-lab',
    author: 'Kaic Labs',
    handle: '@kaiclabs',
    time: '12min',
    avatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=80',
    avatarAlt: 'Foto de perfil de Kaic Labs.',
    body:
      'Estamos testando um fluxo onde ideias pequenas viram conversas longas: pergunta, resposta, citacao e descoberta no mesmo lugar. O Kzone deve nascer para fazer a discussao continuar.',
    repliesCount: 42,
    repostsCount: 18,
    likesCount: 284,
    viewsCount: 8200,
    sharesCount: 31,
  },
  {
    id: 'dev-question',
    author: 'Nina Dev',
    handle: '@ninadev',
    time: '26min',
    avatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&q=80',
    avatarAlt: 'Foto de perfil de Nina Dev.',
    body:
      'Qual foi a melhor decisao tecnica que voce tomou este mes? Quero montar uma lista de aprendizados praticos para quem esta criando apps mobile e compartilhar com a comunidade.',
    repliesCount: 76,
    repostsCount: 24,
    likesCount: 391,
    viewsCount: 14000,
    sharesCount: 58,
    media: [
      {
        id: 'dev-question-board',
        type: 'image',
        uri: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
        alt: 'Mesa com notebook exibindo codigo em uma tela escura.',
        aspectRatio: 16 / 9,
      },
    ],
  },
  {
    id: 'trend-watch',
    author: 'Radar Criativo',
    handle: '@radarcriativo',
    time: '41min',
    avatar:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=240&q=80',
    avatarAlt: 'Foto de perfil do Radar Criativo.',
    body:
      'Ferramentas de IA estao mudando a forma como criadores prototipam telas. O ponto mais interessante nao e so gerar rapido, e discutir melhor o que deve existir.',
    repliesCount: 19,
    repostsCount: 12,
    likesCount: 167,
    viewsCount: 5700,
    sharesCount: 22,
    media: [
      {
        id: 'trend-ui-1',
        type: 'image',
        uri: 'https://images.unsplash.com/photo-1558655146-9f40138edfeb?auto=format&fit=crop&w=900&q=80',
        alt: 'Esbocos de interface e notas de produto sobre uma mesa.',
        aspectRatio: 1,
      },
      {
        id: 'trend-ui-2',
        type: 'image',
        uri: 'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=900&q=80',
        alt: 'Tela com layout colorido de produto digital.',
        aspectRatio: 1,
      },
    ],
  },
  {
    id: 'open-question',
    author: 'Kzone Beta',
    handle: '@kzone',
    time: '1h',
    avatar:
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=240&q=80',
    avatarAlt: 'Foto de perfil do Kzone Beta.',
    body:
      'Uma boa timeline de informacao precisa dar contexto sem cansar. Menos vitrines, mais conversa. Menos destaque artificial, mais participacao real.',
    repliesCount: 34,
    repostsCount: 11,
    likesCount: 203,
    viewsCount: 6400,
    sharesCount: 27,
    media: [
      {
        id: 'open-question-1',
        type: 'image',
        uri: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80',
        alt: 'Pessoa organizando ideias em um quadro digital.',
        aspectRatio: 1,
      },
      {
        id: 'open-question-2',
        type: 'image',
        uri: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=900&q=80',
        alt: 'Grupo colaborando em uma sala com luz roxa.',
        aspectRatio: 1,
      },
      {
        id: 'open-question-3',
        type: 'image',
        uri: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=900&q=80',
        alt: 'Time discutindo uma ideia em frente a laptops.',
        aspectRatio: 1,
      },
      {
        id: 'open-question-4',
        type: 'image',
        uri: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80',
        alt: 'Espaco de trabalho moderno usado para debates de produto.',
        aspectRatio: 1,
      },
    ],
  },
  {
    id: 'demo-video',
    author: 'Maya Motion',
    handle: '@mayamotion',
    time: '2h',
    avatar:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=240&q=80',
    avatarAlt: 'Foto de perfil de Maya Motion.',
    body:
      'Video pode complementar uma ideia, mas nao deve tomar o lugar da mensagem. Este mock mostra como o Kzone pode anexar uma demonstracao horizontal mantendo a conversa em primeiro plano.',
    repliesCount: 28,
    repostsCount: 16,
    likesCount: 249,
    viewsCount: 9800,
    sharesCount: 36,
    media: [
      {
        id: 'demo-video-thumb',
        type: 'video',
        thumbnail:
          'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
        alt: 'Thumbnail horizontal de uma demonstracao em notebook.',
        aspectRatio: 16 / 9,
        duration: '0:42',
      },
    ],
  },
];

function formatKzoneCount(count: number) {
  const formatUnit = (value: number) => {
    const rounded = Math.round(value * 10) / 10;

    return Number.isInteger(rounded)
      ? String(rounded)
      : rounded.toFixed(1).replace('.', ',');
  };

  if (count >= 1_000_000) {
    return `${formatUnit(count / 1_000_000)}M`;
  }

  if (count >= 1_000) {
    return `${formatUnit(count / 1_000)}K`;
  }

  return String(count);
}

type KzonePlaceholderProps = {
  titlePan: PanGesture;
  topInset: number;
  onBack: () => void;
};

function KzonePlaceholder({ titlePan, topInset, onBack }: KzonePlaceholderProps) {
  const renderPost = React.useCallback(
    ({ item }: { item: KzonePreviewPost }) => <KzonePostPreview post={item} />,
    [],
  );

  const keyExtractor = React.useCallback(
    (item: KzonePreviewPost) => item.id,
    [],
  );

  const getItemType = React.useCallback(() => 'post', []);

  return (
    <View style={styles.page}>
      <View style={[styles.topBar, { paddingTop: topInset }]}>
        <GestureDetector gesture={titlePan}>
          <View
            accessibilityHint="Arraste para a direita para voltar ao feed KaChan!"
            accessibilityLabel="Kzone"
            accessibilityRole="button"
            hitSlop={12}
            style={styles.logoHandle}
          >
            <Ionicons
              name="chevron-back"
              size={18}
              color="rgba(229,231,244,0.54)"
            />
            <Text style={styles.logo}>Kzone!</Text>
          </View>
        </GestureDetector>

        <View style={styles.topActions}>
          <View style={styles.soonBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.soonBadgeText}>Em breve</Text>
          </View>

          <Pressable
            onPress={onBack}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Voltar para o feed KaChan!"
            style={({ pressed }) => [
              styles.backPill,
              pressed && styles.backPillPressed,
            ]}
          >
            <Ionicons name="chevron-back" size={15} color="#A6ADCE" />
            <Text style={styles.backPillText}>KaChan!</Text>
          </Pressable>
        </View>
      </View>

      <FlashList
        data={KZONE_POSTS}
        renderItem={renderPost}
        keyExtractor={keyExtractor}
        getItemType={getItemType}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

type KzonePostPreviewProps = {
  post: KzonePreviewPost;
};

const KzonePostPreview = React.memo(function KzonePostPreview({
  post,
}: KzonePostPreviewProps) {
  const [isLiked, setIsLiked] = React.useState(false);
  const [isReposted, setIsReposted] = React.useState(false);
  const [isShared, setIsShared] = React.useState(false);
  const [replyPulseCount, setReplyPulseCount] = React.useState(0);
  const [shareTapCount, setShareTapCount] = React.useState(0);

  const handleReplyPress = React.useCallback(() => {
    setReplyPulseCount((count) => count + 1);
  }, []);

  const handleRepostPress = React.useCallback(() => {
    setIsReposted((value) => !value);
  }, []);

  const handleLikePress = React.useCallback(() => {
    setIsLiked((value) => !value);
  }, []);

  const handleSharePress = React.useCallback(() => {
    setIsShared(true);
    setShareTapCount((count) => count + 1);
  }, []);

  return (
    <View style={styles.post}>
      <View style={styles.avatar}>
        <Image
          source={{ uri: post.avatar }}
          style={styles.avatarImage}
          contentFit="cover"
          cachePolicy="memory-disk"
          recyclingKey={post.avatar}
          accessibilityLabel={post.avatarAlt}
        />
      </View>

      <View style={styles.postContent}>
        <View style={styles.postHeader}>
          <Text style={styles.author} numberOfLines={1}>
            {post.author}
          </Text>
          <Text style={styles.handle} numberOfLines={1}>
            {post.handle}
          </Text>
          <Text style={styles.time}>{post.time}</Text>
        </View>

        <Text style={styles.postBody}>{post.body}</Text>

        {!!post.media?.length && <KzoneMediaGrid media={post.media} />}

        <View style={styles.actionRow}>
          <KzoneAction
            accessibilityLabel="Comentar publicacao"
            icon="chatbubble-outline"
            tone="comment"
            value={formatKzoneCount(post.repliesCount + replyPulseCount)}
            onPress={handleReplyPress}
          />
          <KzoneAction
            accessibilityLabel={
              isReposted ? 'Remover repost da publicacao' : 'Repostar publicacao'
            }
            active={isReposted}
            activeIcon="repeat"
            icon="repeat-outline"
            tone="repost"
            value={formatKzoneCount(
              post.repostsCount + (isReposted ? 1 : 0),
            )}
            onPress={handleRepostPress}
          />
          <KzoneAction
            accessibilityLabel={isLiked ? 'Descurtir publicacao' : 'Curtir publicacao'}
            active={isLiked}
            activeIcon="heart"
            icon="heart-outline"
            tone="like"
            value={formatKzoneCount(post.likesCount + (isLiked ? 1 : 0))}
            onPress={handleLikePress}
          />
          <KzoneAction
            accessibilityLabel="Visualizacoes da publicacao"
            icon="stats-chart-outline"
            tone="views"
            value={formatKzoneCount(post.viewsCount)}
          />
          <KzoneAction
            accessibilityLabel="Compartilhar publicacao"
            active={isShared}
            icon="paper-plane-outline"
            tone="share"
            value={formatKzoneCount(post.sharesCount + shareTapCount)}
            onPress={handleSharePress}
          />
        </View>
      </View>
    </View>
  );
});

type KzoneMediaGridProps = {
  media: KzonePostMedia[];
};

const KzoneMediaGrid = React.memo(function KzoneMediaGrid({
  media,
}: KzoneMediaGridProps) {
  if (media.length === 1) {
    return (
      <View style={styles.singleMediaWrap}>
        <KzoneMediaTile media={media[0]} variant="single" />
      </View>
    );
  }

  return (
    <View style={styles.mediaGrid}>
      {media.map((item) => (
        <KzoneMediaTile key={item.id} media={item} variant="grid" />
      ))}
    </View>
  );
});

type KzoneMediaTileProps = {
  media: KzonePostMedia;
  variant: 'single' | 'grid';
};

const KzoneMediaTile = React.memo(function KzoneMediaTile({
  media,
  variant,
}: KzoneMediaTileProps) {
  const uri = media.type === 'video' ? media.thumbnail : media.uri;

  return (
    <View
      accessibilityLabel={media.alt}
      accessibilityRole="image"
      style={[
        styles.mediaTile,
        variant === 'single'
          ? [styles.singleMediaTile, { aspectRatio: media.aspectRatio }]
          : styles.gridMediaTile,
      ]}
    >
      <Image
        source={{ uri }}
        style={styles.mediaImage}
        contentFit="cover"
        cachePolicy="memory-disk"
        recyclingKey={`${media.type}-${uri}`}
      />

      {media.type === 'video' ? (
        <View style={styles.videoOverlay}>
          <View style={styles.playBadge}>
            <Ionicons name="play" size={18} color="#FFFFFF" />
          </View>
          <Text style={styles.videoDuration}>{media.duration}</Text>
        </View>
      ) : null}
    </View>
  );
});

type KzoneActionProps = {
  accessibilityLabel: string;
  active?: boolean;
  activeIcon?: keyof typeof Ionicons.glyphMap;
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  tone: 'comment' | 'repost' | 'like' | 'views' | 'share';
  value: string;
};

const KzoneAction = React.memo(function KzoneAction({
  accessibilityLabel,
  active = false,
  activeIcon,
  icon,
  onPress,
  tone,
  value,
}: KzoneActionProps) {
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const canPress = Boolean(onPress);
  const color = getKzoneActionColor(tone, active);
  const displayIcon = active && activeIcon ? activeIcon : icon;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  const handlePress = React.useCallback(() => {
    if (!onPress) {
      return;
    }

    if (tone === 'comment') {
      rotate.value = withSequence(
        withTiming(-7, ACTION_TIMING),
        withTiming(6, ACTION_TIMING),
        withTiming(0, ACTION_TIMING),
      );
      scale.value = withSequence(
        withTiming(0.94, ACTION_TIMING),
        withSpring(1.11, ACTION_SPRING),
        withTiming(1, ACTION_TIMING),
      );
    } else if (tone === 'repost') {
      rotate.value = withSequence(
        withTiming(-10, ACTION_TIMING),
        withTiming(9, ACTION_TIMING),
        withTiming(0, ACTION_TIMING),
      );
      scale.value = withSequence(
        withTiming(0.94, ACTION_TIMING),
        withSpring(1.12, ACTION_SPRING),
        withTiming(1, ACTION_TIMING),
      );
    } else if (tone === 'like') {
      scale.value = withSequence(
        withTiming(0.86, ACTION_TIMING),
        withSpring(1.22, ACTION_SPRING),
        withTiming(1, ACTION_TIMING),
      );
    } else if (tone === 'share') {
      translateX.value = withSequence(
        withTiming(5, ACTION_TIMING),
        withTiming(0, {
          duration: 150,
          easing: ReanimatedEasing.out(ReanimatedEasing.cubic),
        }),
      );
      scale.value = withSequence(
        withTiming(0.96, ACTION_TIMING),
        withSpring(1.08, ACTION_SPRING),
        withTiming(1, ACTION_TIMING),
      );
    }

    onPress();
  }, [onPress, rotate, scale, tone, translateX]);

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={canPress ? 'button' : 'text'}
      accessibilityState={active ? { selected: true } : undefined}
      disabled={!canPress}
      hitSlop={6}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.actionPressable,
        pressed && styles.actionPressed,
      ]}
    >
      <View style={styles.actionItem}>
        <Reanimated.View style={[styles.actionIconWrap, animatedStyle]}>
          <Ionicons name={displayIcon} size={17} color={color} />
        </Reanimated.View>
        <Text style={[styles.actionText, active && { color }]}>{value}</Text>
      </View>
    </Pressable>
  );
});

function getKzoneActionColor(
  tone: KzoneActionProps['tone'],
  active: boolean,
) {
  if (!active) {
    return '#7D86A8';
  }

  if (tone === 'like') {
    return '#FF5A8F';
  }

  if (tone === 'repost') {
    return '#55D6A2';
  }

  if (tone === 'share') {
    return '#B9B3FF';
  }

  return '#B9B3FF';
}

export default KzonePlaceholder;

const styles = StyleSheet.create({
  page: {
    width,
    flex: 1,
    backgroundColor: '#090B14',
  },
  topBar: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(166,173,206,0.14)',
  },
  logoHandle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingLeft: 2,
    paddingRight: 10,
  },
  logo: {
    color: '#FFFFFF',
    fontSize: 23,
    fontWeight: '900',
    letterSpacing: 0,
  },
  topActions: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
  },
  soonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(108,99,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(185,179,255,0.24)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#B9B3FF',
  },
  soonBadgeText: {
    color: '#D9D6FF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0,
  },
  backPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minHeight: 34,
    paddingVertical: 6,
    paddingLeft: 6,
    paddingRight: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  backPillPressed: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  backPillText: {
    color: '#A6ADCE',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0,
  },
  listContent: {
    paddingBottom: 104,
  },
  post: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(166,173,206,0.14)',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#6C63FF',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  postContent: {
    flex: 1,
    minWidth: 0,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
    gap: 5,
  },
  author: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    maxWidth: 132,
    letterSpacing: 0,
  },
  handle: {
    color: '#8D95B6',
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
  },
  time: {
    color: '#7D86A8',
    fontSize: 13,
    fontWeight: '700',
  },
  postBody: {
    color: '#F3F4FA',
    fontSize: 17,
    lineHeight: 25,
    fontWeight: '400',
    marginTop: 8,
    letterSpacing: 0,
  },
  singleMediaWrap: {
    marginTop: 13,
  },
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 13,
    overflow: 'hidden',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(166,173,206,0.16)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  mediaTile: {
    overflow: 'hidden',
    backgroundColor: '#111625',
  },
  singleMediaTile: {
    width: '100%',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(166,173,206,0.16)',
  },
  gridMediaTile: {
    width: '49%',
    aspectRatio: 1,
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.16)',
  },
  playBadge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 3,
    backgroundColor: 'rgba(108,99,255,0.86)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  videoDuration: {
    position: 'absolute',
    right: 9,
    bottom: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.68)',
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 15,
    gap: 6,
  },
  actionPressable: {
    borderRadius: 999,
    flexShrink: 1,
    minWidth: 0,
  },
  actionPressed: {
    backgroundColor: 'rgba(185,179,255,0.08)',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 2,
    paddingVertical: 5,
  },
  actionIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    color: '#7D86A8',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0,
  },
});
