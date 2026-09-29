import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import AppButton from './AppButton';

export function LoadingState({ palette, label = 'Cargando tus cortes' }) {
  return (
    <View style={styles.state}>
      <ActivityIndicator color={palette.tint} size="large" />
      <Text style={[styles.message, { color: palette.secondary }]}>{label}</Text>
    </View>
  );
}

export function StorageErrorState({ palette, onRetry }) {
  return (
    <View style={styles.errorState}>
      <Text style={[styles.title, { color: palette.text }]}>No pudimos abrir tu historial</Text>
      <Text style={[styles.message, { color: palette.secondary }]}>
        Tus cortes siguen en el dispositivo. Intenta leerlos de nuevo.
      </Text>
      <AppButton title="Reintentar" icon="retry" onPress={onRetry} palette={palette} />
    </View>
  );
}

const styles = StyleSheet.create({
  state: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    padding: 26,
  },
  errorState: {
    flex: 1,
    alignItems: 'stretch',
    justifyContent: 'center',
    gap: 14,
    padding: 24,
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
  },
  message: {
    fontSize: 16,
    lineHeight: 23,
    textAlign: 'center',
  },
});
