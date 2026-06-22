import { createClient, SupabaseClient } from '@supabase/supabase-js'

export type EventRow = {
  id: string
  type: string
  title: string
  amount: number | null
  currency: string | null
  person: string | null
  project: string | null
  event_datetime: string | null
  due_datetime: string | null
  status: string
  raw_text: string
  transcript: string | null
  metadata: Record<string, unknown>
  telegram_chat_id: string | null
  telegram_message_id: string | null
  audio_file_id: string | null
  source: string
  source_type: string
  google_calendar_event_id: string | null
  sync_status: string
  created_at: string
  updated_at: string
}

export type EventType = 'task' | 'reminder' | 'expense' | 'income' | 'debt_given' | 'debt_received' | 'note' | 'calendar' | 'meeting' | 'work'

export const EVENT_TYPE_LABELS: Record<string, string> = {
  task: 'Задача',
  reminder: 'Нагадування',
  expense: 'Витрата',
  income: 'Дохід',
  debt_given: 'Позика (дав)',
  debt_received: 'Борг (отримав)',
  note: 'Нотатка',
  calendar: 'Календар',
  meeting: 'Зустріч',
  work: 'Робота',
}

export const STATUS_LABELS: Record<string, string> = {
  open: 'Відкрита',
  'in-progress': 'В процесі',
  done: 'Виконана',
  cancelled: 'Скасована',
  pending: 'Очікує',
  completed: 'Завершено',
  scheduled: 'Заплановано',
}

/**
 * Creates a Supabase client with dynamic credentials.
 * If a verified JWT is available in sessionStorage (from Telegram HMAC auth),
 * it is passed as a custom Authorization header — this activates the JWT-based RLS policy.
 */
export function createSupabaseClient(url: string, key: string): SupabaseClient {
  const jwt = typeof window !== 'undefined' ? sessionStorage.getItem('supabase_jwt') : null

  if (jwt) {
    return createClient(url, key, {
      global: {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      },
    })
  }

  return createClient(url, key)
}

// Default client from env (for SSR)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const isServer = typeof window === 'undefined'
const supabaseKey = isServer
  ? (process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '')
  : (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '')

export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: !isServer
      }
    })
  : null
