create table public.perfiles (
    id uuid primary key references auth.users (id) on delete cascade,
    nombre text not null check (btrim(nombre) <> ''),
    creado_en timestamptz not null default now()
);

create table public.dispositivos (
    id uuid primary key default gen_random_uuid(),
    perfil_id uuid not null references public.perfiles (id) on delete cascade,
    nombre text,
    creado_en timestamptz not null default now()
);

create table public.conversaciones (
    id uuid primary key default gen_random_uuid(),
    tipo text not null check (tipo in ('directa', 'grupo')),
    nombre text,
    creada_en timestamptz not null default now()
);

create table public.conversaciones_miembros (
    conversacion_id uuid not null references public.conversaciones (id) on delete cascade,
    perfil_id uuid not null references public.perfiles (id) on delete cascade,
    unido_en timestamptz not null default now(),
    primary key (conversacion_id, perfil_id)
);

create table public.mensajes (
    id uuid primary key default gen_random_uuid(),
    conversacion_id uuid not null references public.conversaciones (id) on delete cascade,
    remitente_id uuid not null,
    contenido text not null check (btrim(contenido) <> ''),
    enviado_en timestamptz not null default now(),
    foreign key (conversacion_id, remitente_id)
        references public.conversaciones_miembros (conversacion_id, perfil_id)
);

create index dispositivos_perfil_id_idx on public.dispositivos (perfil_id);
create index conversaciones_miembros_perfil_id_idx on public.conversaciones_miembros (perfil_id);
create index mensajes_conversacion_remitente_idx on public.mensajes (conversacion_id, remitente_id);
create index mensajes_conversacion_enviado_en_idx on public.mensajes (conversacion_id, enviado_en, id);

alter table public.perfiles enable row level security;
alter table public.dispositivos enable row level security;
alter table public.conversaciones enable row level security;
alter table public.conversaciones_miembros enable row level security;
alter table public.mensajes enable row level security;

revoke all privileges on table public.perfiles, public.dispositivos, public.conversaciones,
    public.conversaciones_miembros, public.mensajes from public, anon, authenticated;
