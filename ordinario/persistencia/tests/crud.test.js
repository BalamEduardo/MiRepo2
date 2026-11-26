const { test } = require('node:test');
const assert = require('node:assert/strict');
const { listarProductos, actualizarProducto, eliminarProducto } = require('../lib/productos');

test('consulta productos ordenados', async () => {
  const filas = [{ id: 1, producto: 'Pan', precio: 5 }];
  const cliente = { from: tabla => ({ select: campos => ({ order: async columna => { assert.equal(tabla, 'productos'); assert.equal(columna, 'id'); return { data: filas, error: null }; } }) }) };
  assert.deepEqual(await listarProductos(cliente), filas);
});

test('actualiza solo el registro solicitado y comprueba el resultado', async () => {
  const cliente = { from: () => ({ update: valores => ({ eq: (campo, id) => ({ select: async () => { assert.equal(id, 2); assert.equal(campo, 'id'); assert.equal(valores.precio, 4.5); return { data: [{ id }], error: null }; } }) }) }) };
  await actualizarProducto(cliente, 2, { producto: 'Pan', precio: '4.50' });
});

test('avisa si la eliminación no afectó ningún registro', async () => {
  const cliente = { from: () => ({ delete: () => ({ eq: () => ({ select: async () => ({ data: [], error: null }) }) }) }) };
  await assert.rejects(eliminarProducto(cliente, 1), /no se encontró/i);
});

test('elimina solo el registro solicitado', async () => {
  const cliente = { from: () => ({ delete: () => ({ eq: (campo, id) => ({ select: async () => { assert.equal(campo, 'id'); assert.equal(id, 7); return { data: [{ id }], error: null }; } }) }) }) };
  await eliminarProducto(cliente, 7);
});
