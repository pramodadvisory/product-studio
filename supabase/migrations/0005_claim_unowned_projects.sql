-- Projects saved before sign-in existed have no owner, so no one can see them.
-- 0004 hands them to the first account to sign up, but only for accounts made
-- after it ran. This covers an account that already existed: when there is
-- exactly one account, it claims every project without an owner.
--
-- Safe to re-run: it does nothing once projects have owners, or once a second
-- account exists.

do $$
declare
  v_only uuid;
begin
  if (select count(*) from auth.users) <> 1 then
    return;
  end if;
  select id into v_only from auth.users;

  update public.product_boards set owner_id = v_only where owner_id is null;

  insert into public.project_members (board_id, user_id, role)
  select b.id, v_only, 'owner'
  from public.product_boards b
  where b.owner_id = v_only
  on conflict (board_id, user_id) do nothing;
end $$;
