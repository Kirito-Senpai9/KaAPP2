import React from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GestureDetector, type PanGesture } from 'react-native-gesture-handler';

const { width } = Dimensions.get('window');

type KzonePlaceholderProps = {
  titlePan: PanGesture;
  topInset: number;
  onBack: () => void;
};

function KzonePlaceholder({ titlePan, topInset, onBack }: KzonePlaceholderProps) {
  return (
    <View style={styles.page}>
      <View style={[styles.topBar, { paddingTop: topInset }]}>
        <GestureDetector gesture={titlePan}>
          <View hitSlop={12} style={styles.logoHandle}>
            <Ionicons
              name="chevron-back"
              size={18}
              color="rgba(229,231,244,0.5)"
            />
            <Text style={styles.logo}>Kzone!</Text>
          </View>
        </GestureDetector>

        <View style={{ flex: 1 }} />

        <TouchableOpacity
          onPress={onBack}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Voltar para o feed KaChan!"
          style={styles.backPill}
        >
          <Ionicons name="chevron-back" size={15} color="#A6ADCE" />
          <Text style={styles.backPillText}>KaChan!</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        <Text style={styles.wordmark}>Kzone!</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>EM BREVE</Text>
        </View>
        <Text style={styles.subtitle}>
          Uma nova experiência de feed está chegando.
        </Text>
      </View>
    </View>
  );
}

export default KzonePlaceholder;

const styles = StyleSheet.create({
  page: { width, flex: 1 },
  topBar: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  logoHandle: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 8, paddingLeft: 8 },
  logo: { color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: 0.3 },
  backPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 6,
    paddingLeft: 6,
    paddingRight: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  backPillText: { color: '#A6ADCE', fontSize: 13, fontWeight: '700' },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 80,
    gap: 14,
  },
  wordmark: {
    color: '#fff',
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  badge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(108,99,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(108,99,255,0.5)',
  },
  badgeText: {
    color: '#B9B3FF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  subtitle: {
    color: '#A6ADCE',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 20,
  },
});
