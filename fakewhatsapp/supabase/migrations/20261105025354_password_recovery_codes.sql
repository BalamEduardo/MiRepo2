create table public.password_recovery_codes (
    user_id uuid primary key references auth.users(id) on delete cascade,
    code_hash text not null unique check (code_hash ~ '^[0-9a-f]{64}$')
);
alter table public.password_recovery_codes enable row level security;
revoke all on public.password_recovery_codes from public, anon, authenticated;
grant select, insert, update, delete on public.password_recovery_codes to service_role;
