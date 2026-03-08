import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
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

import Telainicial from '../screens/Telainicial';
import Shorts from '../screens/Shorts';
import Comunidade from '../screens/Comunidade';
import Perfil from '../screens/Perfil';
import Criar from '../screens/Criar';

export type KachanTabParamList = {
  Home: undefined;
  Shorts: undefined;
  Criar: undefined;
  Comunidade: undefined;
  Perfil: undefined;
};

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

  React.useEffect(() => {
    activeProgress.value = withTiming(focused ? 1 : 0, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
    });
  }, [focused, activeProgress]);

  const iconName = focused && activeName ? activeName : name;

  const iconContainerStyle = useAnimatedStyle(() => {
    const scale = interpolate(activeProgress.value + pressProgress.value, [0, 1.2], [1, 1.1]);
    const translateY = interpolate(activeProgress.value, [0, 1], [0, -2]);

    return {
      transform: [{ translateY }, { scale }],
    };
  });

  const labelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(activeProgress.value, [0, 1], ['#A6ADCE', '#FFFFFF']),
  }));

  const iconProps = useAnimatedProps(() => ({
    color: interpolateColor(activeProgress.value, [0, 1], ['#A6ADCE', '#6C63FF']),
  }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={accessibilityState}
      onPress={onPress}
      onPressIn={() => {
        pressProgress.value = withTiming(0.14, { duration: 120, easing: Easing.out(Easing.quad) });
      }}
      onPressOut={() => {
        pressProgress.value = withTiming(0, { duration: 160, easing: Easing.out(Easing.quad) });
      }}
      style={styles.tab}
    >
      <Animated.View style={iconContainerStyle}>
        <AnimatedIonicon name={iconName} size={24} animatedProps={iconProps} />
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
        <BlurView intensity={38} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.tintLayer} />

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
      <Tab.Screen name="Home" component={Telainicial} />
      <Tab.Screen name="Shorts" component={Shorts} />
      <Tab.Screen name="Criar" component={Criar} />
      <Tab.Screen name="Comunidade" component={Comunidade} />
      <Tab.Screen name="Perfil" component={Perfil} />
    </Tab.Navigator>
  );
}

const H = 74;

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
    paddingBottom: Platform.select({ ios: 18, android: 12 }),
    paddingTop: 10,
  },
  glassBar: {
    height: H,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    shadowColor: '#000',
    shadowOpacity: 0.26,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 16,
    backgroundColor: 'rgba(21,24,47,0.35)',
  },
  tintLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20,24,44,0.40)',
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: H,
  },
  label: {
    marginTop: 3,
    fontSize: 11,
    fontWeight: '600',
  },
});
