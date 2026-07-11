-- ---------------------------------------------------------------------------
-- Private storage bucket for medical documents.
-- Object path convention: {owner_id}/{line_id}/{event_id}/{filename}
-- Access is owner-scoped via the first path segment (= auth.uid()).
-- Files are never public; the app serves them through short-lived signed URLs.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents',
  'documents',
  false,
  10485760, -- 10 MB
  array[
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/heic',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "documents_read_own" on storage.objects;
create policy "documents_read_own" on storage.objects
  for select using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "documents_insert_own" on storage.objects;
create policy "documents_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "documents_update_own" on storage.objects;
create policy "documents_update_own" on storage.objects
  for update using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "documents_delete_own" on storage.objects;
create policy "documents_delete_own" on storage.objects
  for delete using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
