import React, { useRef, useState } from 'react';
import { Alert, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppButton from '../components/AppButton';
import BudgetSummary from '../components/BudgetSummary';
import HoldingsGroup from '../components/HoldingsGroup';
import { useSnapshots } from '../context/SnapshotContext';
import { formatLongDate, formatMoney, precedingSnapshot, totalCentsFor } from '../data/amounts';
import { HOLDING_GROUPS } from '../data/holdings';
import { snapshotShareText } from '../data/shareSnapshot';
import { palette, spacing } from '../theme';

export default function SnapshotDetailScreen({ navigation, route }) {
  const { snapshots } = useSnapshots();
  const [isSharing, setIsSharing] = useState(false);
  const shareLock = useRef(false);
  const snapshot = snapshots.find((item) => item.id === route.params?.snapshotId);
  const previous = snapshot ? precedingSnapshot(snapshots, snapshot.id) : null;
  if (!snapshot) {
    return <SafeAreaView style={styles.safe}><Text style={styles.title}>No encontramos este corte.</Text></SafeAreaView>;
  }
  const total = totalCentsFor(snapshot.values);
  const shareCut = async () => {
    if (shareLock.current) return;
    shareLock.current = true;
    setIsSharing(true);
    try {
      await Share.share({ title: 'Corte semanal · DineroMio', message: snapshotShareText(snapshot) });
    } catch {
      Alert.alert('No se pudo compartir', 'El corte sigue guardado. Intenta compartirlo otra vez.');
    } finally {
      shareLock.current = false;
      setIsSharing(false);
    }
  };
  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.date}>{formatLongDate(snapshot.createdAt)}</Text>
        <Text style={styles.totalLabel}>Total original del corte</Text>
        <Text style={styles.total}>{formatMoney(total)}</Text>
        {HOLDING_GROUPS.map((group) => <HoldingsGroup key={group} group={group} values={snapshot.values} totalCents={total} palette={palette} />)}
        <BudgetSummary snapshot={snapshot} previous={previous} palette={palette} showCategories historical expandedInitially />
        <View style={styles.actions}>
          <AppButton title={isSharing ? 'Abriendo menú…' : 'Compartir corte'} icon="share" variant="secondary"
            palette={palette} disabled={isSharing} onPress={shareCut} />
          <AppButton title="Editar corte" icon="edit" variant="secondary" palette={palette}
            onPress={() => navigation.navigate('Corte', { snapshotId: snapshot.id, mode: 'edit' })} />
          <AppButton title="Ver gastos" icon="history" palette={palette}
            onPress={() => navigation.navigate('Gastos', { snapshotId: snapshot.id, mode: 'list' })} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.background },
  content: { paddingHorizontal: spacing.lg, paddingTop: 24, paddingBottom: 36 },
  title: { margin: 24, color: palette.text, fontSize: 20 },
  date: { color: palette.secondary, fontSize: 15, lineHeight: 21, textTransform: 'capitalize' },
  totalLabel: { marginTop: 16, color: palette.secondary, fontSize: 14, lineHeight: 20 },
  total: { marginBottom: 16, color: palette.text, fontSize: 28, lineHeight: 36, fontWeight: '700', fontVariant: ['tabular-nums'] },
  actions: { marginTop: 20, gap: 10 },
});
