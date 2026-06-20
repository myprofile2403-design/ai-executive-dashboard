'use client'

import {
  LayoutDashboard,
  CheckSquare,
  Bell,
  Wallet,
  StickyNote,
  Settings,
  Menu,
  X,
  Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAppStore, ViewType } from '@/lib/store'
import { useState } from 'react'

const navItems: { view: ViewType; label: string; icon: React.ElementType }[] = [
  { view: 'overview', label: 'Огляд', icon: LayoutDashboard },
  { view: 'tasks', label: 'Задачі', icon: CheckSquare },
  { view: 'reminders', label: 'Нагадування', icon: Bell },
  { view: 'expenses', label: 'Витрати', icon: Wallet },
  { view: 'work', label: 'Робочі години', icon: Clock },
  { view: 'notes', label: 'Нотатки', icon: StickyNote },
  { view: 'settings', label: 'Налаштування', icon: Settings },
]

export function DashboardSidebar() {
  const { activeView, setActiveView } = useAppStore()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Mobile toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-3 left-3 z-50 md:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Overlay for mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-40 h-full w-64 border-r bg-card transition-transform md:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
            AI
          </div>
          <div>
            <h1 className="text-sm font-semibold">Executive Assistant</h1>
            <p className="text-[10px] text-muted-foreground">Особистий дашборд</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1 p-3">
          {navItems.map(({ view, label, icon: Icon }) => (
            <Button
              key={view}
              variant={activeView === view ? 'secondary' : 'ghost'}
              className={cn(
                'justify-start gap-3 h-10',
                activeView === view && 'font-semibold'
              )}
              onClick={() => {
                setActiveView(view)
                setMobileOpen(false)
              }}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Button>
          ))}
        </nav>

        <div className="absolute bottom-4 left-0 right-0 px-4">
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <p className="text-[10px] text-muted-foreground">
              Дані з Supabase
            </p>
            <p className="text-[10px] text-muted-foreground">
              n8n + Whisper + GPT
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}
