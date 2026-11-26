-- Políticas aplicadas: acceso público sin inicio de sesión.
grant select, delete on public.productos to anon;
grant update (producto, descripcion, precio) on public.productos to anon;
create policy "Consulta publica de productos" on public.productos for select to anon using (true);
create policy "Actualizacion publica de productos" on public.productos for update to anon using (true) with check (true);
create policy "Eliminacion publica de productos" on public.productos for delete to anon using (true);

