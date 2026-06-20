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
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Wallet, Loader2, RefreshCw, TrendingDown } from 'lucide-react'
import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts'
import { NotConfiguredCard, ErrorCard } from '@/components/dashboard/shared'

type Period = 'day' | 'week' | 'month' | 'custom'

const CATEGORY_COLORS = {
  'дом (їда)': '#FF8042',    // Orange
  'одяг': '#0088FE',          // Blue
  'інструменти': '#FFBB28',   // Yellow
  'топливо': '#FF0000',       // Red
  'для себе': '#00C49F',      // Teal
  'Інше': '#8884d8',          // Purple
}

export function ExpensesView() {
  const [period, setPeriod] = useState<Period>('week')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const { data, count, loading, error, refetch } = useEvents({
    type: 'expense',
    period: period !== 'custom' ? period : undefined,
    dateFrom: period === 'custom' ? dateFrom : undefined,
    dateTo: period === 'custom' ? dateTo : undefined,
  })

  const totals = useMemo(() => {
    const result: Record<string, number> = {}
    data.forEach((e) => {
      if (e.amount) {
        const cur = e.currency || 'CZK'
        result[cur] = (result[cur] || 0) + Number(e.amount)
      }
    })
    return result
  }, [data])

  // Chart data - group by date
  const chartData = useMemo(() => {
    const grouped: Record<string, Record<string, number>> = {}
    data.forEach((e) => {
      if (!e.created_at || !e.amount) return
      const date = new Date(e.created_at).toLocaleDateString('uk-UA', {
        day: 'numeric', month: 'short'
      })
      if (!grouped[date]) grouped[date] = {}
      const cur = e.currency || 'CZK'
      grouped[date][cur] = (grouped[date][cur] || 0) + Number(e.amount)
    })
    return Object.entries(grouped)
      .map(([date, currencies]) => ({ date, ...currencies }))
      .reverse()
  }, [data])

  // Category data - group by project column
  const categoryData = useMemo(() => {
    const categories: Record<string, number> = {
      'дом (їда)': 0,
      'одяг': 0,
      'інструменти': 0,
      'топливо': 0,
      'для себе': 0,
      'Інше': 0,
    }

    data.forEach((e) => {
      if (!e.amount) return
      const category = e.project && e.project.trim() ? e.project.trim() : 'Інше'
      const amount = Number(e.amount)

      if (category in categories) {
        categories[category] += amount
      } else {
        categories['Інше'] += amount
      }
    })

    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .filter((item) => item.value > 0)
  }, [data])

  const periodLabels: Record<Period, string> = {
    day: 'За день',
    week: 'За тиждень',
    month: 'За місяць',
    custom: 'Вибрати період',
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Витрати</h2>
          <p className="text-muted-foreground">
            {count} {count === 1 ? 'запис' : count < 4 ? 'записи' : 'записів'}
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

      {/* Custom date range */}
      {period === 'custom' && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Від:</label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">До:</label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-40"
            />
          </div>
        </div>
      )}

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
            <Wallet className="mx-auto h-12 w-12 text-muted-foreground/30" />
            <p className="mt-3 text-muted-foreground">Витрат не знайдено за цей період</p>
            <p className="text-xs text-muted-foreground mt-1">
              Скажіть асистенту &quot;витратив 500 CZK на...&quot; через Telegram
            </p>
          </CardContent>
        </Card>
      )}

      {!loading && !error && data.length > 0 && (
        <>
          {/* Summary cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(totals).map(([currency, amount]) => (
              <Card key={currency}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Всього {currency}
                  </CardTitle>
                  <div className="rounded-md p-1.5 bg-emerald-50 dark:bg-emerald-950/30">
                    <TrendingDown className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{amount.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">{currency}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Bar Chart */}
            {chartData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Динаміка витрат за днями</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="date" className="text-xs" tick={{ fontSize: 10 }} />
                        <YAxis className="text-xs" tick={{ fontSize: 10 }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: '12px',
                          }}
                        />
                        {Object.keys(totals).map((currency, idx) => (
                          <Bar
                            key={currency}
                            dataKey={currency}
                            fill={`fill-${idx + 1}`}
                            className={cn(
                              idx === 0 && "fill-emerald-500",
                              idx === 1 && "fill-blue-500",
                              idx === 2 && "fill-indigo-500"
                            )}
                            radius={[4, 4, 0, 0]}
                          />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pie Chart */}
            {categoryData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Витрати за категоріями (CZK)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex flex-col justify-between">
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={70}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {categoryData.map((entry) => (
                              <Cell
                                key={`cell-${entry.name}`}
                                fill={CATEGORY_COLORS[entry.name as keyof typeof CATEGORY_COLORS] || '#8884d8'}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: number) => [`${value.toFixed(2)} CZK`, 'Сума']}
                            contentStyle={{
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                              fontSize: '12px',
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    {/* Legend */}
                    <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[10px]">
                      {categoryData.map((entry) => {
                        const color = CATEGORY_COLORS[entry.name as keyof typeof CATEGORY_COLORS] || '#8884d8'
                        return (
                          <div key={entry.name} className="flex items-center gap-1">
                            <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                            <span className="text-muted-foreground">{entry.name}:</span>
                            <span className="font-semibold">{entry.value.toFixed(0)} CZK</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Expense list */}
          <ScrollArea className="max-h-[calc(100vh-520px)]">
            <div className="space-y-2">
              {data.map((expense) => (
                <Card key={expense.id} className="border-l-4 border-l-emerald-500">
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm">{expense.title}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {expense.raw_text}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          {expense.project && (
                            <Badge variant="outline" className="text-[10px]">
                              Категорія: {expense.project}
                            </Badge>
                          )}
                          {expense.person && (
                            <Badge variant="outline" className="text-[10px]">
                              {expense.person}
                            </Badge>
                          )}
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(expense.created_at).toLocaleDateString('uk-UA', {
                              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-bold text-sm">
                          {expense.amount ? Number(expense.amount).toFixed(2) : '—'}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {expense.currency || 'CZK'}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </>
      )}
    </div>
  )
}
