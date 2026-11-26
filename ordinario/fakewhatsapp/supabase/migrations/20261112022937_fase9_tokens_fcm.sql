create table public.tokens_fcm (
    usuario_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
    instalacion_id uuid not null,
    token text not null check (length(token) between 1 and 4096),
    actualizado_en timestamptz not null default now(),
    primary key (usuario_id, instalacion_id)
);
alter table public.tokens_fcm enable row level security;
revoke all on public.tokens_fcm from public, anon, authenticated;
grant select, insert, update, delete on public.tokens_fcm to authenticated;
create policy tokens_fcm_propios on public.tokens_fcm for all to authenticated
    using (usuario_id = (select auth.uid()))
    with check (usuario_id = (select auth.uid()));
