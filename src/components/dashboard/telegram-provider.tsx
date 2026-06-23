'use client'

import { useEffect, useState } from 'react'
import { isTelegramWebApp } from '@/lib/telegram'

interface TelegramAuthState {
  status: 'idle' | 'loading' | 'authenticated' | 'error'
  error?: string
}

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<TelegramAuthState>({ status: 'loading' })

  useEffect(() => {
    // Fetch Supabase configuration from server so user doesn't have to enter it
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => {
        if (data.supabaseUrl && data.supabaseKey) {
          localStorage.setItem('dashboard_supabase_url', data.supabaseUrl)
          localStorage.setItem('dashboard_supabase_key', data.supabaseKey)
        }
        
        // ВІДМКНЕНО АВТЕНТИФІКАЦІЮ: Одразу пускаємо користувача
        setAuth({ status: 'authenticated' })
      })
      .catch((err) => {
        console.error('Failed to load config', err)
        setAuth({ status: 'authenticated' })
      })
    
    // Зчитуємо initData щоб знати Chat ID (без перевірки підпису)
    try {
      if (isTelegramWebApp()) {
        const tg = (window as any).Telegram?.WebApp
        if (tg?.initDataUnsafe?.user?.id) {
          localStorage.setItem('dashboard_telegram_chat_id', String(tg.initDataUnsafe.user.id))
        }
      }
    } catch (err) {}
  }, [])

  if (auth.status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Завантаження...</p>
        </div>
      </div>
    )
  }

  return <div className={isTelegramWebApp() ? 'tg-mini-app' : ''}>{children}</div>
}
