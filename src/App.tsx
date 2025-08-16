import 'react-native-gesture-handler';
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator, NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';

/** Tipagem das rotas */
type RootStackParamList = {
  Splash: undefined;
  TelaLogin: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

/** =============== SplashScreen =============== **/
type SplashProps = NativeStackScreenProps<RootStackParamList, 'Splash'>;

function SplashScreen({ navigation }: SplashProps) {
  const fadeText = useRef(new Animated.Value(0)).current;

  // 3 camadas para crossfade suave
  const grad1 = useRef(new Animated.Value(1)).current;
  const grad2 = useRef(new Animated.Value(0)).current;
  const grad3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeText, { toValue: 1, duration: 700, useNativeDriver: true }).start();

    const loop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(grad2, { toValue: 1, duration: 1600, useNativeDriver: true }),
          Animated.timing(grad1, { toValue: 0, duration: 1600, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(grad3, { toValue: 1, duration: 1600, useNativeDriver: true }),
          Animated.timing(grad2, { toValue: 0, duration: 1600, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(grad1, { toValue: 1, duration: 1600, useNativeDriver: true }),
          Animated.timing(grad3, { toValue: 0, duration: 1600, useNativeDriver: true }),
        ]),
      ])
    );
    loop.start();

    const timer = setTimeout(() => {
      loop.stop();
      navigation.replace('TelaLogin');
    }, 2200);

    return () => {
      clearTimeout(timer);
      loop.stop();
    };
  }, [navigation, fadeText, grad1, grad2, grad3]);

  const translateY = fadeText.interpolate({ inputRange: [0, 1], outputRange: [10, 0] });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <Animated.View style={[StyleSheet.absoluteFill, { opacity: grad1 }]}>
        <LinearGradient colors={['#2230C3', '#6C63FF', '#FF5F6D']} start={[0, 0]} end={[1, 1]} style={StyleSheet.absoluteFill} />
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: grad2 }]}>
        <LinearGradient colors={['#0E0E12', '#2230C3', '#6C63FF']} start={[1, 0]} end={[0, 1]} style={StyleSheet.absoluteFill} />
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: grad3 }]}>
        <LinearGradient colors={['#6C63FF', '#FF5F6D', '#2230C3']} start={[0, 1]} end={[1, 0]} style={StyleSheet.absoluteFill} />
      </Animated.View>

      <Animated.Text style={[styles.logo, { opacity: fadeText, transform: [{ translateY }] }]}>Kachan!</Animated.Text>
    </View>
  );
}

/** =============== TelaLogin (placeholder) =============== **/
function TelaLogin() {
  return (
    <View style={[styles.container, { backgroundColor: '#0E0E12' }]}>
      <Text style={styles.title}>Tela de Login</Text>
      <Text style={styles.subtitle}>Campos e ações virão aqui na próxima etapa.</Text>
    </View>
  );
}

/** =============== App (entrypoint) =============== **/
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="TelaLogin" component={TelaLogin} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

/** =============== Styles =============== **/
const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logo: {
    color: '#FFFFFF',
    fontSize: 48,
    fontWeight: '800',
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowRadius: 12,
  },
  title: { color: '#FFF', fontSize: 28, fontWeight: '700', marginBottom: 8 },
  subtitle: { color: '#C8C8D8', fontSize: 16, textAlign: 'center', paddingHorizontal: 24 },
});
