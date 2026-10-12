-- Prepared only. Aggregate metadata, no IP, email, account ID or request content.
begin;
create table stylist_private.account_admission (
 slot integer primary key check(slot=1),
 window_started timestamptz not null,
 used integer not null check(used between 0 and 60)
);
insert into stylist_private.account_admission values(1,clock_timestamp(),0);
alter table stylist_private.account_admission enable row level security;
revoke all on stylist_private.account_admission from public,anon,authenticated,service_role;
create function public.stylist_consume_account_admission()
returns jsonb language plpgsql security definer set search_path='' as $$
declare current_window stylist_private.account_admission; observed timestamptz;
begin
 select * into current_window from stylist_private.account_admission where slot=1 for update;
 if not found then raise exception 'Account admission unavailable'; end if;
 observed:=clock_timestamp();
 -- A backward database clock must not replenish allowance.
 if observed<current_window.window_started then raise exception 'Account admission unavailable'; end if;
 if observed>=current_window.window_started+interval '60 seconds' then
  update stylist_private.account_admission set window_started=observed,used=1 where slot=1;
  return jsonb_build_object('allowed',true,'retryAfter',0);
 end if;
 if current_window.used>=60 then
  return jsonb_build_object('allowed',false,'retryAfter',greatest(1,ceil(extract(epoch from current_window.window_started+interval '60 seconds'-observed)))::integer);
 end if;
 update stylist_private.account_admission set used=used+1 where slot=1;
 return jsonb_build_object('allowed',true,'retryAfter',0);
end $$;
revoke all on function public.stylist_consume_account_admission() from public,anon,authenticated;
grant execute on function public.stylist_consume_account_admission() to service_role;
commit;
