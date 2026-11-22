-- Keep the existing helper name so all existing message policies gain group membership checks.
create or replace function chat_private.es_participante_directo(chat uuid)
returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select from public.conversaciones_miembros where conversacion_id=chat and perfil_id=(select auth.uid()))
$$;

alter table public.mensajes add column imagen_ruta text, add column eliminado boolean not null default false;
grant select(imagen_ruta, eliminado), insert(imagen_ruta) on public.mensajes to authenticated;
alter table public.mensajes add constraint imagen_ruta_valida check (imagen_ruta is null or
 imagen_ruta = conversacion_id::text || '/' || remitente_id::text || '/' || id::text || '.jpg');

create function chat_private.crear_grupo(titulo text, participantes uuid[])
returns uuid language plpgsql security definer set search_path='' as $$
declare chat uuid; yo uuid:=auth.uid(); cantidad integer;
begin
 if yo is null then raise insufficient_privilege; end if;
 if length(btrim(titulo)) not between 1 and 80 then raise exception 'Nombre de grupo inválido'; end if;
 select count(distinct p) into cantidad from unnest(participantes) p where p<>yo;
 if cantidad not between 1 and 49 then raise exception 'Elige entre 1 y 49 participantes'; end if;
 if not exists(select from public.perfiles where id=yo) or exists (
 select from unnest(participantes) p where not exists(select from public.perfiles where id=p))
 then raise exception 'Participante inválido'; end if;
 insert into public.conversaciones(tipo,nombre) values('grupo',btrim(titulo)) returning id into chat;
 insert into public.conversaciones_miembros(conversacion_id,perfil_id)
 select chat,p from (select distinct unnest(participantes) p union select yo) s;
 return chat;
end $$;
revoke all on function chat_private.crear_grupo(text,uuid[]) from public,anon;
grant execute on function chat_private.crear_grupo(text,uuid[]) to authenticated;
create function public.crear_grupo(titulo text,participantes uuid[]) returns uuid language sql security invoker set search_path='' as $$
 select chat_private.crear_grupo(titulo,participantes)
$$;
revoke all on function public.crear_grupo(text,uuid[]) from public,anon;
grant execute on function public.crear_grupo(text,uuid[]) to authenticated;

create policy miembros_consultar on public.conversaciones_miembros for select to authenticated
 using(chat_private.es_participante_directo(conversacion_id));
grant select on public.conversaciones_miembros to authenticated;
create policy conversaciones_consultar on public.conversaciones for select to authenticated
 using(chat_private.es_participante_directo(id));
grant select on public.conversaciones to authenticated;

create function chat_private.eliminar_mensaje(mensaje uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise insufficient_privilege; end if;
 update public.mensajes set contenido='Mensaje eliminado',imagen_ruta=null,eliminado=true
 where id=mensaje and remitente_id=auth.uid() and chat_private.es_participante_directo(conversacion_id);
 if not found then raise insufficient_privilege; end if;
end $$;
revoke all on function chat_private.eliminar_mensaje(uuid) from public,anon;
grant execute on function chat_private.eliminar_mensaje(uuid) to authenticated;
create function public.eliminar_mensaje(mensaje uuid) returns void language sql security invoker set search_path='' as $$
 select chat_private.eliminar_mensaje(mensaje)
$$;
revoke all on function public.eliminar_mensaje(uuid) from public,anon;
grant execute on function public.eliminar_mensaje(uuid) to authenticated;

create function public.buscar_mensajes(chat uuid, consulta text)
returns setof public.mensajes language sql stable security invoker set search_path='' as $$
 select * from public.mensajes where conversacion_id=chat and not eliminado
 and strpos(lower(contenido),lower(left(coalesce(consulta,''),100)))>0
 order by enviado_en desc,id desc limit 100
$$;
revoke all on function public.buscar_mensajes(uuid,text) from public,anon;
grant execute on function public.buscar_mensajes(uuid,text) to authenticated;
-- SETOF requires SELECT on every exposed message column; RLS still gates every row.
grant select on public.mensajes to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values('imagenes-chat','imagenes-chat',false,2097152,array['image/jpeg']);
create policy imagenes_chat_insertar on storage.objects for insert to authenticated with check(
 bucket_id='imagenes-chat' and (storage.foldername(name))[2]=(select auth.uid())::text
 and chat_private.es_participante_directo(((storage.foldername(name))[1])::uuid));
create policy imagenes_chat_leer on storage.objects for select to authenticated using(
 bucket_id='imagenes-chat' and exists(select from public.mensajes m where m.imagen_ruta=name and not m.eliminado
 and chat_private.es_participante_directo(m.conversacion_id)));

create or replace function chat_private.listar_chats_con_prueba(desde integer)
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
    select c.id,c.id,c.nombre,false,m.contenido,m.remitente_id,
        coalesce(m.enviado_en,c.creada_en),false
    from public.conversaciones c
    left join lateral (select contenido,remitente_id,enviado_en from public.mensajes
        where conversacion_id=c.id order by enviado_en desc,id desc limit 1) m on true
    where c.tipo='grupo' and chat_private.es_participante_directo(c.id)
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


create function chat_private.puede_canal(canal text) returns boolean language plpgsql stable security definer set search_path='' as $$
begin
 if canal !~ '^(realtime:)?mensajes:[0-9a-fA-F-]{36}$' then return false; end if;
 return chat_private.es_participante_directo(right(canal,36)::uuid);
exception when invalid_text_representation then return false;
end $$;
revoke all on function chat_private.puede_canal(text) from public,anon;
grant execute on function chat_private.puede_canal(text) to authenticated;
create policy chats_realtime_leer on realtime.messages for select to authenticated
 using(extension in ('presence','broadcast') and chat_private.puede_canal((select realtime.topic())));
create policy chats_realtime_enviar on realtime.messages for insert to authenticated
 with check(extension in ('presence','broadcast') and chat_private.puede_canal((select realtime.topic())));
