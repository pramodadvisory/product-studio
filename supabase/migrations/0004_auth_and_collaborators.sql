-- Sign-in, project owners and collaborators.
--
-- Until now every table was open to the anon key. From here on a project is
-- reachable only by the people on it:
--
--   owner   the person who created it. Manages collaborators.
--   editor  changes content and publishes.
--   viewer  reads only.
--
-- Membership lives in `project_members`, which also carries the organisation
-- a collaborator is tagged with on that project (a label, e.g. "Acme" or
-- "Ascendion"; it grants nothing). People are added by the email they signed
-- up with, so only existing accounts can be added.
--
-- Project ids stay global (one row per project, shared by everyone on it).
-- The sample project is never stored here: it has the same id for everyone,
-- so it stays in each person's browser (see src/lib/product-board/storage.ts).
--
-- Run after 0003_project_work.sql (`npm run db:push` runs them in order).

-- ---------------------------------------------------------------------------
-- Profiles: the part of each account other people on a project can see.
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id         uuid        primary key references auth.users(id) on delete cascade,
  email      text        not null,
  full_name  text        check (full_name is null or char_length(full_name) <= 120),
  created_at timestamptz not null default now()
);

create unique index if not exists profiles_email_key on public.profiles (lower(email));

alter table public.profiles enable row level security;

-- ---------------------------------------------------------------------------
-- Owners and members.
-- ---------------------------------------------------------------------------

-- Nullable so rows saved before sign-in existed can be claimed (see
-- handle_new_user). Rows with no owner are invisible to everyone.
alter table public.product_boards
  add column if not exists owner_id uuid default auth.uid() references auth.users(id) on delete cascade;

create index if not exists product_boards_owner_idx on public.product_boards (owner_id);

create table if not exists public.project_members (
  board_id     text        not null references public.product_boards(id) on delete cascade,
  user_id      uuid        not null references public.profiles(id) on delete cascade,
  role         text        not null check (role in ('owner', 'editor', 'viewer')),
  organisation text        check (organisation is null or char_length(organisation) <= 120),
  added_by     uuid        references auth.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  primary key (board_id, user_id)
);

create unique index if not exists project_members_one_owner on public.project_members (board_id) where role = 'owner';
create index if not exists project_members_user_idx on public.project_members (user_id);

alter table public.project_members enable row level security;

-- The signed-in person's role on a project, or null. Security definer so the
-- policies below can use it without recursing through project_members' own.
create or replace function public.project_role(p_board_id text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select m.role
  from public.project_members m
  where m.board_id = p_board_id and m.user_id = (select auth.uid());
$$;

-- Every project the signed-in person is on, with their role.
create or replace function public.my_project_roles()
returns table (board_id text, role text)
language sql
stable
security definer
set search_path = ''
as $$
  select m.board_id, m.role
  from public.project_members m
  where m.user_id = (select auth.uid());
$$;

-- True when the signed-in person and `p_user` are on at least one project together.
create or replace function public.shares_project_with(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.project_members mine
    join public.project_members theirs on theirs.board_id = mine.board_id
    where mine.user_id = (select auth.uid()) and theirs.user_id = p_user
  );
$$;

-- A new account gets a profile. The very first account also claims anything
-- saved before sign-in existed, so it isn't stranded with no owner.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''))
  on conflict (id) do nothing;

  if (select count(*) from auth.users) = 1 then
    update public.product_boards set owner_id = new.id where owner_id is null;
    insert into public.project_members (board_id, user_id, role)
    select b.id, new.id, 'owner' from public.product_boards b where b.owner_id = new.id
    on conflict (board_id, user_id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Accounts made before this migration get a profile too.
insert into public.profiles (id, email, full_name)
select u.id, u.email, nullif(btrim(u.raw_user_meta_data ->> 'full_name'), '')
from auth.users u
where u.email is not null
on conflict (id) do nothing;

-- Keep the profile's email in step when someone changes theirs.
create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row when (old.email is distinct from new.email)
  execute function public.handle_user_email_change();

-- Whoever creates a project is its owner.
create or replace function public.handle_new_board()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.owner_id is not null then
    insert into public.project_members (board_id, user_id, role)
    values (new.id, new.owner_id, 'owner')
    on conflict (board_id, user_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_board_created on public.product_boards;
create trigger on_board_created
  after insert on public.product_boards
  for each row execute function public.handle_new_board();

-- ---------------------------------------------------------------------------
-- Access rules. The anon key gets nothing; only signed-in people on a project.
-- ---------------------------------------------------------------------------

revoke all on public.product_boards, public.project_work, public.board_publications,
  public.project_members, public.profiles from anon;

-- product_boards ------------------------------------------------------------
drop policy if exists product_boards_anon_read on public.product_boards;
drop policy if exists product_boards_anon_write on public.product_boards;

drop policy if exists product_boards_read on public.product_boards;
create policy product_boards_read on public.product_boards
  for select to authenticated
  using (owner_id = (select auth.uid()) or public.project_role(id) is not null);

drop policy if exists product_boards_create on public.product_boards;
create policy product_boards_create on public.product_boards
  for insert to authenticated
  with check (owner_id = (select auth.uid()));

drop policy if exists product_boards_edit on public.product_boards;
create policy product_boards_edit on public.product_boards
  for update to authenticated
  using (public.project_role(id) in ('owner', 'editor'))
  with check (public.project_role(id) in ('owner', 'editor'));

drop policy if exists product_boards_delete on public.product_boards;
create policy product_boards_delete on public.product_boards
  for delete to authenticated
  using (public.project_role(id) = 'owner');

-- The owner and the publishing columns are only ever set by the database
-- (the default, and the functions in 0002), never by the app.
revoke insert, update on public.product_boards from authenticated;
grant insert (id, product_name, status, doc, updated_at) on public.product_boards to authenticated;
grant update (id, product_name, status, doc, updated_at) on public.product_boards to authenticated;

-- project_work --------------------------------------------------------------
drop policy if exists project_work_anon_read on public.project_work;
drop policy if exists project_work_anon_write on public.project_work;

drop policy if exists project_work_read on public.project_work;
create policy project_work_read on public.project_work
  for select to authenticated
  using (public.project_role(board_id) is not null);

drop policy if exists project_work_create on public.project_work;
create policy project_work_create on public.project_work
  for insert to authenticated
  with check (public.project_role(board_id) in ('owner', 'editor'));

drop policy if exists project_work_edit on public.project_work;
create policy project_work_edit on public.project_work
  for update to authenticated
  using (public.project_role(board_id) in ('owner', 'editor'))
  with check (public.project_role(board_id) in ('owner', 'editor'));

drop policy if exists project_work_delete on public.project_work;
create policy project_work_delete on public.project_work
  for delete to authenticated
  using (public.project_role(board_id) = 'owner');

-- project_members -----------------------------------------------------------
-- Added through add_collaborator() below; the owner row by handle_new_board().
drop policy if exists project_members_read on public.project_members;
create policy project_members_read on public.project_members
  for select to authenticated
  using (public.project_role(board_id) is not null);

-- The owner changes anyone's organisation, and collaborators' roles. The check
-- keeps the owner's own row as owner and makes no one else owner, so a
-- project always has exactly its one owner.
drop policy if exists project_members_edit on public.project_members;
create policy project_members_edit on public.project_members
  for update to authenticated
  using (public.project_role(board_id) = 'owner')
  with check ((role = 'owner') = (user_id = (select auth.uid())));

-- The owner removes a collaborator, or a collaborator leaves.
drop policy if exists project_members_remove on public.project_members;
create policy project_members_remove on public.project_members
  for delete to authenticated
  using (role <> 'owner' and (public.project_role(board_id) = 'owner' or user_id = (select auth.uid())));

revoke insert, update on public.project_members from authenticated;
grant update (role, organisation) on public.project_members to authenticated;

-- profiles ------------------------------------------------------------------
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or public.shares_project_with(id));

drop policy if exists profiles_edit_own on public.profiles;
create policy profiles_edit_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Email comes from the account, so people can only change their name.
revoke insert, update, delete on public.profiles from authenticated;
grant update (full_name) on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- Adding a collaborator, by the email they signed up with.
-- ---------------------------------------------------------------------------

create or replace function public.add_collaborator(
  p_board_id text,
  p_email text,
  p_role text,
  p_organisation text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user public.profiles%rowtype;
begin
  if public.project_role(p_board_id) is distinct from 'owner' then
    raise exception 'Only the project owner can add people' using errcode = '42501';
  end if;
  if p_role not in ('editor', 'viewer') then
    raise exception 'Role must be editor or viewer' using errcode = '22023';
  end if;

  select * into v_user from public.profiles p where lower(p.email) = lower(btrim(p_email));
  if not found then
    raise exception 'No one has signed up with that email yet' using errcode = 'P0002';
  end if;
  if v_user.id = (select auth.uid()) then
    raise exception 'You already own this project' using errcode = '22023';
  end if;

  insert into public.project_members (board_id, user_id, role, organisation, added_by)
  values (p_board_id, v_user.id, p_role, nullif(btrim(p_organisation), ''), (select auth.uid()))
  on conflict (board_id, user_id) do update
    set role = excluded.role, organisation = excluded.organisation
    where public.project_members.role <> 'owner';

  return jsonb_build_object(
    'userId', v_user.id,
    'email', v_user.email,
    'fullName', v_user.full_name,
    'role', p_role,
    'organisation', nullif(btrim(p_organisation), '')
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Publishing (0002) now checks who is asking. Viewers of a published link
-- still need no account: get_published stays open.
-- ---------------------------------------------------------------------------

create or replace function public.publish_board(p_board_id text, p_doc jsonb, p_note text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_slug    text;
  v_version int;
  v_at      timestamptz;
begin
  if public.project_role(p_board_id) is null then
    raise exception 'Project % has not been saved yet', p_board_id using errcode = 'P0002';
  end if;
  if public.project_role(p_board_id) not in ('owner', 'editor') then
    raise exception 'Viewers can''t publish' using errcode = '42501';
  end if;

  select b.publish_slug into v_slug
  from public.product_boards b
  where b.id = p_board_id
  for update;

  select coalesce(max(p.version), 0) + 1 into v_version
  from public.board_publications p
  where p.board_id = p_board_id;

  -- 20 hex characters from a v4 UUID (about 74 random bits): unguessable, and
  -- short enough to paste.
  if v_slug is null then
    v_slug := left(replace(gen_random_uuid()::text, '-', ''), 20);
  end if;

  insert into public.board_publications as p (board_id, version, doc, note)
  values (p_board_id, v_version, p_doc, nullif(btrim(p_note), ''))
  returning p.published_at into v_at;

  update public.product_boards b
  set publish_slug = v_slug, published_version = v_version
  where b.id = p_board_id;

  return jsonb_build_object('slug', v_slug, 'version', v_version, 'publishedAt', v_at);
end;
$$;

create or replace function public.unpublish_board(p_board_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.project_role(p_board_id) is distinct from 'owner'
     and public.project_role(p_board_id) is distinct from 'editor' then
    raise exception 'Only the owner or an editor can take a project offline' using errcode = '42501';
  end if;
  update public.product_boards set published_version = null where id = p_board_id;
end;
$$;

create or replace function public.publication_status(p_board_id text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'slug', b.publish_slug,
    'liveVersion', b.published_version,
    'latestVersion', (select max(q.version) from public.board_publications q where q.board_id = b.id),
    'publishedAt', p.published_at,
    'sourceUpdatedAt', p.doc ->> 'updatedAt'
  )
  from public.product_boards b
  left join public.board_publications p
    on p.board_id = b.id and p.version = b.published_version
  where b.id = p_board_id and public.project_role(b.id) is not null;
$$;

-- Supabase grants new functions to anon by default, so take each one back
-- explicitly; only the public link stays open to people who aren't signed in.
revoke all on function public.project_role(text) from public, anon;
revoke all on function public.my_project_roles() from public, anon;
revoke all on function public.shares_project_with(uuid) from public, anon;
revoke all on function public.add_collaborator(text, text, text, text) from public, anon;
revoke all on function public.publish_board(text, jsonb, text) from public, anon;
revoke all on function public.unpublish_board(text) from public, anon;
revoke all on function public.publication_status(text) from public, anon;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.handle_user_email_change() from public, anon, authenticated;
revoke all on function public.handle_new_board() from public, anon, authenticated;

grant execute on function public.project_role(text) to authenticated;
grant execute on function public.my_project_roles() to authenticated;
grant execute on function public.shares_project_with(uuid) to authenticated;
grant execute on function public.add_collaborator(text, text, text, text) to authenticated;
grant execute on function public.publish_board(text, jsonb, text) to authenticated;
grant execute on function public.unpublish_board(text) to authenticated;
grant execute on function public.publication_status(text) to authenticated;
grant execute on function public.get_published(text) to anon, authenticated;
