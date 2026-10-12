-- Local preparation only. No Auth route, provider call or hosted activation.
begin;
create table stylist_private.consultation_slot (
 slot integer primary key check(slot=1),
 owner_id uuid references auth.users(id),
 session_id uuid,
 token uuid,
 fence bigint not null default 0,
 state text not null default 'free' check(state in ('free','reserved','provider')),
 expires_at timestamptz,
 check ((state='free' and owner_id is null and session_id is null and token is null and expires_at is null)
 or (state<>'free' and owner_id is not null and session_id is not null and token is not null and expires_at is not null))
);
insert into stylist_private.consultation_slot(slot) values(1);
revoke all on stylist_private.consultation_slot from public,anon,authenticated,service_role;
create function public.stylist_claim_consultation(p_owner uuid,p_session uuid,p_token uuid default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare s stylist_private.consultation_slot;
begin
 if p_owner is null or p_session is null or not exists(select 1 from auth.users where id=p_owner) then raise exception 'invalid consultation identity'; end if;
 select * into s from stylist_private.consultation_slot where slot=1 for update;
 if s.state<>'free' and s.owner_id=p_owner and s.session_id=p_session and s.token=p_token and s.expires_at>clock_timestamp() then
 return jsonb_build_object('sessionId',s.session_id,'token',s.token,'fence',s.fence,'state',s.state,'expiresAt',s.expires_at);
 end if;
 -- Only a reservation that has never permitted provider work may expire freely.
 if s.state<>'free' and not(s.state='reserved' and s.expires_at<=clock_timestamp()) then return null; end if;
 -- A failed reconnect must not silently create a replacement session.
 if p_token is not null then return null; end if;
 update stylist_private.consultation_slot set owner_id=p_owner,session_id=p_session,token=gen_random_uuid(),fence=fence+1,state='reserved',expires_at=clock_timestamp()+interval '60 seconds' where slot=1 returning * into s;
 return jsonb_build_object('sessionId',s.session_id,'token',s.token,'fence',s.fence,'state',s.state,'expiresAt',s.expires_at);
end $$;
create function public.stylist_update_consultation(p_owner uuid,p_session uuid,p_token uuid,p_fence bigint,p_action text,p_cleanup_verified boolean default false)
returns boolean language plpgsql security definer set search_path='' as $$
declare s stylist_private.consultation_slot;
begin
 select * into s from stylist_private.consultation_slot where slot=1 for update;
 if s.state='free' or p_owner is distinct from s.owner_id or p_session is distinct from s.session_id or p_token is distinct from s.token or p_fence is distinct from s.fence then return false; end if;
 if p_action='end' then
 if s.state='provider' and p_cleanup_verified is distinct from true then return false; end if;
 update stylist_private.consultation_slot set owner_id=null,session_id=null,token=null,state='free',expires_at=null where slot=1;
 return true;
 end if;
 if s.expires_at<=clock_timestamp() then return false; end if;
 if p_action='provider' and s.state='reserved' then
 -- Persist this BEFORE starting any provider request, including ambiguous failures.
 update stylist_private.consultation_slot set state='provider' where slot=1;
 return true;
 elsif p_action='heartbeat' then
 update stylist_private.consultation_slot set expires_at=clock_timestamp()+interval '60 seconds' where slot=1;
 return true;
 elsif p_action='check' then return true;
 end if;
 return false;
end $$;
revoke all on function public.stylist_claim_consultation(uuid,uuid,uuid) from public,anon,authenticated;
revoke all on function public.stylist_update_consultation(uuid,uuid,uuid,bigint,text,boolean) from public,anon,authenticated;
grant execute on function public.stylist_claim_consultation(uuid,uuid,uuid) to service_role;
grant execute on function public.stylist_update_consultation(uuid,uuid,uuid,bigint,text,boolean) to service_role;
commit;
