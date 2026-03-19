import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function LiveSetup() {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>Live Streamer</Text>
      <Text style={styles.sub}>Configuração de live em breve.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0E0E12', alignItems: 'center', justifyContent: 'center' },
  title: { color: '#fff', fontSize: 22, fontWeight: '800' },
  sub: { color: '#A6ADCE', marginTop: 6 },
});
