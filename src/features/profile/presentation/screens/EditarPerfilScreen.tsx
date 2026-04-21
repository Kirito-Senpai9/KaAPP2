import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Reanimated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackScreenProps } from '@/app/navigation/types';
import {
  PROFILE_GAMER_STATS,
  type EditableProfileState,
  type GamerStatId,
  type ProfileGamerStat,
  type SocialLinkId,
  useProfileStore,
} from '@/features/profile/presentation/store/useProfileStore';

type EditableImageKind = 'avatar' | 'banner';

type SocialLinkOption = {
  id: SocialLinkId;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  placeholder: string;
};

type DraggableGamerStatRowProps = {
  stat: ProfileGamerStat;
  index: number;
  itemCount: number;
  onDragStart: () => void;
  onDragEnd: () => void;
  onMoveToIndex: (statId: GamerStatId, nextIndex: number) => void;
  onMoveByOffset: (statId: GamerStatId, direction: -1 | 1) => void;
};

const STAT_ROW_HEIGHT = 74;

const SOCIAL_LINK_OPTIONS: SocialLinkOption[] = [
  { id: 'tiktok', label: 'TikTok', icon: 'logo-tiktok', color: '#FFFFFF', placeholder: 'https://www.tiktok.com/@usuario' },
  { id: 'youtube', label: 'YouTube', icon: 'logo-youtube', color: '#FF4D5E', placeholder: 'https://www.youtube.com/@canal' },
  { id: 'twitch', label: 'Twitch', icon: 'logo-twitch', color: '#B987FF', placeholder: 'https://www.twitch.tv/usuario' },
  { id: 'instagram', label: 'Instagram', icon: 'logo-instagram', color: '#FF7AC8', placeholder: 'https://www.instagram.com/usuario' },
  { id: 'x', label: 'X', icon: 'logo-x', color: '#FFFFFF', placeholder: 'https://x.com/usuario' },
];

const normalizeHandle = (value: string) => {
  const compactHandle = value.trim().replace(/\s+/g, '').replace(/^@+/, '');
  return compactHandle ? `@${compactHandle}` : '';
};

const normalizeSocialUrl = (value: string) => {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return '';
  }

  return /^https?:\/\//i.test(trimmedValue) ? trimmedValue : `https://${trimmedValue}`;
};

const isSafeHttpUrl = (value: string) => {
  if (!value) {
    return true;
  }

  try {
    const parsedUrl = new URL(value);
    return parsedUrl.protocol === 'https:' || parsedUrl.protocol === 'http:';
  } catch {
    return false;
  }
};

function DraggableGamerStatRow({
  stat,
  index,
  itemCount,
  onDragStart,
  onDragEnd,
  onMoveToIndex,
  onMoveByOffset,
}: DraggableGamerStatRowProps) {
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  const panGesture = Gesture.Pan()
    .activateAfterLongPress(130)
    .minDistance(4)
    .onBegin(() => {
      scale.value = withSpring(1.025);
      runOnJS(onDragStart)();
    })
    .onUpdate((event) => {
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
      const offset = Math.round(event.translationY / STAT_ROW_HEIGHT);
      const nextIndex = Math.min(Math.max(index + offset, 0), itemCount - 1);

      if (nextIndex !== index) {
        runOnJS(onMoveToIndex)(stat.id, nextIndex);
      }
    })
    .onFinalize(() => {
      translateY.value = withSpring(0);
      scale.value = withSpring(1);
      runOnJS(onDragEnd)();
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    zIndex: scale.value > 1 ? 10 : 0,
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Reanimated.View
        style={[styles.statOrderRow, animatedStyle]}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={`${stat.label}, posicao ${index + 1}`}
        accessibilityHint="Arraste para reorganizar, ou use as acoes de acessibilidade para mover."
        accessibilityActions={[
          { name: 'decrement', label: `Subir ${stat.label}` },
          { name: 'increment', label: `Descer ${stat.label}` },
        ]}
        onAccessibilityAction={(event) => {
          if (event.nativeEvent.actionName === 'decrement') {
            onMoveByOffset(stat.id, -1);
          }

          if (event.nativeEvent.actionName === 'increment') {
            onMoveByOffset(stat.id, 1);
          }
        }}
      >
        <View style={[styles.statIconBox, { borderColor: stat.color }]}>
          <Ionicons name={stat.icon} size={19} color={stat.color} />
        </View>
        <View style={styles.statOrderText}>
          <Text style={styles.statOrderLabel}>{stat.label}</Text>
          <Text style={styles.statOrderMeta}>Arraste para a posicao {index + 1}</Text>
        </View>
        <Ionicons name="reorder-three-outline" size={24} color="#C7CCEF" />
      </Reanimated.View>
    </GestureDetector>
  );
}

export default function EditarPerfilScreen({ navigation }: RootStackScreenProps<'EditarPerfil'>) {
  const insets = useSafeAreaInsets();
  const savedName = useProfileStore((state) => state.name);
  const savedHandle = useProfileStore((state) => state.handle);
  const savedAvatar = useProfileStore((state) => state.avatar);
  const savedBanner = useProfileStore((state) => state.banner);
  const savedBio = useProfileStore((state) => state.bio);
  const savedSocialLinks = useProfileStore((state) => state.socialLinks);
  const savedGamerStatOrder = useProfileStore((state) => state.gamerStatOrder);
  const updateProfile = useProfileStore((state) => state.updateProfile);

  const [name, setName] = useState(savedName);
  const [handle, setHandle] = useState(savedHandle);
  const [avatar, setAvatar] = useState(savedAvatar);
  const [banner, setBanner] = useState(savedBanner);
  const [bio, setBio] = useState(savedBio);
  const [socialLinks, setSocialLinks] = useState(savedSocialLinks);
  const [gamerStatOrder, setGamerStatOrder] = useState<GamerStatId[]>(savedGamerStatOrder);
  const [isDraggingStat, setIsDraggingStat] = useState(false);

  const orderedStats = useMemo(
    () => gamerStatOrder.map((statId) => PROFILE_GAMER_STATS[statId]),
    [gamerStatOrder]
  );

  const canSave = name.trim().length > 0 && normalizeHandle(handle).length > 1;

  const pickProfileImage = useCallback(async (kind: EditableImageKind) => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert('Permissao necessaria', 'Libere acesso a galeria para atualizar sua imagem.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.9,
        allowsEditing: kind === 'avatar',
        aspect: kind === 'avatar' ? [1, 1] : undefined,
        allowsMultipleSelection: false,
      });

      if (result.canceled || !result.assets?.[0]?.uri) {
        return;
      }

      if (kind === 'avatar') {
        setAvatar(result.assets[0].uri);
        return;
      }

      setBanner(result.assets[0].uri);
    } catch (error) {
      console.warn('[EditarPerfilScreen] Falha ao escolher imagem', error);
      Alert.alert('Nao foi possivel atualizar', 'Tente escolher outra imagem da galeria.');
    }
  }, []);

  const updateSocialLink = useCallback((id: SocialLinkId, value: string) => {
    setSocialLinks((currentLinks) => ({
      ...currentLinks,
      [id]: value,
    }));
  }, []);

  const moveStatByOffset = useCallback((statId: GamerStatId, direction: -1 | 1) => {
    setGamerStatOrder((currentOrder) => {
      const currentIndex = currentOrder.indexOf(statId);
      const nextIndex = currentIndex + direction;

      if (currentIndex < 0 || nextIndex < 0 || nextIndex >= currentOrder.length) {
        return currentOrder;
      }

      const nextOrder = [...currentOrder];
      [nextOrder[currentIndex], nextOrder[nextIndex]] = [nextOrder[nextIndex], nextOrder[currentIndex]];
      return nextOrder;
    });
  }, []);

  const moveStatToIndex = useCallback((statId: GamerStatId, targetIndex: number) => {
    setGamerStatOrder((currentOrder) => {
      const currentIndex = currentOrder.indexOf(statId);

      if (currentIndex < 0 || targetIndex < 0 || targetIndex >= currentOrder.length || targetIndex === currentIndex) {
        return currentOrder;
      }

      const nextOrder = [...currentOrder];
      const [movedStat] = nextOrder.splice(currentIndex, 1);
      nextOrder.splice(targetIndex, 0, movedStat);
      return nextOrder;
    });
  }, []);

  const saveProfile = useCallback(() => {
    const trimmedName = name.trim();
    const normalizedHandle = normalizeHandle(handle);

    if (!trimmedName) {
      Alert.alert('Nome obrigatorio', 'Informe um nome para exibir no perfil.');
      return;
    }

    if (!normalizedHandle) {
      Alert.alert('Arroba obrigatoria', 'Informe uma tag para o perfil.');
      return;
    }

    const normalizedSocialLinks = SOCIAL_LINK_OPTIONS.reduce<Record<SocialLinkId, string>>((links, option) => {
      links[option.id] = normalizeSocialUrl(socialLinks[option.id]);
      return links;
    }, {
      tiktok: '',
      youtube: '',
      twitch: '',
      instagram: '',
      x: '',
    });

    const invalidSocialLink = SOCIAL_LINK_OPTIONS.find((option) => !isSafeHttpUrl(normalizedSocialLinks[option.id]));

    if (invalidSocialLink) {
      Alert.alert('Link invalido', `Confira o link de ${invalidSocialLink.label}. Use um endereco http ou https.`);
      return;
    }

    const nextProfile: EditableProfileState = {
      name: trimmedName,
      handle: normalizedHandle,
      avatar,
      banner,
      bio: bio.trim(),
      socialLinks: normalizedSocialLinks,
      gamerStatOrder,
    };

    updateProfile(nextProfile);
    navigation.goBack();
  }, [avatar, banner, bio, gamerStatOrder, handle, name, navigation, socialLinks, updateProfile]);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <LinearGradient
        colors={['#0E0E12', '#11142A', '#0E0E12']}
        start={[0, 0]}
        end={[1, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.header}>
        <Pressable
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Voltar para o perfil"
        >
          <Ionicons name="chevron-back" size={24} color="#F4F6FF" />
        </Pressable>
        <Text style={styles.headerTitle}>Editar perfil</Text>
        <Pressable
          style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
          onPress={saveProfile}
          disabled={!canSave}
          accessibilityRole="button"
          accessibilityLabel="Salvar alteracoes do perfil"
        >
          <LinearGradient
            colors={['#8B7CFF', '#5B4BFF']}
            start={[0, 0]}
            end={[1, 1]}
            style={styles.saveButtonGradient}
          >
            <Text style={styles.saveButtonText}>Salvar</Text>
          </LinearGradient>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          scrollEnabled={!isDraggingStat}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Math.max(insets.bottom, 16) + 28 },
          ]}
        >
          <View style={styles.profilePreview}>
            <View style={styles.previewBannerWrap}>
              <Image
                source={{ uri: banner }}
                style={styles.bannerPreview}
                contentFit="cover"
                cachePolicy="memory-disk"
                recyclingKey={banner}
                accessibilityLabel="Preview do banner do perfil"
              />
              <LinearGradient
                colors={['rgba(14,14,18,0.04)', 'rgba(14,14,18,0.48)', '#0E0E12']}
                style={styles.previewShade}
              />
              <Pressable
                style={styles.bannerEditButton}
                onPress={() => pickProfileImage('banner')}
                accessibilityRole="button"
                accessibilityLabel="Trocar banner do perfil"
              >
                <Ionicons name="image-outline" size={18} color="#FFFFFF" />
                <Text style={styles.mediaButtonText}>Banner</Text>
              </Pressable>
            </View>

            <View style={styles.previewIdentity}>
              <View style={styles.avatarPreviewWrap}>
                <Image
                  source={{ uri: avatar }}
                  style={styles.avatarPreview}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                  recyclingKey={avatar}
                  accessibilityLabel="Preview da foto de perfil"
                />
                <Pressable
                  style={styles.avatarEditButton}
                  onPress={() => pickProfileImage('avatar')}
                  accessibilityRole="button"
                  accessibilityLabel="Trocar foto de perfil"
                >
                  <Ionicons name="camera-outline" size={17} color="#FFFFFF" />
                </Pressable>
              </View>
              <Text style={styles.previewName} numberOfLines={1}>{name.trim() || 'Nome do perfil'}</Text>
              <Text style={styles.previewHandle} numberOfLines={1}>{normalizeHandle(handle) || '@usuario'}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Identidade</Text>
            <Text style={styles.fieldLabel}>Nome de usuario</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              style={styles.input}
              placeholder="Nome do perfil"
              placeholderTextColor="#858CB6"
              maxLength={32}
              autoCapitalize="words"
            />

            <Text style={styles.fieldLabel}>Tag do usuario</Text>
            <TextInput
              value={handle}
              onChangeText={setHandle}
              style={styles.input}
              placeholder="@jujutsu_supremacy"
              placeholderTextColor="#858CB6"
              maxLength={32}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bio</Text>
            <TextInput
              value={bio}
              onChangeText={setBio}
              style={[styles.input, styles.bioInput]}
              placeholder="Conte um pouco sobre seu perfil"
              placeholderTextColor="#858CB6"
              maxLength={160}
              multiline
              textAlignVertical="top"
            />
            <Text style={styles.counterText}>{bio.length}/160</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Links sociais</Text>
            <Text style={styles.sectionDescription}>
              Preencha as redes que devem aparecer como icones no perfil.
            </Text>

            <View style={styles.socialFields}>
              {SOCIAL_LINK_OPTIONS.map((option) => (
                <View style={styles.socialFieldRow} key={option.id}>
                  <View style={styles.socialFieldIcon}>
                    <Ionicons name={option.icon} size={19} color={option.color} />
                  </View>
                  <View style={styles.socialFieldContent}>
                    <Text style={styles.socialFieldLabel}>{option.label}</Text>
                    <TextInput
                      value={socialLinks[option.id]}
                      onChangeText={(value) => updateSocialLink(option.id, value)}
                      style={styles.socialInput}
                      placeholder={option.placeholder}
                      placeholderTextColor="#858CB6"
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="url"
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ordem das estatisticas</Text>
            <Text style={styles.sectionDescription}>
              Organize como as informacoes de jogos aparecem no perfil.
            </Text>

            <View style={styles.statsOrder}>
              {orderedStats.map((stat, index) => (
                <DraggableGamerStatRow
                  key={stat.id}
                  stat={stat}
                  index={index}
                  itemCount={orderedStats.length}
                  onDragStart={() => setIsDraggingStat(true)}
                  onDragEnd={() => setIsDraggingStat(false)}
                  onMoveToIndex={moveStatToIndex}
                  onMoveByOffset={moveStatByOffset}
                />
              ))}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0E0E12',
  },
  header: {
    height: 58,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  saveButton: {
    minWidth: 78,
    height: 38,
    borderRadius: 8,
    overflow: 'hidden',
  },
  saveButtonDisabled: {
    opacity: 0.48,
  },
  saveButtonGradient: {
    flex: 1,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
  },
  profilePreview: {
    marginTop: 8,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#15182F',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  previewBannerWrap: {
    height: 190,
    overflow: 'hidden',
  },
  bannerPreview: {
    width: '100%',
    height: '100%',
  },
  previewShade: {
    ...StyleSheet.absoluteFillObject,
  },
  bannerEditButton: {
    position: 'absolute',
    right: 12,
    top: 12,
    minHeight: 36,
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(8,10,20,0.68)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  mediaButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  avatarPreviewWrap: {
    width: 94,
    height: 94,
    borderRadius: 47,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0E0E12',
    borderWidth: 4,
    borderColor: '#0E0E12',
  },
  avatarPreview: {
    width: 84,
    height: 84,
    borderRadius: 42,
  },
  avatarEditButton: {
    position: 'absolute',
    right: -2,
    bottom: 3,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6C63FF',
    borderWidth: 3,
    borderColor: '#0E0E12',
  },
  previewIdentity: {
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingBottom: 16,
    marginTop: -58,
  },
  previewName: {
    marginTop: 7,
    maxWidth: '86%',
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  previewHandle: {
    marginTop: 3,
    maxWidth: '86%',
    color: '#9EA5D4',
    fontSize: 12,
    fontWeight: '700',
  },
  section: {
    marginTop: 22,
    paddingTop: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  sectionDescription: {
    marginTop: 6,
    color: '#9EA5D4',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  fieldLabel: {
    marginTop: 16,
    marginBottom: 8,
    color: '#C7CCEF',
    fontSize: 13,
    fontWeight: '800',
  },
  input: {
    minHeight: 48,
    borderRadius: 8,
    paddingHorizontal: 13,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    backgroundColor: 'rgba(255,255,255,0.055)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.11)',
  },
  bioInput: {
    minHeight: 118,
    paddingTop: 12,
    paddingBottom: 12,
    lineHeight: 20,
  },
  counterText: {
    marginTop: 8,
    color: '#858CB6',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
  },
  socialFields: {
    marginTop: 14,
    gap: 10,
  },
  socialFieldRow: {
    minHeight: 64,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.055)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.09)',
  },
  socialFieldIcon: {
    width: 38,
    height: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(8,10,20,0.45)',
  },
  socialFieldContent: {
    flex: 1,
    minWidth: 0,
    marginLeft: 12,
  },
  socialFieldLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  socialInput: {
    minHeight: 30,
    marginTop: 3,
    padding: 0,
    color: '#DDE1FF',
    fontSize: 13,
    fontWeight: '700',
  },
  statsOrder: {
    marginTop: 14,
    gap: 10,
  },
  statOrderRow: {
    minHeight: STAT_ROW_HEIGHT - 10,
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.055)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.09)',
  },
  statIconBox: {
    width: 38,
    height: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(8,10,20,0.45)',
    borderWidth: StyleSheet.hairlineWidth,
  },
  statOrderText: {
    flex: 1,
    minWidth: 0,
    marginLeft: 12,
  },
  statOrderLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  statOrderMeta: {
    marginTop: 3,
    color: '#858CB6',
    fontSize: 12,
    fontWeight: '700',
  },
});
