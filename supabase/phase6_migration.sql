-- Phase 6 migration — run this once in Supabase → SQL Editor → New query → Run.
-- Adds a field for undated, general notes about a Work (separate from
-- session-tied reading notes and the final review).

alter table works add column if not exists general_notes text;
