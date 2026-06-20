-- =====================================================
-- AI Executive Assistant - Supabase Schema
-- Unified events table with RLS
-- =====================================================







create table if not exists events (
    id uuid primary key default gen_random_uuid(),

    type text not null,
    title text not null,

    amount numeric(12,2),
    currency text,

    person text,
    project text,

    event_datetime timestamptz,
    due_datetime timestamptz,

    status text default 'open',

    raw_text text not null,
    transcript text,

    metadata jsonb default '{}'::jsonb,

    telegram_chat_id text,
    telegram_message_id text,

    audio_file_id text,

    source text default 'telegram',
    source_type text default 'text',

    google_calendar_event_id text,
    sync_status text default 'pending',

    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- =====================================================
-- INDEXES
-- =====================================================

create index if not exists idx_events_type
on events(type);

create index if not exists idx_events_created_at
on events(created_at desc);

create index if not exists idx_events_project
on events(project);

create index if not exists idx_events_person
on events(person);

create index if not exists idx_events_status
on events(status);

create index if not exists idx_events_event_datetime
on events(event_datetime);

create index if not exists idx_events_due_datetime
on events(due_datetime);

create index if not exists idx_events_metadata
on events using gin(metadata);

create index if not exists idx_events_source
on events(source);

create index if not exists idx_events_sync_status
on events(sync_status);

-- =====================================================
-- UPDATED_AT TRIGGER
-- =====================================================

create or replace function set_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

drop trigger if exists trg_set_updated_at on events;

create trigger trg_set_updated_at
before update on events
for each row
execute function set_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

alter table events enable row level security;

-- Service role full access (used by n8n via API key)
create policy "Service role full access" on events
    for all
    using (auth.role() = 'service_role')
    with check (auth.role() = 'service_role');
