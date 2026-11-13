begin;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, supabase_auth_admin;

create table private.settings (
  singleton boolean primary key default true check (singleton),
  allowed_domain text not null check (allowed_domain = lower(allowed_domain))
);
insert into private.settings (allowed_domain) values ('hbplus.fit');

create function private.allowed_email(candidate text) returns boolean
language sql stable security definer set search_path = ''
as $$
  select coalesce(
    candidate ~ '^[^@[:space:]]+@[^@[:space:]]+$'
    and lower(split_part(candidate, '@', 2)) = (
      select allowed_domain from private.settings where singleton
    ), false
  );
$$;

create function private.verified_member(member uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from auth.users u
    join auth.identities i on i.user_id = u.id and i.provider = 'google'
    where u.id = member
      and u.email_confirmed_at is not null
      and private.allowed_email(u.email)
      and lower(i.identity_data->>'email') = lower(u.email)
      and i.identity_data->'email_verified' = 'true'::jsonb
  );
$$;

create function private.before_user_created(event jsonb) returns jsonb
language sql stable security definer set search_path = ''
as $$
  select case when private.allowed_email(event->'user'->>'email')
    and event#>>'{user,app_metadata,provider}' = 'google'
  then '{}'::jsonb
  else jsonb_build_object('error', jsonb_build_object(
    'http_code', 403,
    'message', 'Access restricted. Please login using your official domain email.'
  )) end;
$$;

create function private.before_token_issued(event jsonb) returns jsonb
language sql stable security definer set search_path = ''
as $$
  select case when private.verified_member((event->>'user_id')::uuid)
    and event->>'authentication_method' in ('oauth', 'token_refresh')
  then jsonb_build_object('claims', event->'claims')
  else jsonb_build_object('error', jsonb_build_object(
    'http_code', 403,
    'message', 'Access restricted. Please login using your official domain email.'
  )) end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
create policy read_own_profile on public.profiles for select to authenticated
using ((select auth.uid()) = id and (select private.verified_member(auth.uid())));

create function public.workspace_profile()
returns table (email text, role text, created_at timestamptz)
language plpgsql security definer set search_path = ''
as $$
declare
  member uuid := auth.uid();
begin
  if not private.verified_member(member) then
    raise insufficient_privilege using message =
      'Access restricted. Please login using your official domain email.';
  end if;

  insert into public.profiles (id) values (member) on conflict (id) do nothing;

  return query
    select u.email::text, p.role, p.created_at
    from auth.users u join public.profiles p on p.id = u.id
    where u.id = member;
end;
$$;

revoke execute on all functions in schema private from public, anon, authenticated;
grant execute on function private.before_user_created(jsonb), private.before_token_issued(jsonb)
  to supabase_auth_admin;
grant execute on function private.verified_member(uuid) to authenticated;
revoke execute on function public.workspace_profile() from public, anon, authenticated;
grant execute on function public.workspace_profile() to authenticated;

commit;
