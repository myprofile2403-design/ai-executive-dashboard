'use client'

import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { OverviewView } from '@/components/dashboard/overview-view'
import { TasksView } from '@/components/dashboard/tasks-view'
import { RemindersView } from '@/components/dashboard/reminders-view'
import { ExpensesView } from '@/components/dashboard/expenses-view'
import { WorkView } from '@/components/dashboard/work-view'
import { NotesView } from '@/components/dashboard/notes-view'
import { SettingsView } from '@/components/dashboard/settings-view'
import { useAppStore, ViewType } from '@/lib/store'
import { ThemeProvider } from 'next-themes'
import { ThemeToggle } from '@/components/dashboard/theme-toggle'
import { TelegramProvider } from '@/components/dashboard/telegram-provider'
import { TelegramHeader } from '@/components/dashboard/telegram-header'
import { useState, useEffect } from 'react'
import { isTelegramWebApp, setupTelegramMiniApp } from '@/lib/telegram'

const viewMap: Record<ViewType, React.ComponentType> = {
  overview: OverviewView,
  tasks: TasksView,
  reminders: RemindersView,
  expenses: ExpensesView,
  work: WorkView,
  notes: NotesView,
  settings: SettingsView,
}

export default function DashboardPage() {
  const { activeView } = useAppStore()
  const ActiveView = viewMap[activeView]

  // Detect Telegram Mini App — only on client to avoid hydration mismatch
  const [isTG, setIsTG] = useState(false)
  useEffect(() => {
    const result = isTelegramWebApp()
    if (result) setupTelegramMiniApp()
    setIsTG(result)
  }, [])

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TelegramProvider>
        <div className="min-h-screen bg-background">
          {isTG ? (
            // Telegram Mini App layout — compact, no sidebar
            <div className="flex flex-col min-h-screen">
              <TelegramHeader />
              <main className="flex-1 px-4 pb-6 pt-2">
                <ActiveView />
              </main>
            </div>
          ) : (
            // Regular web layout — with sidebar
            <>
              <DashboardSidebar />
              <main className="md:ml-64 min-h-screen">
                <div className="flex items-center justify-end p-3">
                  <ThemeToggle />
                </div>
                <div className="px-4 pb-8 sm:px-6 lg:px-8">
                  <ActiveView />
                </div>
              </main>
            </>
          )}
        </div>
      </TelegramProvider>
    </ThemeProvider>
  )
}
