create extension if not exists pg_net with schema extensions;

create function chat_private.notificar_mensaje_nuevo()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
    endpoint text;
    secret text;
begin
    select decrypted_secret into endpoint from vault.decrypted_secrets where name = 'fwa_project_url';
    select decrypted_secret into secret from vault.decrypted_secrets where name = 'fwa_webhook_secret';
    if endpoint is null or secret is null then
        raise warning 'Falta configurar la notificación de mensajes';
        return new;
    end if;
    perform net.http_post(
        url := endpoint || '/functions/v1/notificar-mensaje',
        headers := pg_catalog.jsonb_build_object('Content-Type', 'application/json', 'x-webhook-secret', secret),
        body := pg_catalog.jsonb_build_object('mensaje_id', new.id)
    );
    return new;
exception when others then
    raise warning 'No se pudo solicitar la notificación de mensaje';
    return new;
end;
$$;
revoke all on function chat_private.notificar_mensaje_nuevo() from public, anon, authenticated;
create trigger notificar_mensaje_nuevo after insert on public.mensajes
    for each row execute function chat_private.notificar_mensaje_nuevo();
