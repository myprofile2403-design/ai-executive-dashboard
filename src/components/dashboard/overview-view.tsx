'use client'

import { useStats } from '@/hooks/use-events'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  CheckSquare,
  Bell,
  Wallet,
  StickyNote,
  AlertTriangle,
  Calendar,
  TrendingUp,
  Rocket,
  ArrowRight,
  Clock,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'

function formatExpenses(expenses: Record<string, number>) {
  return Object.entries(expenses)
    .map(([currency, amount]) => `${amount.toFixed(2)} ${currency}`)
    .join(', ') || '0.00 CZK'
}

function WelcomeSetup() {
  const { setActiveView } = useAppStore()
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-lg text-center border-dashed">
        <CardContent className="py-12 px-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-6">
            <Rocket className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold mb-2">Ласкаво просимо!</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Для початку роботи з дашбордом потрібно підключити вашу базу даних Supabase.
            Це займе всьільки хвилину — вам знадобляться URL та API ключ.
          </p>
          <Button
            onClick={() => setActiveView('settings')}
            className="gap-2"
          >
            Налаштувати підключення
            <ArrowRight className="h-4 w-4" />
          </Button>
          <div className="mt-6 flex flex-col gap-2 text-xs text-muted-foreground">
            <p>1. Відкрийте Supabase Dashboard → Settings → API</p>
            <p>2. Скопіюйте Project URL та anon public key</p>
            <p>3. Вставте їх у налаштуваннях дашборду</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function OverviewView() {
  const { stats, loading, error } = useStats()
  const { setActiveView } = useAppStore()

  // Show welcome screen if not configured
  if (error && error.includes('налаштовано')) {
    return <WelcomeSetup />
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-12">
        <Card className="w-full max-w-md border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Помилка підключення
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{error}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Перевірте налаштування Supabase у розділі &quot;Налаштування&quot;.
            </p>
            <Badge
              variant="outline"
              className="mt-3 cursor-pointer"
              onClick={() => setActiveView('settings')}
            >
              Перейти до налаштувань
            </Badge>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-muted rounded" />
              <div className="h-4 w-4 bg-muted rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!stats) return null

  const cards = [
    {
      title: 'Відкриті задачі',
      value: stats.openTasks,
      icon: CheckSquare,
      subtitle: `${stats.todayTasks} сьогодні`,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      onClick: () => setActiveView('tasks'),
    },
    {
      title: 'Прострочені',
      value: stats.overdueTasks,
      icon: AlertTriangle,
      subtitle: 'потребують уваги',
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-950/30',
      onClick: () => setActiveView('tasks'),
    },
    {
      title: 'Нагадування',
      value: stats.upcomingReminders,
      icon: Bell,
      subtitle: 'майбутніх',
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      onClick: () => setActiveView('reminders'),
    },
    {
      title: 'Витрати сьогодні',
      value: formatExpenses(stats.todayExpenses),
      icon: Wallet,
      subtitle: 'за день',
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
      onClick: () => setActiveView('expenses'),
      isText: true,
    },
    {
      title: 'Витрати за тиждень',
      value: formatExpenses(stats.weekExpenses),
      icon: TrendingUp,
      subtitle: 'за тиждень',
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-950/30',
      onClick: () => setActiveView('expenses'),
      isText: true,
    },
    {
      title: 'Витрати за місяць',
      value: formatExpenses(stats.monthExpenses),
      icon: Calendar,
      subtitle: 'за місяць',
      color: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-50 dark:bg-rose-950/30',
      onClick: () => setActiveView('expenses'),
      isText: true,
    },
    {
      title: 'Нотатки',
      value: stats.totalNotes,
      icon: StickyNote,
      subtitle: 'всього',
      color: 'text-teal-600 dark:text-teal-400',
      bg: 'bg-teal-50 dark:bg-teal-950/30',
      onClick: () => setActiveView('notes'),
    },
    {
      title: 'Години роботи',
      value: `${stats.monthWorkHours || 0} год.`,
      icon: Clock,
      subtitle: 'за поточний місяць',
      color: 'text-sky-600 dark:text-sky-400',
      bg: 'bg-sky-50 dark:bg-sky-950/30',
      onClick: () => setActiveView('work'),
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Огляд</h2>
        <p className="text-muted-foreground">
          Ваш персональний виконавчий асистент — загальне резюме
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card
            key={card.title}
            className="cursor-pointer transition-shadow hover:shadow-md"
            onClick={card.onClick}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className={cn('rounded-md p-1.5', card.bg)}>
                <card.icon className={cn('h-4 w-4', card.color)} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={cn('text-2xl font-bold', card.isText && 'text-lg')}>{card.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{card.subtitle}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
