import React from 'react';
import { View } from 'react-native';
import { SymbolView } from 'expo-symbols';

const SYMBOLS = {
  home: { ios: 'house.fill', android: 'home', web: 'home' },
  history: { ios: 'clock.arrow.circlepath', android: 'history', web: 'history' },
  calendar: { ios: 'calendar', android: 'calendar_month', web: 'calendar_month' },
  bank: { ios: 'building.columns', android: 'account_balance', web: 'account_balance' },
  cash: { ios: 'banknote', android: 'payments', web: 'payments' },
  fund: { ios: 'chart.line.uptrend.xyaxis', android: 'monitoring', web: 'monitoring' },
  globe: { ios: 'globe.americas.fill', android: 'public', web: 'public' },
  bitcoin: { ios: 'bitcoinsign.circle', android: 'currency_bitcoin', web: 'currency_bitcoin' },
  plus: { ios: 'plus', android: 'add', web: 'add' },
  share: { ios: 'square.and.arrow.up', android: 'share', web: 'share' },
  edit: { ios: 'pencil', android: 'edit', web: 'edit' },
  delete: { ios: 'trash', android: 'delete', web: 'delete' },
  close: { ios: 'xmark', android: 'close', web: 'close' },
  help: { ios: 'questionmark.circle', android: 'help_outline', web: 'help_outline' },
  chevron: { ios: 'chevron.down', android: 'expand_more', web: 'expand_more' },
  chevronRight: { ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' },
  arrowUp: { ios: 'arrow.up.right', android: 'north_east', web: 'north_east' },
  arrowDown: { ios: 'arrow.down.right', android: 'south_east', web: 'south_east' },
  equal: { ios: 'equal', android: 'drag_handle', web: 'drag_handle' },
  retry: { ios: 'arrow.clockwise', android: 'refresh', web: 'refresh' },
  check: { ios: 'checkmark', android: 'check', web: 'check' },
};

export default function AppIcon({ name, color, size = 22, style }) {
  return (
    <SymbolView
      name={SYMBOLS[name] || { ios: name, android: 'circle', web: 'circle' }}
      tintColor={color}
      size={size}
      style={[{ width: size, height: size }, style]}
      fallback={<View style={[{ width: size, height: size }, style]} />}
    />
  );
}
