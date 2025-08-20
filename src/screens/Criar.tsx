import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

export default function CreateScreen() {
  const OptionCard = ({ icon, title, subtitle, onPress }: any) => {
    const scale = new Animated.Value(1);

    const onPressIn = () => {
      Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();
    };
    const onPressOut = () => {
      Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }).start();
    };

    return (
      <Animated.View style={{ transform: [{ scale }] }}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={onPress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          style={styles.cardWrapper}
        >
          <LinearGradient
            colors={["#1E1F36", "#0E0E12"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.card}
          >
            <Ionicons name={icon} size={38} color="#DDE1FF" />
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.cardSubtitle}>{subtitle}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="arrow-back" size={26} color="#fff" />
        <Text style={styles.headerTitle}>Criar</Text>
        <Ionicons name="help-circle-outline" size={24} color="#fff" />
      </View>

      {/* Options */}
      <View style={styles.options}>
        <OptionCard
          icon="game-controller-outline"
          title="Live Streamer"
          subtitle="Transmita seus jogos ao vivo"
          onPress={() => {}}
        />
        <OptionCard
          icon="create-outline"
          title="Criar Postagem"
          subtitle="Compartilhe no feed"
          onPress={() => {}}
        />
        <OptionCard
          icon="film-outline"
          title="Criar Shorts"
          subtitle="Grave ou envie vídeos curtos"
          onPress={() => {}}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0E0E12", padding: 16 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },

  options: { marginTop: 20, gap: 18 },
  cardWrapper: { borderRadius: 16, overflow: "hidden" },
  card: {
    width: width - 32,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  cardTitle: { color: "#fff", fontSize: 16, fontWeight: "700", marginTop: 6 },
  cardSubtitle: { color: "#A6ADCE", fontSize: 13, textAlign: "center" },
});
