import React from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import AmountInput from './AmountInput';
import { allocatedCentsFor, CATEGORIES, validateBudgetDraft } from '../data/budget';
import { formatMoney } from '../data/amounts';

export default function BudgetFields({ draft, onChange, cashCents, errors, editable, inputRefs, palette }) {
  const preview = validateBudgetDraft(draft, cashCents);
  const valid = !Object.keys(preview.errors).length;
  const setField = (key, value) => onChange({ ...draft, [key]: value });
  return (
    <View style={styles.section}>
      <View style={styles.toggleRow}>
        <Text style={[styles.title, { color: palette.text }]}>Apartar para gastos</Text>
        <Switch value={draft.enabled} onValueChange={(value) => setField('enabled', value)} disabled={!editable}
          trackColor={{ true: palette.tint }} accessibilityLabel="Apartar para gastos" />
      </View>
      <Text style={[styles.note, { color: palette.secondary }]}>Dinero en cuentas: {formatMoney(cashCents)}. Incluye bancos y GBM sin invertir.</Text>
      {draft.enabled ? (
        <>
          <AmountInput holding={{ label: 'Monto para esta semana', symbol: 'cash' }} value={draft.amount}
            onChangeText={(value) => setField('amount', value)} error={errors.budgetAmount} editable={editable}
            inputRef={(ref) => { inputRefs.current.budgetAmount = ref; }} palette={palette} />
          <View style={styles.toggleRow}>
            <Text style={[styles.label, { color: palette.text }]}>Repartir por categorías</Text>
            <Switch value={draft.distribute} onValueChange={(value) => setField('distribute', value)} disabled={!editable}
              trackColor={{ true: palette.tint }} accessibilityLabel="Repartir por categorías" />
          </View>
          {draft.distribute ? CATEGORIES.map(({ key, label }) => (
            <AmountInput key={key} holding={{ label, symbol: 'cash' }} value={draft.categories[key]}
              onChangeText={(value) => setField('categories', { ...draft.categories, [key]: value })}
              error={errors[key]} editable={editable}
              inputRef={(ref) => { inputRefs.current[key] = ref; }} palette={palette} />
          )) : null}
          {errors.distribution ? <Text accessibilityRole="alert" style={[styles.note, { color: palette.negative }]}>{errors.distribution}</Text> : null}
          {draft.distribute && valid ? (
            <Text style={[styles.note, { color: palette.secondary }]}>Falta asignar: {formatMoney(preview.budget.amountCents - allocatedCentsFor(preview.budget))}</Text>
          ) : null}
          <Text style={[styles.note, { color: palette.secondary }]}>Es un plan para la semana. Tus saldos registrados se conservan hasta el próximo corte.</Text>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 15 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, minHeight: 44 },
  title: { flex: 1, fontSize: 18, lineHeight: 24, fontWeight: '600' },
  label: { flex: 1, fontSize: 16, lineHeight: 22, fontWeight: '600' },
  note: { fontSize: 14, lineHeight: 20 },
});
