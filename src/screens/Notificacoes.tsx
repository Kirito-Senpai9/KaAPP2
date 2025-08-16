import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
export default function Notificacoes() {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>Notificações</Text>
      <Text style={styles.sub}>Avisos, menções e convites.</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0E0E12', alignItems: 'center', justifyContent: 'center' },
  title: { color: '#fff', fontSize: 22, fontWeight: '800' },
  sub: { color: '#A6ADCE', marginTop: 6 },
});
