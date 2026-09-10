import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import FeatureCard from "../components/FeatureCard";
import { colors } from "../theme/colors";

export default function HomeScreen({ navigation }) {
  return (
    <SafeAreaView edges={["left", "right", "bottom"]} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.greeting}>
          <Text style={styles.eyebrow}>MI ESPACIO PERSONAL</Text>
          <Text style={styles.title}>Hola, Eduardo</Text>
          <Text style={styles.subtitle}>Un pequeño lugar para jugar, cuidarte y organizarte.</Text>
        </View>

        <View style={styles.hero}>
          <View style={styles.heroCopy}>
            <Text style={styles.heroEyebrow}>HOY ES UN BUEN DÍA</Text>
            <Text style={styles.heroTitle}>Haz algo que te haga bien.</Text>
            <Text style={styles.heroText}>Tus herramientas están listas cuando las necesites.</Text>
          </View>
          <Text style={styles.heroDecoration}>✦</Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Todo en un lugar</Text>
          <Text style={styles.sectionCount}>4 herramientas</Text>
        </View>

        <FeatureCard
          color={colors.primary}
          description="Un clásico rápido para dos jugadores."
          icon="✕"
          title="Tic Tac Toe"
          onPress={() => navigation.navigate("Tic Tac Toe")}
        />
        <FeatureCard
          color="#EC4899"
          description="Encuentra todas las parejas y ejercita la memoria."
          icon="◆"
          title="Memorama"
          onPress={() => navigation.navigate("Memorama")}
        />
        <FeatureCard
          color={colors.success}
          description="Conoce tu índice de masa corporal en segundos."
          icon="♡"
          title="Calcular IMC"
          onPress={() => navigation.navigate("IMC")}
        />
        <FeatureCard
          color={colors.orange}
          description="Anota lo que necesitas y márcalo al comprar."
          icon="✓"
          title="Lista del súper"
          onPress={() => navigation.navigate("Súper")}
        />

        <View style={styles.tip}>
          <Text style={styles.tipIcon}>☼</Text>
          <View style={styles.tipCopy}>
            <Text style={styles.tipTitle}>Todo se queda en tu teléfono</Text>
            <Text style={styles.tipText}>La lista y los juegos funcionan sin cuentas ni conexión.</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 30,
  },
  greeting: {
    marginBottom: 18,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.4,
    marginBottom: 7,
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 6,
  },
  hero: {
    backgroundColor: colors.primary,
    borderRadius: 22,
    flexDirection: "row",
    marginBottom: 27,
    minHeight: 142,
    overflow: "hidden",
    padding: 20,
  },
  heroCopy: {
    flex: 1,
    paddingRight: 12,
  },
  heroEyebrow: {
    color: "#C7D2FE",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  heroTitle: {
    color: colors.white,
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 27,
  },
  heroText: {
    color: "#E0E7FF",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 8,
  },
  heroDecoration: {
    alignSelf: "center",
    color: "#C7D2FE",
    fontSize: 66,
    opacity: 0.75,
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
  },
  sectionCount: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  tip: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: 18,
    flexDirection: "row",
    marginTop: 8,
    padding: 15,
  },
  tipIcon: {
    color: colors.primary,
    fontSize: 25,
    marginRight: 12,
  },
  tipCopy: {
    flex: 1,
  },
  tipTitle: {
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: "900",
    marginBottom: 3,
  },
  tipText: {
    color: "#4338CA",
    fontSize: 12,
    lineHeight: 17,
  },
});
