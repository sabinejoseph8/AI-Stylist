-- LOCAL PREPARATION ONLY. Requires Supabase Storage schema.
begin;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values ('stylist-wardrobe','stylist-wardrobe',false,10485760,array['image/jpeg','image/png','image/webp']);
-- Only the server creates/removes objects after validating actual image bytes.
-- No anonymous access, browser upload, overwrite or delete policy is granted.
create policy stylist_wardrobe_owner_read on storage.objects for select to authenticated
 using (bucket_id='stylist-wardrobe' and split_part(name,'/',1)=(select auth.uid())::text);
commit;
