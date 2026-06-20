'use client'

import { getTelegramUser, isTelegramWebApp } from '@/lib/telegram'
import { useAppStore } from '@/lib/store'

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  // This component provides Telegram context awareness
  // The actual TG detection is done in page.tsx using useSyncExternalStore
  // Here we just check for auto-loading Supabase config if user is in TG context
  const isTG = isTelegramWebApp()

  if (!isTG) {
    return <>{children}</>
  }

  // In Telegram Mini App context — auto-detect user
  const user = getTelegramUser()
  void user // Could be used for user-specific features in the future

  return (
    <div className="tg-mini-app">
      {children}
    </div>
  )
}
