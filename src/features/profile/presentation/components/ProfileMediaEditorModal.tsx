import React, { useCallback, useEffect, useMemo } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Reanimated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type {
  ProfileMedia,
  ProfileMediaTransform,
} from '@/features/profile/presentation/store/useProfileStore';
import { DEFAULT_PROFILE_MEDIA_TRANSFORM } from '@/features/profile/presentation/store/useProfileStore';
import {
  clampProfileMediaTransform,
  createProfileMediaSource,
  createTransformFromOffsets,
  getProfileMediaMetrics,
  getResolvedProfileMediaTransform,
  PROFILE_MEDIA_MAX_ZOOM,
  PROFILE_MEDIA_MIN_ZOOM,
} from '@/features/profile/presentation/utils/profileMedia';

type EditableImageKind = 'avatar' | 'banner';

type ProfileMediaEditorModalProps = {
  visible: boolean;
  kind: EditableImageKind | null;
  media: ProfileMedia | null;
  onCancel: () => void;
  onConfirm: (transform: ProfileMediaTransform) => void;
};

const PROFILE_BANNER_HEIGHT = 214;

const clamp = (value: number, min: number, max: number) => {
  'worklet';
  return Math.min(Math.max(value, min), max);
};

export function ProfileMediaEditorModal({
  visible,
  kind,
  media,
  onCancel,
  onConfirm,
}: ProfileMediaEditorModalProps) {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const bannerAspectRatio = windowWidth / PROFILE_BANNER_HEIGHT;
  const avatarViewportSize = Math.min(windowWidth - 56, 284);
  const bannerViewportWidth = windowWidth - 24;
  const bannerViewportHeight = bannerViewportWidth / bannerAspectRatio;
  const viewportWidth = kind === 'banner' ? bannerViewportWidth : avatarViewportSize;
  const viewportHeight = kind === 'banner' ? bannerViewportHeight : avatarViewportSize;
  const isAvatar = kind === 'avatar';

  const source = useMemo(
    () => (media ? createProfileMediaSource(media) : null),
    [media]
  );

  const baseMetrics = useMemo(
    () => (media ? getProfileMediaMetrics(media, viewportWidth, viewportHeight, PROFILE_MEDIA_MIN_ZOOM) : null),
    [media, viewportHeight, viewportWidth]
  );

  const initialTransform = useMemo(
    () => (media ? clampProfileMediaTransform(media, viewportWidth, viewportHeight, media.transform) : DEFAULT_PROFILE_MEDIA_TRANSFORM),
    [media, viewportHeight, viewportWidth]
  );

  const initialResolvedTransform = useMemo(
    () => (media ? getResolvedProfileMediaTransform({ ...media, transform: initialTransform }, viewportWidth, viewportHeight) : null),
    [initialTransform, media, viewportHeight, viewportWidth]
  );

  const scale = useSharedValue(PROFILE_MEDIA_MIN_ZOOM);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const panStartX = useSharedValue(0);
  const panStartY = useSharedValue(0);
  const pinchStartScale = useSharedValue(PROFILE_MEDIA_MIN_ZOOM);

  useEffect(() => {
    if (!visible || !initialResolvedTransform) {
      return;
    }

    scale.value = initialResolvedTransform.zoom;
    translateX.value = initialResolvedTransform.translateX;
    translateY.value = initialResolvedTransform.translateY;
  }, [initialResolvedTransform, scale, translateX, translateY, visible]);

  const resetTransform = useCallback(() => {
    scale.value = withSpring(PROFILE_MEDIA_MIN_ZOOM, { damping: 18, stiffness: 220, mass: 0.84 });
    translateX.value = withSpring(0, { damping: 18, stiffness: 220, mass: 0.84 });
    translateY.value = withSpring(0, { damping: 18, stiffness: 220, mass: 0.84 });
  }, [scale, translateX, translateY]);

  const confirmTransform = useCallback(() => {
    if (!media) {
      return;
    }

    onConfirm(
      createTransformFromOffsets(
        media,
        viewportWidth,
        viewportHeight,
        scale.value,
        translateX.value,
        translateY.value
      )
    );
  }, [media, onConfirm, scale, translateX, translateY, viewportHeight, viewportWidth]);

  const clampOffsets = useCallback((nextScale: number, nextX: number, nextY: number) => {
    'worklet';

    const baseWidth = baseMetrics?.baseWidth ?? viewportWidth;
    const baseHeight = baseMetrics?.baseHeight ?? viewportHeight;
    const displayWidth = baseWidth * nextScale;
    const displayHeight = baseHeight * nextScale;
    const maxOffsetX = Math.max(0, (displayWidth - viewportWidth) / 2);
    const maxOffsetY = Math.max(0, (displayHeight - viewportHeight) / 2);

    return {
      x: clamp(nextX, -maxOffsetX, maxOffsetX),
      y: clamp(nextY, -maxOffsetY, maxOffsetY),
    };
  }, [baseMetrics?.baseHeight, baseMetrics?.baseWidth, viewportHeight, viewportWidth]);

  const panGesture = useMemo(() => Gesture.Pan()
    .enabled(visible && !!media)
    .onStart(() => {
      panStartX.value = translateX.value;
      panStartY.value = translateY.value;
    })
    .onUpdate((event) => {
      const nextOffsets = clampOffsets(
        scale.value,
        panStartX.value + event.translationX,
        panStartY.value + event.translationY
      );

      translateX.value = nextOffsets.x;
      translateY.value = nextOffsets.y;
    }), [clampOffsets, media, panStartX, panStartY, scale, translateX, translateY, visible]);

  const pinchGesture = useMemo(() => Gesture.Pinch()
    .enabled(visible && !!media)
    .onStart(() => {
      pinchStartScale.value = scale.value;
    })
    .onUpdate((event) => {
      const nextScale = clamp(
        pinchStartScale.value * event.scale,
        PROFILE_MEDIA_MIN_ZOOM,
        PROFILE_MEDIA_MAX_ZOOM
      );
      const nextOffsets = clampOffsets(nextScale, translateX.value, translateY.value);

      scale.value = nextScale;
      translateX.value = nextOffsets.x;
      translateY.value = nextOffsets.y;
    }), [clampOffsets, media, pinchStartScale, scale, translateX, translateY, visible]);

  const editorGesture = useMemo(
    () => Gesture.Simultaneous(panGesture, pinchGesture),
    [panGesture, pinchGesture]
  );

  const animatedMediaStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  if (!media || !kind || !baseMetrics || !source) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.header}>
          <Pressable
            style={styles.headerAction}
            onPress={onCancel}
            accessibilityRole="button"
            accessibilityLabel="Cancelar ajuste de imagem"
          >
            <Text style={styles.headerActionText}>Cancelar</Text>
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{isAvatar ? 'Ajustar foto' : 'Ajustar banner'}</Text>
            <Text style={styles.headerHint}>Arraste e aproxime para definir o enquadramento.</Text>
          </View>
          <Pressable
            style={styles.headerAction}
            onPress={confirmTransform}
            accessibilityRole="button"
            accessibilityLabel="Usar imagem ajustada"
          >
            <Text style={styles.headerActionText}>Usar</Text>
          </Pressable>
        </View>

        <View style={styles.editorBody}>
          <GestureDetector gesture={editorGesture}>
            <View
              style={[
                styles.viewport,
                {
                  width: viewportWidth,
                  height: viewportHeight,
                  borderRadius: isAvatar ? viewportWidth / 2 : 12,
                },
              ]}
            >
              <View style={styles.viewportCenter}>
                <Reanimated.View
                  style={[
                    styles.mediaFrame,
                    {
                      width: baseMetrics.baseWidth,
                      height: baseMetrics.baseHeight,
                    },
                    animatedMediaStyle,
                  ]}
                >
                  <Image
                    source={source}
                    style={styles.mediaImage}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                    recyclingKey={media.uri}
                    accessibilityLabel={isAvatar ? 'Editor da foto de perfil' : 'Editor do banner de perfil'}
                  />
                </Reanimated.View>
              </View>
              <View
                pointerEvents="none"
                style={[
                  styles.viewportOutline,
                  {
                    borderRadius: isAvatar ? viewportWidth / 2 : 12,
                  },
                ]}
              />
            </View>
          </GestureDetector>
        </View>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 18) }]}>
          <Pressable
            style={styles.footerButton}
            onPress={resetTransform}
            accessibilityRole="button"
            accessibilityLabel="Repor enquadramento da imagem"
          >
            <Ionicons name="refresh-outline" size={18} color="#E4E8FF" />
            <Text style={styles.footerButtonText}>Repor</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#05060B',
  },
  header: {
    minHeight: 64,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAction: {
    minWidth: 68,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActionText: {
    color: '#E8EBFF',
    fontSize: 14,
    fontWeight: '800',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  headerHint: {
    marginTop: 4,
    color: '#9098C5',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  editorBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  viewport: {
    overflow: 'hidden',
    backgroundColor: '#111526',
  },
  viewportCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  mediaFrame: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  viewportOutline: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.84)',
  },
  footer: {
    paddingHorizontal: 18,
    paddingTop: 12,
    alignItems: 'center',
  },
  footerButton: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  footerButtonText: {
    color: '#E4E8FF',
    fontSize: 14,
    fontWeight: '800',
  },
});

export default ProfileMediaEditorModal;
