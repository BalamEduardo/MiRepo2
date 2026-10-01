import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppIcon from './AppIcon';

function GuideRow({ title, children }) {
  return <View style={styles.row}><Text style={styles.rowTitle}>{title}</Text><Text style={styles.copy}>{children}</Text></View>;
}

export default function BudgetHelpSheet({ visible, onClose }) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.title}>Cómo leer tu presupuesto</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Cerrar ayuda del presupuesto" onPress={onClose} style={styles.close}>
            <AppIcon name="close" color="#0066CC" size={21} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.intro}>El presupuesto es un plan semanal. Tus saldos guardados se conservan como los capturaste.</Text>
          <GuideRow title="Gastado">Suma los gastos que anotaste después de este corte.</GuideRow>
          <GuideRow title="Presupuesto restante">Es el presupuesto menos lo gastado. Nunca baja de cero; si gastas más, verás el exceso.</GuideRow>
          <GuideRow title="Total estimado actual">Resta los gastos anotados al total original del corte.</GuideRow>
          <GuideRow title="Total previsto">Resta al total estimado solo el presupuesto que aún queda por gastar. Los gastos realizados se descuentan una sola vez.</GuideRow>
          <View style={styles.note}><AppIcon name="calendar" color="#0066CC" size={20} /><Text style={styles.noteText}>Al guardar otro corte, actualiza tus saldos reales. Ese periodo empieza sin gastos nuevos.</Text></View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F5F7' },
  header: { minHeight: 60, paddingHorizontal: 22, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E0E0E0', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { flex: 1, color: '#1D1D1F', fontSize: 20, lineHeight: 26, fontWeight: '700' },
  close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 24, paddingBottom: 40 },
  intro: { color: '#5E6472', fontSize: 16, lineHeight: 24, marginBottom: 18 },
  row: { paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E0E0E0', gap: 6 },
  rowTitle: { color: '#1D1D1F', fontSize: 17, lineHeight: 23, fontWeight: '600' },
  copy: { color: '#5E6472', fontSize: 15, lineHeight: 22 },
  note: { marginTop: 22, padding: 16, backgroundColor: '#EAF3FF', borderRadius: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  noteText: { flex: 1, color: '#1D1D1F', fontSize: 14, lineHeight: 21 },
});
