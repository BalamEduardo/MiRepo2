import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "../theme/colors";

export default function FeatureCard({ icon, title, description, color, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { borderLeftColor: color },
        pressed && styles.cardPressed,
      ]}
    >
      <View style={[styles.iconContainer, { borderColor: color }]}>
        <Text style={styles.icon}>{icon}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>

      <Text style={[styles.arrow, { color }]}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderLeftWidth: 4,
    borderRadius: 18,
    flexDirection: "row",
    marginBottom: 12,
    padding: 16,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.985 }],
  },
  iconContainer: {
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    height: 52,
    justifyContent: "center",
    marginRight: 14,
    width: 52,
  },
  icon: {
    fontSize: 25,
  },
  content: {
    flex: 1,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 4,
  },
  description: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  arrow: {
    fontSize: 30,
    fontWeight: "300",
    marginLeft: 8,
  },
});
