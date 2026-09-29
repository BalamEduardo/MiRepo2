import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import AppButton from '../components/AppButton';
import { colors } from '../theme';

export default function HomeScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brandRow}>
          <View style={styles.brandIcon}>
            <Ionicons name="calculator-outline" size={22} color={colors.greenDark} />
          </View>
          <Text style={styles.brand}>Ganancia Fácil</Text>
        </View>

        <View style={styles.hero}>
          <View style={styles.badge}>
            <Ionicons name="sparkles" size={16} color={colors.orangeDark} />
            <Text style={styles.badgeText}>Cuentas claras para tu negocio</Text>
          </View>

          <Text style={styles.title}>Descubre cuánto ganas por cada venta</Text>
          <Text style={styles.subtitle}>
            Escribe tu costo y precio de venta. En segundos sabrás si tienes ganancia,
            equilibrio o pérdida.
          </Text>

          <View style={styles.heroImageFrame}>
            <Image
              source={require('../../assets/ganancia-facil-icon.png')}
              style={styles.heroImage}
              resizeMode="contain"
              accessible
              accessibilityLabel="Tienda con una moneda de peso y una flecha de crecimiento"
            />
          </View>
        </View>

        <View style={styles.actionCard}>
          <View style={styles.actionCopy}>
            <Text style={styles.actionTitle}>Calcula una venta</Text>
            <Text style={styles.actionText}>Sólo necesitas dos cantidades en pesos mexicanos.</Text>
          </View>
          <AppButton
            title="Abrir calculadora"
            icon="arrow-forward"
            onPress={() => navigation.navigate('Calculadora')}
            accessibilityLabel="Abrir la calculadora de ganancia"
          />
        </View>
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
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 28,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.greenDark,
  },
  hero: {
    alignItems: 'center',
    marginTop: 30,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: colors.orangeSoft,
  },
  badgeText: {
    color: colors.orangeDark,
    fontSize: 13,
    fontWeight: '700',
  },
  title: {
    marginTop: 18,
    color: colors.text,
    fontSize: 34,
    lineHeight: 39,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 14,
    maxWidth: 520,
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  heroImageFrame: {
    width: '72%',
    maxWidth: 280,
    aspectRatio: 1,
    marginTop: 18,
    borderRadius: 32,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  actionCard: {
    marginTop: 24,
    padding: 18,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 18,
    shadowColor: '#5B4630',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  actionCopy: {
    gap: 5,
  },
  actionTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '800',
  },
  actionText: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
});
