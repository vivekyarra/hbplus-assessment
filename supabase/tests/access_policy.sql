-- Run only against the dedicated assessment project. All fixtures roll back.
begin;

do $$
declare
  hook_name text := 'private.before_user_created';
  denied text := 'Access restricted. Please login using your official domain email.';
  event jsonb;
begin
  if not private.allowed_email('example@hbplus.fit')
    or not private.allowed_email('Example@HBPLUS.FIT')
    or private.allowed_email('example@gmail.com')
    or private.allowed_email('example@hbplus.fit.evil.test')
    or private.allowed_email('example@staff.hbplus.fit')
    or private.allowed_email('example@@hbplus.fit')
    or private.allowed_email(' example@hbplus.fit')
    or private.allowed_email(null)
  then raise exception 'Exact domain checks failed'; end if;

  event := '{"user":{"email":"example@gmail.com","app_metadata":{"provider":"google"}}}';
  if private.before_user_created(event)#>>'{error,message}' is distinct from denied then
    raise exception '% did not return the required rejection', hook_name;
  end if;
  event := '{"user":{"email":"example@hbplus.fit","app_metadata":{"provider":"google"}}}';
  if private.before_user_created(event) <> '{}'::jsonb then
    raise exception '% rejected an eligible signup', hook_name;
  end if;

  if has_function_privilege('anon', 'public.workspace_profile()', 'execute')
    or has_table_privilege('authenticated', 'public.profiles', 'UPDATE')
  then raise exception 'Unexpected public profile privileges'; end if;
end;
$$;

insert into auth.users (id, email, email_confirmed_at)
values ('7ffbf601-0000-4000-8000-000000000001', 'policy-test@hbplus.fit', now()),
       ('7ffbf601-0000-4000-8000-000000000002', 'policy-test@gmail.com', now()),
       ('7ffbf601-0000-4000-8000-000000000003', 'unverified-test@hbplus.fit', now());

insert into auth.identities (id, user_id, provider, provider_id, identity_data)
select gen_random_uuid(), id, 'google', id::text,
  jsonb_build_object('sub', id::text, 'email', email, 'email_verified', id::text not like '%003')
from auth.users where id::text like '7ffbf601-0000-4000-8000-00000000000%';

do $$
declare
  accepted jsonb := '{"user_id":"7ffbf601-0000-4000-8000-000000000001","authentication_method":"oauth","claims":{"sub":"fixture"}}';
begin
  if private.before_token_issued(accepted) <> '{"claims":{"sub":"fixture"}}'::jsonb
    or private.before_token_issued(jsonb_set(accepted, '{authentication_method}', '"token_refresh"')) ? 'error'
    or not private.before_token_issued(jsonb_set(accepted, '{authentication_method}', '"password"')) ? 'error'
    or not private.before_token_issued(jsonb_set(accepted, '{user_id}', '"7ffbf601-0000-4000-8000-000000000002"')) ? 'error'
    or not private.before_token_issued(jsonb_set(accepted, '{user_id}', '"7ffbf601-0000-4000-8000-000000000003"')) ? 'error'
  then raise exception 'Token issuance policy failed'; end if;
end;
$$;

set local role authenticated;
select set_config('request.jwt.claim.sub', '7ffbf601-0000-4000-8000-000000000001', true);
do $$
begin
  if not exists (select 1 from public.workspace_profile() where role = 'user' and email = 'policy-test@hbplus.fit')

  then raise exception 'Eligible user profile missing'; end if;
end;
$$;

do $$
begin
  if (select count(*) from public.profiles) <> 1 then
    raise exception 'Eligible user could not read their own profile';
  end if;
end;
$$;
select set_config('request.jwt.claim.sub', '7ffbf601-0000-4000-8000-000000000002', true);
do $$
begin
  if exists (select 1 from public.profiles) then raise exception 'Profile RLS failed'; end if;
  begin
    perform public.workspace_profile();
    raise exception 'Unauthorized profile lookup succeeded';
  exception when insufficient_privilege then null;
  end;
end;
$$;

rollback;
