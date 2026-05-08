-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: create cvs table for the CV builder
-- Run via: supabase db push  OR paste into Supabase SQL editor
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Extensions ----------------------------------------------------------------
create extension if not exists "uuid-ossp";

-- 2. Table --------------------------------------------------------------------
create table if not exists public.cvs (
  id               uuid        primary key default uuid_generate_v4(),
  user_id          uuid        not null references auth.users(id) on delete cascade,
  name             text        not null default 'Mon CV',
  data             jsonb       not null default '{}',
  template         text        not null default 'corso',
  accent           text        not null default '#7c3aed',
  lang             text        not null default 'fr',
  section_order    jsonb       not null default '["summary","experience","education","skills","languages","certifications","projects","interests"]',
  sections_enabled jsonb       not null default '{"summary":true,"experience":true,"education":true,"skills":true,"languages":true,"certifications":true,"projects":false,"interests":false}',
  updated_at       timestamptz not null default now()
);

comment on table public.cvs is
  'One row per CV document. The full CV payload lives in data (jsonb).';

comment on column public.cvs.data is
  'Serialised CVData (see app/cv/_lib/schema.ts). Validated on write by the application layer.';

comment on column public.cvs.section_order is
  'Ordered list of section IDs, e.g. ["summary","experience","education",…]';

comment on column public.cvs.sections_enabled is
  'Map of sectionId → boolean. False = hidden in the builder and in print.';

-- 3. Indexes ------------------------------------------------------------------
create index if not exists cvs_user_id_idx    on public.cvs (user_id);
create index if not exists cvs_updated_at_idx on public.cvs (updated_at desc);

-- 4. updated_at auto-maintenance ---------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql security definer as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists cvs_set_updated_at on public.cvs;
create trigger cvs_set_updated_at
  before update on public.cvs
  for each row execute function public.set_updated_at();

-- 5. Row-Level Security -------------------------------------------------------
alter table public.cvs enable row level security;

-- SELECT: own rows only
create policy "cvs: owner select"
  on public.cvs for select
  using (auth.uid() = user_id);

-- INSERT: must supply own user_id
create policy "cvs: owner insert"
  on public.cvs for insert
  with check (auth.uid() = user_id);

-- UPDATE: own rows only
create policy "cvs: owner update"
  on public.cvs for update
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- DELETE: own rows only
create policy "cvs: owner delete"
  on public.cvs for delete
  using (auth.uid() = user_id);

-- 6. Supabase Storage bucket for profile photos --------------------------------
-- Create via the Supabase dashboard OR un-comment if using the Storage API:
--
-- insert into storage.buckets (id, name, public)
-- values ('cv-photos', 'cv-photos', false)
-- on conflict (id) do nothing;
--
-- create policy "cv-photos: owner read"
--   on storage.objects for select
--   using (bucket_id = 'cv-photos' and auth.uid()::text = (storage.foldername(name))[1]);
--
-- create policy "cv-photos: owner write"
--   on storage.objects for insert
--   with check (bucket_id = 'cv-photos' and auth.uid()::text = (storage.foldername(name))[1]);
--
-- create policy "cv-photos: owner delete"
--   on storage.objects for delete
--   using (bucket_id = 'cv-photos' and auth.uid()::text = (storage.foldername(name))[1]);
