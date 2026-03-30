import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import type { ShareTarget } from '@/features/share/domain/entities/share';

type ShareTargetTileProps = {
  target: ShareTarget;
  selected: boolean;
  onPress: (targetId: string) => void;
};

function ShareTargetTileComponent({
  target,
  selected,
  onPress,
}: ShareTargetTileProps) {
  return (
    <Pressable
      onPress={() => onPress(target.id)}
      style={({ pressed }) => [
        styles.tile,
        selected && styles.tileSelected,
        pressed && styles.tilePressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Selecionar ${target.name}`}
    >
      <View style={styles.avatarWrap}>
        <Image
          source={{ uri: target.avatar }}
          style={styles.avatar}
          contentFit="cover"
          cachePolicy="memory-disk"
          recyclingKey={target.avatar}
        />
        <View
          style={[
            styles.typeBadge,
            target.type === 'community' && styles.typeBadgeCommunity,
          ]}
        >
          {target.type === 'community' ? (
            <MaterialCommunityIcons
              name="account-group-outline"
              size={10}
              color="#F6F8FF"
            />
          ) : (
            <Ionicons name="person-outline" size={10} color="#F6F8FF" />
          )}
        </View>
        {selected && (
          <View style={styles.selectedBadge}>
            <Ionicons name="checkmark" size={12} color="#0D1124" />
          </View>
        )}
      </View>
      <Text style={styles.name} numberOfLines={2}>
        {target.name}
      </Text>
      <Text style={styles.subtitle} numberOfLines={1}>
        {target.subtitle}
      </Text>
    </Pressable>
  );
}

export default memo(ShareTargetTileComponent);

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minHeight: 118,
    paddingHorizontal: 6,
    paddingVertical: 8,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  tilePressed: {
    opacity: 0.86,
  },
  tileSelected: {
    backgroundColor: 'rgba(108,99,255,0.16)',
    borderColor: 'rgba(140,150,255,0.46)',
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: 10,
  },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  selectedBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7AF1A7',
    borderWidth: 2,
    borderColor: '#101327',
  },
  typeBadge: {
    position: 'absolute',
    left: -2,
    bottom: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4556D7',
    borderWidth: 2,
    borderColor: '#101327',
  },
  typeBadgeCommunity: {
    backgroundColor: '#D75E8E',
  },
  name: {
    color: '#F5F7FF',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    minHeight: 32,
  },
  subtitle: {
    color: '#99A3D7',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 2,
  },
});
