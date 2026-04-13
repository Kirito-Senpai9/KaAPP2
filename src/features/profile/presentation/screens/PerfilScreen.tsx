import React, { memo, useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Dimensions,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatCount } from '@/shared/utils/formatCount';

const { width } = Dimensions.get('window');
const TAB_BAR_HEIGHT = 112;
const GRID_GAP = 2;
const TILE_SIZE = Math.floor((width - GRID_GAP * 2) / 3);

type ProfileImageKind = 'avatar' | 'banner';

type VideoTabId = 'posts' | 'private' | 'reposts' | 'favorites' | 'liked';

type AccountMetric = {
  label: string;
  value: string;
};

type GamerStat = {
  label: string;
  value: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
};

type VideoTab = {
  id: VideoTabId;
  accessibilityLabel: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
};

type ProfileVideo = {
  id: string;
  tab: VideoTabId;
  thumbnail: string;
  views: number;
  isPrivate?: boolean;
};

const PROFILE = {
  name: 'Jujutsu Supremacy',
  handle: '@jujutsu_supremacy',
  avatar:
    'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=500&q=80&auto=format&fit=crop',
  banner:
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1600&q=80&auto=format&fit=crop',
  bio:
    'Canal gamer de animes, ranked e clipes de boss fight. Lives de sexta, builds testadas e muita zoeira controlada.',
  linkLabel: 'twitch.tv/jujutsu_supremacy',
  linkUrl: 'https://www.twitch.tv/jujutsu_supremacy',
};

const ACCOUNT_METRICS: AccountMetric[] = [
  { label: 'Jogos', value: '187' },
  { label: 'Seguindo', value: '31' },
  { label: 'Seguidores', value: '31,3 mil' },
  { label: 'Curtidas', value: '403,9 mil' },
];

const GAMER_STATS: GamerStat[] = [
  { label: 'Jogos', value: '210', icon: 'game-controller-outline', color: '#76A9FF' },
  { label: 'Finalizados', value: '17', icon: 'flag-outline', color: '#B987FF' },
  { label: 'Completados', value: '11', icon: 'checkmark-outline', color: '#83F2A1' },
  { label: 'Tempo', value: '2176h', icon: 'time-outline', color: '#C07BFF' },
];

const VIDEO_TABS: VideoTab[] = [
  { id: 'posts', accessibilityLabel: 'Videos postados pelo usuario', icon: 'grid-outline' },
  { id: 'private', accessibilityLabel: 'Videos privados', icon: 'lock-closed-outline' },
  { id: 'reposts', accessibilityLabel: 'Repostagens', icon: 'repeat-outline' },
  { id: 'favorites', accessibilityLabel: 'Videos favoritos', icon: 'bookmark-outline' },
  { id: 'liked', accessibilityLabel: 'Videos curtidos', icon: 'heart-outline' },
];

const PROFILE_VIDEOS: ProfileVideo[] = [
  {
    id: 'post-1',
    tab: 'posts',
    thumbnail: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=900&q=80&auto=format&fit=crop',
    views: 24500,
  },
  {
    id: 'post-2',
    tab: 'posts',
    thumbnail: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=900&q=80&auto=format&fit=crop',
    views: 18100,
  },
  {
    id: 'post-3',
    tab: 'posts',
    thumbnail: 'https://images.unsplash.com/photo-1511882150382-421056c89033?w=900&q=80&auto=format&fit=crop',
    views: 9200,
  },
  {
    id: 'post-4',
    tab: 'posts',
    thumbnail: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=900&q=80&auto=format&fit=crop',
    views: 63100,
  },
  {
    id: 'post-5',
    tab: 'posts',
    thumbnail: 'https://images.unsplash.com/photo-1534423861386-85a16f5d13fd?w=900&q=80&auto=format&fit=crop',
    views: 5100,
  },
  {
    id: 'post-6',
    tab: 'posts',
    thumbnail: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=900&q=80&auto=format&fit=crop',
    views: 12600,
  },
  {
    id: 'private-1',
    tab: 'private',
    thumbnail: 'https://images.unsplash.com/photo-1542751110-97427bbecf20?w=900&q=80&auto=format&fit=crop',
    views: 0,
    isPrivate: true,
  },
  {
    id: 'private-2',
    tab: 'private',
    thumbnail: 'https://images.unsplash.com/photo-1600861194942-f883de0dfe96?w=900&q=80&auto=format&fit=crop',
    views: 0,
    isPrivate: true,
  },
  {
    id: 'private-3',
    tab: 'private',
    thumbnail: 'https://images.unsplash.com/photo-1551103782-8ab07afd45c1?w=900&q=80&auto=format&fit=crop',
    views: 0,
    isPrivate: true,
  },
  {
    id: 'repost-1',
    tab: 'reposts',
    thumbnail: 'https://images.unsplash.com/photo-1535223289827-42f1e9919769?w=900&q=80&auto=format&fit=crop',
    views: 30100,
  },
  {
    id: 'repost-2',
    tab: 'reposts',
    thumbnail: 'https://images.unsplash.com/photo-1519669556878-63bdad8a1a49?w=900&q=80&auto=format&fit=crop',
    views: 7700,
  },
  {
    id: 'favorite-1',
    tab: 'favorites',
    thumbnail: 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=900&q=80&auto=format&fit=crop',
    views: 41900,
  },
  {
    id: 'favorite-2',
    tab: 'favorites',
    thumbnail: 'https://images.unsplash.com/photo-1605901309584-818e25960a8f?w=900&q=80&auto=format&fit=crop',
    views: 15400,
  },
  {
    id: 'liked-1',
    tab: 'liked',
    thumbnail: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=900&q=80&auto=format&fit=crop',
    views: 88800,
  },
  {
    id: 'liked-2',
    tab: 'liked',
    thumbnail: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=900&q=80&auto=format&fit=crop',
    views: 21200,
  },
  {
    id: 'liked-3',
    tab: 'liked',
    thumbnail: 'https://images.unsplash.com/photo-1515549832467-8783363e19b6?w=900&q=80&auto=format&fit=crop',
    views: 12500,
  },
];

const isSafeHttpUrl = (url: string) => (
  url.startsWith('https://') || url.startsWith('http://')
);

const ProfileVideoTile = memo(function ProfileVideoTile({ item }: { item: ProfileVideo }) {
  return (
    <View style={styles.tile}>
      <Image
        source={{ uri: item.thumbnail }}
        style={styles.tileImage}
        contentFit="cover"
        cachePolicy="memory-disk"
        recyclingKey={item.thumbnail}
        accessibilityLabel="Miniatura de video do perfil"
      />
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.68)']}
        style={styles.tileGradient}
      />
      <View style={styles.tileMeta}>
        <Ionicons name={item.isPrivate ? 'lock-closed' : 'play'} size={13} color="#FFFFFF" />
        <Text style={styles.tileViews}>{item.isPrivate ? 'Privado' : formatCount(item.views, 'lower')}</Text>
      </View>
    </View>
  );
});

export default function Perfil() {
  const insets = useSafeAreaInsets();
  const [bannerUri, setBannerUri] = useState(PROFILE.banner);
  const [avatarUri, setAvatarUri] = useState(PROFILE.avatar);
  const [activeTab, setActiveTab] = useState<VideoTabId>('posts');

  const filteredVideos = useMemo(
    () => PROFILE_VIDEOS.filter((video) => video.tab === activeTab),
    [activeTab]
  );

  const pickProfileImage = useCallback(async (kind: ProfileImageKind) => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert('Permissao necessaria', 'Libere acesso a galeria para atualizar sua imagem.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.9,
        allowsEditing: kind === 'avatar',
        aspect: kind === 'avatar' ? [1, 1] : undefined,
        allowsMultipleSelection: false,
      });

      if (result.canceled || !result.assets?.[0]?.uri) {
        return;
      }

      if (kind === 'avatar') {
        setAvatarUri(result.assets[0].uri);
        return;
      }

      setBannerUri(result.assets[0].uri);
    } catch (error) {
      console.warn('[PerfilScreen] Falha ao escolher imagem', error);
      Alert.alert('Nao foi possivel atualizar', 'Tente escolher outra imagem da galeria.');
    }
  }, []);

  const openExternalProfileLink = useCallback(async () => {
    if (!isSafeHttpUrl(PROFILE.linkUrl)) {
      Alert.alert('Link indisponivel', 'Este link externo nao pode ser aberto.');
      return;
    }

    try {
      const supported = await Linking.canOpenURL(PROFILE.linkUrl);

      if (!supported) {
        Alert.alert('Link indisponivel', 'Nao foi possivel abrir este link agora.');
        return;
      }

      await Linking.openURL(PROFILE.linkUrl);
    } catch (error) {
      console.warn('[PerfilScreen] Falha ao abrir link externo', error);
      Alert.alert('Link indisponivel', 'Tente abrir novamente em instantes.');
    }
  }, []);

  const renderVideoTile = useCallback(
    ({ item }: { item: ProfileVideo }) => <ProfileVideoTile item={item} />,
    []
  );

  const renderHeader = useCallback(() => (
    <View style={styles.header}>
      <Pressable
        style={styles.bannerWrap}
        onPress={() => pickProfileImage('banner')}
        accessibilityRole="button"
        accessibilityLabel="Alterar banner do perfil"
      >
        <Image
          source={{ uri: bannerUri }}
          style={styles.bannerImage}
          contentFit="cover"
          cachePolicy="memory-disk"
          recyclingKey={bannerUri}
          accessibilityLabel="Banner do perfil"
        />
        <LinearGradient
          colors={['rgba(14,14,18,0.05)', 'rgba(14,14,18,0.48)', '#0E0E12']}
          style={styles.bannerOverlay}
        />
        <View style={styles.bannerAction}>
          <Ionicons name="camera-outline" size={17} color="#FFFFFF" />
          <Text style={styles.bannerActionText}>Banner</Text>
        </View>
      </Pressable>

      <View style={styles.identity}>
        <Pressable
          style={styles.avatarButton}
          onPress={() => pickProfileImage('avatar')}
          accessibilityRole="button"
          accessibilityLabel="Alterar foto de perfil"
        >
          <Image
            source={{ uri: avatarUri }}
            style={styles.avatar}
            contentFit="cover"
            cachePolicy="memory-disk"
            recyclingKey={avatarUri}
            accessibilityLabel="Foto de perfil"
          />
          <View style={styles.avatarEditBadge}>
            <Ionicons name="camera" size={14} color="#FFFFFF" />
          </View>
        </Pressable>

        <Text style={styles.profileName} numberOfLines={1}>{PROFILE.name}</Text>
        <Text style={styles.profileHandle} numberOfLines={1}>{PROFILE.handle}</Text>

        <View style={styles.accountMetrics}>
          {ACCOUNT_METRICS.map((metric) => (
            <View style={styles.accountMetric} key={metric.label}>
              <Text style={styles.accountMetricValue} numberOfLines={1}>{metric.value}</Text>
              <Text style={styles.accountMetricLabel} numberOfLines={1}>{metric.label}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.bio}>{PROFILE.bio}</Text>

        <Pressable
          style={styles.bioLink}
          onPress={openExternalProfileLink}
          accessibilityRole="link"
          accessibilityLabel={`Abrir link externo ${PROFILE.linkLabel}`}
        >
          <Ionicons name="link-outline" size={15} color="#AEB7FF" />
          <Text style={styles.bioLinkText} numberOfLines={1}>{PROFILE.linkLabel}</Text>
        </Pressable>
      </View>

      <View style={styles.gamerStats}>
        {GAMER_STATS.map((stat) => (
          <View style={styles.gamerStat} key={stat.label}>
            <Ionicons name={stat.icon} size={20} color={stat.color} />
            <Text style={styles.gamerStatValue} numberOfLines={1}>{stat.value}</Text>
            <Text style={styles.gamerStatLabel} numberOfLines={1}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.videoTabs}>
        {VIDEO_TABS.map((tab) => {
          const isActive = tab.id === activeTab;

          return (
            <Pressable
              key={tab.id}
              style={styles.videoTabButton}
              onPress={() => setActiveTab(tab.id)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={tab.accessibilityLabel}
            >
              <Ionicons
                name={tab.icon}
                size={23}
                color={isActive ? '#FFFFFF' : 'rgba(220,224,255,0.62)'}
              />
              <View style={[styles.videoTabIndicator, isActive && styles.videoTabIndicatorActive]} />
            </Pressable>
          );
        })}
      </View>
    </View>
  ), [activeTab, avatarUri, bannerUri, openExternalProfileLink, pickProfileImage]);

  const listEmptyComponent = useMemo(() => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons name="filmstrip-off" size={34} color="#AEB7FF" />
      <Text style={styles.emptyText}>Nada por aqui ainda.</Text>
    </View>
  ), []);

  return (
    <SafeAreaView style={styles.root} edges={['left', 'right']}>
      <LinearGradient
        colors={['#0E0E12', '#11142a', '#0E0E12']}
        start={[0, 0]}
        end={[1, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.logo}>KaChan!</Text>
        <View style={styles.topActions}>
          <Pressable style={styles.topActionButton} accessibilityRole="button" accessibilityLabel="Notificacoes">
            <Ionicons name="notifications-outline" size={21} color="#E5E7F4" />
          </Pressable>
          <Pressable style={styles.topActionButton} accessibilityRole="button" accessibilityLabel="Configuracoes do perfil">
            <Ionicons name="settings-outline" size={21} color="#E5E7F4" />
          </Pressable>
        </View>
      </View>

      <FlashList
        data={filteredVideos}
        renderItem={renderVideoTile}
        keyExtractor={(item) => item.id}
        getItemType={(item) => item.tab}
        numColumns={3}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={listEmptyComponent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: TAB_BAR_HEIGHT + insets.bottom,
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0E0E12',
  },
  topBar: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  topActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  header: {
    paddingBottom: 4,
  },
  bannerWrap: {
    height: 186,
    overflow: 'hidden',
    backgroundColor: '#15182F',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  bannerAction: {
    position: 'absolute',
    right: 14,
    top: 14,
    height: 34,
    borderRadius: 17,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(8,10,20,0.62)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  bannerActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  identity: {
    alignItems: 'center',
    paddingHorizontal: 18,
    marginTop: -52,
  },
  avatarButton: {
    width: 106,
    height: 106,
    borderRadius: 53,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0E0E12',
    borderWidth: 4,
    borderColor: '#0E0E12',
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  avatarEditBadge: {
    position: 'absolute',
    right: 3,
    bottom: 6,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6C63FF',
    borderWidth: 3,
    borderColor: '#0E0E12',
  },
  profileName: {
    marginTop: 8,
    maxWidth: width - 48,
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0,
  },
  profileHandle: {
    marginTop: 3,
    maxWidth: width - 48,
    color: '#9EA5D4',
    fontSize: 14,
    fontWeight: '700',
  },
  accountMetrics: {
    marginTop: 18,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  accountMetric: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
  },
  accountMetricValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  accountMetricLabel: {
    marginTop: 3,
    color: '#9EA5D4',
    fontSize: 12,
    fontWeight: '700',
  },
  bio: {
    marginTop: 18,
    color: '#E8EAF8',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  bioLink: {
    marginTop: 10,
    maxWidth: width - 48,
    minHeight: 32,
    borderRadius: 16,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(108,99,255,0.16)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(174,183,255,0.22)',
  },
  bioLinkText: {
    flexShrink: 1,
    color: '#DDE1FF',
    fontSize: 13,
    fontWeight: '700',
  },
  gamerStats: {
    marginTop: 22,
    paddingVertical: 15,
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  gamerStat: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    gap: 5,
  },
  gamerStatValue: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  gamerStatLabel: {
    color: '#7F86B2',
    fontSize: 11,
    fontWeight: '700',
  },
  videoTabs: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.09)',
  },
  videoTabButton: {
    flex: 1,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoTabIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 32,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'transparent',
  },
  videoTabIndicatorActive: {
    backgroundColor: '#7A72FF',
  },
  tile: {
    width: TILE_SIZE,
    height: Math.floor(TILE_SIZE * 1.34),
    marginRight: GRID_GAP,
    marginBottom: GRID_GAP,
    backgroundColor: '#15182F',
    overflow: 'hidden',
  },
  tileImage: {
    width: '100%',
    height: '100%',
  },
  tileGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  tileMeta: {
    position: 'absolute',
    left: 7,
    right: 7,
    bottom: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tileViews: {
    flexShrink: 1,
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  emptyState: {
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  emptyText: {
    color: '#A6ADCE',
    fontSize: 14,
    fontWeight: '700',
  },
});
