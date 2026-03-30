import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Alert,
  InteractionManager,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetFooter,
  BottomSheetFlatList,
  BottomSheetModal,
  BottomSheetTextInput,
  type BottomSheetBackdropProps,
  type BottomSheetFooterProps,
} from '@gorhom/bottom-sheet';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  buildShareTargetSections,
  filterShareTargets,
} from '@/features/share/application/use-cases/shareTargets';
import type {
  SharePostPreview,
  ShareTarget,
} from '@/features/share/domain/entities/share';
import ShareTargetTile from '@/features/share/presentation/components/BottomSheetShare/ShareTargetTile';
import { useShareTargets } from '@/features/share/presentation/hooks/useShareTargets';
import type { RootStackParamList } from '@/app/navigation/types';

type ShareListRow =
  | {
      id: string;
      type: 'section';
      title: string;
    }
  | {
      id: string;
      type: 'targets';
      targets: ShareTarget[];
    };

export type BottomSheetShareProps = {
  visible: boolean;
  post: SharePostPreview | null;
  onClose: () => void;
  onShareIncrement?: (postId: string, amount: number) => void;
};

const EMPTY_TARGETS: ShareTarget[] = [];

function chunkTargets(targets: ShareTarget[], size: number) {
  const rows: ShareTarget[][] = [];

  for (let index = 0; index < targets.length; index += size) {
    rows.push(targets.slice(index, index + size));
  }

  return rows;
}

function BottomSheetShareComponent({
  visible,
  post,
  onClose,
  onShareIncrement,
}: BottomSheetShareProps) {
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const modalRef = useRef<BottomSheetModal>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [footerHeight, setFooterHeight] = useState(0);
  const snapPoints = useMemo(() => ['70%', '92%'], []);
  const { targets } = useShareTargets(visible);

  const resetState = useCallback(() => {
    setSearchQuery('');
    setSelectedIds([]);
  }, []);

  const handleDismiss = useCallback(() => {
    resetState();
    onClose();
  }, [onClose, resetState]);

  useEffect(() => {
    if (!visible || !post) {
      resetState();
      modalRef.current?.dismiss();
      return;
    }

    modalRef.current?.present();
  }, [post, resetState, visible]);

  const filteredTargets = useMemo(
    () => filterShareTargets(targets, searchQuery),
    [searchQuery, targets]
  );

  const sections = useMemo(
    () => buildShareTargetSections(filteredTargets),
    [filteredTargets]
  );

  const rows = useMemo<ShareListRow[]>(() => {
    const nextRows: ShareListRow[] = [];

    sections.forEach((section) => {
      nextRows.push({
        id: `section-${section.key}`,
        type: 'section',
        title: section.title,
      });

      chunkTargets(section.targets, 4).forEach((targetsChunk, rowIndex) => {
        nextRows.push({
          id: `targets-${section.key}-${rowIndex}`,
          type: 'targets',
          targets: targetsChunk,
        });
      });
    });

    return nextRows;
  }, [sections]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selectedCount = selectedIds.length;
  const selectedTargets = useMemo(() => {
    if (selectedIds.length === 0) {
      return EMPTY_TARGETS;
    }

    return targets.filter((target) => selectedSet.has(target.id));
  }, [selectedIds.length, selectedSet, targets]);

  const toggleSelection = useCallback((targetId: string) => {
    setSelectedIds((currentIds) => {
      if (currentIds.includes(targetId)) {
        return currentIds.filter((currentId) => currentId !== targetId);
      }

      return [...currentIds, targetId];
    });
  }, []);

  const shareMessage = useMemo(() => {
    if (!post) {
      return '';
    }

    const textBlocks = [
      `Confira este post de ${post.authorName} no KaChan!`,
      post.text,
      post.mediaUri,
    ].filter(Boolean);

    return textBlocks.join('\n\n');
  }, [post]);

  const handleInternalSend = useCallback(() => {
    if (!post || selectedCount === 0) {
      return;
    }

    const destinationLabel =
      selectedTargets.length === 1
        ? selectedTargets[0].name
        : `${selectedTargets.length} contatos e comunidades`;

    onShareIncrement?.(post.id, selectedTargets.length);
    onClose();
    resetState();

    InteractionManager.runAfterInteractions(() => {
      Alert.alert('Compartilhado', `Post enviado para ${destinationLabel}.`);
    });
  }, [
    onClose,
    onShareIncrement,
    post,
    resetState,
    selectedCount,
    selectedTargets,
  ]);

  const handleExternalShare = useCallback(() => {
    if (!post) {
      return;
    }

    onClose();
    resetState();

    InteractionManager.runAfterInteractions(async () => {
      try {
        const result = await Share.share({
          message: shareMessage,
          ...(post.mediaUri ? { url: post.mediaUri } : {}),
        });

        if (result.action === Share.sharedAction) {
          onShareIncrement?.(post.id, 1);
        }
      } catch {
        Alert.alert(
          'Nao foi possivel compartilhar',
          'Tente novamente em alguns instantes.'
        );
      }
    });
  }, [onClose, onShareIncrement, post, resetState, shareMessage]);

  const handleAddToStory = useCallback(() => {
    if (!post) {
      return;
    }

    onClose();
    resetState();

    InteractionManager.runAfterInteractions(() => {
      navigation.navigate('CriarStories', {
        uri: post.mediaUri,
        type: post.mediaType,
        caption: post.caption ?? post.text,
      });
    });
  }, [navigation, onClose, post, resetState]);

  const renderHeader = useMemo(
    () => (
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Text style={styles.headerTitle}>Compartilhar</Text>
          <View style={styles.headerCounter}>
            <Ionicons name="paper-plane-outline" size={14} color="#DCE1FF" />
            <Text style={styles.headerCounterText}>{selectedCount}</Text>
          </View>
        </View>

        {post && (
          <View style={styles.postPreview}>
            <Image
              source={{ uri: post.authorAvatar }}
              style={styles.postPreviewAvatar}
              contentFit="cover"
              cachePolicy="memory-disk"
              recyclingKey={post.authorAvatar}
            />
            <View style={styles.postPreviewTextWrap}>
              <Text style={styles.postPreviewTitle}>Post de {post.authorName}</Text>
              <Text style={styles.postPreviewText} numberOfLines={2}>
                {post.text}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color="#98A2D9" />
          <BottomSheetTextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Pesquisar contatos e comunidades"
            placeholderTextColor="#8F98CC"
            style={styles.searchInput}
          />
          {!!searchQuery && (
            <Pressable
              onPress={() => setSearchQuery('')}
              hitSlop={8}
              style={styles.searchClear}
            >
              <Ionicons name="close-circle" size={18} color="#98A2D9" />
            </Pressable>
          )}
        </View>
      </View>
    ),
    [post, searchQuery, selectedCount]
  );

  const renderFooter = useCallback(
    (props: BottomSheetFooterProps) => (
      <BottomSheetFooter {...props}>
        <View
          onLayout={(event: LayoutChangeEvent) => {
            const nextHeight = Math.ceil(event.nativeEvent.layout.height);
            setFooterHeight((currentHeight) =>
              currentHeight === nextHeight ? currentHeight : nextHeight
            );
          }}
          style={[
            styles.footerWrap,
            { paddingBottom: Math.max(insets.bottom, 10) },
          ]}
        >
          <View style={styles.footerRow}>
            <Pressable
              style={({ pressed }) => [
                styles.secondaryAction,
                pressed && styles.secondaryActionPressed,
              ]}
              onPress={handleAddToStory}
            >
              <Ionicons name="add-circle-outline" size={20} color="#DCE1FF" />
              <Text style={styles.secondaryActionText}>Story</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.secondaryAction,
                pressed && styles.secondaryActionPressed,
              ]}
              onPress={handleExternalShare}
            >
              <Ionicons name="share-social-outline" size={20} color="#DCE1FF" />
              <Text style={styles.secondaryActionText}>Apps</Text>
            </Pressable>

            <Pressable
              disabled={selectedCount === 0}
              style={({ pressed }) => [
                styles.primaryAction,
                selectedCount === 0 && styles.primaryActionDisabled,
                pressed && selectedCount > 0 && styles.primaryActionPressed,
              ]}
              onPress={handleInternalSend}
            >
              <LinearGradient
                colors={
                  selectedCount > 0
                    ? ['#6C63FF', '#2230C3']
                    : ['rgba(108,99,255,0.32)', 'rgba(34,48,195,0.32)']
                }
                start={[0, 0]}
                end={[1, 1]}
                style={styles.primaryActionGradient}
              >
                <MaterialCommunityIcons
                  name="send-circle-outline"
                  size={22}
                  color="#FFFFFF"
                />
                <Text style={styles.primaryActionText}>
                  {selectedCount > 0 ? `Enviar (${selectedCount})` : 'Enviar'}
                </Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </BottomSheetFooter>
    ),
    [
      handleAddToStory,
      handleExternalShare,
      handleInternalSend,
      insets.bottom,
      selectedCount,
    ]
  );

  const renderItem = useCallback(
    ({ item }: { item: ShareListRow }) => {
      if (item.type === 'section') {
        return <Text style={styles.sectionTitle}>{item.title}</Text>;
      }

      return (
        <View style={styles.targetsRow}>
          {item.targets.map((target) => (
            <ShareTargetTile
              key={target.id}
              target={target}
              selected={selectedSet.has(target.id)}
              onPress={toggleSelection}
            />
          ))}
          {Array.from({ length: Math.max(0, 4 - item.targets.length) }).map(
            (_, index) => (
              <View
                key={`${item.id}-spacer-${index}`}
                style={styles.targetSpacer}
              />
            )
          )}
        </View>
      );
    },
    [selectedSet, toggleSelection]
  );

  return (
    <BottomSheetModal
      ref={modalRef}
      index={0}
      snapPoints={snapPoints}
      topInset={insets.top}
      bottomInset={insets.bottom}
      onDismiss={handleDismiss}
      enablePanDownToClose
      enableDynamicSizing={false}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustPan"
      backdropComponent={(props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          pressBehavior="close"
        />
      )}
      footerComponent={renderFooter}
      handleIndicatorStyle={styles.grabHandle}
      backgroundStyle={styles.sheetBackground}
    >
      <BottomSheetFlatList
        data={rows}
        keyExtractor={(item: ShareListRow) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={24} color="#98A2D9" />
            <Text style={styles.emptyStateTitle}>Nada encontrado</Text>
            <Text style={styles.emptyStateText}>
              Tente pesquisar por outro nome ou comunidade.
            </Text>
          </View>
        }
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: footerHeight + 18 },
        ]}
      />
    </BottomSheetModal>
  );
}

export default memo(BottomSheetShareComponent);

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: '#101327',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  grabHandle: {
    width: 44,
    height: 5,
    borderRadius: 99,
    backgroundColor: 'rgba(220,227,255,0.45)',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  header: {
    paddingBottom: 14,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: '#F7F8FF',
    fontSize: 24,
    fontWeight: '800',
  },
  headerCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  headerCounterText: {
    color: '#F7F8FF',
    fontSize: 12,
    fontWeight: '700',
  },
  postPreview: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  postPreviewAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  postPreviewTextWrap: {
    flex: 1,
  },
  postPreviewTitle: {
    color: '#F6F8FF',
    fontSize: 14,
    fontWeight: '700',
  },
  postPreviewText: {
    color: '#A6B0E2',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 2,
  },
  searchBar: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 50,
    borderRadius: 18,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  searchInput: {
    flex: 1,
    color: '#F7F8FF',
    fontSize: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  searchClear: {
    marginLeft: 6,
  },
  sectionTitle: {
    color: '#DDE2FF',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 10,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  targetsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10,
    marginBottom: 12,
  },
  targetSpacer: {
    flex: 1,
  },
  footerWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#101327',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10,
  },
  secondaryAction: {
    width: 86,
    minHeight: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  secondaryActionPressed: {
    opacity: 0.82,
  },
  secondaryActionText: {
    color: '#DDE2FF',
    fontSize: 11,
    fontWeight: '700',
  },
  primaryAction: {
    flex: 1,
    borderRadius: 22,
    overflow: 'hidden',
  },
  primaryActionPressed: {
    opacity: 0.92,
  },
  primaryActionDisabled: {
    opacity: 0.6,
  },
  primaryActionGradient: {
    flex: 1,
    minHeight: 72,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 48,
    paddingBottom: 64,
  },
  emptyStateTitle: {
    color: '#EEF1FF',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 10,
  },
  emptyStateText: {
    color: '#98A2D9',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 240,
    lineHeight: 18,
  },
});
