-- Local preparation only. No hosted application or real credential writes.
begin;
create table stylist_private.refresh_ownership (
 owner_id uuid not null references auth.users(id) on delete cascade,
 session_id uuid primary key references auth.sessions(id) on delete cascade,
 generation bigint not null check(generation between 1 and 9007199254740991),
 expires_at_ms bigint not null check(expires_at_ms between 1 and 9007199254740991),
 envelope jsonb not null check(
  jsonb_typeof(envelope)='object' and octet_length(envelope::text)<=12000
  and envelope ?& array['version','keyId','nonce','ciphertext','tag']
  and envelope-array['version','keyId','nonce','ciphertext','tag']='{}'::jsonb
  and envelope->'version'='1'::jsonb
  and jsonb_typeof(envelope->'keyId')='string' and envelope->>'keyId' ~ '^[A-Za-z0-9_-]{1,64}$'
  and jsonb_typeof(envelope->'nonce')='string' and envelope->>'nonce' ~ '^[A-Za-z0-9_-]{16}$'
  and jsonb_typeof(envelope->'tag')='string' and envelope->>'tag' ~ '^[A-Za-z0-9_-]{22}$'
  and jsonb_typeof(envelope->'ciphertext')='string' and length(envelope->>'ciphertext') between 1 and 10923 and envelope->>'ciphertext' ~ '^[A-Za-z0-9_-]+$'
 ),
 state text not null check(state in ('ready','rotating','held')),
 lease_id uuid,
 check((state='ready' and lease_id is null) or (state in ('rotating','held') and lease_id is not null))
);
alter table stylist_private.refresh_ownership enable row level security;
revoke all on stylist_private.refresh_ownership from public,anon,authenticated,service_role;
create function public.stylist_adopt_refresh(p_owner uuid,p_session uuid,p_expiry bigint,p_envelope jsonb)
returns boolean language plpgsql security definer set search_path='' as $$
begin
 if public.stylist_auth_session_active(p_owner,p_session) is distinct from true or p_expiry<=extract(epoch from clock_timestamp())*1000 then return false; end if;
 insert into stylist_private.refresh_ownership values(p_owner,p_session,1,p_expiry,p_envelope,'ready',null) on conflict(session_id) do nothing;
 return found;
end $$;
-- Service-only reconciliation may inspect held or revoked-session state; no customer read grant.
create function public.stylist_inspect_refresh(p_owner uuid,p_session uuid)
returns jsonb language sql stable security definer set search_path='' as $$
 select to_jsonb(value) from stylist_private.refresh_ownership value where value.owner_id=p_owner and value.session_id=p_session;
$$;
create function public.stylist_claim_refresh(p_owner uuid,p_session uuid,p_generation bigint)
returns jsonb language plpgsql security definer set search_path='' as $$
declare value stylist_private.refresh_ownership;
begin
 if public.stylist_auth_session_active(p_owner,p_session) is distinct from true then return null; end if;
 update stylist_private.refresh_ownership set state='rotating',lease_id=gen_random_uuid()
 where owner_id=p_owner and session_id=p_session and generation=p_generation and state='ready'
  and expires_at_ms>extract(epoch from clock_timestamp())*1000 returning * into value;
 if not found then return null; end if;
 return to_jsonb(value);
end $$;
create function public.stylist_finish_refresh(p_owner uuid,p_session uuid,p_generation bigint,p_lease uuid,p_expiry bigint,p_envelope jsonb)
returns boolean language plpgsql security definer set search_path='' as $$
begin
 if public.stylist_auth_session_active(p_owner,p_session) is distinct from true or p_expiry<=extract(epoch from clock_timestamp())*1000 then return false; end if;
 update stylist_private.refresh_ownership set generation=generation+1,expires_at_ms=p_expiry,envelope=p_envelope,state='ready',lease_id=null
 where owner_id=p_owner and session_id=p_session and generation=p_generation and generation<9007199254740991 and lease_id=p_lease and state='rotating';
 return found;
end $$;
create function public.stylist_hold_refresh(p_owner uuid,p_session uuid,p_generation bigint,p_lease uuid)
returns boolean language plpgsql security definer set search_path='' as $$
begin
 update stylist_private.refresh_ownership set state='held'
 where owner_id=p_owner and session_id=p_session and generation=p_generation and lease_id=p_lease and state='rotating';
 return found;
end $$;
-- The trusted caller must actually verify provider revocation before asking to remove state.
create function public.stylist_remove_refresh(p_owner uuid,p_session uuid,p_generation bigint,p_lease uuid,p_revoked boolean)
returns boolean language plpgsql security definer set search_path='' as $$
begin
 if p_revoked is distinct from true then return false; end if;
 delete from stylist_private.refresh_ownership where owner_id=p_owner and session_id=p_session and generation=p_generation and lease_id is not distinct from p_lease;
 return found;
end $$;
revoke all on function public.stylist_adopt_refresh(uuid,uuid,bigint,jsonb),public.stylist_inspect_refresh(uuid,uuid),public.stylist_claim_refresh(uuid,uuid,bigint),public.stylist_finish_refresh(uuid,uuid,bigint,uuid,bigint,jsonb),public.stylist_hold_refresh(uuid,uuid,bigint,uuid),public.stylist_remove_refresh(uuid,uuid,bigint,uuid,boolean) from public,anon,authenticated;
grant execute on function public.stylist_adopt_refresh(uuid,uuid,bigint,jsonb),public.stylist_inspect_refresh(uuid,uuid),public.stylist_claim_refresh(uuid,uuid,bigint),public.stylist_finish_refresh(uuid,uuid,bigint,uuid,bigint,jsonb),public.stylist_hold_refresh(uuid,uuid,bigint,uuid),public.stylist_remove_refresh(uuid,uuid,bigint,uuid,boolean) to service_role;
commit;
