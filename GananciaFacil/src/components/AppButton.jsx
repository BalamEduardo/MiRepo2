import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../theme';

export default function AppButton({
  title,
  onPress,
  icon,
  variant = 'primary',
  accessibilityLabel,
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        styles[variant],
        pressed && styles.pressed,
      ]}
    >
      {icon ? (
        <Ionicons
          name={icon}
          size={20}
          color={variant === 'primary' || variant === 'danger' ? '#FFFFFF' : colors.greenDark}
        />
      ) : null}
      <Text
        style={[
          styles.label,
          variant === 'primary' || variant === 'danger'
            ? styles.lightLabel
            : styles.darkLabel,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 9,
  },
  primary: {
    backgroundColor: colors.green,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.green,
  },
  danger: {
    backgroundColor: colors.orangeDark,
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.96 }],
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
  },
  lightLabel: {
    color: '#FFFFFF',
  },
  darkLabel: {
    color: colors.greenDark,
  },
});
