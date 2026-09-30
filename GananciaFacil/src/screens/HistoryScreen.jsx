import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppButton from '../components/AppButton';
import BudgetSummary from '../components/BudgetSummary';
import AppIcon from '../components/AppIcon';
import HoldingsGroup from '../components/HoldingsGroup';
import { LoadingState, StorageErrorState } from '../components/ScreenStates';
import {
  formatMoney,
  formatShortDate,
  precedingSnapshotsById,
  totalCentsFor,
} from '../data/amounts';
import { HOLDING_GROUPS } from '../data/holdings';
import { useSnapshots } from '../context/SnapshotContext';
import { palette, spacing } from '../theme';

function SnapshotEntry({ snapshot, previous, expanded, onToggle, onEdit, onDelete, palette, isFirst }) {
  const total = totalCentsFor(snapshot.values);
  const previousTotal = previous ? totalCentsFor(previous.values) : 0;
  const variation = previous ? total - previousTotal : null;
  const dateLabel = formatShortDate(snapshot.createdAt);
  const variationColor = variation > 0
    ? palette.positive
    : (variation < 0 ? palette.negative : palette.secondary);

  return (
    <View style={[
      styles.entry,
      isFirst && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.separator },
      { borderBottomColor: palette.separator },
    ]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${expanded ? 'Ocultar' : 'Ver'} detalles del corte del ${dateLabel}, total ${formatMoney(total)}`}
        accessibilityState={{ expanded }}
        onPress={onToggle}
        style={({ pressed }) => [styles.entryButton, pressed && styles.pressed]}
      >
        <View style={styles.entryHeading}>
          <View style={styles.entryTitleGroup}>
            <AppIcon name="calendar" size={18} color={palette.dateMark} />
            <Text style={[styles.entryDate, { color: palette.text }]}>{dateLabel}</Text>
          </View>
          <AppIcon
            name="chevron"
            size={17}
            color={palette.secondary}
            style={expanded ? styles.chevronUp : undefined}
          />
        </View>
        <View style={styles.entrySummary}>
          <Text style={[styles.entryTotal, { color: palette.text }]}>{formatMoney(total)}</Text>
          {variation === null ? (
            <Text style={[styles.entryVariation, { color: palette.secondary }]}>Primer corte</Text>
          ) : (
            <Text style={[styles.entryVariation, { color: variationColor }]}>
              {variation === 0 ? 'Sin cambio' : `${variation > 0 ? '+' : '−'}${formatMoney(Math.abs(variation))}`}
            </Text>
          )}
        </View>
        <Text style={[styles.entryHint, { color: palette.secondary }]}>Toca para ver los siete saldos</Text>
      </Pressable>

      {expanded ? (
        <View style={styles.details}>
          {HOLDING_GROUPS.map((group) => (
            <HoldingsGroup
              key={group}
              group={group}
              values={snapshot.values}
              totalCents={total}
              palette={palette}
            />
          ))}
          <BudgetSummary snapshot={snapshot} palette={palette} showCategories />
          <View style={styles.actions}>
            <AppButton
              title="Editar"
              accessibilityLabel={`Editar corte del ${dateLabel}`}
              icon="edit"
              variant="secondary"
              palette={palette}
              onPress={onEdit}
              style={styles.actionButton}
            />
            <AppButton
              title="Eliminar"
              accessibilityLabel={`Eliminar corte del ${dateLabel}`}
              icon="delete"
              variant="destructive"
              palette={palette}
              onPress={onDelete}
              style={styles.actionButton}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}

export default function HistoryScreen({ navigation }) {
  const { snapshots, isLoading, storageError, reload, deleteSnapshot } = useSnapshots();
  const [expandedId, setExpandedId] = useState('');
  const previousById = React.useMemo(() => precedingSnapshotsById(snapshots), [snapshots]);

  const askToDelete = (snapshot) => {
    const dateLabel = formatShortDate(snapshot.createdAt);

    Alert.alert(
      '¿Eliminar este corte?',
      `Se borrarán los saldos y el presupuesto del corte del ${dateLabel}. Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSnapshot(snapshot.id);
              setExpandedId('');
            } catch {
              Alert.alert('No se pudo eliminar', 'Tus datos siguen guardados. Intenta de nuevo.');
            }
          },
        },
      ],
    );
  };

  const openEdit = (snapshotId) => {
    navigation.navigate('Corte', { snapshotId, mode: 'edit' });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]} edges={['top']}>
        <LoadingState palette={palette} />
      </SafeAreaView>
    );
  }

  if (storageError) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]} edges={['top']}>
        <StorageErrorState palette={palette} onRetry={reload} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]} edges={['top']}>
      <FlatList
        data={snapshots}
        keyExtractor={(snapshot) => snapshot.id}
        extraData={expandedId}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={(
          <View>
            <Text style={[styles.title, { color: palette.text }]}>Historial de cortes</Text>
            <Text style={[styles.subtitle, { color: palette.secondary }]}>
              Cada fecha conserva sus saldos y su presupuesto.
            </Text>
          </View>
        )}
        ListEmptyComponent={(
          <View style={styles.emptyState}>
            <AppIcon name="calendar" size={34} color={palette.tint} />
            <Text style={[styles.emptyTitle, { color: palette.text }]}>Aún no hay semanas guardadas</Text>
            <Text style={[styles.emptyCopy, { color: palette.secondary }]}>
              Cuando registres tu primer corte, aparecerá aquí con su distribución completa.
            </Text>
            <AppButton
              title="Registrar primer corte"
              icon="plus"
              onPress={() => navigation.navigate('Corte', { mode: 'new', snapshotId: null })}
              palette={palette}
              style={styles.emptyAction}
            />
          </View>
        )}
        renderItem={({ item: snapshot, index }) => (
          <SnapshotEntry
            snapshot={snapshot}
            previous={previousById.get(snapshot.id)}
            expanded={expandedId === snapshot.id}
            onToggle={() => setExpandedId((current) => (
              current === snapshot.id ? '' : snapshot.id
            ))}
            onEdit={() => openEdit(snapshot.id)}
            onDelete={() => askToDelete(snapshot)}
            palette={palette}
            isFirst={index === 0}
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: 26,
    paddingBottom: 35,
  },
  title: {
    fontSize: 27,
    lineHeight: 34,
    fontWeight: '700',
    letterSpacing: -0.35,
  },
  subtitle: {
    marginTop: 7,
    marginBottom: 23,
    fontSize: 15,
    lineHeight: 22,
  },
  entry: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  entryButton: {
    minHeight: 92,
    paddingVertical: 14,
    gap: 7,
  },
  pressed: {
    opacity: 0.63,
  },
  entryHeading: {
    minHeight: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  entryTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  entryDate: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  chevronUp: {
    transform: [{ rotate: '180deg' }],
  },
  entrySummary: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 10,
  },
  entryTotal: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  entryVariation: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  entryHint: {
    fontSize: 12,
    lineHeight: 17,
  },
  details: {
    paddingTop: 5,
    paddingBottom: 17,
  },
  actions: {
    marginTop: 17,
    flexDirection: 'row',
    gap: 11,
  },
  actionButton: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 8,
  },
  emptyState: {
    flex: 1,
    minHeight: 390,
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 12,
  },
  emptyTitle: {
    marginTop: 7,
    fontSize: 21,
    lineHeight: 28,
    fontWeight: '700',
  },
  emptyCopy: {
    fontSize: 15,
    lineHeight: 23,
  },
  emptyAction: {
    width: '100%',
    marginTop: 7,
  },
});
