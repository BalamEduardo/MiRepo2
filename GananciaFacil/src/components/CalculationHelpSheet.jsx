import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppIcon from './AppIcon';
import { radii } from '../theme';

function Rule({ title, description, palette }) {
  return (
    <View style={[styles.rule, { borderBottomColor: palette.separator }]}>
      <Text style={[styles.ruleTitle, { color: palette.text }]}>{title}</Text>
      <Text style={[styles.ruleDescription, { color: palette.secondary }]}>{description}</Text>
    </View>
  );
}

export default function CalculationHelpSheet({ visible, onClose, palette }) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]}>
        <View style={[styles.header, { borderBottomColor: palette.separator }]}>
          <Text style={[styles.title, { color: palette.text }]}>Cómo se calcula</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cerrar explicación"
            hitSlop={8}
            onPress={onClose}
            style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
          >
            <AppIcon name="close" color={palette.tint} size={20} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <Text style={[styles.intro, { color: palette.secondary }]}>
            DineroMio guarda el valor que escribes cada semana. No conecta con tus cuentas ni consulta precios.
          </Text>
          <Rule
            title="Total del corte"
            description="Suma Santander, Nu, Openbank, el efectivo sin invertir en GBM, VTI, VXUS y BTC."
            palette={palette}
          />
          <Rule
            title="Distribución"
            description="Cada porcentaje compara una cuenta o posición con el total de ese corte."
            palette={palette}
          />
          <Rule
            title="Presupuesto semanal"
            description="Aparta un monto del dinero en Santander, Nu, Openbank y GBM sin invertir. Puedes repartirlo entre cinco categorías. Es un plan: los saldos reales se actualizan en tu próximo corte."
            palette={palette}
          />
          <Rule
            title="Variación"
            description="Resta el total del corte anterior al total actual. Los depósitos o retiros también pueden mover esta cifra."
            palette={palette}
          />
          <View style={[styles.note, { backgroundColor: palette.tintSoft }]}>
            <AppIcon name="calendar" color={palette.tint} size={20} />
            <Text style={[styles.noteText, { color: palette.text }]}>
              El historial se guarda localmente. DineroMio no tiene cuenta ni servicio de sincronización.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    minHeight: 58,
    paddingHorizontal: 22,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    flex: 1,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.55,
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 34,
  },
  intro: {
    marginBottom: 10,
    fontSize: 16,
    lineHeight: 24,
  },
  rule: {
    paddingVertical: 19,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 6,
  },
  ruleTitle: {
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '700',
  },
  ruleDescription: {
    fontSize: 15,
    lineHeight: 22,
  },
  note: {
    marginTop: 22,
    paddingHorizontal: 15,
    paddingVertical: 14,
    borderRadius: radii.control,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
});
