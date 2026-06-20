'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Settings,
  Save,
  CheckCircle2,
  Database,
  Key,
  Link2,
  Bot,
  Users,
  Plus,
  Trash2,
  Shield,
  Eye,
  EyeOff,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'

// LocalStorage keys
const SUPABASE_URL_KEY = 'dashboard_supabase_url'
const SUPABASE_KEY_KEY = 'dashboard_supabase_key'
const OPENROUTER_KEY = 'dashboard_openrouter_key'
const ALLOWED_IDS_KEY = 'dashboard_allowed_telegram_ids'

function load(key: string) {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem(key) || ''
}
function loadList(key: string): string[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(key) || '[]')
  } catch {
    return []
  }
}

// ─── Password-style input with show/hide toggle ───
function SecretInput({
  id,
  value,
  onChange,
  placeholder,
}: {
  id: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pr-10"
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )
}

// ─── Save confirmation badge ───
function SaveButton({ onSave, saved }: { onSave: () => void; saved: boolean }) {
  return (
    <Button onClick={onSave} className="gap-2 mt-2">
      {saved ? (
        <>
          <CheckCircle2 className="h-4 w-4" />
          Збережено!
        </>
      ) : (
        <>
          <Save className="h-4 w-4" />
          Зберегти
        </>
      )}
    </Button>
  )
}

export function SettingsView() {
  const { setSupabaseConfig } = useAppStore()

  // ── Supabase ──
  const [url, setUrl] = useState('')
  const [key, setKey] = useState('')
  const [savedSupabase, setSavedSupabase] = useState(false)

  // ── OpenRouter ──
  const [openrouterKey, setOpenrouterKey] = useState('')
  const [savedOR, setSavedOR] = useState(false)

  // ── Allowed Telegram users ──
  const [allowedIds, setAllowedIds] = useState<string[]>([])
  const [newEntry, setNewEntry] = useState('')
  const [savedUsers, setSavedUsers] = useState(false)

  // Load from localStorage on mount (avoids SSR mismatch)
  useEffect(() => {
    setUrl(load(SUPABASE_URL_KEY))
    setKey(load(SUPABASE_KEY_KEY))
    setOpenrouterKey(load(OPENROUTER_KEY))
    setAllowedIds(loadList(ALLOWED_IDS_KEY))
  }, [])

  const handleSaveSupabase = () => {
    localStorage.setItem(SUPABASE_URL_KEY, url)
    localStorage.setItem(SUPABASE_KEY_KEY, key)
    setSupabaseConfig(url, key)
    setSavedSupabase(true)
    setTimeout(() => setSavedSupabase(false), 3000)
  }

  const handleSaveOR = () => {
    localStorage.setItem(OPENROUTER_KEY, openrouterKey)
    setSavedOR(true)
    setTimeout(() => setSavedOR(false), 3000)
  }

  const handleAddUser = () => {
    const trimmed = newEntry.trim()
    if (!trimmed || allowedIds.includes(trimmed)) return
    setAllowedIds((prev) => [...prev, trimmed])
    setNewEntry('')
  }

  const handleRemoveUser = (entry: string) => {
    setAllowedIds((prev) => prev.filter((e) => e !== entry))
  }

  const handleSaveUsers = () => {
    localStorage.setItem(ALLOWED_IDS_KEY, JSON.stringify(allowedIds))
    setSavedUsers(true)
    setTimeout(() => setSavedUsers(false), 3000)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="h-6 w-6" />
          Налаштування
        </h2>
        <p className="text-muted-foreground mt-1">
          Ключі доступу та параметри асистента зберігаються тільки у вашому браузері.
        </p>
      </div>

      {/* ── Supabase ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="h-5 w-5 text-emerald-500" />
            База даних — Supabase
          </CardTitle>
          <CardDescription>
            URL та Anon Key вашого Supabase проекту. Знайдіть у{' '}
            <span className="font-medium">Settings → API</span>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="supabase-url" className="flex items-center gap-2">
              <Link2 className="h-3.5 w-3.5" />
              Supabase URL
            </Label>
            <Input
              id="supabase-url"
              placeholder="https://xxxxx.supabase.co"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <p className="text-[11px] text-muted-foreground">
              Dashboard → Settings → API → Project URL
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="supabase-key" className="flex items-center gap-2">
              <Key className="h-3.5 w-3.5" />
              Supabase Anon Key
            </Label>
            <SecretInput
              id="supabase-key"
              value={key}
              onChange={setKey}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            />
            <p className="text-[11px] text-muted-foreground">
              Dashboard → Settings → API → Project API keys → <strong>anon public</strong>
            </p>
          </div>

          <SaveButton onSave={handleSaveSupabase} saved={savedSupabase} />
        </CardContent>
      </Card>

      {/* ── OpenRouter ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bot className="h-5 w-5 text-violet-500" />
            AI — OpenRouter API Key
          </CardTitle>
          <CardDescription>
            Ключ для роботи LLM через OpenRouter. Отримайте на{' '}
            <a
              href="https://openrouter.ai/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-violet-500 hover:text-violet-400"
            >
              openrouter.ai/keys
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="openrouter-key" className="flex items-center gap-2">
              <Key className="h-3.5 w-3.5" />
              OpenRouter API Key
            </Label>
            <SecretInput
              id="openrouter-key"
              value={openrouterKey}
              onChange={setOpenrouterKey}
              placeholder="sk-or-v1-..."
            />
            <p className="text-[11px] text-muted-foreground">
              Використовується у n8n воркфлоу для виклику мовної моделі
            </p>
          </div>

          <SaveButton onSave={handleSaveOR} saved={savedOR} />
        </CardContent>
      </Card>

      {/* ── Allowed Telegram Users ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-5 w-5 text-sky-500" />
            Дозволені користувачі Telegram
          </CardTitle>
          <CardDescription>
            Тільки ці Telegram ID або username матимуть доступ до бота.
            Введіть числовий ID (наприклад <code className="bg-muted px-1 rounded">123456789</code>)
            або @username.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* List */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Users className="h-3.5 w-3.5" />
              Список ({allowedIds.length})
            </Label>

            {allowedIds.length === 0 && (
              <p className="text-sm text-muted-foreground italic">
                Список порожній — бот буде мовчки ігнорувати всіх
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              {allowedIds.map((entry) => (
                <div
                  key={entry}
                  className="flex items-center gap-1 rounded-full border bg-muted px-3 py-1 text-sm"
                >
                  <span>{entry}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveUser(entry)}
                    className="ml-1 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Add new */}
          <div className="flex gap-2">
            <Input
              placeholder="123456789 або @username"
              value={newEntry}
              onChange={(e) => setNewEntry(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddUser()}
              className="flex-1"
            />
            <Button variant="outline" size="icon" onClick={handleAddUser}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <p className="text-[11px] text-muted-foreground">
            Щоб дізнатись свій Telegram ID — напишіть боту{' '}
            <a
              href="https://t.me/userinfobot"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              @userinfobot
            </a>
          </p>

          <SaveButton onSave={handleSaveUsers} saved={savedUsers} />

          <div className="rounded-lg bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 p-3 text-[12px] text-sky-700 dark:text-sky-300 mt-2">
            <strong>Примітка:</strong> Цей список зберігається у браузері.
            Щоб обмежити доступ у самому n8n воркфлоу, вкажіть ті самі ID у змінній{' '}
            <code className="bg-sky-100 dark:bg-sky-900 px-1 rounded">ALLOWED_TELEGRAM_IDS</code> у
            налаштуваннях n8n.
          </div>
        </CardContent>
      </Card>

      {/* ── How it works ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Як це працює</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          {[
            'Ви відправляєте голосове або текстове повідомлення через Telegram бота.',
            'n8n воркфлоу транскрибує голос через Whisper, а AI Agent визначає тип (задача, нагадування, витрата, нотатка, робота).',
            'Дані зберігаються у таблицю Supabase events.',
            'Цей дашборд читає дані з Supabase та відображає їх у зручному форматі.',
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <Badge variant="outline" className="mt-0.5 shrink-0">
                {i + 1}
              </Badge>
              <p>{step}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
