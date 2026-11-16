-- Publishing: a read-only copy of a project that anyone with the link can view.
--
-- Publishing freezes the board document as a numbered version. Viewers only
-- ever see the live version's frozen copy, never the draft the PM keeps
-- editing. Every version is kept, so the published page can say what changed
-- since the one before.
--
-- Viewers and the editor go through the functions below, never the tables:
-- `board_publications` has RLS on and no policies, so the anon key can't list
-- other projects' copies. The functions run as their owner (security definer).
--
-- Run this in the Supabase SQL editor after 0001_product_boards.sql.

create table if not exists public.board_publications (
  board_id     text        not null references public.product_boards(id) on delete cascade,
  version      int         not null,
  doc          jsonb       not null,
  -- The publisher's "what changed" note for readers. Optional.
  note         text,
  published_at timestamptz not null default now(),
  primary key (board_id, version)
);

alter table public.board_publications enable row level security;

-- The link stays the same across versions, and across unpublish/republish.
alter table public.product_boards add column if not exists publish_slug text unique;
-- The version viewers see. Null means not published (the link shows "not available").
alter table public.product_boards add column if not exists published_version int;

-- NOTE: like the board policies in 0001, these functions are open to anyone
-- with the anon key because the app has no auth yet. Once it does, check
-- `auth.uid()` against the board's owner in publish_board, unpublish_board and
-- publication_status. get_published stays open: it is the public link.

-- Freeze `p_doc` as the next version and make it the live one.
-- The client sends the document it is showing, so what the PM sees is exactly
-- what gets published, even if the last autosave is still in flight.
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
  select b.publish_slug into v_slug
  from public.product_boards b
  where b.id = p_board_id
  for update;

  if not found then
    raise exception 'Project % has not been saved yet', p_board_id using errcode = 'P0002';
  end if;

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

-- Take the link offline. The versions and the slug are kept, so publishing
-- again brings the same link back.
create or replace function public.unpublish_board(p_board_id text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.product_boards set published_version = null where id = p_board_id;
$$;

-- What the editor needs to show the Publish button's state.
-- `sourceUpdatedAt` is the board's own updatedAt inside the live copy: if the
-- draft's updatedAt is newer, there are unpublished changes.
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
  where b.id = p_board_id;
$$;

-- The public link: the live copy, plus the version before it so the page can
-- say what changed. Null when the slug is unknown or the project is unpublished.
create or replace function public.get_published(p_slug text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'version', p.version,
    'doc', p.doc,
    'note', p.note,
    'publishedAt', p.published_at,
    'previous', (
      select jsonb_build_object('version', q.version, 'doc', q.doc, 'publishedAt', q.published_at)
      from public.board_publications q
      where q.board_id = p.board_id and q.version < p.version
      order by q.version desc
      limit 1
    )
  )
  from public.product_boards b
  join public.board_publications p
    on p.board_id = b.id and p.version = b.published_version
  where b.publish_slug = p_slug;
$$;

revoke all on function public.publish_board(text, jsonb, text) from public;
revoke all on function public.unpublish_board(text) from public;
revoke all on function public.publication_status(text) from public;
revoke all on function public.get_published(text) from public;

grant execute on function public.publish_board(text, jsonb, text) to anon, authenticated;
grant execute on function public.unpublish_board(text) to anon, authenticated;
grant execute on function public.publication_status(text) to anon, authenticated;
grant execute on function public.get_published(text) to anon, authenticated;
