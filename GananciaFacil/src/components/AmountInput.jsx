import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import AppIcon from './AppIcon';
import { radii } from '../theme';

export default function AmountInput({
  holding,
  value,
  editable = true,
  error,
  onChangeText,
  inputRef,
  palette,
}) {
  const label = `${holding.label}${holding.description ? `, ${holding.description}` : ''}`;

  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <AppIcon name={holding.symbol} color={palette.secondary} size={19} />
        <Text style={[styles.label, { color: palette.text }]}>{holding.label}</Text>
      </View>
      {holding.description ? (
        <Text style={[styles.description, { color: palette.secondary }]}>
          {holding.description}
        </Text>
      ) : null}
      <View style={[
        styles.inputRow,
        { backgroundColor: palette.field, borderColor: error ? palette.negative : palette.separator },
      ]}>
        <Text style={[styles.currency, { color: palette.secondary }]}>$</Text>
        <TextInput
          ref={inputRef}
          accessibilityLabel={label}
          accessibilityHint={error || 'Monto en pesos mexicanos. Puedes usar punto o coma y hasta dos decimales.'}
          accessibilityState={{ disabled: !editable }}
          aria-invalid={Boolean(error)}
          value={value}
          onChangeText={onChangeText}
          editable={editable}
          placeholder="0.00"
          placeholderTextColor={palette.placeholder}
          keyboardType="decimal-pad"
          inputMode="decimal"
          autoCorrect={false}
          selectTextOnFocus={false}
          returnKeyType="done"
          style={[styles.input, { color: palette.text }]}
        />
        <Text style={[styles.currencyCode, { color: palette.secondary }]}>MXN</Text>
      </View>
      {error ? (
        <View
          style={styles.errorRow}
          accessible
          accessibilityRole="alert"
          accessibilityLabel={error}
          accessibilityLiveRegion="assertive"
        >
          <AppIcon name="help" color={palette.negative} size={16} />
          <Text style={[styles.error, { color: palette.negative }]}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: 7,
  },
  labelRow: {
    minHeight: 26,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
  },
  description: {
    marginLeft: 27,
    fontSize: 13,
    lineHeight: 18,
  },
  inputRow: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: radii.control,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  currency: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
  },
  input: {
    flex: 1,
    minHeight: 50,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 17,
    lineHeight: 23,
    fontVariant: ['tabular-nums'],
  },
  currencyCode: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  error: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});
