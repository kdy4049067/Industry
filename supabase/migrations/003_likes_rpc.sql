-- ============================================================
-- 003_likes_rpc.sql
-- 게시글 좋아요 토글 RPC + like_count 동기화
-- ============================================================

-- 1) 중복 좋아요 데이터 정리
delete from likes a
using likes b
where a.id > b.id
  and a.post_id = b.post_id
  and a.user_id = b.user_id;

-- 2) 사용자당 게시글 1회 좋아요 보장
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'likes_post_id_user_id_key'
  ) then
    alter table likes
      add constraint likes_post_id_user_id_key unique (post_id, user_id);
  end if;
end $$;

-- 3) likes 변경 시 posts.like_count 자동 동기화
create or replace function public.refresh_post_like_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  affected_post_id bigint;
begin
  if TG_OP = 'DELETE' then
    affected_post_id := old.post_id;
  else
    affected_post_id := new.post_id;
  end if;

  update posts
  set like_count = (
    select count(*)
    from likes
    where post_id = affected_post_id
  )
  where id = affected_post_id;

  if TG_OP = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

drop trigger if exists likes_refresh_post_like_count on likes;

create trigger likes_refresh_post_like_count
  after insert or delete on likes
  for each row
  execute function public.refresh_post_like_count();

-- 4) 좋아요 토글 RPC (jsonb 반환으로 업그레이드)
drop function if exists public.toggle_post_like(bigint);

create or replace function public.toggle_post_like(post_id_input bigint)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_like_id bigint;
  new_like_count int;
  now_liked boolean;
begin
  if auth.uid() is null then
    raise exception 'LOGIN_REQUIRED';
  end if;

  if not exists (select 1 from posts where id = post_id_input) then
    raise exception 'POST_NOT_FOUND';
  end if;

  select id
  into existing_like_id
  from likes
  where post_id = post_id_input
    and user_id = auth.uid();

  if existing_like_id is null then
    insert into likes (post_id, user_id)
    values (post_id_input, auth.uid());

    now_liked := true;
  else
    delete from likes
    where id = existing_like_id;

    now_liked := false;
  end if;

  select count(*)
  into new_like_count
  from likes
  where post_id = post_id_input;

  update posts
  set like_count = new_like_count
  where id = post_id_input;

  return jsonb_build_object(
    'liked', now_liked,
    'like_count', new_like_count
  );
end;
$$;

grant execute on function public.toggle_post_like(bigint) to authenticated;

-- 5) 기존 like_count 보정
update posts
set like_count = (
  select count(*)
  from likes
  where likes.post_id = posts.id
);
