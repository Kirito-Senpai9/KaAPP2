import React from 'react';
import {
  BackHandler,
  Dimensions,
  Pressable,
  ScrollView,
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
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

type KzoneFeedMode = 'for-you' | 'hype' | 'following';
type KzoneHypeFilterId = 'for-you' | 'esports' | 'entertainment' | 'news';

const ACTION_TIMING = {
  duration: 110,
  easing: ReanimatedEasing.out(ReanimatedEasing.quad),
};

const ACTION_SPRING = {
  damping: 12,
  mass: 0.7,
  stiffness: 240,
};

const MENU_ANIMATION = {
  duration: 180,
  easing: ReanimatedEasing.out(ReanimatedEasing.cubic),
};

const MENU_CLOSE_AFTER_SELECTION_MS = 220;
const FEED_MENU_PANEL_WIDTH = Math.min(width - 32, 236);

const KZONE_FEED_OPTIONS: Array<{
  id: KzoneFeedMode;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
  activeColor: string;
  glowColor: string;
}> = [
  {
    id: 'for-you',
    label: 'Para Você',
    icon: 'sparkles-outline',
    activeIcon: 'sparkles',
    activeColor: '#B9B3FF',
    glowColor: 'rgba(108,99,255,0.2)',
  },
  {
    id: 'hype',
    label: 'Hype',
    icon: 'flame-outline',
    activeIcon: 'flame',
    activeColor: '#FF5C8A',
    glowColor: 'rgba(255,92,138,0.18)',
  },
  {
    id: 'following',
    label: 'Seguindo',
    icon: 'people-outline',
    activeIcon: 'people',
    activeColor: '#5DE1C5',
    glowColor: 'rgba(93,225,197,0.15)',
  },
];

const KZONE_HYPE_FILTERS: Array<{
  id: KzoneHypeFilterId;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  { id: 'for-you', label: 'Quentes para voce', icon: 'flame-outline' },
  { id: 'esports', label: 'E-Sports', icon: 'game-controller-outline' },
  { id: 'entertainment', label: 'Entretenimento', icon: 'tv-outline' },
  { id: 'news', label: 'Noticias', icon: 'newspaper-outline' },
];

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
  isFollowing: boolean;
  media?: KzonePostMedia[];
};

type KzoneHypeTopic = {
  id: string;
  title: string;
  category: Exclude<KzoneHypeFilterId, 'for-you'>;
  categoryLabel: string;
  description: string;
  mentions: number;
  growth: number;
  score: number;
  icon: keyof typeof Ionicons.glyphMap;
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
    isFollowing: true,
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
    isFollowing: true,
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
    isFollowing: false,
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
    isFollowing: true,
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
    isFollowing: false,
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

const KZONE_HYPE_TOPICS: KzoneHypeTopic[] = [
  {
    id: 'kzone-beta',
    title: 'Kzone abre nova fase de testes no KaAPP2',
    category: 'news',
    categoryLabel: 'Noticias',
    description:
      'A comunidade discute os primeiros formatos de descoberta e conversa do novo feed.',
    mentions: 128400,
    growth: 48,
    score: 98200,
    icon: 'newspaper-outline',
  },
  {
    id: 'esports-final',
    title: 'Final brasileira movimenta o cenario competitivo',
    category: 'esports',
    categoryLabel: 'E-Sports',
    description:
      'Analises, melhores jogadas e previsoes dominam as conversas desta tarde.',
    mentions: 96400,
    growth: 41,
    score: 89100,
    icon: 'game-controller-outline',
  },
  {
    id: 'anime-season',
    title: 'Nova temporada de anime surpreende na estreia',
    category: 'entertainment',
    categoryLabel: 'Entretenimento',
    description:
      'Teorias e reacoes ao primeiro episodio colocam a serie entre os assuntos do dia.',
    mentions: 78500,
    growth: 36,
    score: 81400,
    icon: 'tv-outline',
  },
  {
    id: 'ai-agents',
    title: 'Agentes de IA ganham espaco em projetos mobile',
    category: 'news',
    categoryLabel: 'Noticias',
    description:
      'Desenvolvedores compartilham experiencias, limites e novos casos de uso.',
    mentions: 64200,
    growth: 29,
    score: 73900,
    icon: 'newspaper-outline',
  },
  {
    id: 'championship-roster',
    title: 'Mudanca de elenco agita campeonato de E-Sports',
    category: 'esports',
    categoryLabel: 'E-Sports',
    description:
      'A transferencia inesperada abriu debates sobre a proxima etapa da competicao.',
    mentions: 51900,
    growth: 24,
    score: 66200,
    icon: 'game-controller-outline',
  },
  {
    id: 'streaming-premiere',
    title: 'Estreia de ficcao cientifica divide opinioes',
    category: 'entertainment',
    categoryLabel: 'Entretenimento',
    description:
      'Visual, roteiro e referencias viraram os principais pontos da conversa.',
    mentions: 43800,
    growth: 18,
    score: 58400,
    icon: 'tv-outline',
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
};

function KzonePlaceholder({ titlePan, topInset }: KzonePlaceholderProps) {
  const [activeFeed, setActiveFeed] =
    React.useState<KzoneFeedMode>('for-you');
  const [activeHypeFilter, setActiveHypeFilter] =
    React.useState<KzoneHypeFilterId>('for-you');
  const [isFeedMenuOpen, setIsFeedMenuOpen] = React.useState(false);
  const feedMenuCloseTimeoutRef = React.useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const menuProgress = useSharedValue(0);

  const renderPost = React.useCallback(
    ({ item }: { item: KzonePreviewPost }) => <KzonePostPreview post={item} />,
    [],
  );

  const keyExtractor = React.useCallback(
    (item: KzonePreviewPost) => item.id,
    [],
  );

  const getItemType = React.useCallback(() => 'post', []);

  const renderHypeItem = React.useCallback(
    ({ item, index }: { item: KzoneHypeTopic; index: number }) => (
      <KzoneHypeItem topic={item} rank={index + 1} />
    ),
    [],
  );

  const hypeKeyExtractor = React.useCallback(
    (item: KzoneHypeTopic) => item.id,
    [],
  );

  const getHypeItemType = React.useCallback(
    (_item: KzoneHypeTopic, index: number) =>
      index === 0 ? 'hype-top' : 'hype',
    [],
  );

  const visiblePosts = React.useMemo(
    () =>
      activeFeed === 'following'
        ? KZONE_POSTS.filter((post) => post.isFollowing)
        : KZONE_POSTS,
    [activeFeed],
  );

  const visibleHypeTopics = React.useMemo(
    () =>
      KZONE_HYPE_TOPICS.filter(
        (topic) =>
          activeHypeFilter === 'for-you' ||
          topic.category === activeHypeFilter,
      ).sort((left, right) => right.score - left.score),
    [activeHypeFilter],
  );

  const activeFeedLabel = React.useMemo(
    () =>
      KZONE_FEED_OPTIONS.find((option) => option.id === activeFeed)?.label ??
      'Para Você',
    [activeFeed],
  );

  const menuAnimatedStyle = useAnimatedStyle(() => ({
    opacity: menuProgress.value,
    transform: [
      { translateY: (1 - menuProgress.value) * -10 },
      { scale: 0.96 + menuProgress.value * 0.04 },
    ],
  }));

  const menuBackdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: menuProgress.value,
  }));

  const menuChevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${menuProgress.value * 180}deg` }],
  }));

  const clearFeedMenuCloseTimeout = React.useCallback(() => {
    if (feedMenuCloseTimeoutRef.current) {
      clearTimeout(feedMenuCloseTimeoutRef.current);
      feedMenuCloseTimeoutRef.current = null;
    }
  }, []);

  const openFeedMenu = React.useCallback(() => {
    clearFeedMenuCloseTimeout();
    setIsFeedMenuOpen(true);
    menuProgress.value = withTiming(1, MENU_ANIMATION);
  }, [clearFeedMenuCloseTimeout, menuProgress]);

  const closeFeedMenu = React.useCallback(() => {
    clearFeedMenuCloseTimeout();
    menuProgress.value = withTiming(0, MENU_ANIMATION);
    setIsFeedMenuOpen(false);
  }, [clearFeedMenuCloseTimeout, menuProgress]);

  const toggleFeedMenu = React.useCallback(() => {
    if (isFeedMenuOpen) {
      closeFeedMenu();
    } else {
      openFeedMenu();
    }
  }, [closeFeedMenu, isFeedMenuOpen, openFeedMenu]);

  const handleFeedSelect = React.useCallback(
    (feed: KzoneFeedMode) => {
      clearFeedMenuCloseTimeout();
      setActiveFeed(feed);
      feedMenuCloseTimeoutRef.current = setTimeout(() => {
        closeFeedMenu();
      }, MENU_CLOSE_AFTER_SELECTION_MS);
    },
    [clearFeedMenuCloseTimeout, closeFeedMenu],
  );

  const handleHypeFilterSelect = React.useCallback(
    (filter: KzoneHypeFilterId) => {
      setActiveHypeFilter(filter);
    },
    [],
  );

  React.useEffect(() => {
    if (!isFeedMenuOpen) {
      return;
    }

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        closeFeedMenu();
        return true;
      },
    );

    return () => subscription.remove();
  }, [closeFeedMenu, isFeedMenuOpen]);

  React.useEffect(
    () => () => {
      clearFeedMenuCloseTimeout();
    },
    [clearFeedMenuCloseTimeout],
  );

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
            onPress={toggleFeedMenu}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={`Abrir seletor de feed. Atual: ${activeFeedLabel}`}
            accessibilityState={{ expanded: isFeedMenuOpen }}
            style={({ pressed }) => [
              styles.feedSelector,
              isFeedMenuOpen && styles.feedSelectorActive,
              pressed && styles.feedSelectorPressed,
            ]}
          >
            <Ionicons name="grid-outline" size={15} color="#B9B3FF" />
            <Text style={styles.feedSelectorText} numberOfLines={1}>
              {activeFeedLabel}
            </Text>
            <Reanimated.View style={menuChevronStyle}>
              <Ionicons name="chevron-down" size={14} color="#8D95B6" />
            </Reanimated.View>
          </Pressable>
        </View>
      </View>

      {activeFeed === 'hype' ? (
        <FlashList
          key={`hype-${activeHypeFilter}`}
          data={visibleHypeTopics}
          renderItem={renderHypeItem}
          keyExtractor={hypeKeyExtractor}
          getItemType={getHypeItemType}
          ListHeaderComponent={
            <KzoneHypeFilters
              activeFilter={activeHypeFilter}
              onSelect={handleHypeFilterSelect}
            />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <FlashList
          key={activeFeed}
          data={visiblePosts}
          renderItem={renderPost}
          keyExtractor={keyExtractor}
          getItemType={getItemType}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      )}

      <View
        pointerEvents={isFeedMenuOpen ? 'auto' : 'none'}
        style={styles.feedMenuLayer}
      >
        <Reanimated.View
          style={[styles.feedMenuBackdropLayer, menuBackdropAnimatedStyle]}
        >
          <Pressable
            accessibilityLabel="Fechar seletor de feed"
            accessibilityRole="button"
            onPress={closeFeedMenu}
            style={styles.feedMenuBackdrop}
          />
        </Reanimated.View>

        <Reanimated.View
          style={[
            styles.feedMenuPanel,
            { top: topInset + 54 },
            menuAnimatedStyle,
          ]}
        >
          <View style={styles.feedMenuGrid}>
            {KZONE_FEED_OPTIONS.map((option) => (
              <KzoneFeedMenuOption
                key={option.id}
                active={option.id === activeFeed}
                activeColor={option.activeColor}
                activeIcon={option.activeIcon}
                feed={option.id}
                glowColor={option.glowColor}
                icon={option.icon}
                label={option.label}
                onSelect={handleFeedSelect}
              />
            ))}
          </View>
        </Reanimated.View>
      </View>
    </View>
  );
}

type KzoneFeedMenuOptionProps = {
  active: boolean;
  activeColor: string;
  activeIcon: keyof typeof Ionicons.glyphMap;
  feed: KzoneFeedMode;
  glowColor: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onSelect: (feed: KzoneFeedMode) => void;
};

const KzoneFeedMenuOption = React.memo(function KzoneFeedMenuOption({
  active,
  activeColor,
  activeIcon,
  feed,
  glowColor,
  icon,
  label,
  onSelect,
}: KzoneFeedMenuOptionProps) {
  const iconScale = useSharedValue(1);
  const iconRotation = useSharedValue(0);
  const iconTranslateX = useSharedValue(0);
  const iconTranslateY = useSharedValue(0);
  const selectionProgress = useSharedValue(active ? 1 : 0);

  React.useEffect(() => {
    selectionProgress.value = withTiming(active ? 1 : 0, {
      duration: 180,
      easing: ReanimatedEasing.out(ReanimatedEasing.quad),
    });
  }, [active, selectionProgress]);

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      selectionProgress.value,
      [0, 1],
      ['rgba(166,173,206,0.1)', glowColor],
    ),
    borderColor: interpolateColor(
      selectionProgress.value,
      [0, 1],
      ['rgba(166,173,206,0.14)', activeColor],
    ),
    transform: [
      { translateX: iconTranslateX.value },
      { translateY: iconTranslateY.value },
      { scale: iconScale.value },
      { rotate: `${iconRotation.value}deg` },
    ],
  }));

  const optionAnimatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      selectionProgress.value,
      [0, 1],
      ['rgba(255,255,255,0.035)', glowColor],
    ),
    borderColor: interpolateColor(
      selectionProgress.value,
      [0, 1],
      ['rgba(166,173,206,0.12)', activeColor],
    ),
  }));

  const inactiveIconAnimatedStyle = useAnimatedStyle(() => ({
    opacity: 1 - selectionProgress.value,
    transform: [{ scale: 1 - selectionProgress.value * 0.12 }],
  }));

  const activeIconAnimatedStyle = useAnimatedStyle(() => ({
    opacity: selectionProgress.value,
    transform: [{ scale: 0.82 + selectionProgress.value * 0.18 }],
  }));

  const checkAnimatedStyle = useAnimatedStyle(() => ({
    opacity: selectionProgress.value,
    transform: [{ scale: 0.78 + selectionProgress.value * 0.22 }],
  }));

  const handlePress = React.useCallback(() => {
    if (feed === 'hype') {
      iconScale.value = withSequence(
        withTiming(0.9, ACTION_TIMING),
        withSpring(1.2, ACTION_SPRING),
        withTiming(1, ACTION_TIMING),
      );
      iconTranslateY.value = withSequence(
        withTiming(-4, ACTION_TIMING),
        withSpring(1, ACTION_SPRING),
        withTiming(0, ACTION_TIMING),
      );
      iconRotation.value = withSequence(
        withTiming(-5, ACTION_TIMING),
        withTiming(4, ACTION_TIMING),
        withTiming(0, ACTION_TIMING),
      );
    } else if (feed === 'for-you') {
      iconScale.value = withSequence(
        withTiming(0.9, ACTION_TIMING),
        withSpring(1.16, ACTION_SPRING),
        withTiming(1, ACTION_TIMING),
      );
      iconRotation.value = withSequence(
        withTiming(-10, ACTION_TIMING),
        withTiming(8, ACTION_TIMING),
        withTiming(0, ACTION_TIMING),
      );
    } else {
      iconScale.value = withSequence(
        withTiming(0.94, ACTION_TIMING),
        withSpring(1.1, ACTION_SPRING),
        withTiming(1, ACTION_TIMING),
      );
      iconTranslateX.value = withSequence(
        withTiming(-3, ACTION_TIMING),
        withTiming(3, ACTION_TIMING),
        withTiming(0, ACTION_TIMING),
      );
    }

    onSelect(feed);
  }, [
    feed,
    iconRotation,
    iconScale,
    iconTranslateX,
    iconTranslateY,
    onSelect,
  ]);

  return (
    <Pressable
      accessibilityLabel={`Abrir feed ${label}`}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.feedMenuOptionTouch,
        pressed && styles.feedMenuOptionTouchPressed,
      ]}
    >
      <Reanimated.View
        style={[styles.feedMenuOption, optionAnimatedStyle]}
      >
        <Reanimated.View
          style={[styles.feedMenuOptionIcon, iconAnimatedStyle]}
        >
          <Reanimated.View
            style={[
              styles.feedMenuOptionIconLayer,
              inactiveIconAnimatedStyle,
            ]}
          >
            <Ionicons name={icon} size={21} color="#A6ADCE" />
          </Reanimated.View>
          <Reanimated.View
            style={[
              styles.feedMenuOptionIconLayer,
              activeIconAnimatedStyle,
            ]}
          >
            <Ionicons name={activeIcon} size={21} color={activeColor} />
          </Reanimated.View>
        </Reanimated.View>
        <Text
          numberOfLines={1}
          style={[
            styles.feedMenuOptionText,
            active && styles.feedMenuOptionTextActive,
          ]}
        >
          {label}
        </Text>
        <View style={styles.feedMenuCheckSlot}>
          <Reanimated.View style={checkAnimatedStyle}>
            <Ionicons
              name="checkmark-circle"
              size={16}
              color={activeColor}
            />
          </Reanimated.View>
        </View>
      </Reanimated.View>
    </Pressable>
  );
});

type KzoneHypeFiltersProps = {
  activeFilter: KzoneHypeFilterId;
  onSelect: (filter: KzoneHypeFilterId) => void;
};

const KzoneHypeFilters = React.memo(function KzoneHypeFilters({
  activeFilter,
  onSelect,
}: KzoneHypeFiltersProps) {
  return (
    <View style={styles.hypeFiltersWrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.hypeFiltersContent}
      >
        {KZONE_HYPE_FILTERS.map((filter) => (
          <KzoneHypeFilter
            key={filter.id}
            active={filter.id === activeFilter}
            filter={filter}
            onSelect={onSelect}
          />
        ))}
      </ScrollView>
    </View>
  );
});

type KzoneHypeFilterProps = {
  active: boolean;
  filter: (typeof KZONE_HYPE_FILTERS)[number];
  onSelect: (filter: KzoneHypeFilterId) => void;
};

const KzoneHypeFilter = React.memo(function KzoneHypeFilter({
  active,
  filter,
  onSelect,
}: KzoneHypeFilterProps) {
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotate = useSharedValue(0);

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  const handlePress = React.useCallback(() => {
    if (filter.id === 'for-you') {
      translateY.value = withSequence(
        withTiming(-4, ACTION_TIMING),
        withSpring(0, ACTION_SPRING),
      );
      scale.value = withSequence(
        withTiming(0.9, ACTION_TIMING),
        withSpring(1.16, ACTION_SPRING),
        withTiming(1, ACTION_TIMING),
      );
    } else if (filter.id === 'esports') {
      rotate.value = withSequence(
        withTiming(-10, ACTION_TIMING),
        withTiming(9, ACTION_TIMING),
        withSpring(0, ACTION_SPRING),
      );
    } else if (filter.id === 'entertainment') {
      scale.value = withSequence(
        withTiming(0.88, ACTION_TIMING),
        withSpring(1.2, ACTION_SPRING),
        withTiming(1, ACTION_TIMING),
      );
    } else {
      translateX.value = withSequence(
        withTiming(3, ACTION_TIMING),
        withSpring(0, ACTION_SPRING),
      );
      rotate.value = withSequence(
        withTiming(-6, ACTION_TIMING),
        withSpring(0, ACTION_SPRING),
      );
    }

    onSelect(filter.id);
  }, [filter.id, onSelect, rotate, scale, translateX, translateY]);

  return (
    <Pressable
      accessibilityLabel={`Filtrar Hype por ${filter.label}`}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.hypeFilterPill,
        active && styles.hypeFilterPillActive,
        pressed && styles.hypeFilterPillPressed,
      ]}
    >
      <Reanimated.View style={iconAnimatedStyle}>
        <Ionicons
          name={filter.icon}
          size={17}
          color={active ? '#FFFFFF' : '#8D95B6'}
        />
      </Reanimated.View>
      <Text
        style={[
          styles.hypeFilterText,
          active && styles.hypeFilterTextActive,
        ]}
      >
        {filter.label}
      </Text>
    </Pressable>
  );
});

type KzoneHypeItemProps = {
  rank: number;
  topic: KzoneHypeTopic;
};

const KzoneHypeItem = React.memo(function KzoneHypeItem({
  rank,
  topic,
}: KzoneHypeItemProps) {
  const isTop = rank === 1;

  return (
    <View style={[styles.hypeItem, isTop && styles.hypeItemTop]}>
      <View style={[styles.hypeRank, isTop && styles.hypeRankTop]}>
        <Text style={[styles.hypeRankText, isTop && styles.hypeRankTextTop]}>
          {rank}
        </Text>
      </View>

      <View style={styles.hypeItemContent}>
        <View style={styles.hypeMetaRow}>
          <View style={styles.hypeCategory}>
            <Ionicons
              name={topic.icon}
              size={14}
              color={isTop ? '#D9D6FF' : '#8D95B6'}
            />
            <Text
              style={[
                styles.hypeCategoryText,
                isTop && styles.hypeCategoryTextTop,
              ]}
            >
              {topic.categoryLabel}
            </Text>
          </View>
          <View style={styles.hypeGrowth}>
            <Ionicons name="trending-up" size={14} color="#55D6A2" />
            <Text style={styles.hypeGrowthText}>+{topic.growth}%</Text>
          </View>
        </View>

        <Text style={[styles.hypeTitle, isTop && styles.hypeTitleTop]}>
          {topic.title}
        </Text>
        <Text style={styles.hypeDescription}>{topic.description}</Text>
        <Text style={styles.hypeMentions}>
          {formatKzoneCount(topic.mentions)} mencoes
        </Text>
      </View>
    </View>
  );
});

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
    zIndex: 5,
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
  feedSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minHeight: 34,
    paddingVertical: 6,
    paddingHorizontal: 9,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(166,173,206,0.12)',
    maxWidth: 118,
  },
  feedSelectorActive: {
    backgroundColor: 'rgba(108,99,255,0.16)',
    borderColor: 'rgba(185,179,255,0.36)',
  },
  feedSelectorPressed: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  feedSelectorText: {
    color: '#D9D6FF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0,
    flexShrink: 1,
  },
  feedMenuLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 40,
  },
  feedMenuBackdropLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  feedMenuBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(4,5,10,0.34)',
  },
  feedMenuPanel: {
    position: 'absolute',
    right: 14,
    width: FEED_MENU_PANEL_WIDTH,
    padding: 8,
    borderRadius: 24,
    backgroundColor: '#121625',
    borderWidth: 1,
    borderColor: 'rgba(185,179,255,0.24)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.32,
    shadowRadius: 18,
    elevation: 14,
  },
  feedMenuGrid: {
    flexDirection: 'column',
    gap: 8,
  },
  feedMenuOptionTouch: {
    borderRadius: 999,
  },
  feedMenuOptionTouchPressed: {
    opacity: 0.92,
  },
  feedMenuOption: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(166,173,206,0.12)',
    backgroundColor: 'rgba(255,255,255,0.035)',
  },
  feedMenuOptionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(166,173,206,0.14)',
    backgroundColor: 'rgba(166,173,206,0.1)',
  },
  feedMenuOptionIconLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedMenuOptionText: {
    color: '#A6ADCE',
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0,
  },
  feedMenuOptionTextActive: {
    color: '#FFFFFF',
  },
  feedMenuCheckSlot: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingBottom: 104,
  },
  hypeFiltersWrap: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(166,173,206,0.14)',
    backgroundColor: '#090B14',
  },
  hypeFiltersContent: {
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  hypeFilterPill: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(166,173,206,0.16)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  hypeFilterPillActive: {
    borderColor: 'rgba(185,179,255,0.48)',
    backgroundColor: 'rgba(108,99,255,0.22)',
  },
  hypeFilterPillPressed: {
    backgroundColor: 'rgba(185,179,255,0.13)',
  },
  hypeFilterText: {
    color: '#8D95B6',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0,
  },
  hypeFilterTextActive: {
    color: '#FFFFFF',
  },
  hypeItem: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 17,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(166,173,206,0.14)',
  },
  hypeItemTop: {
    marginHorizontal: 12,
    marginTop: 12,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(185,179,255,0.32)',
    borderRadius: 8,
    backgroundColor: 'rgba(108,99,255,0.12)',
  },
  hypeRank: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(166,173,206,0.09)',
    borderWidth: 1,
    borderColor: 'rgba(166,173,206,0.16)',
  },
  hypeRankTop: {
    backgroundColor: '#6C63FF',
    borderColor: '#B9B3FF',
  },
  hypeRankText: {
    color: '#A6ADCE',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0,
  },
  hypeRankTextTop: {
    color: '#FFFFFF',
  },
  hypeItemContent: {
    flex: 1,
    minWidth: 0,
  },
  hypeMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  hypeCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  hypeCategoryText: {
    color: '#8D95B6',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0,
  },
  hypeCategoryTextTop: {
    color: '#D9D6FF',
  },
  hypeGrowth: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  hypeGrowthText: {
    color: '#55D6A2',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0,
  },
  hypeTitle: {
    color: '#F3F4FA',
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '800',
    letterSpacing: 0,
    marginTop: 7,
  },
  hypeTitleTop: {
    color: '#FFFFFF',
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '900',
  },
  hypeDescription: {
    color: '#A6ADCE',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
    letterSpacing: 0,
    marginTop: 6,
  },
  hypeMentions: {
    color: '#7D86A8',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0,
    marginTop: 8,
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
