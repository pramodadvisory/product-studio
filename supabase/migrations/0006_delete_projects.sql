-- Deleting a project, and making sure it stays deleted.
--
-- Only the owner can delete a project, and only through delete_project(). It
-- removes the project's work (project_work has no foreign key, see 0003),
-- then the board, which takes its members and published versions with it.
--
-- The app keeps a copy of each project in the browser and sends up any copy
-- Supabase hasn't got. A browser that last saw the project before it was
-- deleted would otherwise re-create it, owned by whoever opened it. So each
-- deleted id is remembered here, and a board with that id can't be created
-- again. Ids are random, so a new project never collides with an old one.
--
-- Leaving a project needs nothing new: 0004 already lets a collaborator
-- delete their own project_members row.
--
-- Run after 0005_claim_unowned_projects.sql (`npm run db:push` runs them in order).

create table if not exists public.deleted_projects (
  board_id   text        primary key,
  deleted_by uuid        references auth.users(id) on delete set null,
  deleted_at timestamptz not null default now()
);

-- No policies: only the functions below read or write it.
alter table public.deleted_projects enable row level security;
revoke all on public.deleted_projects from anon, authenticated;

create or replace function public.is_deleted_project(p_board_id text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.deleted_projects d where d.board_id = p_board_id);
$$;

-- A deleted project's id can't be used again.
drop policy if exists product_boards_create on public.product_boards;
create policy product_boards_create on public.product_boards
  for insert to authenticated
  with check (owner_id = (select auth.uid()) and not public.is_deleted_project(id));

-- Deleting goes through delete_project() only, so the work rows and the
-- record above are never skipped.
drop policy if exists product_boards_delete on public.product_boards;
revoke delete on public.product_boards from authenticated;

create or replace function public.delete_project(p_board_id text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if public.project_role(p_board_id) is distinct from 'owner' then
    raise exception 'Only the project owner can delete it' using errcode = '42501';
  end if;

  insert into public.deleted_projects (board_id, deleted_by)
  values (p_board_id, (select auth.uid()))
  on conflict (board_id) do nothing;

  delete from public.project_work where board_id = p_board_id;
  -- Cascades to project_members and board_publications.
  delete from public.product_boards where id = p_board_id;
end;
$$;

revoke all on function public.is_deleted_project(text) from public, anon;
revoke all on function public.delete_project(text) from public, anon;
grant execute on function public.is_deleted_project(text) to authenticated;
grant execute on function public.delete_project(text) to authenticated;
