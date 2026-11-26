-- Permite insertar únicamente los campos del formulario sin iniciar sesión.
-- Cualquier persona que conozca la URL y la clave pública puede insertar.
grant insert (producto, descripcion, precio) on public.productos to anon;
create policy "Permitir insercion publica de productos"
  on public.productos for insert to anon with check (true);
