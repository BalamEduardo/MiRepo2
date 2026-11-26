import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { supabase } from '../lib/supabase';
import { actualizarProducto } from '../lib/productos';
import { Action, colors, common } from './ui';

export default function EditarProducto({ producto, alGuardar, alCancelar }) {
  const [nombre, setNombre] = useState(producto.producto);
  const [descripcion, setDescripcion] = useState(producto.descripcion || '');
  const [precio, setPrecio] = useState(String(producto.precio));
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState('');
  async function guardar() {
    if (ocupado) return;
    setOcupado(true); setError('');
    try { await actualizarProducto(supabase, producto.id, { producto: nombre, descripcion, precio }); await alGuardar(); }
    catch (e) { setError(e.message); }
    finally { setOcupado(false); }
  }
  return <View style={styles.form}>
    <Text style={styles.title}>Editar producto</Text>
    <View><Text style={common.label}>Producto</Text><TextInput accessibilityLabel="Editar producto" style={common.input} value={nombre} onChangeText={setNombre} editable={!ocupado} /></View>
    <View><Text style={common.label}>Descripción</Text><TextInput accessibilityLabel="Editar descripción" style={common.input} value={descripcion} onChangeText={setDescripcion} editable={!ocupado} multiline /></View>
    <View><Text style={common.label}>Precio</Text><TextInput accessibilityLabel="Editar precio" style={common.input} value={precio} onChangeText={setPrecio} editable={!ocupado} keyboardType="decimal-pad" /></View>
    {error ? <Text accessibilityLiveRegion="polite" style={common.error}>{error}</Text> : null}
    <View style={styles.actions}><View style={styles.flex}><Action title={ocupado ? 'Guardando...' : 'Guardar cambios'} disabled={ocupado} onPress={guardar} /></View><View style={styles.flex}><Action variant="secondary" title="Cancelar" disabled={ocupado} onPress={alCancelar} accessibilityLabel="Cancelar edición" /></View></View>
  </View>;
}
const styles = StyleSheet.create({ form: { gap: 14, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.line }, title: { color: colors.ink, fontSize: 16, fontWeight: '700' }, actions: { flexDirection: 'row', gap: 8 }, flex: { flex: 1 } });
