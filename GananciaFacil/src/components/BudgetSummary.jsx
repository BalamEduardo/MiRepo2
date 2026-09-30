import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { allocatedCentsFor, cashCentsFor, CATEGORIES } from '../data/budget';
import { formatMoney } from '../data/amounts';

export default function BudgetSummary({ snapshot, palette, showCategories = false }) {
  const cash = cashCentsFor(snapshot.values);
  const budget = snapshot.budget;
  const rows = [
    ['Dinero en cuentas', cash],
    ['Apartado para gastos', budget?.amountCents ?? 0],
    ['Sin apartar', cash - (budget?.amountCents ?? 0)],
  ];
  return (
    <View style={styles.section}>
      <Text style={[styles.title, { color: palette.text }]}>Gastos de la semana</Text>
      {rows.map(([label, amount]) => (
        <View key={label} style={styles.row}>
          <Text style={[styles.label, { color: palette.secondary }]}>{label}</Text>
          <Text style={[styles.amount, { color: palette.text }]}>{formatMoney(amount)}</Text>
        </View>
      ))}
      {!budget ? <Text style={[styles.note, { color: palette.secondary }]}>Sin presupuesto definido</Text> : null}
      {showCategories && budget?.categories ? (
        <View style={[styles.categories, { borderTopColor: palette.separator }]}>
          {CATEGORIES.map(({ key, label }) => (
            <View key={key} style={styles.row}>
              <Text style={[styles.label, { color: palette.secondary }]}>{label}</Text>
              <Text style={[styles.amount, { color: palette.text }]}>{formatMoney(budget.categories[key])}</Text>
            </View>
          ))}
          <Text style={[styles.note, { color: palette.secondary }]}>Falta asignar: {formatMoney(budget.amountCents - allocatedCentsFor(budget))}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 12, marginTop: 24 },
  title: { fontSize: 20, lineHeight: 26, fontWeight: '600', marginBottom: 3 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 },
  label: { flex: 1, fontSize: 15, lineHeight: 21 },
  amount: { fontSize: 15, lineHeight: 21, fontWeight: '600', fontVariant: ['tabular-nums'] },
  note: { fontSize: 13, lineHeight: 19 },
  categories: { gap: 10, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
});
