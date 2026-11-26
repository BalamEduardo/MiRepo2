create table public.contactos_prueba (
    id uuid primary key default gen_random_uuid(),
    propietario_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
    nombre text not null check (char_length(btrim(nombre)) between 1 and 80),
    creado_en timestamptz not null default now(),
    unique (propietario_id, nombre)
);
create table public.mensajes_prueba (
    id uuid primary key,
    conversacion_id uuid not null references public.contactos_prueba(id) on delete cascade,
    remitente_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
    contenido text not null check (char_length(btrim(contenido)) between 1 and 4000),
    enviado_en timestamptz not null default now()
);
create index mensajes_prueba_historial_idx
    on public.mensajes_prueba(conversacion_id, enviado_en, id);
create index mensajes_prueba_remitente_idx on public.mensajes_prueba(remitente_id);
alter table public.contactos_prueba enable row level security;
alter table public.mensajes_prueba enable row level security;
revoke all on public.contactos_prueba, public.mensajes_prueba from public, anon, authenticated;
grant select, insert (nombre) on public.contactos_prueba to authenticated;
grant select, insert (id, conversacion_id, contenido) on public.mensajes_prueba to authenticated;

create policy contactos_prueba_leer on public.contactos_prueba for select to authenticated
    using (propietario_id = (select auth.uid()));
create policy contactos_prueba_crear on public.contactos_prueba for insert to authenticated
    with check (propietario_id = (select auth.uid()));
create policy mensajes_prueba_leer on public.mensajes_prueba for select to authenticated
    using (remitente_id = (select auth.uid()));
create policy mensajes_prueba_crear on public.mensajes_prueba for insert to authenticated
    with check (remitente_id = (select auth.uid()) and exists (
        select 1 from public.contactos_prueba p where p.id = conversacion_id
            and p.propietario_id = (select auth.uid())
    ));

create function public.crear_contacto_prueba(nombre_contacto text)
returns uuid language plpgsql security invoker set search_path = ''
as $$
declare
    contacto uuid;
    nombre_limpio text := btrim(nombre_contacto);
begin
    insert into public.contactos_prueba(nombre) values (nombre_limpio)
        on conflict (propietario_id, nombre) do nothing returning id into contacto;
    if contacto is null then
        select p.id into contacto from public.contactos_prueba p
            where p.propietario_id = (select auth.uid()) and p.nombre = nombre_limpio;
    end if;
    return contacto;
end;
$$;

create function chat_private.listar_chats_con_prueba(desde integer)
returns table (id uuid, destinatario_id uuid, nombre text, tiene_foto boolean,
    ultimo_mensaje text, ultimo_remitente_id uuid, actividad timestamptz, de_prueba boolean)
language sql stable security definer set search_path = ''
as $$
    select * from (
    select c.id, p.id as destinatario_id, p.nombre, p.tiene_foto, m.contenido, m.remitente_id,
        coalesce(m.enviado_en, c.creada_en) as actividad, false as de_prueba
    from chat_private.pares_directos d
    join public.conversaciones c on c.id = d.conversacion_id
    join public.perfiles p on p.id = case
        when d.usuario_a = (select auth.uid()) then d.usuario_b else d.usuario_a end
    left join lateral (
        select contenido, remitente_id, enviado_en
        from public.mensajes
        where conversacion_id = c.id
        order by enviado_en desc, id desc limit 1
    ) m on true
    where (select auth.uid()) in (d.usuario_a, d.usuario_b)
    union all
    select p.id, p.id, p.nombre, false, m.contenido, m.remitente_id,
        coalesce(m.enviado_en, p.creado_en), true
    from public.contactos_prueba p
    left join lateral (
        select contenido, remitente_id, enviado_en from public.mensajes_prueba
        where conversacion_id = p.id order by enviado_en desc, id desc limit 1
    ) m on true
    where p.propietario_id = (select auth.uid())
    ) chats
    order by chats.actividad desc, chats.id desc
    limit 51 offset greatest(coalesce(desde, 0), 0)
$$;

create function public.listar_chats_con_prueba(desde integer)
returns table (id uuid, destinatario_id uuid, nombre text, tiene_foto boolean,
    ultimo_mensaje text, ultimo_remitente_id uuid, actividad timestamptz, de_prueba boolean)
language sql stable security invoker set search_path = ''
as $$ select * from chat_private.listar_chats_con_prueba(desde) $$;

revoke all on function public.crear_contacto_prueba(text), public.listar_chats_con_prueba(integer),
    chat_private.listar_chats_con_prueba(integer) from public, anon;
grant execute on function public.crear_contacto_prueba(text), public.listar_chats_con_prueba(integer),
    chat_private.listar_chats_con_prueba(integer) to authenticated;
