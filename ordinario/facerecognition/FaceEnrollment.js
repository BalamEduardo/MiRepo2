import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import EmbeddingEngine from './EmbeddingEngine';
import { saveFaceRecord } from './face-records';

export default function FaceEnrollment({ capture, canCapture, onClose, onSaved, onBusy }) {
  const engine = useRef(null);
  const alive = useRef(true);
  const lock = useRef(false);
  const [name, setName] = useState('');
  const [status, setStatus] = useState('loading');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const [phase, setPhase] = useState('');

  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; onBusy(false); };
  }, [onBusy]);

  const register = async () => {
    if (lock.current || !canCapture || status !== 'ready') return;
    if (!name.trim()) { setMessage('Escribe un nombre para este registro.'); return; }
    lock.current = true;
    setBusy(true);
    onBusy(true);
    setMessage(null);
    setPhase('Capturando rostro…');
    try {
      const image = await capture();
      if (!alive.current) return;
      setPhase('Generando embedding en el teléfono…');
      const result = await engine.current.generate(image);
      if (!alive.current) return;
      setPhase('Guardando registro local…');
      const record = await saveFaceRecord(name, result);
      onSaved(record);
      if (alive.current) onClose();
    } catch (error) {
      if (alive.current) setMessage(error.message || 'No se pudo registrar el rostro. Inténtalo de nuevo.');
    } finally {
      lock.current = false;
      if (alive.current) {
        setBusy(false);
        onBusy(false);
      }
    }
  };

  return <Modal transparent animationType="fade" onRequestClose={onClose}>
    <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.card}>
        <Text style={styles.title}>Registrar rostro</Text>
        <Text style={styles.text}>Deja un solo rostro frente a la cámara, con buena luz. El embedding se guarda únicamente en este teléfono.</Text>
        <TextInput
          accessibilityLabel="Nombre del registro facial"
          placeholder="Nombre del registro"
          placeholderTextColor="#A8B0C2"
          value={name}
          onChangeText={setName}
          maxLength={60}
          editable={!busy}
          autoCapitalize="words"
          style={styles.input}
        />
        <Text style={styles.text} accessibilityLiveRegion="polite">
          {busy ? phase : status === 'loading' ? 'Preparando modelo local…'
            : status === 'error' ? 'No se pudo preparar el modelo. Cierra esta ventana y vuelve a intentarlo.'
              : canCapture ? 'Modelo listo. Puedes registrar el rostro.' : 'Espera a que la cámara detecte un solo rostro.'}
        </Text>
        {busy || status === 'loading' ? <ActivityIndicator color="#C5F36A" /> : null}
        {message ? <Text style={styles.error} accessibilityLiveRegion="polite">{message}</Text> : null}
        <Pressable accessibilityRole="button" accessibilityState={{ disabled: busy || status !== 'ready' || !canCapture }}
          disabled={busy || status !== 'ready' || !canCapture} onPress={register}
          style={[styles.button, (busy || status !== 'ready' || !canCapture) && styles.disabled]}>
          <Text style={styles.buttonText}>{busy ? 'Procesando…' : 'Generar y guardar embedding'}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onClose} style={styles.cancel}><Text style={styles.cancelText}>Cancelar</Text></Pressable>
        <EmbeddingEngine ref={engine} onStatus={setStatus} />
      </View>
    </KeyboardAvoidingView>
  </Modal>;
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: 'rgba(0,0,0,0.55)' },
  card: { backgroundColor: '#1A1F2B', borderRadius: 24, padding: 20, gap: 14 },
  title: { color: '#F8FAFF', fontSize: 23, fontWeight: '800' },
  text: { color: '#A8B0C2', fontSize: 14, lineHeight: 21 },
  input: { color: '#F8FAFF', borderColor: '#343B4D', borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 16 },
  error: { color: '#FF9E9E', fontSize: 14, lineHeight: 20 },
  button: { backgroundColor: '#C5F36A', borderRadius: 14, minHeight: 52, justifyContent: 'center', alignItems: 'center', padding: 12 },
  disabled: { opacity: 0.45 },
  buttonText: { color: '#171C11', fontSize: 15, fontWeight: '800', textAlign: 'center' },
  cancel: { alignItems: 'center', padding: 10 },
  cancelText: { color: '#C5F36A', fontSize: 15, fontWeight: '600' },
});
