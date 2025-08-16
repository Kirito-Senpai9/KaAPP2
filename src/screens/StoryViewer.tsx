import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function StoryViewer({ route, navigation }: any) {
  const { user } = route.params || {};
  return (
    <View style={styles.root}>
      <Image source={{ uri: user?.avatar }} style={styles.bg} blurRadius={20} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8 }}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.user}>{user?.name}</Text>
      </View>
      <View style={styles.center}>
        <Text style={styles.text}>Story de {user?.name}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  bg: { ...StyleSheet.absoluteFillObject, opacity: 0.35 },
  header: { marginTop: 42, flexDirection: 'row', alignItems: 'center' },
  user: { color: '#fff', fontWeight: '700', fontSize: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  text: { color: '#fff' },
});
