import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import AppIcon from './AppIcon';
import { allocatedCentsFor, cashCentsFor, CATEGORIES } from '../data/budget';
import { formatMoney, formatShortDate, totalCentsFor } from '../data/amounts';

export default function BudgetSummary({ snapshot, previous = null, palette, showCategories = false }) {
  const [expanded, setExpanded] = useState(false);
  const cash = cashCentsFor(snapshot.values);
  const budget = snapshot.budget;
  const reserved = budget?.amountCents ?? 0;
  const adjustedTotal = totalCentsFor(snapshot.values) - reserved;
  const difference = previous ? adjustedTotal - totalCentsFor(previous.values) : null;
  const differenceColor = difference > 0 ? palette.positive : (difference < 0 ? palette.negative : palette.secondary);
  const assignedCategories = CATEGORIES.filter(({ key }) => budget?.categories?.[key] > 0);

  return (
    <View style={styles.section}>
      <Text style={[styles.title, { color: palette.text }]}>Gastos de la semana</Text>
      <View style={styles.totalRow}>
        <Text style={[styles.totalLabel, { color: palette.secondary }]}>Total después de apartar</Text>
        <Text style={[styles.total, { color: palette.text }]}>{formatMoney(adjustedTotal)}</Text>
      </View>
      <Text style={[styles.comparison, { color: differenceColor }]}>
        {difference === null
          ? 'Este es tu primer corte. Aún no hay comparación.'
          : (difference === 0
            ? 'Después de gastos, quedarías con el mismo total que en el corte anterior.'
            : `Después de gastos, tendrías ${formatMoney(Math.abs(difference))} ${difference > 0 ? 'más' : 'menos'} que en el corte anterior.`)}
      </Text>
      {previous ? (
        <Text style={[styles.note, { color: palette.secondary }]}>
          Comparado con el total registrado el {formatShortDate(previous.createdAt)}.
        </Text>
      ) : null}

      <View style={[styles.accounts, { borderTopColor: palette.separator }]}>
        <Text style={[styles.explanation, { color: palette.secondary }]}>
          De tus <Text style={[styles.emphasis, { color: palette.text }]}>{formatMoney(cash)}</Text> en cuentas,
          apartas <Text style={[styles.emphasis, { color: palette.text }]}>{formatMoney(reserved)}</Text> para gastos y
          quedan <Text style={[styles.emphasis, { color: palette.text }]}>{formatMoney(cash - reserved)}</Text> en cuentas.
        </Text>
        <Text style={[styles.note, { color: palette.secondary }]}>
          El total de arriba incluye inversiones. Los gastos son una previsión.
        </Text>
        {!budget ? <Text style={[styles.note, { color: palette.secondary }]}>Todavía no has definido un presupuesto.</Text> : null}
      </View>

      {showCategories && budget?.categories ? (
        <>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded }}
            accessibilityLabel={expanded ? 'Ocultar reparto del presupuesto' : 'Ver reparto del presupuesto'}
            onPress={() => setExpanded((current) => !current)}
            style={({ pressed }) => [styles.disclosure, pressed && styles.pressed]}
          >
            <Text style={[styles.disclosureLabel, { color: palette.tint }]}>{expanded ? 'Ocultar reparto' : 'Ver reparto'}</Text>
            <AppIcon name="chevron" color={palette.tint} size={16} style={expanded ? styles.chevronUp : undefined} />
          </Pressable>
          {expanded ? (
            <View style={styles.distribution}>
              <View style={styles.categoryGrid}>
                {assignedCategories.map(({ key, label }) => (
                  <View key={key} style={styles.category}>
                    <Text style={[styles.note, { color: palette.secondary }]}>{label}</Text>
                    <Text style={[styles.categoryAmount, { color: palette.text }]}>{formatMoney(budget.categories[key])}</Text>
                  </View>
                ))}
              </View>
              <Text style={[styles.note, { color: palette.secondary }]}>
                Falta asignar: {formatMoney(reserved - allocatedCentsFor(budget))}
              </Text>
            </View>
          ) : null}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 24 },
  title: { fontSize: 20, lineHeight: 26, fontWeight: '600', marginBottom: 16 },
  totalRow: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', columnGap: 12, rowGap: 4 },
  totalLabel: { flexGrow: 1, fontSize: 15, lineHeight: 21 },
  total: { fontSize: 24, lineHeight: 31, fontWeight: '600', fontVariant: ['tabular-nums'] },
  comparison: { marginTop: 8, fontSize: 15, lineHeight: 22, fontWeight: '500' },
  note: { fontSize: 13, lineHeight: 19, marginTop: 4 },
  accounts: { marginTop: 16, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth, gap: 4 },
  explanation: { fontSize: 15, lineHeight: 23 },
  emphasis: { fontWeight: '600', fontVariant: ['tabular-nums'] },
  disclosure: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  disclosureLabel: { fontSize: 15, lineHeight: 21, fontWeight: '600' },
  pressed: { opacity: 0.65 },
  chevronUp: { transform: [{ rotate: '180deg' }] },
  distribution: { gap: 8, paddingBottom: 6 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  category: { width: '46%', gap: 2 },
  categoryAmount: { fontSize: 15, lineHeight: 21, fontWeight: '600', fontVariant: ['tabular-nums'] },
});
