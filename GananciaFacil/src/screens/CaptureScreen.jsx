import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  AccessibilityInfo,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePreventRemove } from '@react-navigation/native';

import AmountInput from '../components/AmountInput';
import BudgetFields from '../components/BudgetFields';
import { budgetDraftFor, cashCentsFor, validateBudgetDraft } from '../data/budget';
import AppButton from '../components/AppButton';
import AppIcon from '../components/AppIcon';
import { LoadingState, StorageErrorState } from '../components/ScreenStates';
import { formatCentsForInput, formatLongDate, getAmountError, parseAmountToCents } from '../data/amounts';
import { emptyValues, HOLDINGS, HOLDING_GROUPS } from '../data/holdings';
import { useSnapshots } from '../context/SnapshotContext';
import { palette, spacing } from '../theme';

export default function CaptureScreen({ navigation, route }) {
  const { snapshots, isLoading, storageError, reload, saveSnapshot } = useSnapshots();
  const [values, setValues] = useState(emptyValues);
  const [budgetDraft, setBudgetDraft] = useState(() => budgetDraftFor(null));
  const [budgetErrors, setBudgetErrors] = useState({});
  const originalBudget = useRef(null);
  const scrollRef = useRef(null);
  const budgetPosition = useRef(0);
  const hasScrolled = useRef(false);
  const [errors, setErrors] = useState({});
  const [isReady, setIsReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const saveLock = useRef(false);
  const inputRefs = useRef({});
  const originalValues = useRef(null);
  const hasSaved = useRef(false);
  const snapshotId = route?.params?.snapshotId;
  const sourceSnapshot = snapshotId
    ? snapshots.find((snapshot) => snapshot.id === snapshotId)
    : snapshots[0];
  const isEditing = Boolean(snapshotId);

  useEffect(() => {
    if (isLoading || storageError) {
      return;
    }

    const latestSource = snapshotId
      ? snapshots.find((snapshot) => snapshot.id === snapshotId)
      : snapshots[0];
    const nextValues = latestSource
      ? Object.fromEntries(HOLDINGS.map(({ key }) => [
        key,
        formatCentsForInput(latestSource.values[key]),
      ]))
      : emptyValues();

    originalValues.current = nextValues;
    const nextBudget = budgetDraftFor(latestSource?.budget);
    originalBudget.current = nextBudget;
    setBudgetDraft(nextBudget);
    setBudgetErrors({});
    setValues(nextValues);
    setErrors({});
    setSaveError('');
    setIsReady(true);
  }, [isLoading, snapshotId, snapshots, storageError]);

  const isDirty = isReady
    && originalValues.current !== null
    && (HOLDINGS.some(({ key }) => values[key] !== originalValues.current[key])
      || JSON.stringify(budgetDraft) !== JSON.stringify(originalBudget.current));

  usePreventRemove(isDirty || isSaving, ({ data }) => {
    if (hasSaved.current) {
      navigation.dispatch(data.action);
      return;
    }

    if (isSaving) {
      Alert.alert('Guardando corte', 'Espera a que termine el guardado antes de cerrar esta pantalla.');
      return;
    }

    Alert.alert(
      '¿Descartar tus cambios?',
      'Los cambios en saldos o presupuesto todavía no se han guardado.',
      [
        { text: 'Seguir editando', style: 'cancel' },
        {
          text: 'Descartar cambios',
          style: 'destructive',
          onPress: () => navigation.dispatch(data.action),
        },
      ],
    );
  });

  const changeValue = (key, nextValue) => {
    setValues((current) => ({ ...current, [key]: nextValue }));
    setErrors((current) => ({ ...current, [key]: '' }));
    setBudgetErrors({});
    setSaveError('');
  };

  const handleSave = async () => {
    if (saveLock.current) {
      return;
    }

    const nextErrors = {};
    const nextCents = {};

    for (const holding of HOLDINGS) {
      const error = getAmountError(values[holding.key]);
      nextErrors[holding.key] = error;
      nextCents[holding.key] = error ? Number.NaN : parseAmountToCents(values[holding.key]);
    }

    setErrors(nextErrors);

    const firstInvalid = HOLDINGS.find((holding) => nextErrors[holding.key]);

    if (firstInvalid) {
      requestAnimationFrame(() => {
        inputRefs.current[firstInvalid.key]?.focus();
        AccessibilityInfo.announceForAccessibility(`Revisa ${firstInvalid.label}. ${nextErrors[firstInvalid.key]}`);
      });
      return;
    }

    const checkedBudget = validateBudgetDraft(budgetDraft, cashCentsFor(nextCents));
    setBudgetErrors(checkedBudget.errors);
    const firstBudgetError = Object.keys(checkedBudget.errors)[0];
    if (firstBudgetError) {
      scrollRef.current?.scrollTo({ y: budgetPosition.current, animated: false });
      requestAnimationFrame(() => {
        inputRefs.current[firstBudgetError === 'distribution' ? 'budgetAmount' : firstBudgetError]?.focus();
        AccessibilityInfo.announceForAccessibility(checkedBudget.errors[firstBudgetError]);
      });
      return;
    }

    saveLock.current = true;
    setIsSaving(true);
    setSaveError('');

    try {
      await saveSnapshot({ id: snapshotId, values: nextCents, budget: checkedBudget.budget });
      hasSaved.current = true;
      navigation.goBack();
    } catch (error) {
      setSaveError(error instanceof Error
        ? error.message
        : 'No pudimos guardar el corte. Intenta otra vez.');
    } finally {
      saveLock.current = false;
      setIsSaving(false);
    }
  };

  if (storageError) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]} edges={['top', 'bottom']}>
        <StorageErrorState palette={palette} onRetry={reload} />
      </SafeAreaView>
    );
  }

  if (isLoading || !isReady) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]} edges={['top', 'bottom']}>
        <LoadingState palette={palette} label="Preparando tu corte" />
      </SafeAreaView>
    );
  }

  if (isEditing && !sourceSnapshot) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]} edges={['top', 'bottom']}>
        <View style={styles.notFound}>
          <AppIcon name="calendar" size={30} color={palette.dateMark} />
          <Text style={[styles.notFoundTitle, { color: palette.text }]}>Este corte ya no está disponible</Text>
          <Text style={[styles.subtitle, { color: palette.secondary }]}>
            Regresa al historial para abrir un registro guardado.
          </Text>
          <AppButton title="Volver al historial" onPress={() => navigation.goBack()} palette={palette} />
        </View>
      </SafeAreaView>
    );
  }

  const dateLabel = formatLongDate(sourceSnapshot?.createdAt || new Date().toISOString());

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.topBar, { borderBottomColor: palette.separator }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cancelar y cerrar el corte"
            accessibilityState={{ disabled: isSaving }}
            disabled={isSaving}
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
          >
            <AppIcon name="close" size={19} color={palette.tint} />
            <Text style={[styles.cancelText, { color: palette.tint }]}>Cancelar</Text>
          </Pressable>
          <Text style={[styles.navTitle, { color: palette.text }]}>
            {isEditing ? 'Editar corte' : 'Nuevo corte'}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isSaving ? 'Guardando corte' : 'Guardar corte'}
            accessibilityState={{ disabled: isSaving }}
            disabled={isSaving}
            onPress={handleSave}
            style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]}
          >
            <Text style={[styles.saveText, { color: isSaving ? palette.secondary : palette.tint }]}>
              {isSaving ? 'Guardando' : 'Guardar'}
            </Text>
          </Pressable>
        </View>

        <ScrollView
          ref={scrollRef}
          onContentSizeChange={() => {
            if (route.params?.initialSection === 'budget' && !hasScrolled.current && budgetPosition.current > 0) {
              hasScrolled.current = true;
              scrollRef.current?.scrollTo({ y: budgetPosition.current, animated: false });
            }
          }}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.intro}>
            <View style={[styles.dateIcon, { backgroundColor: palette.dateMarkSoft }]}>
              <AppIcon name="calendar" size={19} color={palette.dateMark} />
            </View>
            <View style={styles.introCopy}>
              <Text style={[styles.title, { color: palette.text }]}>
                {isEditing ? 'Actualiza este registro' : '¿Qué cambió esta semana?'}
              </Text>
              <Text style={[styles.subtitle, { color: palette.secondary }]}>
                {isEditing
                  ? `Corte del ${dateLabel.toLowerCase()}. La fecha se conserva.`
                  : (sourceSnapshot
                    ? 'Usamos tu corte anterior. Cambia solo los valores que necesites.'
                    : 'Este será el primer registro de tu historial.')}
              </Text>
            </View>
          </View>

          {HOLDING_GROUPS.map((group) => (
            <View key={group} style={styles.formGroup}>
              <Text style={[styles.groupTitle, { color: palette.text, borderBottomColor: palette.separator }]}>{group}</Text>
              {HOLDINGS.filter((holding) => holding.group === group).map((holding) => (
                <AmountInput
                  key={holding.key}
                  holding={holding}
                  value={values[holding.key]}
                  editable={!isSaving}
                  error={errors[holding.key]}
                  onChangeText={(value) => changeValue(holding.key, value)}
                  inputRef={(ref) => { inputRefs.current[holding.key] = ref; }}
                  palette={palette}
                />
              ))}
            </View>
          ))}

          <View onLayout={(event) => {
            budgetPosition.current = event.nativeEvent.layout.y;
            if (route.params?.initialSection === 'budget' && !hasScrolled.current) {
              hasScrolled.current = true;
              requestAnimationFrame(() => scrollRef.current?.scrollTo({ y: budgetPosition.current, animated: false }));
            }
          }}>
            <BudgetFields
              draft={budgetDraft}
              onChange={(next) => { setBudgetDraft(next); setBudgetErrors({}); setSaveError(''); }}
              cashCents={cashCentsFor(Object.fromEntries(HOLDINGS.map(({ key }) => [
                key, getAmountError(values[key]) ? 0 : parseAmountToCents(values[key]),
              ])))}
              errors={budgetErrors}
              editable={!isSaving}
              inputRefs={inputRefs}
              palette={palette}
            />
          </View>

          <View style={styles.formFooter}>
            <Text style={[styles.helper, { color: palette.secondary }]}>
              Todos los montos son en MXN. Escribe 0 si una cuenta no tiene saldo.
            </Text>
            {saveError ? (
              <View
                style={styles.saveErrorRow}
                accessible
                accessibilityRole="alert"
                accessibilityLabel={saveError}
                accessibilityLiveRegion="assertive"
              >
                <AppIcon name="help" size={18} color={palette.negative} />
                <Text style={[styles.saveError, { color: palette.negative }]}>{saveError}</Text>
              </View>
            ) : null}
            <AppButton
              title={isSaving ? 'Guardando…' : (isEditing ? 'Guardar cambios' : 'Guardar corte')}
              icon={isSaving ? undefined : 'check'}
              onPress={handleSave}
              disabled={isSaving}
              palette={palette}
              style={styles.footerButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  notFound: {
    flex: 1,
    justifyContent: 'center',
    gap: 14,
    paddingHorizontal: spacing.lg,
  },
  notFoundTitle: {
    fontSize: 22,
    lineHeight: 29,
    fontWeight: '700',
  },
  flex: {
    flex: 1,
  },
  topBar: {
    minHeight: 54,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cancelButton: {
    minWidth: 82,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cancelText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
  },
  navTitle: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  saveButton: {
    minWidth: 58,
    minHeight: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  saveText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.55,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: 35,
    gap: 21,
  },
  intro: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 13,
  },
  dateIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  introCopy: {
    flex: 1,
    gap: 5,
  },
  title: {
    fontSize: 21,
    lineHeight: 27,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  formGroup: {
    gap: 15,
  },
  groupTitle: {
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
  },
  formFooter: {
    gap: 13,
  },
  helper: {
    fontSize: 13,
    lineHeight: 19,
  },
  saveErrorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  saveError: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  footerButton: {
    marginTop: 3,
  },
});
