import React, { useMemo } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import type { ProfileMedia } from '@/features/profile/presentation/store/useProfileStore';
import {
  createProfileMediaSource,
  getResolvedProfileMediaTransform,
} from '@/features/profile/presentation/utils/profileMedia';

type ProfileMediaViewportProps = {
  media: ProfileMedia;
  viewportWidth: number;
  viewportHeight: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel: string;
};

export function ProfileMediaViewport({
  media,
  viewportWidth,
  viewportHeight,
  borderRadius = 0,
  style,
  accessibilityLabel,
}: ProfileMediaViewportProps) {
  const resolved = useMemo(
    () => getResolvedProfileMediaTransform(media, viewportWidth, viewportHeight),
    [media, viewportHeight, viewportWidth]
  );

  const source = useMemo(() => createProfileMediaSource(media), [media]);

  return (
    <View
      style={[
        styles.viewport,
        {
          width: viewportWidth,
          height: viewportHeight,
          borderRadius,
        },
        style,
      ]}
    >
      <View style={styles.centered}>
        <View
          style={[
            styles.mediaFrame,
            {
              width: resolved.displayWidth,
              height: resolved.displayHeight,
              transform: [
                { translateX: resolved.translateX },
                { translateY: resolved.translateY },
              ],
            },
          ]}
        >
          <Image
            source={source}
            style={styles.image}
            contentFit="cover"
            cachePolicy="memory-disk"
            recyclingKey={media.uri}
            accessibilityLabel={accessibilityLabel}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  viewport: {
    overflow: 'hidden',
    backgroundColor: '#12162B',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  mediaFrame: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});

export default ProfileMediaViewport;
