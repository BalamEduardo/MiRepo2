create schema if not exists chat_private;

create table chat_private.pares_directos (
    usuario_a uuid not null,
    usuario_b uuid not null,
    conversacion_id uuid not null unique references public.conversaciones(id) on delete cascade,
    primary key (usuario_a, usuario_b),
    check (usuario_a < usuario_b),
    foreign key (conversacion_id, usuario_a)
        references public.conversaciones_miembros(conversacion_id, perfil_id) on delete cascade,
    foreign key (conversacion_id, usuario_b)
        references public.conversaciones_miembros(conversacion_id, perfil_id) on delete cascade
);
alter table chat_private.pares_directos enable row level security;
revoke all on chat_private.pares_directos from public, anon, authenticated;

-- Reuse previously created direct chats that already have exactly two members.
with pares as (
    select c.id, (array_agg(m.perfil_id order by m.perfil_id))[1] as a,
        (array_agg(m.perfil_id order by m.perfil_id))[2] as b
    from public.conversaciones c
    join public.conversaciones_miembros m on m.conversacion_id = c.id
    where c.tipo = 'directa'
    group by c.id
    having count(*) = 2
)
insert into chat_private.pares_directos(usuario_a, usuario_b, conversacion_id)
select distinct on (a, b) a, b, id from pares order by a, b, id;

create function chat_private.abrir_directa(destinatario uuid)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare
    yo uuid := auth.uid();
    primero uuid := least(yo, destinatario);
    segundo uuid := greatest(yo, destinatario);
    chat uuid;
begin
    if yo is null then
        raise insufficient_privilege;
    end if;
    if destinatario is null or yo = destinatario then
        raise exception using errcode = '22023', message = 'destinatario_invalido';
    end if;
    if not exists (select from public.perfiles where id = yo) then
        raise exception using errcode = '22023', message = 'perfil_requerido';
    end if;
    if not exists (select from public.perfiles where id = destinatario) then
        raise exception using errcode = '22023', message = 'destinatario_invalido';
    end if;

    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(primero::text || ':' || segundo::text, 0));
    select conversacion_id into chat from chat_private.pares_directos
        where usuario_a = primero and usuario_b = segundo;
    if found then
        return chat;
    end if;

    insert into public.conversaciones(tipo) values ('directa') returning id into chat;
    insert into public.conversaciones_miembros(conversacion_id, perfil_id)
        values (chat, primero), (chat, segundo);
    insert into chat_private.pares_directos(usuario_a, usuario_b, conversacion_id)
        values (primero, segundo, chat);
    return chat;
end;
$$;

create function chat_private.listar_directas(desde integer)
returns table (id uuid, destinatario_id uuid, nombre text, tiene_foto boolean,
    ultimo_mensaje text, ultimo_remitente_id uuid, actividad timestamptz)
language sql stable security definer set search_path = ''
as $$
    select c.id, p.id, p.nombre, p.tiene_foto, m.contenido, m.remitente_id,
        coalesce(m.enviado_en, c.creada_en)
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
    order by coalesce(m.enviado_en, c.creada_en) desc, c.id desc
    limit 51 offset greatest(coalesce(desde, 0), 0)
$$;

create index pares_directos_usuario_b_idx on chat_private.pares_directos(usuario_b);
grant usage on schema chat_private to authenticated;
revoke all on function chat_private.abrir_directa(uuid), chat_private.listar_directas(integer)
    from public, anon;
grant execute on function chat_private.abrir_directa(uuid), chat_private.listar_directas(integer)
    to authenticated;

create function public.abrir_chat_directo(destinatario uuid)
returns uuid language sql security invoker set search_path = ''
as $$ select chat_private.abrir_directa(destinatario) $$;

create function public.listar_chats_directos(desde integer)
returns table (id uuid, destinatario_id uuid, nombre text, tiene_foto boolean,
    ultimo_mensaje text, ultimo_remitente_id uuid, actividad timestamptz)
language sql stable security invoker set search_path = ''
as $$ select * from chat_private.listar_directas(desde) $$;

revoke all on function public.abrir_chat_directo(uuid), public.listar_chats_directos(integer)
    from public, anon;
grant execute on function public.abrir_chat_directo(uuid), public.listar_chats_directos(integer)
    to authenticated;
