create policy avatares_eliminar_propio on storage.objects for delete to authenticated
    using (bucket_id = 'avatares' and name = (select auth.uid())::text || '.jpg');
