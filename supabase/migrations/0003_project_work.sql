-- Project work: the parts of a project that live outside the board document,
-- namely the decision log, experiments, the story map and sprints.
--
-- Each one is a single JSON document per project, saved whole (one upsert per
-- save), the same way the board is. They are kept out of the board document so
-- an autosave on one page never overwrites an edit made on another, and so
-- publishing, which freezes the board, doesn't carry them along.
--
-- There is no foreign key to product_boards on purpose: work can reach Supabase
-- before the board's first save does (a project made while Supabase was down,
-- or before it was connected). The app has no way to delete a project yet; when
-- it does, delete its rows here too.
--
-- Run after 0002_publishing.sql (`npm run db:push` runs them in order).

create table if not exists public.project_work (
  board_id   text        not null,
  kind       text        not null
             check (kind in ('decisions', 'experiments', 'story_map', 'sprints')),
  doc        jsonb       not null,
  updated_at timestamptz not null default now(),
  primary key (board_id, kind)
);

alter table public.project_work enable row level security;

-- NOTE: open to the anon key, like the board policies in 0001, because the app
-- has no auth yet. Replace with owner-scoped policies before real client data
-- goes in.
drop policy if exists project_work_anon_read on public.project_work;
create policy project_work_anon_read
  on public.project_work for select
  using (true);

drop policy if exists project_work_anon_write on public.project_work;
create policy project_work_anon_write
  on public.project_work for all
  using (true)
  with check (true);

-- Granted explicitly so the tables are reachable through the API whatever the
-- project's default privileges are. RLS above still decides which rows.
grant select, insert, update, delete on table public.product_boards to anon, authenticated;
grant select, insert, update, delete on table public.project_work to anon, authenticated;
