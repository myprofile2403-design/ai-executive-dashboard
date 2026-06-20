'use client'

import { useEvents } from '@/hooks/use-events'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Clock, Loader2, RefreshCw, BarChart3, Calendar } from 'lucide-react'
import { useState, useMemo } from 'react'
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { NotConfiguredCard, ErrorCard } from '@/components/dashboard/shared'

type Period = 'week' | 'month' | 'all'

export function WorkView() {
  const [period, setPeriod] = useState<Period>('month')

  const { data, loading, error, refetch } = useEvents({
    type: 'work',
  })

  // Filter data based on active period
  const filteredData = useMemo(() => {
    if (period === 'all') return data
    
    const now = new Date()
    let limitDate = new Date()
    
    if (period === 'week') {
      const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1
      limitDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek)
    } else if (period === 'month') {
      limitDate = new Date(now.getFullYear(), now.getMonth(), 1)
    }
    
    return data.filter(e => {
      if (!e.created_at) return false
      return new Date(e.created_at) >= limitDate
    })
  }, [data, period])

  // Summarize stats
  const stats = useMemo(() => {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    let todayHours = 0
    let weekHours = 0
    let monthHours = 0

    data.forEach(e => {
      if (!e.created_at || !e.amount) return
      const date = new Date(e.created_at)
      const amt = Number(e.amount)
      
      if (date >= todayStart) todayHours += amt
      if (date >= weekStart) weekHours += amt
      if (date >= monthStart) monthHours += amt
    })

    return { todayHours, weekHours, monthHours }
  }, [data])

  // Chart data - group by day
  const chartData = useMemo(() => {
    const grouped: Record<string, number> = {}
    
    // Default show last 7 days or current month days
    const maxDays = period === 'week' ? 7 : 30
    
    filteredData.forEach((e) => {
      if (!e.created_at || !e.amount) return
      const dateStr = new Date(e.created_at).toLocaleDateString('uk-UA', {
        day: 'numeric', month: 'short'
      })
      grouped[dateStr] = (grouped[dateStr] || 0) + Number(e.amount)
    })

    return Object.entries(grouped)
      .map(([date, hours]) => ({ date, hours }))
      .reverse()
      .slice(-maxDays)
  }, [filteredData, period])

  const periodLabels: Record<Period, string> = {
    week: 'Цього тижня',
    month: 'Цього місяця',
    all: 'Всі записи',
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Робочі години</h2>
          <p className="text-muted-foreground">
            Облік виконаної роботи та відпрацьованого часу
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refetch} className="gap-2">
          <RefreshCw className="h-3.5 w-3.5" />
          Оновити
        </Button>
      </div>

      {/* Period filter tabs */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(periodLabels) as Period[]).map((p) => (
          <Button
            key={p}
            variant={period === p ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod(p)}
          >
            {periodLabels[p]}
          </Button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {error && error.includes('налаштовано') && <NotConfiguredCard />}
      {error && !error.includes('налаштовано') && <ErrorCard message={error} />}

      {!loading && !error && data.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Clock className="mx-auto h-12 w-12 text-muted-foreground/30" />
            <p className="mt-3 text-muted-foreground">Не знайдено записів про роботу</p>
            <p className="text-xs text-muted-foreground mt-1">
              Скажіть асистенту &quot;запиши 4 години роботи над проєктом А&quot; через Telegram
            </p>
          </CardContent>
        </Card>
      )}

      {!loading && !error && data.length > 0 && (
        <>
          {/* Summary cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Сьогодні
                </CardTitle>
                <div className="rounded-md p-1.5 bg-sky-50 dark:bg-sky-950/30">
                  <Clock className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.todayHours.toFixed(1)} год.</div>
                <p className="text-xs text-muted-foreground">відпрацьовано сьогодні</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Цього тижня
                </CardTitle>
                <div className="rounded-md p-1.5 bg-blue-50 dark:bg-blue-950/30">
                  <BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.weekHours.toFixed(1)} год.</div>
                <p className="text-xs text-muted-foreground">за поточний тиждень</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Цього місяця
                </CardTitle>
                <div className="rounded-md p-1.5 bg-indigo-50 dark:bg-indigo-950/30">
                  <Calendar className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.monthHours.toFixed(1)} год.</div>
                <p className="text-xs text-muted-foreground">за поточний місяць</p>
              </CardContent>
            </Card>
          </div>

          {/* Chart */}
          {chartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Розподіл робочих годин</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" tick={{ fontSize: 10 }} />
                      <YAxis className="text-xs" tick={{ fontSize: 10 }} unit="г" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                      />
                      <Bar
                        dataKey="hours"
                        name="Години"
                        fill="hsl(var(--primary))"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* History list */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Історія записів ({filteredData.length})</h3>
            <ScrollArea className="max-h-[calc(100vh-540px)]">
              <div className="space-y-2">
                {filteredData.map((session) => (
                  <Card key={session.id} className="border-l-4 border-l-sky-500">
                    <CardContent className="py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm">{session.title}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {session.raw_text}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            {session.project && (
                              <Badge variant="outline" className="text-[10px]">
                                {session.project}
                              </Badge>
                            )}
                            {session.person && (
                              <Badge variant="outline" className="text-[10px]">
                                {session.person}
                              </Badge>
                            )}
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(session.created_at).toLocaleDateString('uk-UA', {
                                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-bold text-sm text-sky-600 dark:text-sky-400">
                            {session.amount ? Number(session.amount).toFixed(1) : '0'} год.
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        </>
      )}
    </div>
  )
}
