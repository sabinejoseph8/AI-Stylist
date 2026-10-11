-- Local preparation only. Deletes metadata, not storage objects.
begin;
create function public.stylist_delete_wardrobe(p_id uuid,p_expected_revision bigint,p_confirm boolean)
returns boolean language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid();
begin
 if actor is null then raise exception 'unauthenticated' using errcode='42501'; end if;
 if p_confirm is distinct from true then raise exception 'confirmation required' using errcode='22023'; end if;
 delete from public.stylist_wardrobe_items where id=p_id and user_id=actor and revision=p_expected_revision;
 if not found then raise exception 'record unavailable or stale' using errcode='40001'; end if;
 return true;
end $$;
revoke all on function public.stylist_delete_wardrobe(uuid,bigint,boolean) from public,anon;
grant execute on function public.stylist_delete_wardrobe(uuid,bigint,boolean) to authenticated;
commit;
