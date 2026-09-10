import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { calculateImc, classifyImc } from "../utils/imc";
import { colors } from "../theme/colors";

export default function ImcScreen() {
  const [peso, setPeso] = useState("");
  const [altura, setAltura] = useState("");
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState("");
  const clasificacion = resultado === null ? null : classifyImc(resultado);

  const calcular = () => {
    const imc = calculateImc(peso, altura);

    if (imc === null) {
      setResultado(null);
      setError("Escribe un peso y una altura mayores que cero.");
      return;
    }

    setResultado(imc);
    setError("");
  };

  const limpiar = () => {
    setPeso("");
    setAltura("");
    setResultado(null);
    setError("");
  };

  return (
    <SafeAreaView edges={["left", "right", "bottom"]} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.eyebrow}>SALUD PERSONAL</Text>
        <Text style={styles.title}>Calcular IMC</Text>
        <Text style={styles.subtitle}>Una referencia rápida usando tu peso y estatura.</Text>

        <View style={styles.formCard}>
          <Text style={styles.label}>Peso</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              keyboardType="decimal-pad"
              onChangeText={setPeso}
              placeholder="70"
              placeholderTextColor="#94A3B8"
              style={styles.input}
              value={peso}
            />
            <Text style={styles.unit}>kg</Text>
          </View>

          <Text style={styles.label}>Altura</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              keyboardType="decimal-pad"
              onChangeText={setAltura}
              placeholder="175"
              placeholderTextColor="#94A3B8"
              style={styles.input}
              value={altura}
            />
            <Text style={styles.unit}>cm</Text>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            accessibilityRole="button"
            onPress={calcular}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
          >
            <Text style={styles.primaryButtonText}>Calcular ahora</Text>
          </Pressable>
        </View>

        {resultado !== null && clasificacion ? (
          <View style={[styles.resultCard, { borderTopColor: clasificacion.color }]}>
            <Text style={styles.resultLabel}>TU RESULTADO</Text>
            <Text style={styles.resultValue}>{resultado.toFixed(1)}</Text>
            <Text style={[styles.resultCategory, { color: clasificacion.color }]}>{clasificacion.label}</Text>
            <Text style={styles.resultHint}>El IMC es una referencia general y no sustituye una valoración médica.</Text>
          </View>
        ) : null}

        <Pressable accessibilityRole="button" onPress={limpiar} style={styles.clearButton}>
          <Text style={styles.clearText}>Limpiar campos</Text>
        </Pressable>
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
    paddingBottom: 32,
  },
  eyebrow: {
    color: colors.success,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginTop: 8,
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "900",
    marginTop: 5,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    marginTop: 22,
    padding: 18,
  },
  label: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 7,
    marginTop: 4,
  },
  inputWrapper: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: 13,
    borderWidth: 1,
    flexDirection: "row",
    marginBottom: 14,
    paddingHorizontal: 13,
  },
  input: {
    color: colors.text,
    flex: 1,
    fontSize: 17,
    paddingVertical: 13,
  },
  unit: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "800",
  },
  error: {
    color: colors.danger,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 12,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: colors.success,
    borderRadius: 13,
    marginTop: 4,
    paddingVertical: 14,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "900",
  },
  buttonPressed: {
    opacity: 0.8,
  },
  resultCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderTopWidth: 5,
    marginTop: 15,
    padding: 20,
  },
  resultLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  resultValue: {
    color: colors.text,
    fontSize: 52,
    fontWeight: "900",
    marginTop: 2,
  },
  resultCategory: {
    fontSize: 16,
    fontWeight: "900",
    marginTop: -3,
  },
  resultHint: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 14,
  },
  clearButton: {
    alignSelf: "center",
    marginTop: 18,
    padding: 8,
  },
  clearText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "700",
  },
});
