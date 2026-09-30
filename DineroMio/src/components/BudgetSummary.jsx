import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import AppButton from './AppButton';
import AppIcon from './AppIcon';
import { allocatedCentsFor, cashCentsFor, CATEGORIES } from '../data/budget';
import { formatMoney, formatShortDate, totalCentsFor } from '../data/amounts';
import { expenseSummaryFor } from '../data/expenses';

export default function BudgetSummary({ snapshot, previous = null, palette, showCategories = false, historical = false, onAdjustBudget }) {
  const [expanded, setExpanded] = useState(false);
  const budget = snapshot.budget;
  const { spent, remaining, estimated, projected, overspent } = expenseSummaryFor(snapshot);
  const difference = previous ? projected - totalCentsFor(previous.values) : null;
  const assigned = CATEGORIES.filter(({ key }) => budget?.categories?.[key] > 0);
  return (
    <View style={styles.section}>
      <Text style={[styles.title, { color: palette.text }]}>{historical ? 'Estimación del periodo' : 'Total estimado actual'}</Text>
      <Text style={[styles.total, { color: palette.text }]}>{formatMoney(estimated)}</Text>
      <Text style={[styles.note, { color: palette.secondary }]}>Según los gastos anotados. Incluye inversiones.</Text>
      <View style={styles.pair}>
        <View style={styles.cell}><Text style={[styles.note, { color: palette.secondary }]}>Gastado</Text><Text style={[styles.amount, { color: palette.text }]}>{formatMoney(spent)}</Text></View>
        <View style={styles.cell}><Text style={[styles.note, { color: palette.secondary }]}>Presupuesto restante</Text><Text style={[styles.amount, { color: palette.text }]}>{budget ? formatMoney(remaining) : 'Sin presupuesto'}</Text></View>
      </View>
      {overspent > 0 ? <Text style={[styles.note, { color: palette.negative }]}>Superaste tu presupuesto por {formatMoney(overspent)}.</Text> : null}
      <Pressable accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => setExpanded((value) => !value)} style={styles.disclosure}>
        <Text style={[styles.link, { color: palette.tint }]}>{expanded ? 'Ocultar presupuesto' : 'Ver presupuesto'}</Text>
        <AppIcon name="chevron" color={palette.tint} size={16} style={expanded ? { transform: [{ rotate: '180deg' }] } : undefined} />
      </Pressable>
      {expanded ? <View style={[styles.details, { borderColor: palette.separator }]}>
        <Text style={[styles.note, { color: palette.secondary }]}>Total original del corte: {formatMoney(totalCentsFor(snapshot.values))}</Text>
        <Text style={[styles.note, { color: palette.secondary }]}>Dinero en cuentas al guardar: {formatMoney(cashCentsFor(snapshot.values))}</Text>
        <Text style={[styles.note, { color: palette.secondary }]}>{budget ? `Planeado para gastos: ${formatMoney(budget.amountCents)}` : 'No definiste un presupuesto. Puedes registrar gastos igualmente.'}</Text>
        <Text style={[styles.label, { color: palette.text }]}>Total previsto: {formatMoney(projected)}</Text>
        <Text style={[styles.note, { color: palette.secondary }]}>Después de gastar el presupuesto restante. Lo gastado se descuenta una sola vez.</Text>
        <Text style={[styles.note, { color: difference < 0 ? palette.negative : difference > 0 ? palette.positive : palette.secondary }]}>
          {difference === null ? 'Primer corte: aún no hay comparación.' : difference === 0 ? 'El total previsto coincide con el corte anterior.'
            : `Tendrías ${formatMoney(Math.abs(difference))} ${difference > 0 ? 'más' : 'menos'} que el total original del corte anterior.`}
        </Text>
        {previous ? <Text style={[styles.note, { color: palette.secondary }]}>Comparado con el corte del {formatShortDate(previous.createdAt)}.</Text> : null}
        {showCategories && budget?.categories ? <>
          <Text style={[styles.label, { color: palette.text }]}>Reparto planeado</Text>
          <View style={styles.grid}>{assigned.map(({ key, label }) => <View key={key} style={styles.cell}>
            <Text style={[styles.note, { color: palette.secondary }]}>{label}</Text>
            <Text style={[styles.amount, { color: palette.text }]}>{formatMoney(budget.categories[key])}</Text>
          </View>)}</View>
          <Text style={[styles.note, { color: palette.secondary }]}>Falta asignar: {formatMoney(budget.amountCents - allocatedCentsFor(budget))}</Text>
        </> : null}
        {onAdjustBudget ? <AppButton title="Ajustar presupuesto" icon="edit" variant="secondary" palette={palette} onPress={onAdjustBudget} style={{ marginTop: 12 }} /> : null}
      </View> : null}
    </View>
  );
}
const styles = StyleSheet.create({
  section: { marginTop: 24 },
  title: { fontSize: 20, lineHeight: 27, fontWeight: '600' },
  total: { fontSize: 34, lineHeight: 42, fontWeight: '600', fontVariant: ['tabular-nums'], marginTop: 6 },
  note: { fontSize: 13, lineHeight: 20, marginTop: 4 },
  pair: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 16 },
  cell: { flexGrow: 1, flexBasis: '42%', gap: 4 },
  amount: { fontSize: 17, lineHeight: 24, fontWeight: '600', fontVariant: ['tabular-nums'] },
  disclosure: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  link: { fontSize: 15, fontWeight: '600' },
  details: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 12, gap: 5 },
  label: { fontSize: 16, lineHeight: 23, fontWeight: '600', marginTop: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
});
