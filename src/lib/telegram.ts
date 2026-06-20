'use client'

type TelegramWebApp = {
  ready: () => void
  close: () => void
  expand: () => void
  enableClosingConfirmation: () => void
  setHeaderColor: (color: string) => void
  BackButton: {
    show: () => void
    hide: () => void
    onClick: (fn: () => void) => void
    offClick: (fn: () => void) => void
  }
  MainButton: {
    show: () => void
    hide: () => void
    onClick: (fn: () => void) => void
  }
  backgroundColor?: string
  textColor?: string
  hintColor?: string
  linkColor?: string
  buttonColor?: string
  buttonTextColor?: string
  secondaryBackgroundColor?: string
  initDataUnsafe?: {
    user?: {
      id: number
      first_name: string
      last_name?: string
      username?: string
      language_code?: string
    }
  }
}

function getWebApp(): TelegramWebApp | null {
  if (typeof window === 'undefined') return null
  const tg = (window as Record<string, unknown>).Telegram as
    | { WebApp?: TelegramWebApp }
    | undefined
  return tg?.WebApp || null
}

export function isTelegramWebApp(): boolean {
  if (typeof window === 'undefined') return false
  return !!getWebApp()
}

export function getTelegramUser() {
  const webapp = getWebApp()
  if (!webapp) return null
  return webapp.initDataUnsafe?.user || null
}

export function setupTelegramMiniApp() {
  const webapp = getWebApp()
  if (!webapp) return

  // Ready signal
  webapp.ready()

  // Enable closing confirmation
  webapp.enableClosingConfirmation()

  // Expand to full height
  webapp.expand()

  // Apply Telegram theme
  try {
    webapp.setHeaderColor('bg_color')
  } catch {
    // setHeaderColor might not be available in all versions
  }
}

export function closeTelegramMiniApp() {
  const webapp = getWebApp()
  if (!webapp) return
  webapp.close()
}

export function getTelegramBackButton() {
  const webapp = getWebApp()
  return webapp?.BackButton || null
}
