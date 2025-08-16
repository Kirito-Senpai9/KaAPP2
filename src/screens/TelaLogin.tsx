import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput,
  TouchableOpacity, Animated, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function TelaLogin({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showPass, setShowPass] = useState(false);

  const btnScale = useRef(new Animated.Value(1)).current;
  const pressIn = () => Animated.spring(btnScale, { toValue: 0.96, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(btnScale, { toValue: 1, friction: 3, useNativeDriver: true }).start();

  const onEntrar = () => {
    navigation.replace('Telainicial');
  };

  return (
    <View style={styles.root}>
      {/* Fundo gradiente suave */}
      <LinearGradient
        colors={['#0E0E12', '#101225', '#0E0E12']}
        start={[0, 0]}
        end={[1, 1]}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['rgba(98, 91, 255,0.25)', 'transparent', 'rgba(255,95,109,0.25)']}
        start={[0, 0]}
        end={[1, 1]}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.logo}>Kachan!</Text>
          <Text style={styles.subtitle}>Entre para continuar</Text>
        </View>

        <View style={styles.card}>
          {/* Email */}
          <View style={styles.inputWrap}>
            <Ionicons name="mail-outline" size={20} color="#AEB0C2" style={styles.icon} />
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="E-mail"
              placeholderTextColor="#8E90A3"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />
          </View>

          {/* Senha */}
          <View style={styles.inputWrap}>
            <MaterialCommunityIcons name="lock-outline" size={20} color="#AEB0C2" style={styles.icon} />
            <TextInput
              value={senha}
              onChangeText={setSenha}
              placeholder="Senha"
              placeholderTextColor="#8E90A3"
              secureTextEntry={!showPass}
              style={styles.input}
            />
            <TouchableOpacity onPress={() => setShowPass(s => !s)} style={styles.eye}>
              <Ionicons name={showPass ? 'eye-off' : 'eye'} size={18} color="#C7C9D9" />
            </TouchableOpacity>
          </View>

          <View style={styles.rowBetween}>
            <TouchableOpacity><Text style={styles.linkMuted}>Esqueci a senha</Text></TouchableOpacity>
            <TouchableOpacity><Text style={styles.linkMuted}>Criar conta</Text></TouchableOpacity>
          </View>

          {/* Botão Entrar */}
          <Animated.View style={{ transform: [{ scale: btnScale }] }}>
            <TouchableOpacity activeOpacity={0.9} onPressIn={pressIn} onPressOut={pressOut} onPress={onEntrar} style={styles.cta}>
              <LinearGradient colors={['#6C63FF', '#2230C3']} start={[0, 0]} end={[1, 1]} style={styles.ctaBg}>
                <Text style={styles.ctaText}>Entrar</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Social (placeholders) */}
          <View style={styles.social}>
            <TouchableOpacity style={styles.socialBtn}>
              <Ionicons name="logo-google" size={18} color="#E0E2F2" />
              <Text style={styles.socialText}>Google</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialBtn}>
              <Ionicons name="logo-github" size={18} color="#E0E2F2" />
              <Text style={styles.socialText}>GitHub</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.footnote}>Ao entrar, você concorda com os Termos e a Política de Privacidade.</Text>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0E0E12' },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  header: { alignItems: 'center', marginBottom: 16 },
  logo: { color: '#FFFFFF', fontSize: 36, fontWeight: '800', letterSpacing: 0.5 },
  subtitle: { color: '#BFC1D6', marginTop: 6 },

  card: {
    width: '100%', maxWidth: 420,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20, padding: 18,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 }, elevation: 8, gap: 14,
  },

  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12, height: 48,
  },
  icon: { marginRight: 8 },
  eye: { paddingHorizontal: 6, paddingVertical: 6 },
  input: { flex: 1, color: '#E8EAF6', fontSize: 15 },

  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  linkMuted: { color: '#AEB0C2', fontSize: 13 },

  cta: { marginTop: 6, borderRadius: 14, overflow: 'hidden' },
  ctaBg: { height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  ctaText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },

  social: { flexDirection: 'row', gap: 12, marginTop: 10, justifyContent: 'center' },
  socialBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 14, height: 42, borderRadius: 12,
  },
  socialText: { color: '#E0E2F2', fontSize: 13, fontWeight: '600' },

  footnote: { color: '#8E90A3', fontSize: 12, textAlign: 'center', marginTop: 18, paddingHorizontal: 24 },
});
