import React, { useEffect, useRef, useState } from 'react';
import { Alert, View, Text, StyleSheet, TouchableOpacity, TextInput, Animated, useWindowDimensions, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { RootStackScreenProps } from '@/app/navigation/types';
import * as ImagePicker from 'expo-image-picker';

const AUDIENCES = [
  { value: 'publico', label: 'Público' },
  { value: 'amigos', label: 'Amigos' },
  { value: 'privado', label: 'Privado' },
] as const;

export default function CriarPostagem({ navigation }: RootStackScreenProps<'CriarPostagem'>) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const previewSize = { height: Math.max(1, width - insets.left - insets.right) * 0.56 };
  const pickerBusy = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  const [media, setMedia] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [tags, setTags] = useState<string>('');
  const [audience, setAudience] = useState<'publico'|'amigos'|'privado'>('publico');

  const canPublish = !!(media || text.trim().length > 0);
  const anim = useRef(new Animated.Value(1)).current;

  const pickImage = async () => {
    if (pickerBusy.current) return;
    pickerBusy.current = true;
    try {
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9 });
      if (mounted.current && !res.canceled && res.assets?.[0]?.uri) setMedia(res.assets[0].uri);
    } catch {
      if (mounted.current) Alert.alert('Não foi possível selecionar', 'Tente escolher outra imagem da galeria.');
    } finally {
      pickerBusy.current = false;
    }
  };

  const onPublish = () => {
    if (!canPublish) return;
    Animated.sequence([
      Animated.spring(anim, { toValue: 0.96, useNativeDriver: true }),
      Animated.spring(anim, { toValue: 1, friction: 3, useNativeDriver: true }),
    ]).start();
    // TODO: enviar para backend
    // payload: { type:'post', media, text, tags, audience }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <LinearGradient colors={['#0E0E12','#11142a','#0E0E12']} style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.hBtn}>
          <Ionicons name="chevron-back" size={22} color="#EDEFFF" />
        </TouchableOpacity>
        <Text style={styles.hTitle}>Criar Postagem</Text>
        <View style={styles.hBtn} />
      </View>

      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 + insets.bottom }}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Texto</Text>
          <TextInput
            value={text}
            onChangeText={setText}
            style={styles.input}
            placeholder="O que você quer compartilhar?"
            placeholderTextColor="#9aa0c6"
            multiline
          />

          <Text style={[styles.cardTitle, { marginTop: 18 }]}>Imagem (opcional)</Text>
          {media ? (
            <TouchableOpacity onPress={pickImage} activeOpacity={0.9} style={[styles.mediaPreview, previewSize]}>
              <Image
                source={{ uri: media }}
                style={styles.previewImg}
                contentFit="cover"
                cachePolicy="memory-disk"
                recyclingKey={media}
              />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={pickImage} activeOpacity={0.9} style={[styles.mediaPlaceholder, previewSize]}>
              <Ionicons name="image-outline" size={26} color="#cfd3ff" />
              <Text style={styles.phTxt}>Adicionar imagem</Text>
            </TouchableOpacity>
          )}

          <Text style={[styles.cardTitle, { marginTop: 18 }]}>Hashtags (opcional)</Text>
          <TextInput
            value={tags}
            onChangeText={setTags}
            style={styles.input}
            placeholder="#kachan  #minecraft"
            placeholderTextColor="#9aa0c6"
          />

          <Text style={[styles.cardTitle, { marginTop: 18 }]}>Audiência</Text>
          <View style={styles.row}>
            {AUDIENCES.map(({ value, label }) => (
              <TouchableOpacity key={value} onPress={() => setAudience(value)} style={[styles.chip, audience === value && styles.chipActive]} activeOpacity={0.85}>
                <Text style={[styles.chipTxt, audience === value && styles.chipTxtActive]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Animated.View style={{ transform: [{ scale: anim }] }}>
          <TouchableOpacity onPress={onPublish} disabled={!canPublish} style={[styles.primary, !canPublish && { opacity: 0.5 }]} activeOpacity={0.9}>
            <LinearGradient colors={['#6C63FF', '#2230C3']} style={styles.primaryBg} start={[0,0]} end={[1,1]}>
              <Ionicons name="send" size={18} color="#fff" />
              <Text style={styles.primaryTxt}>Publicar</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0E0E12' },
  header: { height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10 },
  hBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  hTitle: { color: '#fff', fontWeight: '800', fontSize: 16 },
  card: { backgroundColor: 'rgba(21,24,47,0.65)', borderRadius: 18, padding: 14, marginTop: 12 },
  cardTitle: { color: '#cfd3ff', fontWeight: '700', marginBottom: 8 },
  input: { minHeight: 56, borderRadius: 12, padding: 12, backgroundColor: 'rgba(0,0,0,0.25)', color: '#fff' },
  mediaPlaceholder: { borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 8 },
  mediaPreview: { borderRadius: 14, overflow: 'hidden' },
  previewImg: { width: '100%', height: '100%' },
  phTxt: { color: '#cfd3ff' },
  row: { flexDirection: 'row', gap: 10 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.06)' },
  chipActive: { backgroundColor: 'rgba(108,99,255,0.28)' },
  chipTxt: { color: '#b9c1ff', fontWeight: '700' },
  chipTxtActive: { color: '#fff' },
  primary: { marginTop: 18, borderRadius: 14, overflow: 'hidden' },
  primaryBg: { height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 },
  primaryTxt: { color: '#fff', fontWeight: '800' },
});
