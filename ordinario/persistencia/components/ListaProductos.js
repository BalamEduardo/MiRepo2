import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { supabase } from '../lib/supabase';
import { listarProductos } from '../lib/productos';
import CrearProducto from './CrearProducto';
import EditarProducto from './EditarProducto';
import EliminarProducto from './EliminarProducto';
import { Action, colors, common } from './ui';

export default function ListaProductos() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [editando, setEditando] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const [confirmando, setConfirmando] = useState(null);
  const cargar = useCallback(async () => {
    setCargando(true); setError('');
    try { setProductos(await listarProductos(supabase)); }
    catch (e) { setError(e.message || 'No se pudieron consultar los productos.'); }
    finally { setCargando(false); }
  }, []);
  useEffect(() => { cargar(); }, [cargar]);
  async function cambios(texto) { setEditando(null); setConfirmando(null); setMensaje(texto); await cargar(); }
  return <FlatList
    contentContainerStyle={styles.content}
    data={productos}
    keyExtractor={item => String(item.id)}
    keyboardShouldPersistTaps="handled"
    ListHeaderComponent={<View>
      <View style={styles.header}>
        <Text style={styles.brand}>PERSISTENCIA</Text>
        <Text style={styles.title}>Tus productos</Text>
        <Text style={styles.subtitle}>Registra y administra tu catálogo en un solo lugar.</Text>
      </View>
      <CrearProducto alCrear={() => cambios('')} />
      <View style={styles.listHeader}>
        <View style={styles.listTitle}><Text style={styles.heading}>Productos</Text><Text style={styles.count}>{cargando ? 'Cargando…' : `${productos.length} ${productos.length === 1 ? 'registro' : 'registros'}`}</Text></View>
        <Action variant="quiet" title="Actualizar" accessibilityLabel="Actualizar lista" onPress={cargar} disabled={cargando} />
      </View>
      {cargando ? <ActivityIndicator color={colors.accent} style={styles.feedback} /> : null}
      {error ? <Text accessibilityLiveRegion="polite" style={[common.error, styles.feedback]}>No se pudieron consultar los productos: {error}</Text> : null}
      {mensaje ? <Text accessibilityLiveRegion="polite" style={[common.message, styles.feedback]}>{mensaje}</Text> : null}
    </View>}
    ListEmptyComponent={!cargando && !error ? <View style={styles.empty}><Text style={styles.emptyTitle}>Aún no hay productos</Text><Text style={styles.emptyCopy}>Agrega el primero con el formulario de arriba.</Text></View> : null}
    renderItem={({ item }) => <View style={styles.item}>
      <View style={styles.itemTop}>
        <View style={styles.itemCopy}><Text style={styles.itemName}>{item.producto}</Text><Text style={styles.description}>{item.descripcion || 'Sin descripción'}</Text></View>
        <View style={styles.priceBox}><Text style={styles.priceLabel}>PRECIO</Text><Text style={styles.price}>{Number(item.precio).toFixed(2)}</Text></View>
      </View>
      {editando === item.id ? <EditarProducto key={item.id} producto={item} alGuardar={() => cambios('Producto actualizado.')} alCancelar={() => setEditando(null)} /> : <View style={[styles.itemActions, confirmando === item.id && styles.confirmActions]}>{confirmando !== item.id ? <View style={styles.action}><Action variant="secondary" title="Editar" accessibilityLabel={`Editar ${item.producto}`} onPress={() => setEditando(item.id)} /></View> : null}<View style={styles.action}><EliminarProducto producto={item} alCambiarConfirmacion={valor => setConfirmando(valor ? item.id : null)} alEliminar={() => cambios('Producto eliminado.')} /></View></View>}
    </View>}
  />;
}
const styles = StyleSheet.create({
  content: { paddingHorizontal: 22, paddingTop: 48, paddingBottom: 48, width: '100%', maxWidth: 680, alignSelf: 'center', flexGrow: 1 },
  header: { paddingBottom: 26, gap: 7 }, brand: { color: colors.accent, fontSize: 11, fontWeight: '800', letterSpacing: 1.4 },
  title: { color: colors.ink, fontSize: 30, lineHeight: 36, fontWeight: '800', letterSpacing: -0.6 }, subtitle: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  listHeader: { marginTop: 34, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  listTitle: { flex: 1, gap: 4 }, heading: { color: colors.ink, fontSize: 20, fontWeight: '700' }, count: { color: colors.muted, fontSize: 13 },
  feedback: { marginBottom: 14 }, item: { borderTopWidth: 1, borderTopColor: colors.line, paddingVertical: 18, gap: 16 },
  itemTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 }, itemCopy: { flex: 1, gap: 5 }, itemName: { color: colors.ink, fontSize: 17, fontWeight: '700', lineHeight: 23 },
  description: { color: colors.muted, fontSize: 14, lineHeight: 20 }, priceBox: { alignItems: 'flex-end', gap: 3 }, priceLabel: { color: colors.muted, fontSize: 10, fontWeight: '700', letterSpacing: 0.6 }, price: { color: colors.ink, fontSize: 17, fontWeight: '700', fontVariant: ['tabular-nums'] },
  itemActions: { flexDirection: 'row', gap: 9 }, confirmActions: { flexDirection: 'column' }, action: { flex: 1 }, empty: { paddingVertical: 24, borderTopWidth: 1, borderTopColor: colors.line, gap: 5 }, emptyTitle: { color: colors.ink, fontSize: 16, fontWeight: '700' }, emptyCopy: { color: colors.muted, fontSize: 14, lineHeight: 20 },
});

