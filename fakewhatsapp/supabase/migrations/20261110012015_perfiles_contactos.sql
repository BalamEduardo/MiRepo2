alter table public.perfiles add column tiene_foto boolean not null default false;
grant select (id, nombre, tiene_foto), insert (id, nombre, tiene_foto),
    update (id, nombre, tiene_foto) on public.perfiles to authenticated;

create policy perfiles_directorio on public.perfiles for select to authenticated
    using (true);
create policy perfiles_insertar_propio on public.perfiles for insert to authenticated
    with check (id = (select auth.uid()) and char_length(btrim(nombre)) between 1 and 80);
create policy perfiles_editar_propio on public.perfiles for update to authenticated
    using (id = (select auth.uid()))
    with check (id = (select auth.uid()) and char_length(btrim(nombre)) between 1 and 80);

create function public.buscar_contactos(busqueda text, desde integer)
returns table (id uuid, nombre text, tiene_foto boolean)
language sql stable security invoker set search_path = ''
as $$
    select p.id, p.nombre, p.tiene_foto
    from public.perfiles p
    where p.id <> (select auth.uid())
      and strpos(lower(p.nombre), lower(left(coalesce(busqueda, ''), 80))) > 0
    order by lower(p.nombre), p.id
    limit 51 offset greatest(coalesce(desde, 0), 0)
$$;
revoke all on function public.buscar_contactos(text, integer) from public, anon;
grant execute on function public.buscar_contactos(text, integer) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatares', 'avatares', false, 1048576, array['image/jpeg']);

create policy avatares_directorio on storage.objects for select to authenticated
    using (bucket_id = 'avatares');
create policy avatares_insertar_propio on storage.objects for insert to authenticated
    with check (bucket_id = 'avatares' and name = (select auth.uid())::text || '.jpg');
create policy avatares_editar_propio on storage.objects for update to authenticated
    using (bucket_id = 'avatares' and name = (select auth.uid())::text || '.jpg')
    with check (bucket_id = 'avatares' and name = (select auth.uid())::text || '.jpg');
