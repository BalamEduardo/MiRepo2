async function comprobarConexion(cliente) {
  const { error } = await cliente.from('productos').select('id').limit(1);
  if (!error) return 'disponible';
  if (error.code === '42501') return 'protegida';
  throw new Error(error.message || 'No se pudo conectar con Supabase.');
}

module.exports = { comprobarConexion };
