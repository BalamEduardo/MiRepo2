import React from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import AppIcon from './AppIcon';
import { formatMoney, formatShare } from '../data/amounts';

export default function HoldingRow({
  holding,
  valueCents,
  totalCents,
  palette,
  showShare = false,
  showBar = false,
  animationProgress,
}) {
  const share = totalCents > 0 ? Math.min(100, Math.max(0, (valueCents / totalCents) * 100)) : 0;
  const barWidth = animationProgress
    ? animationProgress.interpolate({ inputRange: [0, 1], outputRange: ['0%', `${share}%`] })
    : `${share}%`;

  return (
    <View
      style={[styles.row, { borderBottomColor: palette.separator }]}
      accessible
      accessibilityLabel={[
        holding.label,
        formatMoney(valueCents),
        showShare ? formatShare(valueCents, totalCents) : null,
      ].filter(Boolean).join(', ')}
    >
      <View style={styles.mainLine}>
        <View style={styles.nameGroup}>
          <AppIcon name={holding.symbol} color={palette.secondary} size={18} />
          <View style={styles.copy}>
            <Text style={[styles.name, { color: palette.text }]}>{holding.label}</Text>
            {holding.description && !showShare ? (
              <Text style={[styles.detail, { color: palette.secondary }]}>
                {holding.description}
              </Text>
            ) : null}
          </View>
        </View>
        <View style={styles.amountGroup}>
          <Text style={[styles.amount, { color: palette.text }]}>{formatMoney(valueCents)}</Text>
          {showShare ? (
            <Text style={[styles.share, { color: palette.secondary }]}>
              {formatShare(valueCents, totalCents)}
            </Text>
          ) : null}
        </View>
      </View>
      {showBar ? (
        <View
          accessible={false}
          style={[styles.track, { backgroundColor: palette.barTrack }]}
        >
          <Animated.View
            style={[styles.bar, { backgroundColor: palette.tint, width: barWidth }]}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 52,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  mainLine: {
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  nameGroup: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  copy: {
    flex: 1,
    gap: 1,
  },
  name: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
  },
  detail: {
    fontSize: 12,
    lineHeight: 16,
  },
  amountGroup: {
    alignItems: 'flex-end',
    gap: 1,
  },
  amount: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    textAlign: 'right',
  },
  share: {
    fontSize: 12,
    lineHeight: 16,
    fontVariant: ['tabular-nums'],
  },
  track: {
    height: 3,
    overflow: 'hidden',
    borderRadius: 2,
  },
  bar: {
    height: 3,
    borderRadius: 2,
  },
});
