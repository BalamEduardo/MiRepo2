alter table public.mensajes
    add column recibido_en timestamptz,
    add column leido_en timestamptz,
    add constraint mensajes_leido_requiere_recibido
        check (leido_en is null or recibido_en is not null);

alter table public.perfiles add column ultima_conexion timestamptz;

grant select (recibido_en, leido_en), update (recibido_en, leido_en)
    on public.mensajes to authenticated;
grant select (ultima_conexion), update (ultima_conexion)
    on public.perfiles to authenticated;

create policy mensajes_confirmar_recibos on public.mensajes
    for update to authenticated
    using (
        remitente_id <> (select auth.uid())
        and chat_private.es_participante_directo(conversacion_id)
    )
    with check (
        remitente_id <> (select auth.uid())
        and chat_private.es_participante_directo(conversacion_id)
    );

create function public.confirmar_mensajes_recibidos(
    p_conversacion_id uuid,
    p_mensajes_ids uuid[]
)
returns void
language sql
security invoker
set search_path = ''
as $$
    update public.mensajes
    set recibido_en = coalesce(recibido_en, pg_catalog.now())
    where conversacion_id = p_conversacion_id
        and id = any(coalesce(p_mensajes_ids, array[]::uuid[]))
        and remitente_id <> (select auth.uid())
        and recibido_en is null
$$;

create function public.marcar_mensajes_leidos(p_conversacion_id uuid)
returns void
language sql
security invoker
set search_path = ''
as $$
    update public.mensajes
    set recibido_en = coalesce(recibido_en, pg_catalog.now()),
        leido_en = coalesce(leido_en, pg_catalog.now())
    where conversacion_id = p_conversacion_id
        and remitente_id <> (select auth.uid())
        and leido_en is null
$$;

create function public.registrar_ultima_conexion()
returns void
language sql
security invoker
set search_path = ''
as $$
    update public.perfiles
    set ultima_conexion = pg_catalog.now()
    where id = (select auth.uid())
$$;

revoke all on function public.confirmar_mensajes_recibidos(uuid, uuid[]),
    public.marcar_mensajes_leidos(uuid), public.registrar_ultima_conexion()
    from public, anon;
grant execute on function public.confirmar_mensajes_recibidos(uuid, uuid[]),
    public.marcar_mensajes_leidos(uuid), public.registrar_ultima_conexion()
    to authenticated;
