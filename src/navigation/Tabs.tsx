import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, LayoutChangeEvent, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Telainicial from '@/screens/Telainicial';
import Explorar from '@/screens/Explorar';
import Notificacoes from '@/screens/Notificacoes';
import Perfil from '@/screens/Perfil';
import Publicar from '@/screens/Publicar';

type TabKey = 'Feed' | 'Explorar' | 'Publicar' | 'Notificacoes' | 'Perfil';

const Tab = createBottomTabNavigator();

const TAB_ICON: Record<TabKey, keyof typeof Ionicons.glyphMap> = {
  Feed: 'home-outline',
  Explorar: 'search-outline',
  Publicar: 'add',
  Notificacoes: 'notifications-outline',
  Perfil: 'person-outline',
};

function AnimatedIconLabel({ name, label, active }: { name: keyof typeof Ionicons.glyphMap; label: string; active: boolean; }) {
  const scale = useRef(new Animated.Value(active ? 1 : 0)).current;
  useEffect(() => { Animated.spring(scale, { toValue: active ? 1 : 0, useNativeDriver: true }).start(); }, [active]);
  const iconColor = active ? '#DDE1FF' : '#A6ADCE';
  const labelColor = active ? '#FFFFFF' : '#A6ADCE';
  const bounce = scale.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });
  const labelOpacity = scale.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  return (
    <View style={{ alignItems: 'center' }}>
      <Animated.View style={{ transform: [{ scale: bounce }] }}>
        <Ionicons name={name} size={22} color={iconColor} />
      </Animated.View>
      <Animated.Text style={[styles.tabLabel, { color: labelColor, opacity: labelOpacity }]} numberOfLines={1}>
        {label}
      </Animated.Text>
    </View>
  );
}

function CustomTabBar({ state, descriptors, navigation }: any) {
  const [tabsLayout, setTabsLayout] = useState<{ x: number; w: number }[]>(new Array(state.routes.length).fill({ x: 0, w: 0 }));
  const indicatorX = useRef(new Animated.Value(0)).current;
  const indicatorW = useRef(new Animated.Value(48)).current;

  useEffect(() => {
    const i = state.index;
    const layout = tabsLayout[i] || { x: 0, w: 48 };
    Animated.spring(indicatorX, { toValue: layout.x + layout.w / 2, useNativeDriver: true }).start();
    Animated.spring(indicatorW, { toValue: Math.max(56, layout.w * 0.7), useNativeDriver: false }).start();
  }, [state.index, tabsLayout]);

  const onTabLayout = (i: number) => (e: LayoutChangeEvent) => {
    const { x, width } = e.nativeEvent.layout;
    setTabsLayout((prev) => { const next = [...prev]; next[i] = { x, w: width }; return next; });
  };

  return (
    <View style={styles.tabWrap}>
      <Animated.View pointerEvents="none" style={[styles.indicatorHolder, { transform: [{ translateX: indicatorX }] }]}> 
        <Animated.View style={[styles.indicator, { width: indicatorW }]} />
      </Animated.View>

      <View style={styles.tabRow}>
        {state.routes.map((route: any, i: number) => {
          const { options } = descriptors[route.key];
          const label = options.tabBarLabel ?? options.title ?? route.name;
          const isFocused = state.index === i;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          const iconName = (TAB_ICON as any)[route.name] ?? 'ellipse';

          if (route.name === 'Publicar') {
            return (
              <View key={route.key} onLayout={onTabLayout(i)} style={styles.centerSlot}>
                <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.centerBtn}>
                  <LinearGradient colors={['#6C63FF', '#2230C3']} start={[0, 0]} end={[1, 1]} style={styles.centerBtnBg}>
                    <Ionicons name="add" size={28} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            );
          }

          return (
            <TouchableOpacity
              key={route.key}
              onLayout={onTabLayout(i)}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              onPress={onPress}
              activeOpacity={0.9}
              style={styles.tabItem}
            >
              <AnimatedIconLabel name={iconName} label={label} active={isFocused} />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false, tabBarStyle: { display: 'none' } }}
      tabBar={(props) => <CustomTabBar {...props} />}
        // @ts-ignore: sceneContainerStyle missing in types
      sceneContainerStyle={{ backgroundColor: '#0E0E12' }}
    >
      <Tab.Screen name="Feed" component={Telainicial} options={{ title: 'Início' }} />
      <Tab.Screen name="Explorar" component={Explorar} options={{ title: 'Explorar' }} />
      <Tab.Screen name="Publicar" component={Publicar} options={{ title: 'Publicar' }} />
      <Tab.Screen name="Notificacoes" component={Notificacoes} options={{ title: 'Alertas' }} />
      <Tab.Screen name="Perfil" component={Perfil} options={{ title: 'Perfil' }} />
    </Tab.Navigator>
  );
}

const TAB_HEIGHT = 72;

const styles = StyleSheet.create({
  tabWrap: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    paddingHorizontal: 12, paddingBottom: Platform.select({ ios: 16, android: 12 }), paddingTop: 10,
    backgroundColor: 'transparent',
  },
  tabRow: {
    height: TAB_HEIGHT, borderRadius: 20, backgroundColor: 'rgba(21, 24, 47, 0.9)',
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, overflow: 'hidden',
  },
  indicatorHolder: {
    position: 'absolute',
    bottom: Platform.select({ ios: 16, android: 12, default: 0 }) + 10 + (TAB_HEIGHT - 44) / 2,
    left: 12, right: 12, alignItems: 'center',
  },
  indicator: { height: 44, borderRadius: 22, backgroundColor: 'rgba(108, 99, 255, 0.16)' },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', height: TAB_HEIGHT },
  tabLabel: { marginTop: 2, fontSize: 11, fontWeight: '600' },
  centerSlot: { width: 76, alignItems: 'center', justifyContent: 'center', height: TAB_HEIGHT },
  centerBtn: {
    borderRadius: 30, overflow: 'hidden', elevation: 10,
    shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 6 },
  },
  centerBtnBg: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
});

