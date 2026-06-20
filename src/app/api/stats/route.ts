import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase credentials are not configured on the server.' },
      { status: 500 }
    )
  }

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString()
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1)).toISOString()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  // Open tasks
  const { count: openTasks } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .eq('type', 'task')
    .in('status', ['open', 'in-progress'])

  // Today's tasks
  const { count: todayTasks } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .eq('type', 'task')
    .gte('created_at', todayStart)
    .lt('created_at', todayEnd)

  // Upcoming reminders (not completed)
  const { count: upcomingReminders } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .eq('type', 'reminder')
    .neq('status', 'done')

  // Today's expenses total
  const { data: todayExpenses } = await supabase
    .from('events')
    .select('amount, currency')
    .eq('type', 'expense')
    .gte('created_at', todayStart)
    .lt('created_at', todayEnd)

  // Week's expenses total
  const { data: weekExpenses } = await supabase
    .from('events')
    .select('amount, currency')
    .eq('type', 'expense')
    .gte('created_at', weekStart)

  // Month's expenses total
  const { data: monthExpenses } = await supabase
    .from('events')
    .select('amount, currency')
    .eq('type', 'expense')
    .gte('created_at', monthStart)

  // Notes count
  const { count: totalNotes } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .eq('type', 'note')

  // Overdue tasks
  const { count: overdueTasks } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .eq('type', 'task')
    .in('status', ['open', 'in-progress'])
    .lt('due_datetime', now.toISOString())
  // Month's work hours total
  const { data: monthWork } = await supabase
    .from('events')
    .select('amount')
    .eq('type', 'work')
    .gte('created_at', monthStart)

  const sumAmounts = (items: { amount: number | null; currency: string | null }[] | null) => {
    if (!items) return { CZK: 0, USD: 0, EUR: 0 }
    const totals: Record<string, number> = {}
    items.forEach((item) => {
      if (item.amount) {
        const cur = item.currency || 'CZK'
        totals[cur] = (totals[cur] || 0) + Number(item.amount)
      }
    })
    return totals
  }

  const sumHours = (items: { amount: number | null }[] | null) => {
    if (!items) return 0
    return items.reduce((acc, item) => acc + (item.amount ? Number(item.amount) : 0), 0)
  }

  return NextResponse.json({
    openTasks: openTasks || 0,
    todayTasks: todayTasks || 0,
    upcomingReminders: upcomingReminders || 0,
    overdueTasks: overdueTasks || 0,
    todayExpenses: sumAmounts(todayExpenses),
    weekExpenses: sumAmounts(weekExpenses),
    monthExpenses: sumAmounts(monthExpenses),
    totalNotes: totalNotes || 0,
    monthWorkHours: sumHours(monthWork),
  })
}
