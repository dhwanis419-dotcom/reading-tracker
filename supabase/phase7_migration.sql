-- Phase 7 migration — run this once in Supabase → SQL Editor → New query → Run.

-- Quotes / highlights captured per work — separate from the final review,
-- not tied to a specific reading session.
create table if not exists quotes (
  id uuid primary key default uuid_generate_v4(),
  work_id uuid not null references works(id) on delete cascade,
  quote_text text not null,
  page_number integer,
  created_at timestamptz not null default now()
);

alter table quotes enable row level security;
create policy "allow all - quotes" on quotes for all using (true) with check (true);

create index if not exists idx_quotes_work on quotes(work_id);

-- One row per year holding your target book count.
create table if not exists reading_goals (
  year integer primary key,
  target integer not null,
  created_at timestamptz not null default now()
);

alter table reading_goals enable row level security;
create policy "allow all - reading_goals" on reading_goals for all using (true) with check (true);
