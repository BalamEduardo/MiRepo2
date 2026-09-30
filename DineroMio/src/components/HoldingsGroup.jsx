import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import HoldingRow from './HoldingRow';
import { HOLDINGS } from '../data/holdings';
import { formatMoney } from '../data/amounts';

export default function HoldingsGroup({
  group,
  values,
  totalCents,
  palette,
  showShare = false,
  showBar = false,
  animationProgress,
}) {
  const items = HOLDINGS.filter((holding) => holding.group === group);
  const groupTotal = items.reduce((total, holding) => (
    total + (Number(values?.[holding.key]) || 0)
  ), 0);

  return (
    <View style={styles.group}>
      <View style={styles.heading}>
        <Text style={[styles.title, { color: palette.secondary }]}>{group}</Text>
        {showShare ? (
          <Text style={[styles.subtotal, { color: palette.secondary }]}>
            {formatMoney(groupTotal)}
          </Text>
        ) : null}
      </View>
      {items.map((holding) => (
        <HoldingRow
          key={holding.key}
          holding={holding}
          valueCents={Number(values?.[holding.key]) || 0}
          totalCents={totalCents}
          palette={palette}
          showShare={showShare}
          showBar={showBar}
          animationProgress={animationProgress}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    marginTop: 8,
  },
  heading: {
    minHeight: 34,
    paddingTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  title: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  subtotal: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
});
