import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { supabase } from '../lib/supabase';
import { eliminarProducto } from '../lib/productos';
import { Action, colors, common } from './ui';

export default function EliminarProducto({ producto, alEliminar, alCambiarConfirmacion }) {
  const [confirmar, setConfirmar] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState('');
  async function eliminar() {
    if (ocupado) return;
    setOcupado(true); setError('');
    try { await eliminarProducto(supabase, producto.id); await alEliminar(); }
    catch (e) { setError(e.message); setOcupado(false); }
  }
  if (!confirmar) return <Action variant="danger" title="Eliminar" accessibilityLabel={`Eliminar ${producto.producto}`} onPress={() => { setConfirmar(true); alCambiarConfirmacion(true); }} />;
  return <View style={styles.confirm}>
    <Text style={styles.question}>¿Eliminar {producto.producto}?</Text>
    <Text style={styles.description}>Esta acción no se puede deshacer.</Text>
    {error ? <Text accessibilityLiveRegion="polite" style={common.error}>{error}</Text> : null}
    <View style={styles.actions}><View style={styles.flex}><Action variant="danger" title={ocupado ? 'Eliminando...' : 'Sí, eliminar'} accessibilityLabel="Confirmar eliminación" disabled={ocupado} onPress={eliminar} /></View><View style={styles.flex}><Action variant="secondary" title="Cancelar" accessibilityLabel="Cancelar eliminación" disabled={ocupado} onPress={() => { setConfirmar(false); alCambiarConfirmacion(false); }} /></View></View>
  </View>;
}
const styles = StyleSheet.create({ confirm: { gap: 8, padding: 14, borderRadius: 10, backgroundColor: colors.dangerSurface }, question: { color: colors.ink, fontWeight: '700', fontSize: 15 }, description: { color: colors.muted, fontSize: 13 }, actions: { flexDirection: 'row', gap: 8, marginTop: 4 }, flex: { flex: 1 } });

