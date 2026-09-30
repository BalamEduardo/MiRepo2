import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import AppIcon from './AppIcon';
import { radii } from '../theme';

export default function AppButton({
  title,
  onPress,
  icon,
  variant = 'primary',
  disabled = false,
  accessibilityLabel,
  palette,
  style,
}) {
  const isPrimary = variant === 'primary';
  const isDestructive = variant === 'destructive';
  const color = isPrimary ? palette.onTint : (isDestructive ? palette.negative : palette.tint);
  const backgroundColor = isPrimary
    ? palette.tint
    : (isDestructive ? palette.negativeSoft : 'transparent');
  const borderColor = isPrimary || isDestructive ? 'transparent' : palette.separator;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: disabled ? palette.surfaceMuted : backgroundColor,
          borderColor,
          opacity: pressed && !disabled ? 0.78 : 1,
        },
        style,
      ]}
    >
      <View style={styles.content}>
        {icon ? <AppIcon name={icon} color={disabled ? palette.secondary : color} size={19} /> : null}
        <Text style={[styles.label, { color: disabled ? palette.secondary : color }]}>
          {title}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 50,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderRadius: radii.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  label: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
});
