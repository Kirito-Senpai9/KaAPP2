import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

// TELAS (ajuste os imports conforme seu projeto)
import Telainicial from '../screens/Telainicial';   // Home
import Shorts from '../screens/Shorts';
import Comunidade from '../screens/Comunidade';
import Perfil from '../screens/Perfil';
import Criar from '../screens/Criar';                // fluxo de criação

type RouteName = 'Home' | 'Shorts' | 'Criar' | 'Comunidade' | 'Perfil';
const Tab = createBottomTabNavigator();

const TABS: Array<{
  key: RouteName;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon?: keyof typeof Ionicons.glyphMap;
  isCenter?: boolean;
}> = [
  { key: 'Home',        label: 'Home',        icon: 'home-outline',        activeIcon: 'home' },
  { key: 'Shorts',      label: 'Shorts',      icon: 'play-circle-outline', activeIcon: 'play-circle' },
  { key: 'Criar',       label: 'Criar',       icon: 'add',                 isCenter: true },
  { key: 'Comunidade',  label: 'Comunidade',  icon: 'people-outline',      activeIcon: 'people' },
  { key: 'Perfil',      label: 'Perfil',      icon: 'person-circle-outline', activeIcon: 'person-circle' },
];

function IconAnimated({
  name,
  activeName,
  label,
  focused,
}: {
  name: keyof typeof Ionicons.glyphMap;
  activeName?: keyof typeof Ionicons.glyphMap;
  label: string;
  focused: boolean;
}) {
  const s = useSharedValue(focused ? 1 : 0);
  useEffect(() => { s.value = withSpring(focused ? 1 : 0); }, [focused]);
  const iconStyle = useAnimatedStyle(() => ({ transform: [{ scale: 1 + s.value * 0.12 }] }));
  const iconName = focused && activeName ? activeName : name;
  const color = focused ? '#6C63FF' : '#A6ADCE';
  const labelColor = focused ? '#FFFFFF' : '#A6ADCE';
  return (
    <View style={{ alignItems: 'center' }}>
      <Animated.View style={iconStyle}>
        <Ionicons name={iconName} size={24} color={color} />
      </Animated.View>
      <Text style={[styles.label, { color: labelColor }]} numberOfLines={1}>{label}</Text>
    </View>
  );
}

function KachanTabBar({ state, descriptors, navigation }: any) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {state.routes.map((route: any, index: number) => {
          const isFocused = state.index === index;
          const options = descriptors[route.key].options;
          const tab = TABS.find(t => t.key === route.name as RouteName)!;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          if (tab.isCenter) {
            return (
              <View key={route.key} style={styles.centerSlot}>
                <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.centerBtn}>
                  <LinearGradient colors={['#6C63FF', '#2230C3']} start={[0, 0]} end={[1, 1]} style={styles.centerBtnBg}>
                    <Ionicons name={tab.icon} size={30} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            );
          }

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              onPress={onPress}
              activeOpacity={0.9}
              style={styles.tab}
            >
              <IconAnimated
                name={tab.icon}
                activeName={tab.activeIcon}
                label={tab.label}
                focused={isFocused}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function KachanTabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false, tabBarStyle: { display: 'none' } }}
      tabBar={(props) => <KachanTabBar {...props} />}
      // @ts-ignore: sceneContainerStyle missing in types
      sceneContainerStyle={{ backgroundColor: '#0E0E12' }}
    >
      <Tab.Screen name="Home" component={Telainicial} />
      <Tab.Screen name="Shorts" component={Shorts} />
      <Tab.Screen name="Criar" component={Criar} />
      <Tab.Screen name="Comunidade" component={Comunidade} />
      <Tab.Screen name="Perfil" component={Perfil} />
    </Tab.Navigator>
  );
}

const H = 72;

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    paddingHorizontal: 12, paddingBottom: Platform.select({ ios: 16, android: 12 }), paddingTop: 10,
  },
  row: {
    height: H,
    borderRadius: 20,
    backgroundColor: 'rgba(21,24,47,0.92)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', height: H },
  label: { fontSize: 11, marginTop: 2, fontWeight: '600' },
  centerSlot: { width: 86, alignItems: 'center', justifyContent: 'center', height: H },
  centerBtn: {
    borderRadius: 34, overflow: 'hidden', elevation: 10,
    shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 6 },
  },
  centerBtnBg: {
    width: 66, height: 66, borderRadius: 33, alignItems: 'center', justifyContent: 'center',
  },
});
