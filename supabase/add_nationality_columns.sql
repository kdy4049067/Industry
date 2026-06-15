-- ============================================================
-- add_nationality_columns.sql
-- profiles 테이블에 nationality_code, nationality_name 컬럼이 없는 경우 추가.
-- schema.sql 에 정의되어 있지만 구버전 DB 에 누락되어 있을 수 있음.
-- idempotent: 여러 번 실행해도 안전.
-- ============================================================

alter table profiles
  add column if not exists nationality_code text;

alter table profiles
  add column if not exists nationality_name text;
