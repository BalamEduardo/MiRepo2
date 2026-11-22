create table public.contactos (
    propietario_id uuid not null default auth.uid() references public.perfiles(id) on delete cascade,
    contacto_id uuid not null references public.perfiles(id) on delete cascade,
    primary key (propietario_id, contacto_id),
    check (propietario_id <> contacto_id)
);
create index contactos_contacto_id_idx on public.contactos(contacto_id);
alter table public.contactos enable row level security;
revoke all on public.contactos from public, anon, authenticated;
grant select, insert (contacto_id) on public.contactos to authenticated;
create policy contactos_leer_propios on public.contactos for select to authenticated
    using (propietario_id = (select auth.uid()));
create policy contactos_guardar_propios on public.contactos for insert to authenticated
    with check (propietario_id = (select auth.uid()));

create function public.buscar_contactos_guardados(busqueda text, desde integer)
returns table (id uuid, nombre text, tiene_foto boolean)
language sql stable security invoker set search_path = ''
as $$
    select p.id, p.nombre, p.tiene_foto
    from public.contactos c
    join public.perfiles p on p.id = c.contacto_id
    where c.propietario_id = (select auth.uid())
        and strpos(lower(p.nombre), lower(left(coalesce(busqueda, ''), 80))) > 0
    order by lower(p.nombre), p.id
    limit 51 offset greatest(coalesce(desde, 0), 0)
$$;
revoke all on function public.buscar_contactos_guardados(text, integer) from public, anon;
grant execute on function public.buscar_contactos_guardados(text, integer) to authenticated;

create function chat_private.es_participante_directo(chat uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
    select exists (
        select from chat_private.pares_directos d
        where d.conversacion_id = chat and (select auth.uid()) in (d.usuario_a, d.usuario_b)
    )
$$;
revoke all on function chat_private.es_participante_directo(uuid) from public, anon;
grant execute on function chat_private.es_participante_directo(uuid) to authenticated;

alter table public.mensajes alter column remitente_id set default auth.uid();
grant select (id, conversacion_id, remitente_id, contenido, enviado_en),
    insert (id, conversacion_id, contenido) on public.mensajes to authenticated;
create policy mensajes_leer_chat_directo on public.mensajes for select to authenticated
    using (chat_private.es_participante_directo(conversacion_id));
create policy mensajes_enviar_chat_directo on public.mensajes for insert to authenticated
    with check (
        remitente_id = (select auth.uid())
        and chat_private.es_participante_directo(conversacion_id)
        and char_length(btrim(contenido)) between 1 and 4000
    );
