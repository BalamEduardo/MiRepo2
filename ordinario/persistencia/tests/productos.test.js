const { test } = require('node:test');
const assert = require('node:assert/strict');
const { guardarProducto } = require('../lib/productos');

test('guarda un producto normalizando sus datos', async () => {
  let registro;
  const cliente = { from: (tabla) => ({ insert: async (datos) => { assert.equal(tabla, 'productos'); registro = datos; return { error: null }; } }) };
  await guardarProducto(cliente, { producto: ' Café ', descripcion: ' Molido ', precio: '12.50' });
  assert.deepEqual(registro, { producto: 'Café', descripcion: 'Molido', precio: 12.5 });
});

test('rechaza nombre vacío y precios inválidos antes de guardar', async () => {
  const cliente = { from() { throw new Error('no debe guardar'); } };
  for (const datos of [{ producto: ' ', precio: '5' }, { producto: 'Pan', precio: '' }, { producto: 'Pan', precio: '-1' }, { producto: 'Pan', precio: '1.999' }, { producto: 'Pan', precio: 'abc' }]) {
    await assert.rejects(guardarProducto(cliente, datos));
  }
});

test('propaga errores de Supabase', async () => {
  const cliente = { from: () => ({ insert: async () => ({ error: { message: 'Permiso denegado' } }) }) };
  await assert.rejects(guardarProducto(cliente, { producto: 'Pan', precio: '1' }), /Permiso denegado/);
});
