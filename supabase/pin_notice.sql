-- ============================================================
-- pin_notice.sql
-- 최고 운영진(is_super_admin)이 주요 공지사항을 상단 고정할 수 있도록
-- posts 테이블에 is_pinned 컬럼 추가.
--
-- 상단 고정/해제는 service_role(createAdminClient)을 쓰는 서버 액션에서만
-- 수행하므로 별도 RLS 정책은 불필요 (service_role은 RLS 자동 우회).
--
-- idempotent: 여러 번 실행해도 안전.
-- ============================================================

alter table posts
  add column if not exists is_pinned boolean not null default false;

-- 결과 확인
select column_name, data_type, column_default, is_nullable
from information_schema.columns
where table_name = 'posts' and column_name = 'is_pinned';
