import React, { useRef, useState } from 'react';
import {
  AccessibilityInfo,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import AppButton from '../components/AppButton';
import { colors } from '../theme';

function parseAmountToCents(value) {
  const normalized = value.trim().replace(',', '.');

  if (!/^-?(?:\d+\.?\d*|\.\d+)$/.test(normalized)) {
    return Number.NaN;
  }

  const sign = normalized.startsWith('-') ? -1 : 1;
  const unsignedValue = normalized.replace(/^-/, '');
  const [wholePart = '0', decimalPart = ''] = unsignedValue.split('.');

  if (decimalPart.length > 2) {
    return Number.NaN;
  }

  const cents = Number(wholePart || '0') * 100
    + Number(`${decimalPart}00`.slice(0, 2));

  return Number.isSafeInteger(cents) ? sign * cents : Number.NaN;
}

function getFieldError(value, fieldName) {
  if (!value.trim()) {
    return `Escribe el ${fieldName}.`;
  }

  const normalized = value.trim().replace(',', '.');

  if (!/^-?(?:\d+\.?\d*|\.\d+)$/.test(normalized)) {
    return 'Usa un número válido, por ejemplo 20.50.';
  }

  const decimalPart = normalized.split('.')[1] || '';

  if (decimalPart.length > 2) {
    return 'Usa como máximo 2 decimales.';
  }

  const amountInCents = parseAmountToCents(value);

  if (!Number.isFinite(amountInCents)) {
    return 'Usa un número válido dentro del rango permitido.';
  }

  if (amountInCents <= 0) {
    return `El ${fieldName} debe ser mayor que cero.`;
  }

  return '';
}

function AmountField({
  inputRef,
  inputId,
  label,
  value,
  onChangeText,
  placeholder,
  error,
  accessibilityLabel,
}) {
  const accessibleInputLabel = error
    ? `${accessibilityLabel}. Error: ${error}`
    : accessibilityLabel;

  return (
    <View style={styles.fieldGroup}>
      <Text nativeID={`${inputId}-label`} style={styles.label}>{label}</Text>
      <View style={[styles.inputRow, error ? styles.inputRowError : null]}>
        <Text style={styles.currency}>$</Text>
        <TextInput
          ref={inputRef}
          nativeID={inputId}
          accessibilityLabel={accessibleInputLabel}
          accessibilityHint={error || 'Escribe una cantidad mayor que cero, con máximo 2 decimales'}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : undefined}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#8A928C"
          keyboardType="decimal-pad"
          inputMode="decimal"
          style={styles.input}
          returnKeyType="done"
        />
        <Text style={styles.currencyCode}>MXN</Text>
      </View>
      {error ? (
        <View
          style={styles.errorRow}
          accessible
          accessibilityRole="alert"
          accessibilityLabel={error}
          accessibilityLiveRegion="assertive"
        >
          <Ionicons name="alert-circle" size={16} color={colors.danger} />
          <Text nativeID={`${inputId}-error`} style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}

export default function CalculatorScreen({ navigation }) {
  const [cost, setCost] = useState('');
  const [price, setPrice] = useState('');
  const [errors, setErrors] = useState({ cost: '', price: '' });
  const [helpVisible, setHelpVisible] = useState(false);
  const [clearVisible, setClearVisible] = useState(false);
  const costInputRef = useRef(null);
  const priceInputRef = useRef(null);

  const changeCost = (value) => {
    setCost(value);
    if (errors.cost) {
      setErrors((current) => ({ ...current, cost: '' }));
    }
  };

  const changePrice = (value) => {
    setPrice(value);
    if (errors.price) {
      setErrors((current) => ({ ...current, price: '' }));
    }
  };

  const calculate = () => {
    const costError = getFieldError(cost, 'costo unitario');
    const priceError = getFieldError(price, 'precio de venta');

    setErrors({ cost: costError, price: priceError });

    if (costError || priceError) {
      const firstError = costError || priceError;
      const firstInvalidInput = costError ? costInputRef : priceInputRef;

      requestAnimationFrame(() => {
        firstInvalidInput.current?.focus();
        AccessibilityInfo.announceForAccessibility(`Error. ${firstError}`);
      });
      return;
    }

    navigation.navigate('Resultado', {
      costCents: parseAmountToCents(cost),
      priceCents: parseAmountToCents(price),
    });
  };

  const confirmClear = () => {
    setCost('');
    setPrice('');
    setErrors({ cost: '', price: '' });
    setClearVisible(false);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.introRow}>
            <View style={styles.introIcon}>
              <Ionicons name="cash-outline" size={28} color={colors.greenDark} />
            </View>
            <View style={styles.introCopy}>
              <Text style={styles.title}>Datos de la venta</Text>
              <Text style={styles.subtitle}>Ingresa el valor de una sola unidad.</Text>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Abrir ayuda sobre el cálculo"
            onPress={() => setHelpVisible(true)}
            style={({ pressed }) => [styles.helpCard, pressed && styles.cardPressed]}
          >
            <View style={styles.helpIcon}>
              <Ionicons name="bulb-outline" size={22} color={colors.orangeDark} />
            </View>
            <View style={styles.helpCopy}>
              <Text style={styles.helpTitle}>¿Cómo se calcula?</Text>
              <Text style={styles.helpText}>Consulta la fórmula y un ejemplo.</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.orangeDark} />
          </Pressable>

          <View style={styles.formCard}>
            <AmountField
              inputRef={costInputRef}
              inputId="cost-input"
              label="Costo unitario"
              value={cost}
              onChangeText={changeCost}
              placeholder="Ej. 20.00"
              error={errors.cost}
              accessibilityLabel="Costo unitario en pesos mexicanos"
            />

            <AmountField
              inputRef={priceInputRef}
              inputId="price-input"
              label="Precio de venta"
              value={price}
              onChangeText={changePrice}
              placeholder="Ej. 30,00"
              error={errors.price}
              accessibilityLabel="Precio de venta en pesos mexicanos"
            />

            <View style={styles.buttonGroup}>
              <AppButton title="Calcular resultado" icon="calculator-outline" onPress={calculate} />
              <AppButton
                title="Limpiar datos"
                icon="trash-outline"
                variant="secondary"
                onPress={() => setClearVisible(true)}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        transparent
        animationType="fade"
        visible={helpVisible}
        onRequestClose={() => setHelpVisible(false)}
        statusBarTranslucent
      >
        <SafeAreaView style={styles.modalSafeArea} edges={['top', 'bottom']}>
          <View style={styles.modalBackdrop}>
            <View
              style={styles.modalCard}
              accessibilityViewIsModal
              accessibilityLabel="Ayuda para calcular la ganancia"
            >
              <ScrollView
                style={styles.modalScroll}
                contentContainerStyle={styles.modalScrollContent}
                showsVerticalScrollIndicator
                bounces={false}
              >
                <View style={styles.modalIcon}>
                  <Ionicons name="bulb-outline" size={30} color={colors.orangeDark} />
                </View>
                <Text style={styles.modalTitle}>Fórmula de ganancia</Text>
                <Text style={styles.modalText}>
                  Resta el costo unitario al precio de venta.
                </Text>
                <View style={styles.formulaBox}>
                  <Text style={styles.formula}>Precio de venta − costo = resultado</Text>
                </View>
                <Text style={styles.exampleText}>
                  Ejemplo: si cuesta $20 y lo vendes en $30, tu ganancia es de $10 por unidad.
                </Text>
              </ScrollView>
              <View style={styles.modalFooter}>
                <AppButton
                  title="Cerrar ayuda"
                  icon="close"
                  onPress={() => setHelpVisible(false)}
                />
              </View>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      <Modal
        transparent
        animationType="fade"
        visible={clearVisible}
        onRequestClose={() => setClearVisible(false)}
        statusBarTranslucent
      >
        <SafeAreaView style={styles.modalSafeArea} edges={['top', 'bottom']}>
          <View style={styles.modalBackdrop}>
            <View
              style={styles.modalCard}
              accessibilityViewIsModal
              accessibilityLabel="Confirmación para limpiar los datos"
            >
              <ScrollView
                style={styles.modalScroll}
                contentContainerStyle={styles.modalScrollContent}
                showsVerticalScrollIndicator
                bounces={false}
              >
                <View style={[styles.modalIcon, styles.warningIcon]}>
                  <Ionicons name="trash-outline" size={28} color={colors.orangeDark} />
                </View>
                <Text style={styles.modalTitle}>¿Limpiar los datos?</Text>
                <Text style={styles.modalText}>
                  Se borrarán el costo, el precio y los mensajes de error.
                </Text>
              </ScrollView>
              <View style={[styles.modalFooter, styles.modalButtons]}>
                <AppButton
                  title="Cancelar"
                  variant="secondary"
                  onPress={() => setClearVisible(false)}
                />
                <AppButton title="Limpiar datos" variant="danger" onPress={confirmClear} />
              </View>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 34,
    gap: 18,
  },
  introRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  introIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: colors.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  introCopy: {
    flex: 1,
    gap: 3,
  },
  title: {
    color: colors.text,
    fontSize: 25,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  helpCard: {
    minHeight: 70,
    borderRadius: 18,
    backgroundColor: colors.orangeSoft,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardPressed: {
    opacity: 0.78,
  },
  helpIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpCopy: {
    flex: 1,
    gap: 2,
  },
  helpTitle: {
    color: colors.orangeDark,
    fontSize: 16,
    fontWeight: '800',
  },
  helpText: {
    color: '#70452D',
    fontSize: 14,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 22,
    shadowColor: '#5B4630',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 3,
  },
  fieldGroup: {
    gap: 8,
  },
  label: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  inputRow: {
    minHeight: 56,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 15,
    backgroundColor: '#FFFCF7',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputRowError: {
    borderColor: colors.danger,
    backgroundColor: '#FFF9F9',
  },
  currency: {
    color: colors.greenDark,
    fontSize: 20,
    fontWeight: '800',
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 18,
    paddingHorizontal: 10,
    paddingVertical: 13,
  },
  currencyCode: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  errorText: {
    flex: 1,
    color: colors.danger,
    fontSize: 13,
    lineHeight: 18,
  },
  buttonGroup: {
    gap: 12,
  },
  modalSafeArea: {
    flex: 1,
    backgroundColor: 'rgba(31, 42, 35, 0.55)',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  modalCard: {
    width: '100%',
    maxWidth: 460,
    maxHeight: '92%',
    alignSelf: 'center',
    borderRadius: 24,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  modalScroll: {
    flexShrink: 1,
  },
  modalScrollContent: {
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 12,
    gap: 16,
  },
  modalFooter: {
    paddingHorizontal: 22,
    paddingTop: 4,
    paddingBottom: 22,
  },
  modalIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: colors.orangeSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningIcon: {
    backgroundColor: colors.orangeSoft,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  modalText: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 24,
  },
  formulaBox: {
    borderRadius: 14,
    backgroundColor: colors.greenSoft,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  formula: {
    color: colors.greenDark,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '800',
    textAlign: 'center',
  },
  exampleText: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 23,
  },
  modalButtons: {
    gap: 10,
  },
});
