const { test } = require('node:test');
const assert = require('node:assert/strict');
const { comprobarConexion } = require('../lib/conexion');

test('confirma la conexión cuando la API responde con la tabla protegida', async () => {
  const cliente = { from: () => ({ select: () => ({ limit: async () => ({ error: { code: '42501' } }) }) }) };
  assert.equal(await comprobarConexion(cliente), 'protegida');
});

test('informa los errores de conexión sin considerarlos éxito', async () => {
  const cliente = { from: () => ({ select: () => ({ limit: async () => ({ error: { message: 'Network request failed' } }) }) }) };
  await assert.rejects(comprobarConexion(cliente), /Network request failed/);
});
