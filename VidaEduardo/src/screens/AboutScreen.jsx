import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "../theme/colors";

export default function AboutScreen() {
  return (
    <SafeAreaView edges={["left", "right", "bottom"]} style={styles.safeArea}>
      <View style={styles.content}>
        <View style={styles.logoCircle}>
          <Text style={styles.logo}>✦</Text>
        </View>
        <Text style={styles.title}>VidaEduardo</Text>
        <Text style={styles.subtitle}>Juegos, salud y organización en una sola app.</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Acerca de esta versión</Text>
          <Text style={styles.cardText}>
            Esta aplicación está pensada para usarse desde Expo Go. Los juegos, el cálculo y la
            lista funcionan de forma local y la lista se reinicia al cerrar la aplicación.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    alignItems: "center",
    padding: 24,
  },
  logoCircle: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: 42,
    height: 84,
    justifyContent: "center",
    marginBottom: 16,
    width: 84,
  },
  logo: {
    color: colors.primary,
    fontSize: 48,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "900",
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
  card: {
    alignSelf: "stretch",
    backgroundColor: colors.surface,
    borderRadius: 18,
    marginTop: 30,
    padding: 20,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 8,
  },
  cardText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
});
