-- 1. Table for rate limiting
create table if not exists interaction_logs (
    id uuid primary key default gen_random_uuid(),
    telegram_chat_id text not null,
    created_at timestamptz default now()
);

-- Index for fast rate limit lookups
create index if not exists idx_interaction_logs_rate 
on interaction_logs (telegram_chat_id, created_at desc);

-- Nightly maintenance: Enable pg_cron (if available) and delete old interaction logs at 3:00 AM
create extension if not exists pg_cron;
select cron.schedule(
  'clean-interaction-logs-nightly',
  '0 3 * * *',
  $$delete from interaction_logs where created_at < now() - interval '7 days'$$
);

-- 2. Optimization index for Cron Reminder query: SELECT ... WHERE due_datetime <= now AND status = 'open' AND type = 'reminder'
create index if not exists idx_events_reminder_due 
on events (due_datetime, status, type) 
where type = 'reminder' and status = 'open';

-- 3. Optimization index for multi-user dashboard queries: SELECT ... WHERE telegram_chat_id = X ORDER BY created_at DESC
create index if not exists idx_events_telegram_chat_id 
on events (telegram_chat_id, created_at desc);

-- 4. Unique index for Telegram message deduplication
create unique index if not exists idx_events_telegram_uniq 
on events (telegram_chat_id, telegram_message_id) 
where telegram_message_id is not null;

-- 5. Secure Row Level Security (RLS) Policy for Authenticated WebApp Users
alter table events enable row level security;

drop policy if exists "Users can only view their own events" on events;
create policy "Users can only view their own events" on events
    for all
    using (
        auth.role() = 'service_role' or telegram_chat_id = (auth.jwt() ->> 'telegram_chat_id')
    )
    with check (
        auth.role() = 'service_role' or telegram_chat_id = (auth.jwt() ->> 'telegram_chat_id')
    );
