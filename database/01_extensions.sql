-- ============================================================================
-- 01 — Extensions & Enums
-- ============================================================================
create extension if not exists pgcrypto;
create extension if not exists pg_cron with schema extensions;

do $$ begin
  create type public.app_role as enum ('admin', 'staff', 'user');
exception when duplicate_object then null; end $$;