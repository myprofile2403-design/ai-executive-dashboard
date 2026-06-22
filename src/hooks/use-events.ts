'use client'

import { useState, useEffect, useCallback } from 'react'
import { EventRow, createSupabaseClient } from '@/lib/supabase'
import { useAppStore } from '@/lib/store'
import type { SupabaseClient } from '@supabase/supabase-js'

function getClient(): SupabaseClient | null {
  if (typeof window === 'undefined') return null
  const url = localStorage.getItem('dashboard_supabase_url') || ''
  const key = localStorage.getItem('dashboard_supabase_key') || ''
  if (!url || !key) return null
  return createSupabaseClient(url, key)
}

export function getTelegramChatId(): string | null {
  if (typeof window === 'undefined') return null
  
  // 1. Try to read from Telegram WebApp SDK if available
  const tg = (window as any).Telegram?.WebApp
  if (tg?.initDataUnsafe?.user?.id) {
    return String(tg.initDataUnsafe.user.id)
  }
  
  // 2. Try to get it from URL parameter if specified (e.g. ?chat_id=12345)
  const urlParams = new URLSearchParams(window.location.search)
  const queryId = urlParams.get('chat_id') || urlParams.get('tg_id')
  if (queryId) {
    // Save to localStorage for convenience
    localStorage.setItem('dashboard_telegram_chat_id', queryId)
    return queryId
  }

  // 3. Fallback to localStorage
  const savedId = localStorage.getItem('dashboard_telegram_chat_id')
  if (savedId) return savedId

  // 4. Fallback to first allowed Telegram ID in settings
  try {
    const allowed = JSON.parse(localStorage.getItem('dashboard_allowed_telegram_ids') || '[]')
    if (allowed.length > 0) return allowed[0]
  } catch {}

  return null
}

export function useEvents(params: {
  type?: string
  status?: string
  period?: string
  dateFrom?: string
  dateTo?: string
}) {
  const [data, setData] = useState<EventRow[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const client = getClient()
      if (!client) {
        setError('Supabase не налаштовано. Перейдіть до Налаштувань.')
        setLoading(false)
        return
      }

      const chatId = getTelegramChatId()
      if (!chatId) {
        setError('Не знайдено Telegram Chat ID. Відкрийте Mini App через Telegram або вкажіть ID у налаштуваннях.')
        setLoading(false)
        return
      }

      let query = client
        .from('events')
        .select('*', { count: 'exact' })
        .eq('telegram_chat_id', chatId)
        .order('created_at', { ascending: false })
        .range(0, 99)

      if (params.type) query = query.eq('type', params.type)
      if (params.status) query = query.eq('status', params.status)

      // Period filter
      if (params.period || params.dateFrom || params.dateTo) {
        const now = new Date()
        let from: Date | null = null
        let to: Date | null = null

        if (params.period === 'day') {
          from = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          to = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
        } else if (params.period === 'week') {
          const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1
          from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek)
          to = new Date(from.getFullYear(), from.getMonth(), from.getDate() + 7)
        } else if (params.period === 'month') {
          from = new Date(now.getFullYear(), now.getMonth(), 1)
          to = new Date(now.getFullYear(), now.getMonth() + 1, 1)
        } else if (params.dateFrom || params.dateTo) {
          if (params.dateFrom) from = new Date(params.dateFrom)
          if (params.dateTo) to = new Date(params.dateTo)
        }

        if (from) query = query.gte('created_at', from.toISOString())
        if (to) query = query.lt('created_at', to.toISOString())
      }

      const { data: rows, error: err, count: cnt } = await query

      if (err) throw new Error(err.message)

      setData((rows as EventRow[]) || [])
      setCount(cnt || 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [params.type, params.status, params.period, params.dateFrom, params.dateTo])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const updateStatus = useCallback(async (id: string, status: string) => {
    const client = getClient()
    if (!client) throw new Error('Supabase не налаштовано')

    const { data: updated, error: err } = await client
      .from('events')
      .update({ status })
      .eq('id', id)
      .select()
      .single()

    if (err) throw new Error(err.message)

    setData((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status } : item))
    )
    return updated as EventRow
  }, [])

  return { data, count, loading, error, refetch: fetchEvents, updateStatus }
}

interface DashboardStats {
  openTasks: number
  todayTasks: number
  upcomingReminders: number
  overdueTasks: number
  todayExpenses: Record<string, number>
  weekExpenses: Record<string, number>
  monthExpenses: Record<string, number>
  totalNotes: number
  monthWorkHours?: number
}

export function useStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const client = getClient()
      if (!client) {
        setError('Supabase не налаштовано. Перейдіть до Налаштувань.')
        setLoading(false)
        return
      }

      const chatId = getTelegramChatId()
      if (!chatId) {
        setError('Не знайдено Telegram Chat ID. Відкрийте Mini App через Telegram або вкажіть ID у налаштуваннях.')
        setLoading(false)
        return
      }

      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString()
      const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1)).toISOString()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

      // Open tasks
      const { count: openTasks } = await client
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'task')
        .eq('telegram_chat_id', chatId)
        .in('status', ['open', 'in-progress'])

      // Today's tasks
      const { count: todayTasks } = await client
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'task')
        .eq('telegram_chat_id', chatId)
        .gte('created_at', todayStart)
        .lt('created_at', todayEnd)

      // Upcoming reminders
      const { count: upcomingReminders } = await client
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'reminder')
        .eq('telegram_chat_id', chatId)
        .neq('status', 'done')

      // Overdue tasks
      const { count: overdueTasks } = await client
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'task')
        .eq('telegram_chat_id', chatId)
        .in('status', ['open', 'in-progress'])
        .lt('due_datetime', now.toISOString())

      // Today's expenses
      const { data: todayExpenses } = await client
        .from('events')
        .select('amount, currency')
        .eq('type', 'expense')
        .eq('telegram_chat_id', chatId)
        .gte('created_at', todayStart)
        .lt('created_at', todayEnd)

      // Week's expenses
      const { data: weekExpenses } = await client
        .from('events')
        .select('amount, currency')
        .eq('type', 'expense')
        .eq('telegram_chat_id', chatId)
        .gte('created_at', weekStart)

      // Month's expenses
      const { data: monthExpenses } = await client
        .from('events')
        .select('amount, currency')
        .eq('type', 'expense')
        .eq('telegram_chat_id', chatId)
        .gte('created_at', monthStart)

      // Notes count
      const { count: totalNotes } = await client
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'note')
        .eq('telegram_chat_id', chatId)

      // Month's work hours
      const { data: monthWork } = await client
        .from('events')
        .select('amount')
        .eq('type', 'work')
        .eq('telegram_chat_id', chatId)
        .gte('created_at', monthStart)

      const sumAmounts = (items: { amount: number | null; currency: string | null }[] | null) => {
        if (!items) return {} as Record<string, number>
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

      setStats({
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return { stats, loading, error, refetch: fetchStats }
}
