import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, TextInput, Animated, Dimensions, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');

export default function CriarShorts({ navigation }: any) {
  const [video, setVideo] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const anim = useRef(new Animated.Value(1)).current;

  const pickVideo = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      videoMaxDuration: 60,
      quality: 1,
    });
    if (!res.canceled && res.assets?.[0]?.uri) setVideo(res.assets[0].uri);
  };

  const onPublish = () => {
    if (!video) return;
    Animated.sequence([
      Animated.spring(anim, { toValue: 0.96, useNativeDriver: true }),
      Animated.spring(anim, { toValue: 1, friction: 3, useNativeDriver: true }),
    ]).start();
    // TODO: enviar para backend
    // payload: { type:'short', video, caption }
  };

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#0E0E12','#11142a','#0E0E12']} style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.hBtn}>
          <Ionicons name="chevron-back" size={22} color="#EDEFFF" />
        </TouchableOpacity>
        <Text style={styles.hTitle}>Criar Shorts</Text>
        <View style={styles.hBtn} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Vídeo</Text>
          {video ? (
            <TouchableOpacity onPress={pickVideo} activeOpacity={0.9} style={styles.mediaPreview}>
              <Image source={{ uri: video }} style={styles.previewImg} />
              <View style={styles.badge}><Ionicons name="videocam" size={14} color="#0E0E12" /></View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={pickVideo} activeOpacity={0.9} style={styles.mediaPlaceholder}>
              <Ionicons name="videocam-outline" size={26} color="#cfd3ff" />
              <Text style={styles.phTxt}>Selecionar vídeo vertical</Text>
            </TouchableOpacity>
          )}

          <Text style={[styles.cardTitle, { marginTop: 18 }]}>Legenda (opcional)</Text>
          <TextInput
            value={caption}
            onChangeText={setCaption}
            style={styles.input}
            placeholder="Legenda curta…"
            placeholderTextColor="#9aa0c6"
            maxLength={120}
          />
        </View>

        <Animated.View style={{ transform: [{ scale: anim }] }}>
          <TouchableOpacity onPress={onPublish} disabled={!video} style={[styles.primary, !video && { opacity: 0.5 }]} activeOpacity={0.9}>
            <LinearGradient colors={['#6C63FF', '#2230C3']} style={styles.primaryBg} start={[0,0]} end={[1,1]}>
              <Ionicons name="send" size={18} color="#fff" />
              <Text style={styles.primaryTxt}>Publicar Shorts</Text>
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
  mediaPlaceholder: { height: width * 0.56, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 8 },
  mediaPreview: { height: width * 0.56, borderRadius: 14, overflow: 'hidden' },
  previewImg: { width: '100%', height: '100%' },
  phTxt: { color: '#cfd3ff' },
  badge: { position: 'absolute', right: 8, top: 8, backgroundColor: '#DDE1FF', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 10 },
  input: { minHeight: 48, borderRadius: 12, padding: 12, backgroundColor: 'rgba(0,0,0,0.25)', color: '#fff' },
  primary: { marginTop: 18, borderRadius: 14, overflow: 'hidden' },
  primaryBg: { height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 },
  primaryTxt: { color: '#fff', fontWeight: '800' },
});
