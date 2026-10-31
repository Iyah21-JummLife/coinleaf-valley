-- Coinleaf Valley: one private row per saved document (each village, plus the
-- list of villages). Run this once in Supabase: SQL Editor → New query → Run.

create table if not exists public.docs (
  user_id    uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  path       text        not null,
  data       jsonb       not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, path)
);

-- Row-level security: a signed-in person can only ever see and change their own rows.
alter table public.docs enable row level security;

drop policy if exists "docs: read own"   on public.docs;
drop policy if exists "docs: insert own" on public.docs;
drop policy if exists "docs: update own" on public.docs;
drop policy if exists "docs: delete own" on public.docs;

create policy "docs: read own"   on public.docs for select to authenticated using (auth.uid() = user_id);
create policy "docs: insert own" on public.docs for insert to authenticated with check (auth.uid() = user_id);
create policy "docs: update own" on public.docs for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "docs: delete own" on public.docs for delete to authenticated using (auth.uid() = user_id);

revoke all on public.docs from anon;
grant select, insert, update, delete on public.docs to authenticated;
