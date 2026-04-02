import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
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
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type {
  StoryPrivacyPerson,
  StoryPrivacyPreset,
} from '@/features/stories/domain/entities/story';
import { useStoryPrivacyEditor } from '@/features/stories/presentation/hooks/useStoryPrivacyEditor';

type BottomSheetStoryPrivacyProps = {
  visible: boolean;
  ownerId: string | null;
  storyId: string | null;
  currentPreset: StoryPrivacyPreset | null;
  onClose: () => void;
};

type PrivacyPresetOption = {
  preset: StoryPrivacyPreset;
  title: string;
  helper: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconSurface: string;
};

type PrivacySheetItem = PrivacyPresetOption | StoryPrivacyPerson;

const PRIVACY_PRESET_OPTIONS: PrivacyPresetOption[] = [
  {
    preset: 'everyone',
    title: 'Todos',
    helper: 'Excluir pessoas',
    icon: 'earth-outline',
    iconColor: '#EAF2FF',
    iconSurface: '#2D8CFF',
  },
  {
    preset: 'contacts',
    title: 'Meus Contatos',
    helper: 'Excluir pessoas',
    icon: 'people-outline',
    iconColor: '#F3EAFF',
    iconSurface: '#9A5CFF',
  },
  {
    preset: 'close_friends',
    title: 'Amigos Proximos',
    helper: 'Editar lista',
    icon: 'star-outline',
    iconColor: '#EEFBE7',
    iconSurface: '#65C95A',
  },
  {
    preset: 'selected_people',
    title: 'Pessoas Selecionadas',
    helper: 'Editar lista',
    icon: 'people-circle-outline',
    iconColor: '#FFF3E7',
    iconSurface: '#F6A245',
  },
];

const PRESET_TITLES: Record<StoryPrivacyPreset, string> = {
  everyone: 'Todos',
  contacts: 'Meus Contatos',
  close_friends: 'Amigos Proximos',
  selected_people: 'Pessoas Selecionadas',
};

function BottomSheetStoryPrivacyComponent({
  visible,
  ownerId,
  storyId,
  currentPreset,
  onClose,
}: BottomSheetStoryPrivacyProps) {
  const insets = useSafeAreaInsets();
  const modalRef = useRef<BottomSheetModal>(null);
  const [footerHeight, setFooterHeight] = useState(0);
  const snapPoints = useMemo(() => ['62%', '92%'], []);
  const {
    activeEditorPreset,
    closeEditor,
    draftPreset,
    filteredPeople,
    listCounts,
    openEditor,
    saveChanges,
    searchQuery,
    selectedPeopleIds,
    setDraftPreset,
    setSearchQuery,
    togglePerson,
  } = useStoryPrivacyEditor({
    visible,
    ownerId,
    storyId,
    initialPreset: currentPreset,
  });

  const isEditingList = !!activeEditorPreset;

  useEffect(() => {
    if (!visible || !ownerId || !storyId) {
      modalRef.current?.dismiss();
      return;
    }

    modalRef.current?.present();
  }, [ownerId, storyId, visible]);

  const handleDismiss = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleSave = useCallback(() => {
    if (!saveChanges()) {
      return;
    }

    modalRef.current?.dismiss();
  }, [saveChanges]);

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
            { paddingBottom: Math.max(insets.bottom, 12) },
          ]}
        >
          <Pressable
            onPress={isEditingList ? closeEditor : handleSave}
            style={({ pressed }) => [
              styles.primaryAction,
              pressed && styles.primaryActionPressed,
            ]}
          >
            <LinearGradient
              colors={['#6C63FF', '#2332D0']}
              start={[0, 0]}
              end={[1, 1]}
              style={styles.primaryActionGradient}
            >
              <Text style={styles.primaryActionText}>
                {isEditingList ? 'Concluir' : 'Salvar configuracoes'}
              </Text>
            </LinearGradient>
          </Pressable>
        </View>
      </BottomSheetFooter>
    ),
    [closeEditor, handleSave, insets.bottom, isEditingList]
  );

  const mainHeader = useMemo(
    () => (
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Editar Privacidade</Text>
        <Text style={styles.headerSubtitle}>
          Escolha quem pode ver este story.
        </Text>
      </View>
    ),
    []
  );

  const editorHeader = useMemo(() => {
    if (!activeEditorPreset) {
      return null;
    }

    const isExclusionPreset =
      activeEditorPreset === 'everyone' || activeEditorPreset === 'contacts';

    return (
      <View style={styles.header}>
        <View style={styles.editorHeaderRow}>
          <Pressable
            onPress={closeEditor}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backButtonPressed,
            ]}
          >
            <Ionicons name="chevron-back" size={18} color="#EEF1FF" />
          </Pressable>
          <View style={styles.editorHeaderCopy}>
            <Text style={styles.headerTitle}>{PRESET_TITLES[activeEditorPreset]}</Text>
            <Text style={styles.headerSubtitle}>
              {isExclusionPreset
                ? 'Selecione pessoas que nunca vao ver este story.'
                : 'Selecione pessoas que podem ver este story.'}
            </Text>
          </View>
        </View>

        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color="#98A2D9" />
          <BottomSheetTextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Pesquisar pessoas"
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
    );
  }, [activeEditorPreset, closeEditor, searchQuery, setSearchQuery]);

  const renderPresetItem = useCallback(
    ({ item }: { item: PrivacyPresetOption }) => {
      const isSelected = draftPreset === item.preset;
      const helperCount = listCounts[item.preset];

      return (
        <View style={styles.presetCard}>
          <Pressable
            onPress={() => setDraftPreset(item.preset)}
            style={({ pressed }) => [
              styles.presetRow,
              pressed && styles.presetRowPressed,
            ]}
          >
            <View
              style={[
                styles.radioOuter,
                isSelected && styles.radioOuterActive,
              ]}
            >
              {isSelected && <View style={styles.radioInner} />}
            </View>

            <View
              style={[
                styles.presetIconWrap,
                { backgroundColor: item.iconSurface },
              ]}
            >
              <Ionicons name={item.icon} size={18} color={item.iconColor} />
            </View>

            <View style={styles.presetCopy}>
              <Text style={styles.presetTitle}>{item.title}</Text>
              <Pressable
                onPress={() => openEditor(item.preset)}
                style={({ pressed }) => [
                  styles.helperLinkWrap,
                  pressed && styles.helperLinkWrapPressed,
                ]}
              >
                <Text style={styles.helperLink}>
                  {item.helper}
                  {helperCount > 0 ? ` (${helperCount})` : ''}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={14}
                  color="#7FB3FF"
                />
              </Pressable>
            </View>
          </Pressable>
        </View>
      );
    },
    [draftPreset, listCounts, openEditor, setDraftPreset]
  );

  const renderPersonItem = useCallback(
    ({ item }: { item: StoryPrivacyPerson }) => {
      const isSelected = selectedPeopleIds.has(item.id);

      return (
        <Pressable
          onPress={() => togglePerson(item)}
          style={({ pressed }) => [
            styles.personRow,
            pressed && styles.personRowPressed,
          ]}
        >
          <Image
            source={{ uri: item.avatar }}
            style={styles.personAvatar}
            contentFit="cover"
            cachePolicy="memory-disk"
            recyclingKey={item.avatar}
          />
          <View style={styles.personCopy}>
            <Text style={styles.personName}>{item.name}</Text>
          </View>
          <View
            style={[
              styles.personCheck,
              isSelected && styles.personCheckActive,
            ]}
          >
            {isSelected && (
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
            )}
          </View>
        </Pressable>
      );
    },
    [selectedPeopleIds, togglePerson]
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
      handleIndicatorStyle={styles.grabHandle}
      backgroundStyle={styles.sheetBackground}
      footerComponent={renderFooter}
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
        data={isEditingList ? filteredPeople : PRIVACY_PRESET_OPTIONS}
        keyExtractor={(item: PrivacySheetItem) =>
          'preset' in item ? item.preset : item.id
        }
        renderItem={isEditingList ? renderPersonItem : renderPresetItem}
        ListHeaderComponent={isEditingList ? editorHeader : mainHeader}
        ListEmptyComponent={
          isEditingList ? (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={24} color="#98A2D9" />
              <Text style={styles.emptyTitle}>Nada encontrado</Text>
              <Text style={styles.emptyText}>
                Tente pesquisar por outro nome para editar esta lista.
              </Text>
            </View>
          ) : null
        }
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: footerHeight + 18 },
        ]}
      />
    </BottomSheetModal>
  );
}

export default memo(BottomSheetStoryPrivacyComponent);

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
    paddingTop: 12,
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
    lineHeight: 19,
    marginTop: 6,
  },
  editorHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  editorHeaderCopy: {
    flex: 1,
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginTop: 2,
  },
  backButtonPressed: {
    opacity: 0.82,
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
  presetCard: {
    marginBottom: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  presetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  presetRowPressed: {
    opacity: 0.9,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterActive: {
    borderColor: '#6C63FF',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#6C63FF',
  },
  presetIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetCopy: {
    flex: 1,
  },
  presetTitle: {
    color: '#F7F8FF',
    fontSize: 16,
    fontWeight: '800',
  },
  helperLinkWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  helperLinkWrapPressed: {
    opacity: 0.82,
  },
  helperLink: {
    color: '#7FB3FF',
    fontSize: 13,
    fontWeight: '700',
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  personRowPressed: {
    opacity: 0.86,
  },
  personAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  personCopy: {
    flex: 1,
  },
  personName: {
    color: '#F7F8FF',
    fontSize: 15,
    fontWeight: '700',
  },
  personCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  personCheckActive: {
    borderColor: '#6C63FF',
    backgroundColor: '#6C63FF',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 48,
    paddingBottom: 64,
  },
  emptyTitle: {
    color: '#EEF1FF',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 10,
  },
  emptyText: {
    color: '#98A2D9',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 240,
    lineHeight: 18,
  },
  footerWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#101327',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  primaryAction: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  primaryActionPressed: {
    opacity: 0.92,
  },
  primaryActionGradient: {
    minHeight: 58,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
