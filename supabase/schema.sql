-- Reading Tracker — Phase 1 schema
-- Paste this whole file into Supabase → SQL Editor → New query → Run.

create extension if not exists "uuid-ossp";

-- WORK: the stable underlying book / short story / article.
create table works (
  id uuid primary key default uuid_generate_v4(),
  type text not null check (type in ('book','short_story','article')),
  title text not null,
  author text,
  cover_url text,
  page_count integer,
  isbn text,
  edition text,
  publication_info text,
  fiction_status text check (fiction_status in ('fiction','non_fiction') or fiction_status is null),
  genres text[] not null default '{}',
  tags text[] not null default '{}',
  collections text[] not null default '{}',
  article_url text,
  article_site text,
  article_pub_date text,
  article_read_time integer,
  general_notes text,
  created_at timestamptz not null default now()
);

-- TBR ENTRY: the fact that a Work was added to the to-read list.
-- "active" stays true until Start Reading is used; the row and its
-- date_added are preserved afterward as history rather than deleted.
create table tbr_entries (
  id uuid primary key default uuid_generate_v4(),
  work_id uuid not null references works(id) on delete cascade,
  date_added timestamptz not null default now(),
  priority text check (priority in ('high','medium','low') or priority is null),
  notes text,
  active boolean not null default true
);

-- READING INSTANCE: one particular time the Work was read.
-- A Work can have many instances (rereads), each with its own history.
create table reading_instances (
  id uuid primary key default uuid_generate_v4(),
  work_id uuid not null references works(id) on delete cascade,
  status text not null default 'currently_reading'
    check (status in ('currently_reading','paused','finished','dnf')),
  start_date timestamptz not null default now(),
  finish_date timestamptz,
  last_read_date timestamptz,
  current_progress numeric not null default 0,
  progress_unit text not null default 'page' check (progress_unit in ('page','percent')),
  rating numeric check (rating >= 0 and rating <= 10),
  favorite boolean not null default false,
  final_review text,
  created_at timestamptz not null default now()
);

-- READING ENTRY: one reading session. Never overwritten or replaced —
-- new sessions are always inserted as new rows.
create table reading_entries (
  id uuid primary key default uuid_generate_v4(),
  reading_instance_id uuid not null references reading_instances(id) on delete cascade,
  date timestamptz not null default now(),
  progress_before numeric not null,
  progress_after numeric not null,
  amount_read numeric not null,
  time_spent_minutes integer,
  thoughts text,
  created_at timestamptz not null default now()
);

create index idx_tbr_active on tbr_entries(active);
create index idx_instances_status on reading_instances(status);
create index idx_entries_instance on reading_entries(reading_instance_id);

-- Row Level Security: enabled for future multi-user support, but Phase 1
-- runs with a permissive policy since this is a single-user personal app
-- accessed only through your own anon key. Tighten this later if you add
-- login (Phase 5 note in README).
alter table works enable row level security;
alter table tbr_entries enable row level security;
alter table reading_instances enable row level security;
alter table reading_entries enable row level security;

create policy "allow all - works" on works for all using (true) with check (true);
create policy "allow all - tbr_entries" on tbr_entries for all using (true) with check (true);
create policy "allow all - reading_instances" on reading_instances for all using (true) with check (true);
create policy "allow all - reading_entries" on reading_entries for all using (true) with check (true);

-- Quotes / highlights captured per work.
create table quotes (
  id uuid primary key default uuid_generate_v4(),
  work_id uuid not null references works(id) on delete cascade,
  quote_text text not null,
  page_number integer,
  created_at timestamptz not null default now()
);
alter table quotes enable row level security;
create policy "allow all - quotes" on quotes for all using (true) with check (true);
create index idx_quotes_work on quotes(work_id);

-- Yearly reading goal.
create table reading_goals (
  year integer primary key,
  target integer not null,
  created_at timestamptz not null default now()
);
alter table reading_goals enable row level security;
create policy "allow all - reading_goals" on reading_goals for all using (true) with check (true);
