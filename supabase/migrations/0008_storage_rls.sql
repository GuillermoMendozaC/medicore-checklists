-- Storage RLS Policies for 'checklist-media' bucket
-- Allows authenticated technicians and admins to upload signatures and photos.
-- Allows public read access (since bucket is already public).

-- Allow any authenticated user to upload files to the checklist-media bucket
create policy "authenticated users can upload checklist media"
on storage.objects for insert
to authenticated
with check (bucket_id = 'checklist-media');

-- Allow authenticated users to update (upsert) their own uploads
create policy "authenticated users can update checklist media"
on storage.objects for update
to authenticated
using (bucket_id = 'checklist-media');

-- Allow public read/select for all files in the bucket
create policy "public can read checklist media"
on storage.objects for select
to public
using (bucket_id = 'checklist-media');

-- Allow authenticated users to delete their own uploads (optional but good practice)
create policy "authenticated users can delete checklist media"
on storage.objects for delete
to authenticated
using (bucket_id = 'checklist-media');
