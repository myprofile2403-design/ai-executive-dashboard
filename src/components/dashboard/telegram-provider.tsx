'use client'

import { useEffect, useState } from 'react'
import { isTelegramWebApp } from '@/lib/telegram'

interface TelegramAuthState {
  status: 'idle' | 'loading' | 'authenticated' | 'error'
  error?: string
}

/**
 * TelegramProvider:
 * - Detects Telegram WebApp context
 * - Sends initData to /api/auth for HMAC verification
 * - Stores the resulting JWT token in localStorage for Supabase authenticated requests
 */
export function TelegramProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<TelegramAuthState>({ status: 'idle' })

  useEffect(() => {
    if (!isTelegramWebApp()) return
    
    const tg = (window as any).Telegram?.WebApp
    if (!tg) return

    const initData = tg.initData
    if (!initData) return

    // Already authenticated this session
    const existingToken = sessionStorage.getItem('supabase_jwt')
    if (existingToken) {
      setAuth({ status: 'authenticated' })
      return
    }

    setAuth({ status: 'loading' })

    fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const { error } = await res.json()
          throw new Error(error || 'Authentication failed')
        }
        return res.json()
      })
      .then(({ token, user }) => {
        // Store JWT for use in Supabase client (authenticated requests bypass anon-only RLS)
        sessionStorage.setItem('supabase_jwt', token)
        if (user?.id) {
          localStorage.setItem('dashboard_telegram_chat_id', String(user.id))
        }
        setAuth({ status: 'authenticated' })
      })
      .catch((err) => {
        console.error('[TelegramProvider] Auth error:', err)
        setAuth({ status: 'error', error: err.message })
      })
  }, [])

  // Loading state
  if (auth.status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Перевірка автентифікації...</p>
        </div>
      </div>
    )
  }

  // Auth error inside Telegram
  if (auth.status === 'error' && isTelegramWebApp()) {
    return (
      <div className="flex items-center justify-center h-screen bg-background p-6">
        <div className="text-center space-y-3 max-w-xs">
          <p className="text-2xl">⚠️</p>
          <p className="font-semibold">Помилка автентифікації</p>
          <p className="text-sm text-muted-foreground">{auth.error}</p>
          <p className="text-xs text-muted-foreground">Закрийте та відкрийте Mini App знову.</p>
        </div>
      </div>
    )
  }

  return <div className={isTelegramWebApp() ? 'tg-mini-app' : ''}>{children}</div>
}
