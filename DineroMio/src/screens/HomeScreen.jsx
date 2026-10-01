import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';

import AppButton from '../components/AppButton';
import BudgetSummary from '../components/BudgetSummary';
import AppIcon from '../components/AppIcon';
import CalculationHelpSheet from '../components/CalculationHelpSheet';
import HoldingsGroup from '../components/HoldingsGroup';
import { LoadingState, StorageErrorState } from '../components/ScreenStates';
import { formatLongDate, formatMoney, formatShortDate, precedingSnapshot, totalCentsFor } from '../data/amounts';
import { HOLDING_GROUPS } from '../data/holdings';
import { useSnapshots } from '../context/SnapshotContext';
import { palette, spacing } from '../theme';

function DateLine({ date, palette }) {
  return (
    <View style={styles.dateLine}>
      <View style={[styles.dateIcon, { backgroundColor: palette.dateMarkSoft }]}>
        <AppIcon name="calendar" size={18} color={palette.dateMark} />
      </View>
      <Text style={[styles.dateText, { color: palette.secondary }]}>{date}</Text>
    </View>
  );
}

export default function HomeScreen({ navigation }) {
  const { snapshots, isLoading, storageError, reload } = useSnapshots();
  const [helpVisible, setHelpVisible] = useState(false);
  const barProgress = useRef(new Animated.Value(1)).current;
  const isFocused = useIsFocused();
  const latest = snapshots[0];
  const latestTotal = latest ? totalCentsFor(latest.values) : 0;
  const previous = latest ? precedingSnapshot(snapshots, latest.id) : null;
  const previousTotal = previous ? totalCentsFor(previous.values) : 0;
  const variation = previous ? latestTotal - previousTotal : null;

  const latestRevision = latest
    ? `${latest.id}:${latest.updatedAt}`
    : 'empty';
  const hasLoaded = useRef(false);
  const previousRevision = useRef('');
  const animationPending = useRef(false);

  useEffect(() => {
    if (isLoading) {
      return undefined;
    }

    if (!hasLoaded.current) {
      hasLoaded.current = true;
      previousRevision.current = latestRevision;
      barProgress.setValue(1);
      return undefined;
    }

    if (previousRevision.current !== latestRevision) {
      previousRevision.current = latestRevision;
      animationPending.current = Boolean(latest);
    }

    if (!latest) {
      animationPending.current = false;
      barProgress.setValue(1);
      return undefined;
    }

    if (!isFocused || !animationPending.current) {
      return undefined;
    }

    animationPending.current = false;
    let active = true;
    let finished = false;

    AccessibilityInfo.isReduceMotionEnabled()
      .then((reduceMotion) => {
        if (!active) {
          animationPending.current = true;
          return;
        }

        if (reduceMotion) {
          barProgress.setValue(1);
          finished = true;
          return;
        }

        barProgress.setValue(0);
        Animated.timing(barProgress, {
          toValue: 1,
          duration: 480,
          easing: Easing.out(Easing.exp),
          useNativeDriver: false,
        }).start(({ finished: didFinish }) => {
          finished = didFinish;
          if (!didFinish) {
            animationPending.current = true;
          }
        });
      })
      .catch(() => {
        if (active) {
          barProgress.setValue(1);
          finished = true;
        }
      });

    return () => {
      active = false;
      barProgress.stopAnimation();
      if (!finished) {
        animationPending.current = true;
      }
    };
  }, [barProgress, isFocused, isLoading, latest, latestRevision]);

  const openNewCut = () => navigation.navigate('Corte', { mode: 'new', snapshotId: null });

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
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brandRow}>
          <View style={styles.brandName}>
            <AppIcon name="calendar" color={palette.tint} size={20} />
            <Text style={[styles.brand, { color: palette.text }]}>DineroMio</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cómo se calcula tu resumen"
            onPress={() => setHelpVisible(true)}
            style={({ pressed }) => [
              styles.helpButton,
              { backgroundColor: pressed ? palette.tintSoft : 'transparent' },
            ]}
          >
            <AppIcon name="help" color={palette.tint} size={23} />
          </Pressable>
        </View>

        {latest ? (
          <>
            <View style={styles.intro}>
              <Text style={[styles.title, { color: palette.text }]}>Tu semana, en claro</Text>
              <DateLine date={formatLongDate(latest.createdAt)} palette={palette} />
            </View>

            <BudgetSummary snapshot={latest} previous={previous} palette={palette} showCategories
              onViewBudget={() => navigation.navigate('Presupuesto')} />
            <AppButton
              title="Registrar gasto"
              icon="plus"
              palette={palette}
              onPress={() => navigation.navigate('Gastos', { snapshotId: latest.id, mode: 'new' })}
              style={{ marginTop: 14 }}
            />
            <AppButton
              title="Ver gastos"
              icon="history"
              variant="secondary"
              palette={palette}
              onPress={() => navigation.navigate('Gastos', { snapshotId: latest.id, mode: 'list' })}
              style={{ marginTop: 14 }}
            />

            <View style={[styles.totalBlock, { borderTopColor: palette.separator, borderBottomColor: palette.separator }]}>
              <Text style={[styles.totalLabel, { color: palette.secondary }]}>Total del corte</Text>
              <Text
                style={[styles.totalValue, { color: palette.text }]}
                accessibilityLabel={`Total del corte: ${formatMoney(latestTotal)} pesos mexicanos`}
                selectable
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
              >
                {formatMoney(latestTotal)}
              </Text>
              <Text style={[styles.currencyNote, { color: palette.secondary }]}>Pesos mexicanos</Text>

              <View style={[styles.variationLine, { borderTopColor: palette.separator }]}>
                <View style={styles.variationCopy}>
                  <Text style={[styles.variationLabel, { color: palette.secondary }]}>
                    Variación {previous ? `desde ${formatShortDate(previous.createdAt)}` : 'semanal'}
                  </Text>
                  <Text style={[styles.variationNote, { color: palette.secondary }]}>
                    {previous ? 'Balance total, no rendimiento de inversión' : 'Este es tu primer corte'}
                  </Text>
                </View>
                {variation === null ? (
                  <Text style={[styles.firstCutLabel, { color: palette.tint }]}>Sin corte previo</Text>
                ) : (
                  <View style={styles.variationValue}>
                    <AppIcon
                      name={variation > 0 ? 'arrowUp' : (variation < 0 ? 'arrowDown' : 'equal')}
                      color={variation > 0 ? palette.positive : (variation < 0 ? palette.negative : palette.secondary)}
                      size={18}
                    />
                    <Text
                      style={[
                        styles.variationAmount,
                        { color: variation > 0 ? palette.positive : (variation < 0 ? palette.negative : palette.secondary) },
                      ]}
                      accessibilityLabel={`Variación: ${formatMoney(Math.abs(variation))} ${variation > 0 ? 'más' : (variation < 0 ? 'menos' : 'sin cambio')}`}
                    >
                      {variation === 0 ? formatMoney(0) : `${variation > 0 ? '+' : '−'}${formatMoney(Math.abs(variation))}`}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.distributionHeader}>
              <Text style={[styles.sectionTitle, { color: palette.text }]}>Dónde está tu dinero</Text>
              <Text style={[styles.sectionNote, { color: palette.secondary }]}>Parte del total</Text>
            </View>
            {HOLDING_GROUPS.map((group) => (
              <HoldingsGroup
                key={group}
                group={group}
                values={latest.values}
                totalCents={latestTotal}
                palette={palette}
                showShare
                showBar
                animationProgress={barProgress}
              />
            ))}

            <AppButton
              title="Registrar corte semanal"
              icon="plus"
              onPress={openNewCut}
              palette={palette}
              style={styles.primaryAction}
            />
          </>
        ) : (
          <View style={styles.emptyState}>
            <Image
              source={require('../../assets/weekly-cut.png')}
              style={styles.emptyIllustration}
              resizeMode="contain"
              accessible
              accessibilityLabel="Ilustración de un corte semanal con sus saldos y distribución"
            />
            <Text style={[styles.emptyTitle, { color: palette.text }]}>Empieza con tu primer corte</Text>
            <Text style={[styles.emptyCopy, { color: palette.secondary }]}>
              Registra los siete saldos. La próxima semana podrás comparar el total con este corte.
            </Text>
            <AppButton
              title="Registrar primer corte"
              icon="plus"
              onPress={openNewCut}
              palette={palette}
              style={styles.emptyAction}
            />
            <Text style={[styles.privacyNote, { color: palette.secondary }]}>
              Historial local en este iPhone · sin cuenta ni sincronización de DineroMio.
            </Text>
          </View>
        )}
      </ScrollView>

      <CalculationHelpSheet
        visible={helpVisible}
        onClose={() => setHelpVisible(false)}
        palette={palette}
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
    paddingTop: spacing.sm,
    paddingBottom: 30,
  },
  brandRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandName: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  brand: {
    fontSize: 19,
    lineHeight: 25,
    fontWeight: '700',
  },
  helpButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  intro: {
    marginTop: 23,
    marginBottom: 20,
    gap: 10,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  dateLine: {
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  dateIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
  },
  totalBlock: {
    marginTop: 24,
    paddingVertical: 19,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  totalLabel: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
  },
  totalValue: {
    marginTop: 5,
    fontSize: 24,
    lineHeight: 31,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.6,
  },
  currencyNote: {
    marginTop: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  variationLine: {
    marginTop: 18,
    paddingTop: 15,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  variationCopy: {
    flex: 1,
    gap: 3,
  },
  variationLabel: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  variationNote: {
    fontSize: 12,
    lineHeight: 17,
  },
  variationValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  variationAmount: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  firstCutLabel: {
    maxWidth: 106,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    textAlign: 'right',
  },
  distributionHeader: {
    marginTop: 24,
    marginBottom: 5,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 10,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
  },
  sectionNote: {
    fontSize: 12,
    lineHeight: 17,
  },
  primaryAction: {
    marginTop: spacing.lg,
  },
  emptyState: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingBottom: 40,
  },
  emptyIllustration: {
    width: 260,
    height: 174,
    alignSelf: 'center',
    marginTop: 4,
  },
  emptyTitle: {
    marginTop: 22,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
  },
  emptyCopy: {
    marginTop: 9,
    fontSize: 16,
    lineHeight: 24,
  },
  emptyAction: {
    width: '100%',
    marginTop: 25,
  },
  privacyNote: {
    alignSelf: 'center',
    marginTop: 16,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
});
