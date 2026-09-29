import React, { useEffect, useMemo, useRef } from 'react';
import {
  AccessibilityInfo,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import AppButton from '../components/AppButton';
import { colors } from '../theme';

function readCents(value) {
  const cents = typeof value === 'number'
    ? value
    : Number(String(value ?? '').trim());

  return Number.isSafeInteger(cents) && cents > 0 ? cents : Number.NaN;
}

function formatMoney(cents) {
  const absoluteCents = Math.abs(cents);
  const pesos = Math.floor(absoluteCents / 100);
  const remainingCents = String(absoluteCents % 100).padStart(2, '0');

  return `$${pesos}.${remainingCents} MXN`;
}

export default function ResultScreen({ navigation, route }) {
  const costCents = readCents(route?.params?.costCents);
  const priceCents = readCents(route?.params?.priceCents);
  const isValid = Number.isFinite(costCents) && Number.isFinite(priceCents);
  const entrance = useRef(new Animated.Value(0)).current;

  const result = useMemo(() => {
    if (!isValid) {
      return null;
    }

    const differenceCents = priceCents - costCents;

    if (differenceCents > 0) {
      return {
        differenceCents,
        title: 'Ganancia',
        message: 'Ganas esta cantidad por cada unidad vendida.',
        icon: 'trending-up',
        color: colors.greenDark,
        softColor: colors.greenSoft,
      };
    }

    if (differenceCents < 0) {
      return {
        differenceCents,
        title: 'Pérdida',
        message: 'Pierdes esta cantidad por cada unidad vendida.',
        icon: 'trending-down',
        color: colors.danger,
        softColor: colors.dangerSoft,
      };
    }

    return {
      differenceCents,
      title: 'Punto de equilibrio',
      message: 'Recuperas el costo, pero no obtienes ganancia.',
      icon: 'remove',
      color: colors.orangeDark,
      softColor: colors.orangeSoft,
    };
  }, [costCents, isValid, priceCents]);

  useEffect(() => {
    let mounted = true;

    AccessibilityInfo.isReduceMotionEnabled()
      .then((reduceMotion) => {
        if (!mounted) {
          return;
        }

        Animated.timing(entrance, {
          toValue: 1,
          duration: reduceMotion ? 0 : 450,
          useNativeDriver: true,
        }).start();
      })
      .catch(() => {
        Animated.timing(entrance, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }).start();
      });

    return () => {
      mounted = false;
      entrance.stopAnimation();
    };
  }, [entrance]);

  const goBackToCalculator = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Calculadora');
    }
  };

  const animatedStyle = {
    opacity: entrance,
    transform: [
      {
        translateY: entrance.interpolate({
          inputRange: [0, 1],
          outputRange: [18, 0],
        }),
      },
      {
        scale: entrance.interpolate({
          inputRange: [0, 1],
          outputRange: [0.97, 1],
        }),
      },
    ],
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.resultContent, animatedStyle]}>
          {result ? (
            <>
              <View style={[styles.statusIcon, { backgroundColor: result.softColor }]}>
                <Ionicons name={result.icon} size={40} color={result.color} />
              </View>

              <Text style={[styles.statusTitle, { color: result.color }]}>{result.title}</Text>
              <Text style={styles.amount} accessibilityLabel={`${result.title}: ${formatMoney(result.differenceCents)}`}>
                {formatMoney(result.differenceCents)}
              </Text>
              <Text style={styles.message}>{result.message}</Text>

              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Resumen de la venta</Text>
                <View style={styles.summaryRow}>
                  <View style={styles.summaryLabelRow}>
                    <Ionicons name="cube-outline" size={19} color={colors.textMuted} />
                    <Text style={styles.summaryLabel}>Costo unitario</Text>
                  </View>
                  <Text style={styles.summaryValue}>{formatMoney(costCents)}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.summaryRow}>
                  <View style={styles.summaryLabelRow}>
                    <Ionicons name="pricetag-outline" size={19} color={colors.textMuted} />
                    <Text style={styles.summaryLabel}>Precio de venta</Text>
                  </View>
                  <Text style={styles.summaryValue}>{formatMoney(priceCents)}</Text>
                </View>
              </View>
            </>
          ) : (
            <View style={styles.invalidCard}>
              <View style={[styles.statusIcon, { backgroundColor: colors.dangerSoft }]}>
                <Ionicons name="alert-circle-outline" size={40} color={colors.danger} />
              </View>
              <Text style={styles.invalidTitle}>Datos no válidos</Text>
              <Text style={styles.message}>
                Regresa a la calculadora y escribe un costo y un precio mayores que cero.
              </Text>
            </View>
          )}

          <View style={styles.actions}>
            <AppButton
              title="Volver a calcular"
              icon="calculator-outline"
              onPress={goBackToCalculator}
            />
            <AppButton
              title="Ir al inicio"
              icon="home-outline"
              variant="secondary"
              onPress={() => navigation.navigate('Inicio')}
            />
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 34,
    justifyContent: 'center',
  },
  resultContent: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    alignItems: 'center',
  },
  statusIcon: {
    width: 78,
    height: 78,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusTitle: {
    marginTop: 18,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
    textAlign: 'center',
  },
  amount: {
    marginTop: 7,
    color: colors.text,
    fontSize: 38,
    lineHeight: 46,
    fontWeight: '800',
    textAlign: 'center',
  },
  message: {
    marginTop: 10,
    maxWidth: 380,
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  summaryCard: {
    width: '100%',
    marginTop: 28,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    shadowColor: '#5B4630',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 3,
  },
  summaryTitle: {
    marginBottom: 17,
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  summaryLabelRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  summaryLabel: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 15,
  },
  summaryValue: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'right',
  },
  divider: {
    height: 1,
    marginVertical: 15,
    backgroundColor: colors.border,
  },
  invalidCard: {
    width: '100%',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
  },
  invalidTitle: {
    marginTop: 16,
    color: colors.danger,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  actions: {
    width: '100%',
    marginTop: 24,
    gap: 12,
  },
});
