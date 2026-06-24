'use client'

import { useEffect, useState } from 'react'
import { isTelegramWebApp } from '@/lib/telegram'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Lock } from 'lucide-react'

interface TelegramAuthState {
  status: 'idle' | 'loading' | 'authenticated' | 'error' | 'web_auth_required'
  error?: string
}

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<TelegramAuthState>({ status: 'loading' })
  const [password, setPassword] = useState('')
  const [webAuthError, setWebAuthError] = useState('')

  useEffect(() => {
    // 1. Load Supabase Config silently
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => {
        if (data.supabaseUrl && data.supabaseKey) {
          localStorage.setItem('dashboard_supabase_url', data.supabaseUrl)
          localStorage.setItem('dashboard_supabase_key', data.supabaseKey)
        }
      })
      .catch(console.error)

    // 2. Check Authentication
    const existingToken = sessionStorage.getItem('supabase_jwt')
    if (existingToken) {
      setAuth({ status: 'authenticated' })
      return
    }

    if (isTelegramWebApp()) {
      // TELEGRAM SILENT AUTH
      const tg = (window as any).Telegram?.WebApp
      
      // If we are in a normal browser, Telegram script loads but platform is 'unknown' and initData is empty.
      if (!tg || (tg.platform === 'unknown' && !tg.initData)) {
        setAuth({ status: 'web_auth_required' })
        return
      }

      if (!tg.initData) {
        setAuth({ status: 'error', error: 'Missing Telegram initData (Open this inside Telegram)' })
        return
      }

      fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData: tg.initData }),
      })
        .then(async (res) => {
          if (!res.ok) throw new Error((await res.json()).error || 'Auth failed')
          return res.json()
        })
        .then(({ token, user }) => {
          sessionStorage.setItem('supabase_jwt', token)
          if (user?.id) localStorage.setItem('dashboard_telegram_chat_id', String(user.id))
          setAuth({ status: 'authenticated' })
        })
        .catch((err) => setAuth({ status: 'error', error: err.message }))
    } else {
      // WEB BROWSER AUTH
      setAuth({ status: 'web_auth_required' })
    }
  }, [])

  const handleWebLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setWebAuthError('')
    
    fetch('/api/web-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Неправильний пароль')
        }
        return res.json()
      })
      .then(({ token, user }) => {
        sessionStorage.setItem('supabase_jwt', token)
        if (user?.id) localStorage.setItem('dashboard_telegram_chat_id', String(user.id))
        setAuth({ status: 'authenticated' })
      })
      .catch((err) => setWebAuthError(err.message))
  }

  if (auth.status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Автентифікація...</p>
        </div>
      </div>
    )
  }

  if (auth.status === 'error' && isTelegramWebApp()) {
    return (
      <div className="flex items-center justify-center h-screen bg-background p-6">
        <div className="text-center space-y-3 max-w-xs">
          <p className="text-2xl">⚠️</p>
          <p className="font-semibold">Помилка автентифікації</p>
          <p className="text-sm text-muted-foreground">{auth.error}</p>
        </div>
      </div>
    )
  }

  if (auth.status === 'web_auth_required') {
    return (
      <div className="flex items-center justify-center h-screen bg-background p-6">
        <form onSubmit={handleWebLogin} className="w-full max-w-sm space-y-4">
          <div className="text-center space-y-2 mb-6">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Вхід у Дашборд</h1>
            <p className="text-sm text-muted-foreground">Введіть пароль для доступу через браузер</p>
          </div>
          
          <div className="space-y-2">
            <Input
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="text-center"
              autoFocus
            />
            {webAuthError && <p className="text-sm text-destructive text-center">{webAuthError}</p>}
          </div>
          <Button type="submit" className="w-full">Увійти</Button>
        </form>
      </div>
    )
  }

  return <div className={isTelegramWebApp() ? 'tg-mini-app' : ''}>{children}</div>
}
