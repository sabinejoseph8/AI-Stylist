-- LOCAL PREPARATION ONLY. Not applied to hosted Supabase.
-- No automatic persistence of session notes, transcripts or feedback.
begin;
create schema if not exists stylist_private;
revoke all on schema stylist_private from public, anon, authenticated;
create table public.stylist_media_assets (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 storage_key text not null unique,
 content_type text not null check (content_type in ('image/jpeg','image/png','image/webp')),
 width integer not null check (width between 1 and 8192),
 height integer not null check (height between 1 and 8192),
 created_at timestamptz not null default now(),
 revision bigint not null default 1 check (revision > 0),
 check (storage_key like user_id::text || '/%'),
 unique (id,user_id)
);
create index stylist_media_owner on public.stylist_media_assets(user_id);
alter table public.stylist_media_assets enable row level security;
alter table public.stylist_media_assets force row level security;
revoke all on public.stylist_media_assets from public, anon, authenticated;
grant select on public.stylist_media_assets to authenticated;
create policy media_owner_read on public.stylist_media_assets for select to authenticated
 using ((select auth.uid()) = user_id);
-- All writes withheld until controlled upload/save/deletion interfaces are implemented.
-- Bucket configuration is intentionally separate from the PostgreSQL-only rehearsal.
commit;
