import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetModal,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { StoryViewerEntry } from '@/features/stories/domain/entities/story';

type BottomSheetStoryViewersProps = {
  visible: boolean;
  viewers: StoryViewerEntry[];
  onClose: () => void;
};

function BottomSheetStoryViewersComponent({
  visible,
  viewers,
  onClose,
}: BottomSheetStoryViewersProps) {
  const insets = useSafeAreaInsets();
  const modalRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['55%', '88%'], []);

  useEffect(() => {
    if (!visible) {
      modalRef.current?.dismiss();
      return;
    }

    modalRef.current?.present();
  }, [visible]);

  const sortedViewers = useMemo(() => [...viewers], [viewers]);

  const renderViewer = useCallback(
    ({ item }: { item: StoryViewerEntry }) => (
      <View style={styles.viewerRow}>
        <Image
          source={{ uri: item.avatar }}
          style={styles.viewerAvatar}
          contentFit="cover"
          cachePolicy="memory-disk"
          recyclingKey={item.avatar}
        />
        <View style={styles.viewerCopy}>
          <Text style={styles.viewerName}>{item.name}</Text>
          <Text style={styles.viewerTime}>{item.viewedAt}</Text>
        </View>
      </View>
    ),
    []
  );

  return (
    <BottomSheetModal
      ref={modalRef}
      index={0}
      snapPoints={snapPoints}
      topInset={insets.top}
      bottomInset={insets.bottom}
      onDismiss={onClose}
      enablePanDownToClose
      enableDynamicSizing={false}
      handleIndicatorStyle={styles.grabHandle}
      backgroundStyle={styles.sheetBackground}
      backdropComponent={(props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          pressBehavior="close"
        />
      )}
    >
      <BottomSheetFlatList
        data={sortedViewers}
        keyExtractor={(item: StoryViewerEntry) => item.id}
        renderItem={renderViewer}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Visualizacoes</Text>
            <Text style={styles.headerSubtitle}>
              {sortedViewers.length === 1
                ? '1 pessoa viu este story'
                : `${sortedViewers.length} pessoas viram este story`}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="eye-off-outline" size={26} color="#98A2D9" />
            <Text style={styles.emptyStateTitle}>Sem visualizacoes</Text>
            <Text style={styles.emptyStateText}>
              Quando alguem assistir este story, a lista aparecera aqui.
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: Math.max(insets.bottom, 16) + 12 },
        ]}
      />
    </BottomSheetModal>
  );
}

export default memo(BottomSheetStoryViewersComponent);

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
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  header: {
    paddingBottom: 16,
  },
  headerTitle: {
    color: '#F7F8FF',
    fontSize: 24,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: '#98A2D9',
    fontSize: 13,
    marginTop: 6,
  },
  viewerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  viewerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  viewerCopy: {
    flex: 1,
  },
  viewerName: {
    color: '#F7F8FF',
    fontSize: 15,
    fontWeight: '700',
  },
  viewerTime: {
    color: '#98A2D9',
    fontSize: 12,
    marginTop: 3,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 56,
    paddingBottom: 76,
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
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 240,
  },
});
