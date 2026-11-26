function normalizarProducto(valores) {
  const producto = (valores.producto || '').trim();
  const descripcion = (valores.descripcion || '').trim();
  const precioTexto = String(valores.precio ?? '').trim();
  if (!producto) throw new Error('Escribe el nombre del producto.');
  if (!/^\d{1,10}(?:[.,]\d{1,2})?$/.test(precioTexto)) throw new Error('Escribe un precio válido con hasta dos decimales.');
  return { producto, descripcion: descripcion || null, precio: Number(precioTexto.replace(',', '.')) };
}
function revisarError(error) { if (error) throw new Error(error.message || 'No se pudo completar la operación.'); }
async function guardarProducto(cliente, valores) {
  const { error } = await cliente.from('productos').insert(normalizarProducto(valores));
  revisarError(error);
}
async function listarProductos(cliente) {
  const { data, error } = await cliente.from('productos').select('id, producto, descripcion, precio').order('id', { ascending: true });
  revisarError(error);
  return data;
}
async function actualizarProducto(cliente, id, valores) {
  const { data, error } = await cliente.from('productos').update(normalizarProducto(valores)).eq('id', id).select('id');
  revisarError(error);
  if (!data || data.length !== 1) throw new Error('El producto no se encontró o no se pudo actualizar.');
}
async function eliminarProducto(cliente, id) {
  const { data, error } = await cliente.from('productos').delete().eq('id', id).select('id');
  revisarError(error);
  if (!data || data.length !== 1) throw new Error('El producto no se encontró o no se pudo eliminar.');
}
module.exports = { guardarProducto, listarProductos, actualizarProducto, eliminarProducto };
