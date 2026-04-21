import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetModal,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Reanimated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackParamList } from '@/app/navigation/types';
import {
  PROFILE_GAMER_STATS,
  type SocialLinkId,
  useProfileStore,
} from '@/features/profile/presentation/store/useProfileStore';
import { formatCount } from '@/shared/utils/formatCount';

const { width } = Dimensions.get('window');
const TAB_BAR_HEIGHT = 112;
const GRID_GAP = 2;
const TILE_SIZE = Math.floor((width - GRID_GAP * 2) / 3);
const VIDEO_TAB_WIDTH = width / 5;
const VIDEO_TAB_INDICATOR_WIDTH = 32;
const VIDEO_TAB_INDICATOR_OFFSET = (VIDEO_TAB_WIDTH - VIDEO_TAB_INDICATOR_WIDTH) / 2;
const SWIPE_CLAMP_DISTANCE = 72;
const SWIPE_TRIGGER_DISTANCE = 52;
const SWIPE_TRIGGER_VELOCITY = 520;
const SWIPE_DRAG_FACTOR = 0.46;
const SWIPE_EXIT_DISTANCE = 56;
const SWIPE_ENTRY_DISTANCE = 28;

type VideoTabId = 'posts' | 'private' | 'reposts' | 'favorites' | 'liked';

type UserStatusId = 'online' | 'away' | 'dnd' | 'invisible';

type AccountMetric = {
  label: string;
  value: string;
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

type ProfileVideoRowData = {
  id: string;
  items: ProfileVideo[];
};

type UserStatusOption = {
  id: UserStatusId;
  label: string;
  color: string;
};

type SocialLinkOption = {
  id: SocialLinkId;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
};

const ACCOUNT_METRICS: AccountMetric[] = [
  { label: 'Jogos', value: '187' },
  { label: 'Seguindo', value: '31' },
  { label: 'Seguidores', value: '31,3 mil' },
  { label: 'Curtidas', value: '403,9 mil' },
];

const VIDEO_TABS: VideoTab[] = [
  { id: 'posts', accessibilityLabel: 'Videos postados pelo usuario', icon: 'grid-outline' },
  { id: 'private', accessibilityLabel: 'Videos privados', icon: 'lock-closed-outline' },
  { id: 'reposts', accessibilityLabel: 'Repostagens', icon: 'repeat-outline' },
  { id: 'favorites', accessibilityLabel: 'Videos favoritos', icon: 'bookmark-outline' },
  { id: 'liked', accessibilityLabel: 'Videos curtidos', icon: 'heart-outline' },
];

const VIDEO_TAB_IDS = VIDEO_TABS.map((tab) => tab.id);

const USER_STATUS_OPTIONS: UserStatusOption[] = [
  { id: 'online', label: 'Disponivel', color: '#35C46B' },
  { id: 'away', label: 'Ausente', color: '#FFC857' },
  { id: 'dnd', label: 'Nao perturbar', color: '#F04F63' },
  { id: 'invisible', label: 'Invisivel', color: '#8C94A8' },
];

const SOCIAL_LINK_OPTIONS: SocialLinkOption[] = [
  { id: 'tiktok', label: 'TikTok', icon: 'logo-tiktok', color: '#FFFFFF' },
  { id: 'youtube', label: 'YouTube', icon: 'logo-youtube', color: '#FF4D5E' },
  { id: 'twitch', label: 'Twitch', icon: 'logo-twitch', color: '#B987FF' },
  { id: 'instagram', label: 'Instagram', icon: 'logo-instagram', color: '#FF7AC8' },
  { id: 'x', label: 'X', icon: 'logo-x', color: '#FFFFFF' },
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

const isSafeHttpUrl = (url: string) => /^https?:\/\//i.test(url);

const ProfileVideoTile = memo(function ProfileVideoTile({
  item,
}: {
  item: ProfileVideo;
}) {
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

const ProfileVideoRow = memo(function ProfileVideoRow({
  row,
  animatedStyle,
}: {
  row: ProfileVideoRowData;
  animatedStyle: React.ComponentProps<typeof Reanimated.View>['style'];
}) {
  const spacerCount = Math.max(0, 3 - row.items.length);

  return (
    <Reanimated.View style={[styles.videoRow, animatedStyle]}>
      <View style={styles.videoRowInner}>
        {row.items.map((item) => (
          <ProfileVideoTile key={item.id} item={item} />
        ))}
        {Array.from({ length: spacerCount }, (_, index) => (
          <View key={`${row.id}-spacer-${index}`} style={styles.tileSpacer} />
        ))}
      </View>
    </Reanimated.View>
  );
});

export default function Perfil() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const statusSheetRef = useRef<BottomSheetModal>(null);
  const [activeTab, setActiveTab] = useState<VideoTabId>('posts');
  const [selectedStatus, setSelectedStatus] = useState<UserStatusId>('online');
  const statusSnapPoints = useMemo(() => ['62%'], []);
  const contentTranslateX = useSharedValue(0);
  const contentOpacity = useSharedValue(1);
  const isTabTransitioning = useSharedValue(false);
  const tabIndicatorX = useSharedValue(VIDEO_TAB_INDICATOR_OFFSET);
  const profileName = useProfileStore((state) => state.name);
  const profileHandle = useProfileStore((state) => state.handle);
  const profileAvatar = useProfileStore((state) => state.avatar);
  const profileBanner = useProfileStore((state) => state.banner);
  const profileBio = useProfileStore((state) => state.bio);
  const profileSocialLinks = useProfileStore((state) => state.socialLinks);
  const gamerStatOrder = useProfileStore((state) => state.gamerStatOrder);

  const filteredVideos = useMemo(
    () => PROFILE_VIDEOS.filter((video) => video.tab === activeTab),
    [activeTab]
  );
  const videoRows = useMemo<ProfileVideoRowData[]>(() => {
    const rows: ProfileVideoRowData[] = [];

    for (let index = 0; index < filteredVideos.length; index += 3) {
      const items = filteredVideos.slice(index, index + 3);
      rows.push({
        id: items.map((item) => item.id).join(':'),
        items,
      });
    }

    return rows;
  }, [filteredVideos]);
  const activeTabIndex = useMemo(() => VIDEO_TAB_IDS.indexOf(activeTab), [activeTab]);

  const selectedStatusOption = useMemo(
    () => USER_STATUS_OPTIONS.find((status) => status.id === selectedStatus) ?? USER_STATUS_OPTIONS[0],
    [selectedStatus]
  );

  const gamerStats = useMemo(
    () => gamerStatOrder.map((statId) => PROFILE_GAMER_STATS[statId]),
    [gamerStatOrder]
  );

  const visibleSocialLinks = useMemo(
    () => SOCIAL_LINK_OPTIONS
      .map((option) => ({ ...option, url: profileSocialLinks[option.id].trim() }))
      .filter((option) => option.url.length > 0),
    [profileSocialLinks]
  );

  const animateTabTransition = useCallback((nextTab: VideoTabId) => {
    if (nextTab === activeTab || isTabTransitioning.value) {
      return;
    }

    const nextTabIndex = VIDEO_TAB_IDS.indexOf(nextTab);
    const direction: -1 | 1 = nextTabIndex > activeTabIndex ? 1 : -1;
    const exitOffset = direction > 0 ? -SWIPE_EXIT_DISTANCE : SWIPE_EXIT_DISTANCE;
    const entryOffset = direction > 0 ? SWIPE_ENTRY_DISTANCE : -SWIPE_ENTRY_DISTANCE;

    isTabTransitioning.value = true;
    contentOpacity.value = withTiming(0.9, { duration: 110 });
    contentTranslateX.value = withTiming(exitOffset, { duration: 140 }, (finished) => {
      if (!finished) {
        isTabTransitioning.value = false;
        return;
      }

      runOnJS(setActiveTab)(nextTab);
      contentTranslateX.value = entryOffset;
      contentOpacity.value = 0.88;
      contentTranslateX.value = withSpring(0, {
        damping: 18,
        stiffness: 220,
        mass: 0.86,
      }, (settled) => {
        if (settled) {
          isTabTransitioning.value = false;
        }
      });
      contentOpacity.value = withTiming(1, { duration: 210 });
    });
  }, [activeTab, activeTabIndex, contentOpacity, contentTranslateX, isTabTransitioning]);

  const handleTabPress = useCallback((tabId: VideoTabId) => {
    animateTabTransition(tabId);
  }, [animateTabTransition]);

  const animatedContentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [
      { translateX: contentTranslateX.value },
      {
        scale: interpolate(
          Math.abs(contentTranslateX.value),
          [0, SWIPE_CLAMP_DISTANCE * SWIPE_DRAG_FACTOR],
          [1, 0.992]
        ),
      },
    ],
  }));

  const animatedTabIndicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tabIndicatorX.value }],
  }));

  useEffect(() => {
    tabIndicatorX.value = withSpring(
      activeTabIndex * VIDEO_TAB_WIDTH + VIDEO_TAB_INDICATOR_OFFSET,
      {
        damping: 18,
        stiffness: 220,
        mass: 0.84,
      }
    );
  }, [activeTabIndex, tabIndicatorX]);

  const swipeVideoTabsGesture = useMemo(() => Gesture.Pan()
    .activeOffsetX([-12, 12])
    .failOffsetY([-18, 18])
    .onUpdate((event) => {
      if (isTabTransitioning.value) {
        return;
      }

      const clampedX = Math.max(Math.min(event.translationX, SWIPE_CLAMP_DISTANCE), -SWIPE_CLAMP_DISTANCE);
      contentTranslateX.value = clampedX * SWIPE_DRAG_FACTOR;
      contentOpacity.value = interpolate(
        Math.abs(clampedX),
        [0, SWIPE_CLAMP_DISTANCE],
        [1, 0.92]
      );
    })
    .onEnd((event) => {
      if (isTabTransitioning.value) {
        return;
      }

      const shouldAdvance = event.translationX <= -SWIPE_TRIGGER_DISTANCE || event.velocityX <= -SWIPE_TRIGGER_VELOCITY;
      const shouldGoBack = event.translationX >= SWIPE_TRIGGER_DISTANCE || event.velocityX >= SWIPE_TRIGGER_VELOCITY;
      const nextTab = VIDEO_TAB_IDS[activeTabIndex + 1];
      const previousTab = VIDEO_TAB_IDS[activeTabIndex - 1];

      if (shouldAdvance && nextTab) {
        runOnJS(animateTabTransition)(nextTab);
        return;
      }

      if (shouldGoBack && previousTab) {
        runOnJS(animateTabTransition)(previousTab);
        return;
      }

      contentTranslateX.value = withSpring(0, {
        damping: 18,
        stiffness: 230,
        mass: 0.84,
      });
      contentOpacity.value = withTiming(1, { duration: 170 });
    }), [activeTabIndex, animateTabTransition, contentOpacity, contentTranslateX, isTabTransitioning]);

  const openStatusSheet = useCallback(() => {
    statusSheetRef.current?.present();
  }, []);

  const closeStatusSheet = useCallback(() => {
    statusSheetRef.current?.dismiss();
  }, []);

  const selectStatus = useCallback((statusId: UserStatusId) => {
    setSelectedStatus(statusId);
    statusSheetRef.current?.dismiss();
  }, []);

  const openCustomStatus = useCallback(() => {
    closeStatusSheet();
    Alert.alert('Status personalizado', 'Essa opcao sera configurada na tela de edicao do perfil.');
  }, [closeStatusSheet]);

  const openEditProfile = useCallback(() => {
    navigation.navigate('EditarPerfil');
  }, [navigation]);

  const renderStatusBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
      />
    ),
    []
  );

  const renderStatusOption = useCallback(
    ({ item, index }: { item: UserStatusOption; index: number }) => {
      const isSelected = item.id === selectedStatus;
      const isLast = index === USER_STATUS_OPTIONS.length - 1;

      return (
        <Pressable
          style={[
            styles.statusOption,
            index === 0 && styles.statusOptionFirst,
            isLast && styles.statusOptionLast,
          ]}
          onPress={() => selectStatus(item.id)}
          accessibilityRole="radio"
          accessibilityState={{ checked: isSelected }}
          accessibilityLabel={`Selecionar status ${item.label}`}
        >
          <View style={[styles.statusOptionDot, { backgroundColor: item.color }]} />
          <Text style={styles.statusOptionLabel}>{item.label}</Text>
          <View style={[styles.statusRadio, isSelected && styles.statusRadioSelected]}>
            {isSelected && <View style={styles.statusRadioInner} />}
          </View>
        </Pressable>
      );
    },
    [selectStatus, selectedStatus]
  );

  const statusSheetHeader = useMemo(() => (
    <View>
      <Text style={styles.statusSheetTitle}>Mudar status online</Text>
      <Text style={styles.statusSheetHint}>Escolha como voce aparece agora.</Text>
      <Text style={styles.statusSheetSubtitle}>Status online</Text>
    </View>
  ), []);

  const statusSheetFooter = useMemo(() => (
    <Pressable
      style={styles.customStatusButton}
      onPress={openCustomStatus}
      accessibilityRole="button"
      accessibilityLabel="Definir status personalizado"
    >
      <Ionicons name="happy-outline" size={22} color="#DDE1FF" />
      <Text style={styles.customStatusText}>Definir status personalizado</Text>
      <Ionicons name="chevron-forward" size={18} color="#8F96C3" />
    </Pressable>
  ), [openCustomStatus]);

  const openExternalProfileLink = useCallback(async (url: string) => {
    if (!isSafeHttpUrl(url)) {
      Alert.alert('Link indisponivel', 'Este link externo nao pode ser aberto.');
      return;
    }

    try {
      const supported = await Linking.canOpenURL(url);

      if (!supported) {
        Alert.alert('Link indisponivel', 'Nao foi possivel abrir este link agora.');
        return;
      }

      await Linking.openURL(url);
    } catch (error) {
      console.warn('[PerfilScreen] Falha ao abrir link externo', error);
      Alert.alert('Link indisponivel', 'Tente abrir novamente em instantes.');
    }
  }, []);

  const renderVideoRow = useCallback(
    ({ item }: { item: ProfileVideoRowData }) => (
      <ProfileVideoRow row={item} animatedStyle={animatedContentStyle} />
    ),
    [animatedContentStyle]
  );

  const getVideoRowType = useCallback(
    () => 'video-row',
    []
  );

  const renderHeader = useCallback(() => (
    <View style={styles.header}>
      <View style={styles.bannerWrap}>
        <Image
          source={{ uri: profileBanner }}
          style={styles.bannerImage}
          contentFit="cover"
          cachePolicy="memory-disk"
          recyclingKey={profileBanner}
          accessibilityLabel="Banner do perfil"
        />
        <LinearGradient
          colors={['rgba(14,14,18,0.05)', 'rgba(14,14,18,0.48)', '#0E0E12']}
          style={styles.bannerOverlay}
        />
        <View style={[styles.bannerControls, { top: insets.top }]}>
          <Pressable
            style={styles.bannerIconButton}
            accessibilityRole="button"
            accessibilityLabel="Loja"
          >
            <Ionicons name="storefront-outline" size={21} color="#FFFFFF" />
          </Pressable>
          <Pressable
            style={styles.bannerIconButton}
            accessibilityRole="button"
            accessibilityLabel="Menu do perfil"
          >
            <Ionicons name="menu-outline" size={24} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      <View style={styles.identity}>
        <View
          style={styles.avatarButton}
        >
          <Image
            source={{ uri: profileAvatar }}
            style={styles.avatar}
            contentFit="cover"
            cachePolicy="memory-disk"
            recyclingKey={profileAvatar}
            accessibilityLabel="Foto de perfil"
          />
          <Pressable
            style={[styles.statusBadge, { backgroundColor: selectedStatusOption.color }]}
            onPress={openStatusSheet}
            accessibilityRole="button"
            accessibilityLabel={`Alterar status. Status atual: ${selectedStatusOption.label}`}
          />
        </View>

        <View style={styles.profileNameRow}>
          <Text style={styles.profileName} numberOfLines={1}>{profileName}</Text>
          <Pressable
            style={styles.editProfileButton}
            onPress={openEditProfile}
            accessibilityRole="button"
            accessibilityLabel="Editar perfil"
          >
            <Ionicons name="create-outline" size={14} color="rgba(221,225,255,0.9)" />
          </Pressable>
        </View>
        <Text style={styles.profileHandle} numberOfLines={1}>{profileHandle}</Text>

        <View style={styles.accountMetrics}>
          {ACCOUNT_METRICS.map((metric) => (
            <View style={styles.accountMetric} key={metric.label}>
              <Text style={styles.accountMetricValue} numberOfLines={1}>{metric.value}</Text>
              <Text style={styles.accountMetricLabel} numberOfLines={1}>{metric.label}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.bio}>{profileBio}</Text>

        {visibleSocialLinks.length > 0 && (
          <View style={styles.socialLinksRow}>
            {visibleSocialLinks.map((link) => (
              <Pressable
                key={link.id}
                style={styles.socialLinkButton}
                onPress={() => openExternalProfileLink(link.url)}
                accessibilityRole="link"
                accessibilityLabel={`Abrir ${link.label}`}
              >
                <Ionicons name={link.icon} size={18} color={link.color} />
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <View style={styles.gamerStats}>
        {gamerStats.map((stat) => (
          <View style={styles.gamerStat} key={stat.id}>
            <Ionicons name={stat.icon} size={17} color={stat.color} />
            <Text style={styles.gamerStatValue} numberOfLines={1}>{stat.value}</Text>
            <Text style={styles.gamerStatLabel} numberOfLines={1}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.videoTabs}>
        <Reanimated.View
          pointerEvents="none"
          style={[styles.videoTabIndicatorTrack, animatedTabIndicatorStyle]}
        >
          <View style={styles.videoTabIndicator} />
        </Reanimated.View>
        {VIDEO_TABS.map((tab) => {
          const isActive = tab.id === activeTab;

          return (
            <Pressable
              key={tab.id}
              style={styles.videoTabButton}
              onPress={() => handleTabPress(tab.id)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={tab.accessibilityLabel}
            >
              <Ionicons
                name={tab.icon}
                size={23}
                color={isActive ? '#FFFFFF' : 'rgba(220,224,255,0.62)'}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  ), [
    activeTab,
    animatedTabIndicatorStyle,
    gamerStats,
    handleTabPress,
    insets.top,
    openEditProfile,
    openExternalProfileLink,
    openStatusSheet,
    profileAvatar,
    profileBanner,
    profileBio,
    profileHandle,
    profileName,
    selectedStatusOption,
    visibleSocialLinks,
  ]);

  const listEmptyComponent = useMemo(() => (
    <Reanimated.View style={[styles.emptyState, animatedContentStyle]}>
      <MaterialCommunityIcons name="filmstrip-off" size={34} color="#AEB7FF" />
      <Text style={styles.emptyText}>Nada por aqui ainda.</Text>
    </Reanimated.View>
  ), [animatedContentStyle]);

  return (
    <SafeAreaView style={styles.root} edges={['left', 'right']}>
      <LinearGradient
        colors={['#0E0E12', '#11142a', '#0E0E12']}
        start={[0, 0]}
        end={[1, 1]}
        style={StyleSheet.absoluteFill}
      />

      <GestureDetector gesture={swipeVideoTabsGesture}>
        <FlashList
          data={videoRows}
          renderItem={renderVideoRow}
          keyExtractor={(item) => item.id}
          getItemType={getVideoRowType}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={listEmptyComponent}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: TAB_BAR_HEIGHT + insets.bottom,
          }}
        />
      </GestureDetector>

      <BottomSheetModal
        ref={statusSheetRef}
        index={0}
        snapPoints={statusSnapPoints}
        topInset={insets.top}
        bottomInset={insets.bottom}
        enablePanDownToClose
        enableDynamicSizing={false}
        handleIndicatorStyle={styles.statusSheetHandle}
        backgroundStyle={styles.statusSheetBackground}
        backdropComponent={renderStatusBackdrop}
      >
        <BottomSheetFlatList
          data={USER_STATUS_OPTIONS}
          keyExtractor={(item: UserStatusOption) => item.id}
          renderItem={renderStatusOption}
          ListHeaderComponent={statusSheetHeader}
          ListFooterComponent={statusSheetFooter}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.statusSheetContent,
            { paddingBottom: Math.max(insets.bottom, 16) + 18 },
          ]}
        />
      </BottomSheetModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0E0E12',
  },
  header: {
    paddingBottom: 0,
  },
  bannerWrap: {
    height: 214,
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
  bannerControls: {
    position: 'absolute',
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bannerIconButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identity: {
    alignItems: 'center',
    paddingHorizontal: 18,
    marginTop: -68,
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
  statusBadge: {
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
  profileNameRow: {
    marginTop: 6,
    width: '100%',
    maxWidth: width - 36,
    minHeight: 30,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 34,
  },
  profileName: {
    width: '100%',
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0,
    textAlign: 'center',
  },
  editProfileButton: {
    position: 'absolute',
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(221,225,255,0.08)',
  },
  profileHandle: {
    marginTop: 3,
    maxWidth: width - 48,
    color: '#9EA5D4',
    fontSize: 14,
    fontWeight: '700',
  },
  accountMetrics: {
    marginTop: 14,
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
    marginTop: 14,
    color: '#E8EAF8',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  socialLinksRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  socialLinkButton: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gamerStats: {
    marginTop: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  gamerStat: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    gap: 3,
  },
  gamerStatValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  gamerStatLabel: {
    color: '#7F86B2',
    fontSize: 10,
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
  videoTabIndicatorTrack: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: VIDEO_TAB_INDICATOR_WIDTH,
    alignItems: 'center',
  },
  videoTabIndicator: {
    width: VIDEO_TAB_INDICATOR_WIDTH,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#7A72FF',
  },
  videoRow: {
    marginBottom: GRID_GAP,
  },
  videoRowInner: {
    flexDirection: 'row',
    gap: GRID_GAP,
  },
  tile: {
    width: TILE_SIZE,
    height: Math.floor(TILE_SIZE * 1.34),
    backgroundColor: '#15182F',
    overflow: 'hidden',
  },
  tileSpacer: {
    width: TILE_SIZE,
    height: Math.floor(TILE_SIZE * 1.34),
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
  statusSheetBackground: {
    backgroundColor: '#090A12',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  statusSheetHandle: {
    width: 44,
    height: 5,
    borderRadius: 99,
    backgroundColor: 'rgba(220,227,255,0.42)',
  },
  statusSheetContent: {
    paddingHorizontal: 0,
    paddingTop: 12,
  },
  statusSheetTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  statusSheetHint: {
    color: '#8F96C3',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 6,
    textAlign: 'center',
  },
  statusSheetSubtitle: {
    color: '#C3C8E8',
    fontSize: 13,
    fontWeight: '700',
    marginHorizontal: 16,
    marginTop: 18,
    marginBottom: 10,
  },
  statusOptions: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  statusOption: {
    minHeight: 54,
    marginHorizontal: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  statusOptionFirst: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  statusOptionLast: {
    borderBottomWidth: 0,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  statusOptionDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 16,
  },
  statusOptionLabel: {
    flex: 1,
    color: '#F4F6FF',
    fontSize: 15,
    fontWeight: '700',
  },
  statusRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(225,229,255,0.62)',
  },
  statusRadioSelected: {
    borderColor: '#7A72FF',
  },
  statusRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#7A72FF',
  },
  customStatusButton: {
    minHeight: 56,
    marginTop: 14,
    marginHorizontal: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.055)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  customStatusText: {
    flex: 1,
    color: '#F4F6FF',
    fontSize: 15,
    fontWeight: '800',
  },
});
