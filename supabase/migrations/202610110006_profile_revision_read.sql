-- Local preparation only. Owner-scoped current snapshot, not a release lock.
begin;
create function public.stylist_read_profile_revision()
returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); result jsonb;
begin
 if actor is null then raise exception 'unauthenticated' using errcode='42501'; end if;
 -- One statement gives a consistent MVCC snapshot of the profile and its signal.
 select jsonb_build_object('revision',coalesce(p.revision,0),'sequence',coalesce(c.sequence,0)) into result
 from (select actor as user_id) owner
 left join public.stylist_profiles p on p.user_id=owner.user_id
 left join lateral (select max(sequence) as sequence from stylist_private.profile_changes where user_id=owner.user_id) c on true;
 return result;
end $$;
revoke all on function public.stylist_read_profile_revision() from public,anon;
grant execute on function public.stylist_read_profile_revision() to authenticated;
commit;
