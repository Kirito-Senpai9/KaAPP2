import React from 'react';
import { View, Pressable, StyleSheet, Platform } from 'react-native';
import { BottomTabBarProps, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, {
  Easing,
  interpolate,
  interpolateColor,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { ComunidadeScreen } from '@/features/community';
import { CriarScreen } from '@/features/create';
import { HomeScreen } from '@/features/feed';
import { PerfilScreen } from '@/features/profile';
import { ShortsScreen } from '@/features/shorts';
import type { KachanTabParamList } from '@/app/navigation/types';

type RouteName = keyof KachanTabParamList;
const Tab = createBottomTabNavigator<KachanTabParamList>();
const AnimatedIonicon = Animated.createAnimatedComponent(Ionicons);

const TABS: Array<{
  key: RouteName;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon?: keyof typeof Ionicons.glyphMap;
}> = [
  { key: 'Home', label: 'Home', icon: 'home-outline', activeIcon: 'home' },
  { key: 'Shorts', label: 'Shorts', icon: 'play-circle-outline', activeIcon: 'play-circle' },
  { key: 'Criar', label: 'Criar', icon: 'add-outline', activeIcon: 'add' },
  { key: 'Comunidade', label: 'Comunidade', icon: 'people-outline', activeIcon: 'people' },
  { key: 'Perfil', label: 'Perfil', icon: 'person-circle-outline', activeIcon: 'person-circle' },
];

function TabIcon({
  name,
  activeName,
  label,
  focused,
  onPress,
  accessibilityState,
}: {
  name: keyof typeof Ionicons.glyphMap;
  activeName?: keyof typeof Ionicons.glyphMap;
  label: string;
  focused: boolean;
  onPress: () => void;
  accessibilityState: { selected: true } | {};
}) {
  const activeProgress = useSharedValue(focused ? 1 : 0);
  const pressProgress = useSharedValue(0);
  const tapPulse = useSharedValue(focused ? 1 : 0);

  React.useEffect(() => {
    activeProgress.value = withTiming(focused ? 1 : 0, {
      duration: 240,
      easing: Easing.out(Easing.cubic),
    });

    if (focused) {
      tapPulse.value = 0;
      tapPulse.value = withTiming(1, {
        duration: 240,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [focused, activeProgress, tapPulse]);

  const iconName = focused && activeName ? activeName : name;

  const iconContainerStyle = useAnimatedStyle(() => {
    const scale = interpolate(activeProgress.value + pressProgress.value, [0, 1.2], [1, 1.05]);
    const translateY = interpolate(activeProgress.value, [0, 1], [0, -1]);

    return {
      transform: [{ translateY }, { scale }],
    };
  });

  const iconGlowStyle = useAnimatedStyle(() => {
    const baseOpacity = interpolate(activeProgress.value, [0, 1], [0, 0.26]);
    const burstOpacity = interpolate(tapPulse.value, [0, 0.45, 1], [0, 0.24, 0]);
    const glowStrength = baseOpacity + burstOpacity;

    const baseScale = interpolate(activeProgress.value + pressProgress.value, [0, 1.25], [0.78, 1]);
    const burstScale = interpolate(tapPulse.value, [0, 1], [0.62, 1.12]);
    const glowScale = Math.max(baseScale, burstScale);

    return {
      opacity: glowStrength,
      transform: [{ scale: glowScale }],
    };
  });

  const labelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(activeProgress.value, [0, 1], ['rgba(166,173,206,0.70)', '#FFFFFF']),
    opacity: interpolate(activeProgress.value, [0, 1], [0.86, 1]),
  }));

  const iconProps = useAnimatedProps(() => ({
    color: interpolateColor(activeProgress.value, [0, 1], ['rgba(166,173,206,0.72)', '#7A72FF']),
  }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={accessibilityState}
      onPress={onPress}
      onPressIn={() => {
        tapPulse.value = 0;
        tapPulse.value = withTiming(1, { duration: 240, easing: Easing.out(Easing.cubic) });
        pressProgress.value = withTiming(0.08, { duration: 120, easing: Easing.out(Easing.quad) });
      }}
      onPressOut={() => {
        pressProgress.value = withTiming(0, { duration: 180, easing: Easing.out(Easing.quad) });
      }}
      style={styles.tab}
    >
      <Animated.View style={iconContainerStyle}>
        <View style={styles.iconShell}>
          <Animated.View style={[styles.iconGlow, iconGlowStyle]} />
          <AnimatedIonicon name={iconName} size={24} animatedProps={iconProps} />
        </View>
      </Animated.View>
      <Animated.Text style={[styles.label, labelStyle]} numberOfLines={1}>
        {label}
      </Animated.Text>
    </Pressable>
  );
}

function KachanTabBar({ state, navigation }: BottomTabBarProps) {
  return (
    <View pointerEvents="box-none" style={styles.wrap}>
      <View style={styles.glassBar}>
        <BlurView intensity={95} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.tintLayer} />
        <View style={styles.edgeHighlight} />

        <View style={styles.row}>
          {state.routes.map((route, index: number) => {
            const isFocused = state.index === index;
            const tab = TABS.find((t) => t.key === (route.name as RouteName));

            if (!tab) return null;

            const onPress = () => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
            };

            return (
              <TabIcon
                key={route.key}
                name={tab.icon}
                activeName={tab.activeIcon}
                label={tab.label}
                focused={isFocused}
                onPress={onPress}
                accessibilityState={isFocused ? { selected: true } : {}}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

export default function KachanTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
        animation: 'shift',
        transitionSpec: {
          animation: 'timing',
          config: {
            duration: 240,
          },
        },
      }}
      tabBar={(props) => <KachanTabBar {...props} />}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Shorts" component={ShortsScreen} />
      <Tab.Screen name="Criar" component={CriarScreen} />
      <Tab.Screen name="Comunidade" component={ComunidadeScreen} />
      <Tab.Screen name="Perfil" component={PerfilScreen} />
    </Tab.Navigator>
  );
}

const H = 78;

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 14,
    paddingBottom: Platform.select({ ios: 22, android: 14 }),
    paddingTop: 10,
  },
  glassBar: {
    height: H,
    borderRadius: 38,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(147,154,255,0.16)',
    shadowColor: '#0A0C20',
    shadowOpacity: 0.24,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
    backgroundColor: 'rgba(18,22,43,0.30)',
  },
  tintLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(22,27,52,0.48)',
  },
  edgeHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.24)',
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: H,
  },
  iconShell: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGlow: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(122,114,255,0.18)',
    shadowColor: '#7A72FF',
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 2,
  },
  label: {
    marginTop: 3,
    fontSize: 11,
    fontWeight: '600',
  },
});
