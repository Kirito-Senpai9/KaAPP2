import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, TextInput, Animated, Dimensions, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');

export default function CriarPostagem({ navigation }: any) {
  const [media, setMedia] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [tags, setTags] = useState<string>('');
  const [audience, setAudience] = useState<'publico'|'amigos'|'privado'>('publico');

  const canPublish = !!(media || text.trim().length > 0);
  const anim = useRef(new Animated.Value(1)).current;

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.9
    });
    if (!res.canceled && res.assets?.[0]?.uri) setMedia(res.assets[0].uri);
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

  const AudienceButton = ({ value, label }: { value: typeof audience; label: string }) => {
    const active = audience === value;
    return (
      <TouchableOpacity onPress={() => setAudience(value)} style={[styles.chip, active && styles.chipActive]} activeOpacity={0.85}>
        <Text style={[styles.chipTxt, active && styles.chipTxtActive]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#0E0E12','#11142a','#0E0E12']} style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.hBtn}>
          <Ionicons name="chevron-back" size={22} color="#EDEFFF" />
        </TouchableOpacity>
        <Text style={styles.hTitle}>Criar Postagem</Text>
        <View style={styles.hBtn} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}>
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
            <TouchableOpacity onPress={pickImage} activeOpacity={0.9} style={styles.mediaPreview}>
              <Image source={{ uri: media }} style={styles.previewImg} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={pickImage} activeOpacity={0.9} style={styles.mediaPlaceholder}>
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
            <AudienceButton value="publico" label="Público" />
            <AudienceButton value="amigos"  label="Amigos" />
            <AudienceButton value="privado" label="Privado" />
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
    </View>
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
  mediaPlaceholder: { height: width * 0.56, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 8 },
  mediaPreview: { height: width * 0.56, borderRadius: 14, overflow: 'hidden' },
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
