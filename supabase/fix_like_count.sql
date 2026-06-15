-- ============================================================
-- fix_like_count.sql
-- 좋아요 카운트를 trigger 기반으로 자동 관리
--
-- 기존 toggle_post_like RPC 내부의 posts.like_count UPDATE 는
-- 일반 사용자 권한에서 RLS에 막힐 수 있으므로, comment_count와
-- 동일하게 AFTER INSERT/DELETE trigger로 처리한다.
--
-- idempotent: 여러 번 실행해도 안전.
-- ============================================================

-- 1) likes 변경 시 posts.like_count 를 자동 갱신하는 함수
create or replace function refresh_post_like_count()
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
    select count(*) from likes where post_id = affected_post_id
  )
  where id = affected_post_id;

  if TG_OP = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

-- 2) trigger 등록
drop trigger if exists likes_refresh_post_like_count on likes;

create trigger likes_refresh_post_like_count
  after insert or delete on likes
  for each row execute function refresh_post_like_count();

-- 3) toggle_post_like RPC 재정의 (posts update 제거 — trigger가 담당)
create or replace function toggle_post_like(post_id_input bigint)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_like_id bigint;
  new_like_count int;
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다.';
  end if;

  select id into existing_like_id
  from likes
  where post_id = post_id_input and user_id = auth.uid();

  if existing_like_id is null then
    insert into likes (post_id, user_id) values (post_id_input, auth.uid());
  else
    delete from likes where id = existing_like_id;
  end if;

  select count(*) into new_like_count
  from likes
  where post_id = post_id_input;

  return new_like_count;
end;
$$;

-- 4) anon/authenticated 에 execute 권한 명시 부여
grant execute on function toggle_post_like(bigint) to anon, authenticated;
grant execute on function refresh_post_like_count() to authenticated;
