import { Pressable, StyleSheet, Text } from 'react-native';

export const colors = {
  ink: '#172d2a', muted: '#586b67', line: '#dce6e2', surface: '#f6f9f7',
  accent: '#176b55', accentDark: '#115441', danger: '#a23c38', dangerSurface: '#fdf2f1',
};

export function Action({ title, onPress, disabled, variant = 'primary', accessibilityLabel }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel || title} accessibilityState={{ disabled: !!disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.action, styles[variant], pressed && styles.pressed, disabled && styles.disabled]}>
    <Text style={[styles.actionText, styles[`${variant}Text`]]}>{title}</Text>
  </Pressable>;
}

export const common = StyleSheet.create({
  label: { color: colors.ink, fontSize: 14, fontWeight: '600', marginBottom: 7 },
  input: { minHeight: 48, borderWidth: 1, borderColor: '#bfcdc7', borderRadius: 10, backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 11, fontSize: 16, color: colors.ink },
  message: { color: colors.accentDark, fontSize: 14, lineHeight: 20 },
  error: { color: colors.danger, fontSize: 14, lineHeight: 20 },
});

const styles = StyleSheet.create({
  action: { minHeight: 46, paddingHorizontal: 17, paddingVertical: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  primary: { backgroundColor: colors.accent },
  secondary: { borderWidth: 1, borderColor: '#c7d7d0', backgroundColor: '#fff' },
  quiet: { backgroundColor: colors.surface },
  danger: { backgroundColor: colors.dangerSurface },
  actionText: { fontSize: 14, fontWeight: '700', textAlign: 'center' },
  primaryText: { color: '#fff' }, secondaryText: { color: colors.ink }, quietText: { color: colors.accentDark }, dangerText: { color: colors.danger },
  pressed: { opacity: 0.72 }, disabled: { opacity: 0.5 },
});
