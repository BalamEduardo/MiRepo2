import React, { useRef, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePreventRemove } from '@react-navigation/native';
import AmountInput from '../components/AmountInput';
import AppButton from '../components/AppButton';
import { useSnapshots } from '../context/SnapshotContext';
import { CATEGORIES } from '../data/budget';
import { formatCentsForInput, formatMoney, formatShortDate, parseAmountToCents } from '../data/amounts';
import { getExpenseAmountError, spentCentsFor } from '../data/expenses';
import { palette } from '../theme';

const emptyDraft = () => ({ amount: '', category: 'otros', description: '' });
const categoryLabel = (key) => CATEGORIES.find((item) => item.key === key)?.label ?? 'Otros';

export default function ExpensesScreen({ navigation, route }) {
  const { snapshots, saveExpense, deleteExpense } = useSnapshots();
  const snapshot = snapshots.find((item) => item.id === route.params?.snapshotId);
  const active = snapshot?.id === snapshots[0]?.id;
  const [mode, setMode] = useState(route.params?.mode === 'new' ? 'form' : 'list');
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(emptyDraft);
  const original = useRef(JSON.stringify(emptyDraft()));
  const [amountError, setAmountError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const dirty = mode === 'form' && JSON.stringify(draft) !== original.current;

  usePreventRemove(busy || dirty, ({ data }) => {
    if (lock.current) return;
    Alert.alert('¿Descartar este gasto?', 'Los cambios sin guardar se perderán.', [
      { text: 'Seguir editando', style: 'cancel' },
      { text: 'Descartar', style: 'destructive', onPress: () => navigation.dispatch(data.action) },
    ]);
  });

  function openForm(expense = null) {
    const next = expense ? { amount: formatCentsForInput(expense.amountCents), category: expense.category,
      description: expense.description } : emptyDraft();
    original.current = JSON.stringify(next);
    setDraft(next); setEditingId(expense?.id ?? null); setAmountError(''); setSaveError(''); setMode('form');
  }

  function cancelForm() {
    if (lock.current) return;
    const cancel = () => { setMode('list'); setSaveError(''); };
    if (!dirty) return cancel();
    Alert.alert('¿Descartar cambios?', 'El gasto guardado se conservará.', [
      { text: 'Seguir editando', style: 'cancel' }, { text: 'Descartar', style: 'destructive', onPress: cancel },
    ]);
  }

  async function save() {
    if (lock.current) return;
    const error = getExpenseAmountError(draft.amount);
    setAmountError(error); setSaveError('');
    if (error) return;
    lock.current = true; setBusy(true);
    try {
      await saveExpense(snapshot.id, { id: editingId, amountCents: parseAmountToCents(draft.amount),
        category: draft.category, description: draft.description.trim() });
      original.current = JSON.stringify(draft);
      setMode('list');
    } catch (error) {
      setSaveError(error.message === 'Los gastos guardados no son válidos.' ? error.message : 'No se pudo guardar. Tu formulario se conserva; intenta otra vez.');
    } finally { lock.current = false; setBusy(false); }
  }

  function askDelete(expense) {
    if (lock.current) return;
    Alert.alert('¿Eliminar gasto?', `${categoryLabel(expense.category)} · ${formatMoney(expense.amountCents)}. Se recalculará solo este periodo.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        if (lock.current) return;
        lock.current = true; setBusy(true); setSaveError('');
        try { await deleteExpense(snapshot.id, expense.id); }
        catch { setSaveError('No se pudo eliminar. El gasto sigue guardado; intenta otra vez.'); }
        finally { lock.current = false; setBusy(false); }
      } },
    ]);
  }

  if (!snapshot) return <SafeAreaView style={styles.safe}><Text style={styles.title}>Corte no disponible</Text><AppButton title="Cerrar" onPress={() => navigation.goBack()} palette={palette} /></SafeAreaView>;
  const expenses = [...(snapshot.expenses ?? [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>{mode === 'list' ? 'Gastos del periodo' : editingId ? 'Editar gasto' : 'Registrar gasto'}</Text>
        <Pressable accessibilityRole="button" disabled={busy} onPress={() => { if (!lock.current) navigation.goBack(); }} style={styles.close} accessibilityLabel="Cerrar gastos"><Text style={styles.link}>Cerrar</Text></Pressable>
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {mode === 'form' ? (
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Text style={styles.note}>Desde el corte del {formatShortDate(snapshot.createdAt)}. Los saldos del corte se conservan.</Text>
            <AmountInput holding={{ label: 'Monto del gasto', symbol: 'cash' }} value={draft.amount} error={amountError} editable={!busy}
              onChangeText={(amount) => { setDraft((current) => ({ ...current, amount })); setAmountError(''); }} palette={palette} />
            <Text style={styles.label}>Categoría</Text>
            <View style={styles.categories}>{CATEGORIES.map(({ key, label }) => (
              <Pressable key={key} disabled={busy} accessibilityRole="button" accessibilityState={{ selected: draft.category === key, disabled: busy }}
                onPress={() => setDraft((current) => ({ ...current, category: key }))}
                style={[styles.chip, draft.category === key && styles.selected]}>
                <Text style={{ color: draft.category === key ? palette.tint : palette.text }}>{label}</Text>
              </Pressable>
            ))}</View>
            <Text style={styles.label}>Descripción · opcional</Text>
            <TextInput accessibilityLabel="Descripción opcional del gasto" value={draft.description} editable={!busy} maxLength={160}
              onChangeText={(description) => setDraft((current) => ({ ...current, description }))} placeholder="Ej. comida con amigos"
              placeholderTextColor={palette.placeholder} style={styles.input} />
            <Text style={styles.note}>{editingId ? 'Se conserva la fecha y hora originales.' : 'La fecha y hora se guardarán automáticamente.'} Puedes superar tu presupuesto.</Text>
            {saveError ? <Text accessibilityRole="alert" style={styles.error}>{saveError}</Text> : null}
            <AppButton title={busy ? 'Guardando…' : 'Guardar gasto'} onPress={save} disabled={busy} palette={palette} />
            <AppButton title="Cancelar" variant="secondary" onPress={cancelForm} disabled={busy} palette={palette} />
          </ScrollView>
        ) : (
          <FlatList data={expenses} keyExtractor={(item) => item.id} contentContainerStyle={styles.content}
            ListHeaderComponent={<View style={{ gap: 12 }}>
              <Text style={styles.note}>Corte del {formatShortDate(snapshot.createdAt)}</Text>
              <Text style={styles.total}>Gastado: {formatMoney(spentCentsFor(expenses))}</Text>
              {active ? <AppButton title="Registrar gasto" icon="plus" onPress={() => openForm()} disabled={busy} palette={palette} />
                : <Text style={styles.note}>Puedes corregir o eliminar gastos existentes de este periodo.</Text>}
              {saveError ? <Text accessibilityRole="alert" style={styles.error}>{saveError}</Text> : null}
            </View>}
            ListEmptyComponent={<Text style={[styles.note, { marginTop: 24 }]}>Aún no hay gastos anotados en este periodo.</Text>}
            renderItem={({ item }) => <View style={styles.row}>
              <View style={styles.rowHeading}><Text style={styles.label}>{categoryLabel(item.category)}</Text><Text style={styles.amount}>{formatMoney(item.amountCents)}</Text></View>
              {item.description ? <Text style={styles.description}>{item.description}</Text> : null}
              <Text style={styles.note}>{new Date(item.createdAt).toLocaleString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</Text>
              <View style={styles.rowActions}>
                <Pressable disabled={busy} accessibilityRole="button" accessibilityLabel={`Editar gasto de ${categoryLabel(item.category)}, ${formatMoney(item.amountCents)}`} style={styles.action} onPress={() => openForm(item)}><Text style={styles.link}>Editar</Text></Pressable>
                <Pressable disabled={busy} accessibilityRole="button" accessibilityLabel={`Eliminar gasto de ${categoryLabel(item.category)}, ${formatMoney(item.amountCents)}`} style={styles.action} onPress={() => askDelete(item)}><Text style={styles.error}>Eliminar</Text></Pressable>
              </View>
            </View>} />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.background },
  header: { paddingHorizontal: 24, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: palette.separator },
  title: { flex: 1, fontSize: 22, fontWeight: '600', color: palette.text },
  close: { minHeight: 44, justifyContent: 'center' },
  content: { padding: 24, gap: 16, paddingBottom: 36 },
  note: { color: palette.secondary, fontSize: 13, lineHeight: 20 },
  label: { color: palette.text, fontSize: 16, fontWeight: '600' },
  total: { color: palette.text, fontSize: 24, fontWeight: '600', fontVariant: ['tabular-nums'] },
  categories: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 44, paddingHorizontal: 16, justifyContent: 'center', borderRadius: 12, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.separator },
  selected: { backgroundColor: palette.tintSoft, borderColor: palette.tint },
  input: { minHeight: 52, color: palette.text, fontSize: 16, padding: 14, backgroundColor: palette.field, borderRadius: 14, borderWidth: 1, borderColor: palette.separator },
  error: { color: palette.negative, fontSize: 15, lineHeight: 22 },
  link: { color: palette.tint, fontSize: 15, fontWeight: '600' },
  row: { paddingTop: 16, paddingBottom: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: palette.separator, gap: 5 },
  rowHeading: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 },
  amount: { color: palette.text, fontSize: 17, fontWeight: '600', fontVariant: ['tabular-nums'] },
  description: { color: palette.text, fontSize: 15, lineHeight: 22 },
  rowActions: { flexDirection: 'row', gap: 24 },
  action: { minHeight: 44, justifyContent: 'center' },
});
