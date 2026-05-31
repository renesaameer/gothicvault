insert into storage.buckets (id, name, public) values ('media', 'media', true) on conflict (id) do nothing;

create policy "Public read media"
on storage.objects for select
to public
using (bucket_id = 'media');

create policy "Staff upload media"
on storage.objects for insert
to authenticated
with check (bucket_id = 'media' and public.is_admin_or_staff(auth.uid()));

create policy "Staff update media"
on storage.objects for update
to authenticated
using (bucket_id = 'media' and public.is_admin_or_staff(auth.uid()));

create policy "Staff delete media"
on storage.objects for delete
to authenticated
using (bucket_id = 'media' and public.is_admin_or_staff(auth.uid()));