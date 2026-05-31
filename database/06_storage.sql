-- ============================================================================
-- 06 — Storage: media bucket + object policies
-- ============================================================================

insert into storage.buckets (id, name, public) values ('media','media',true)
on conflict (id) do update set public = true;

drop policy if exists "Public read media" on storage.objects;
create policy "Public read media" on storage.objects for select using (bucket_id = 'media');

drop policy if exists "Staff upload media" on storage.objects;
create policy "Staff upload media" on storage.objects for insert with check (bucket_id = 'media' and public.is_admin_or_staff(auth.uid()));

drop policy if exists "Staff update media" on storage.objects;
create policy "Staff update media" on storage.objects for update using (bucket_id = 'media' and public.is_admin_or_staff(auth.uid()));

drop policy if exists "Staff delete media" on storage.objects;
create policy "Staff delete media" on storage.objects for delete using (bucket_id = 'media' and public.is_admin_or_staff(auth.uid()));