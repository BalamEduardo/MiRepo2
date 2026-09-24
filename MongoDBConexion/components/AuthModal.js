import React, { useState } from 'react';
import {
  ActivityIndicator,
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
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { authenticate } from '../moviesApi';

export default function AuthModal({ visible, apiBase, onAuthenticated }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setError('');
    if (!username.trim() || !password) {
      setError('Escribe el usuario y la contraseña de MongoDB.');
      return;
    }

    setSubmitting(true);
    try {
      const session = await authenticate({ username, password }, apiBase);
      onAuthenticated(session);
    } catch (cause) {
      setError(cause.message || 'No se pudo conectar. Inténtalo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={keepLoginOpen}
    >
      <SafeAreaProvider>
      <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.topbar}>
            <Text style={styles.wordmark}>CINE <Text style={styles.wordmarkAccent}>/</Text> ARCHIVO</Text>
          </View>

          <View style={styles.intro}>
            <Text style={styles.title}>Inicia sesión</Text>
            <Text style={styles.subtitle}>Ingresa las credenciales de acceso a la base de datos.</Text>
          </View>

          <Field
            label="Usuario de MongoDB"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoComplete="username"
            returnKeyType="next"
            editable={!submitting}
          />
          <Field
            label="Contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
            returnKeyType="done"
            editable={!submitting}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            onPress={submit}
            disabled={submitting}
            style={({ pressed }) => [styles.submit, pressed && !submitting && styles.pressed, submitting && styles.disabled]}
            accessibilityRole="button"
          >
            {submitting
              ? <ActivityIndicator color="#171714" />
              : <Text style={styles.submitText}>Iniciar sesión</Text>}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
      </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

function keepLoginOpen() {
  return undefined;
}

function Field({ label, ...inputProps }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...inputProps}
        style={styles.input}
        placeholder={label}
        placeholderTextColor="#77766F"
        selectionColor="#E8AC56"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#11110F' },
  keyboard: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 26, paddingTop: 24, paddingBottom: 32 },
  topbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  wordmark: { color: '#F2EFE7', fontSize: 13, fontWeight: '800', letterSpacing: 1.6 },
  wordmarkAccent: { color: '#E8AC56' },
  intro: { marginTop: 68, marginBottom: 30 },
  title: { color: '#F2EFE7', fontSize: 34, fontWeight: '700', letterSpacing: -0.8 },
  subtitle: { color: '#AAA69C', fontSize: 16, marginTop: 10, lineHeight: 23 },
  field: { marginBottom: 18 },
  label: { color: '#D4D0C6', fontSize: 13, fontWeight: '600', marginBottom: 8 },
  input: {
    minHeight: 52,
    paddingHorizontal: 15,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#393832',
    backgroundColor: '#1A1A17',
    color: '#F2EFE7',
    fontSize: 16,
  },
  error: { color: '#FF9A87', fontSize: 14, lineHeight: 20, marginBottom: 14 },
  submit: {
    minHeight: 54,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E8AC56',
    borderRadius: 11,
    marginTop: 8,
  },
  submitText: { color: '#171714', fontSize: 16, fontWeight: '800' },
  pressed: { opacity: 0.84 },
  disabled: { opacity: 0.62 },
});
