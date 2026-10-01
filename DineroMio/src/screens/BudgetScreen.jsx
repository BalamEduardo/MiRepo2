import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppIcon from '../components/AppIcon';
import AppButton from '../components/AppButton';
import BudgetHelpSheet from '../components/BudgetHelpSheet';
import BudgetSummary from '../components/BudgetSummary';
import { useSnapshots } from '../context/SnapshotContext';
import { precedingSnapshot } from '../data/amounts';
import { palette, spacing } from '../theme';

export default function BudgetScreen({ navigation }) {
  const { snapshots } = useSnapshots();
  const snapshot = snapshots[0];
  const previous = snapshot ? precedingSnapshot(snapshots, snapshot.id) : null;
  const [helpVisible, setHelpVisible] = useState(false);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heading}>
          <View style={styles.headingCopy}>
            <Text style={styles.title}>Tu plan para esta semana</Text>
            <Text style={styles.subtitle}>Consulta gastos, presupuesto restante y proyección.</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Ayuda sobre el presupuesto" onPress={() => setHelpVisible(true)} style={styles.help}>
            <AppIcon name="help" color={palette.tint} size={23} />
          </Pressable>
        </View>
        {snapshot ? (
          <BudgetSummary
            snapshot={snapshot}
            previous={previous}
            palette={palette}
            showCategories
            expandedInitially
            onAdjustBudget={() => navigation.navigate('Corte', { snapshotId: snapshot.id, initialSection: 'budget' })}
          />
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Registra un corte semanal para empezar tu presupuesto.</Text>
            <AppButton title="Registrar primer corte" icon="plus" palette={palette}
              onPress={() => navigation.navigate('Corte', { mode: 'new', snapshotId: null })} />
          </View>
        )}
        <View style={[styles.explainer, { borderColor: palette.separator }]}>
          <AppIcon name="calendar" color={palette.tint} size={20} />
          <Text style={styles.explainerText}>El presupuesto guía tus gastos. El siguiente corte guarda los saldos reales y abre un periodo nuevo.</Text>
        </View>
      </ScrollView>
      <BudgetHelpSheet visible={helpVisible} onClose={() => setHelpVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.background },
  content: { paddingHorizontal: spacing.lg, paddingTop: 24, paddingBottom: 36 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headingCopy: { flex: 1, gap: 5 },
  title: { color: palette.text, fontSize: 25, lineHeight: 32, fontWeight: '700' },
  subtitle: { color: palette.secondary, fontSize: 15, lineHeight: 22 },
  help: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  empty: { marginTop: 24, gap: 18 },
  emptyText: { color: palette.secondary, fontSize: 16, lineHeight: 24 },
  explainer: { marginTop: 22, paddingTop: 16, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 10 },
  explainerText: { flex: 1, color: palette.secondary, fontSize: 14, lineHeight: 21 },
});
