'use client'

import { useEffect, useState } from 'react'
import { isTelegramWebApp } from '@/lib/telegram'

interface TelegramAuthState {
  status: 'idle' | 'loading' | 'authenticated' | 'error'
  error?: string
}

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<TelegramAuthState>({ status: 'idle' })

  useEffect(() => {
    // ВІДМКНЕНО АВТЕНТИФІКАЦІЮ: 
    // Одразу пускаємо користувача в дашборд.
    setAuth({ status: 'authenticated' })
    
    // Якщо треба, можна також зчитувати initData просто щоб знати Chat ID (без перевірки підпису)
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
