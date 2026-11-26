import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';
import { supabase } from '../lib/supabase';
import { guardarProducto } from '../lib/productos';
import { Action, colors, common } from './ui';

export default function CrearProducto({ alCrear }) {
  const [producto, setProducto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState(false);
  const [guardando, setGuardando] = useState(false);

  async function guardar() {
    if (guardando) return;
    setMensaje(''); setError(false); setGuardando(true);
    try {
      await guardarProducto(supabase, { producto, descripcion, precio });
      setProducto(''); setDescripcion(''); setPrecio('');
      setMensaje('Producto guardado correctamente.');
      if (alCrear) await alCrear();
    } catch (e) {
      setError(true); setMensaje(e.message || 'No se pudo guardar el producto.');
    } finally { setGuardando(false); }
  }

  return <View style={styles.form}>
    <View style={styles.intro}>
      <Text style={styles.heading}>Nuevo producto</Text>
      <Text style={styles.help}>Agrega los datos para registrar un producto.</Text>
    </View>
    <View><Text style={common.label}>Producto</Text>
      <TextInput accessibilityLabel="Producto" style={common.input} value={producto} onChangeText={setProducto} placeholder="Ej. Café molido" placeholderTextColor="#687b75" editable={!guardando} /></View>
    <View><Text style={common.label}>Descripción <Text style={styles.optional}>· Opcional</Text></Text>
      <TextInput accessibilityLabel="Descripción" style={[common.input, styles.description]} value={descripcion} onChangeText={setDescripcion} placeholder="Describe el producto" placeholderTextColor="#687b75" multiline editable={!guardando} /></View>
    <View><Text style={common.label}>Precio</Text>
      <TextInput accessibilityLabel="Precio" style={common.input} value={precio} onChangeText={setPrecio} placeholder="0.00" placeholderTextColor="#687b75" keyboardType="decimal-pad" editable={!guardando} /></View>
    <Action title={guardando ? 'Guardando...' : 'Guardar producto'} onPress={guardar} disabled={guardando} />
    {guardando ? <ActivityIndicator color={colors.accent} /> : null}
    {mensaje ? <Text accessibilityLiveRegion="polite" style={error ? common.error : common.message}>{mensaje}</Text> : null}
  </View>;
}
const styles = StyleSheet.create({
  form: { gap: 17, width: '100%', padding: 20, borderRadius: 16, backgroundColor: colors.surface },
  intro: { gap: 5, marginBottom: 2 }, heading: { color: colors.ink, fontSize: 20, fontWeight: '700' },
  help: { color: colors.muted, fontSize: 14, lineHeight: 20 }, optional: { fontWeight: '400', color: colors.muted },
  description: { minHeight: 76, textAlignVertical: 'top' },
});
