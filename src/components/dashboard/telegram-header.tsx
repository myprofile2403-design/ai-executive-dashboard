'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAppStore, ViewType } from '@/lib/store'
import { closeTelegramMiniApp, getTelegramBackButton } from '@/lib/telegram'
import {
  LayoutDashboard,
  CheckSquare,
  Bell,
  Wallet,
  StickyNote,
  Settings,
  ArrowLeft,
  Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const navItems: { view: ViewType; label: string; icon: React.ElementType }[] = [
  { view: 'overview', label: 'Огляд', icon: LayoutDashboard },
  { view: 'tasks', label: 'Задачі', icon: CheckSquare },
  { view: 'reminders', label: 'Нагадування', icon: Bell },
  { view: 'expenses', label: 'Витрати', icon: Wallet },
  { view: 'work', label: 'Робота', icon: Clock },
  { view: 'notes', label: 'Нотатки', icon: StickyNote },
]

const viewTitles: Record<ViewType, string> = {
  overview: 'AI Асистент',
  tasks: 'Задачі',
  reminders: 'Нагадування',
  expenses: 'Витрати',
  work: 'Робочі години',
  notes: 'Нотатки',
  settings: 'Налаштування',
}

export function TelegramHeader() {
  const { activeView, setActiveView } = useAppStore()
  const [showTabs, setShowTabs] = useState(false)

  const handleBack = useCallback(() => {
    if (activeView !== 'overview') {
      setActiveView('overview')
    } else {
      closeTelegramMiniApp()
    }
  }, [activeView, setActiveView])

  // Setup Telegram BackButton
  useEffect(() => {
    const BackButton = getTelegramBackButton()
    if (!BackButton) return

    if (activeView !== 'overview') {
      BackButton.show()
    } else {
      BackButton.hide()
    }

    const handler = () => {
      if (activeView !== 'overview') {
        setActiveView('overview')
      }
    }

    BackButton.onClick(handler)
    return () => {
      BackButton.offClick(handler)
    }
  }, [activeView, setActiveView])

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      {/* Title bar */}
      <div className="flex items-center justify-between px-4 h-12">
        <div className="flex items-center gap-2">
          {activeView !== 'overview' && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleBack}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <h1 className="text-sm font-semibold">{viewTitles[activeView]}</h1>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setShowTabs(!showTabs)}
        >
          <LayoutDashboard className="h-4 w-4" />
        </Button>
      </div>

      {/* Expanded tab navigation */}
      {showTabs && (
        <div className="flex items-center gap-1 px-3 pb-2 overflow-x-auto">
          {navItems.map(({ view, label, icon: Icon }) => (
            <Button
              key={view}
              variant={activeView === view ? 'default' : 'ghost'}
              size="sm"
              className={cn(
                'shrink-0 gap-1.5 h-8 text-xs',
                activeView === view && 'font-semibold'
              )}
              onClick={() => {
                setActiveView(view)
                setShowTabs(false)
              }}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Button>
          ))}
          <Button
            variant={activeView === 'settings' ? 'default' : 'ghost'}
            size="sm"
            className="shrink-0 gap-1.5 h-8 text-xs"
            onClick={() => {
              setActiveView('settings')
              setShowTabs(false)
            }}
          >
            <Settings className="h-3.5 w-3.5" />
            ⚙️
          </Button>
        </div>
      )}

      {/* Bottom tab bar (always visible) */}
      {!showTabs && (
        <div className="flex items-center justify-around px-1 py-1.5 border-t">
          {navItems.map(({ view, label, icon: Icon }) => (
            <Button
              key={view}
              variant="ghost"
              size="sm"
              className={cn(
                'flex-col gap-0.5 h-auto py-1 px-2 text-[10px]',
                activeView === view ? 'text-primary' : 'text-muted-foreground'
              )}
              onClick={() => setActiveView(view)}
            >
              <Icon className={cn('h-4 w-4', activeView === view && 'text-primary')} />
              {label}
            </Button>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'flex-col gap-0.5 h-auto py-1 px-2 text-[10px]',
              activeView === 'settings' ? 'text-primary' : 'text-muted-foreground'
            )}
            onClick={() => setActiveView('settings')}
          >
            <Settings className={cn('h-4 w-4', activeView === 'settings' && 'text-primary')} />
            ⚙️
          </Button>
        </div>
      )}
    </header>
  )
}
