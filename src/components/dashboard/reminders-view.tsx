'use client'

import { useEvents } from '@/hooks/use-events'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useState } from 'react'
import { Bell, Loader2, RefreshCw, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { STATUS_LABELS } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { NotConfiguredCard, ErrorCard } from '@/components/dashboard/shared'

export function RemindersView() {
  const { data, count, loading, error, refetch, updateStatus } = useEvents({
    type: 'reminder',
  })
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const handleDismiss = async (id: string) => {
    setUpdatingId(id)
    try {
      await updateStatus(id, 'done')
    } finally {
      setUpdatingId(null)
    }
  }

  // Sort: upcoming first, then by event_datetime
  const sorted = [...data].sort((a, b) => {
    // Active reminders first
    if (a.status === 'done' && b.status !== 'done') return 1
    if (a.status !== 'done' && b.status === 'done') return -1
    // Then by event_datetime
    const dateA = a.event_datetime ? new Date(a.event_datetime).getTime() : Infinity
    const dateB = b.event_datetime ? new Date(b.event_datetime).getTime() : Infinity
    return dateA - dateB
  })

  const activeReminders = sorted.filter((r) => r.status !== 'done')
  const doneReminders = sorted.filter((r) => r.status === 'done')

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Нагадування</h2>
          <p className="text-muted-foreground">
            {activeReminders.length} активних з {count} всього
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refetch} className="gap-2">
          <RefreshCw className="h-3.5 w-3.5" />
          Оновити
        </Button>
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
            <Bell className="mx-auto h-12 w-12 text-muted-foreground/30" />
            <p className="mt-3 text-muted-foreground">Нагадувань немає</p>
            <p className="text-xs text-muted-foreground mt-1">
              Скажіть асистенту &quot;нагадай мені...&quot; через Telegram
            </p>
          </CardContent>
        </Card>
      )}

      <ScrollArea className="max-h-[calc(100vh-280px)]">
        {/* Active reminders */}
        {activeReminders.length > 0 && (
          <div className="space-y-3 mb-6">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Активні
            </h3>
            {activeReminders.map((reminder) => {
              const isOverdue = reminder.event_datetime && new Date(reminder.event_datetime) < new Date()
              const eventDate = reminder.event_datetime
                ? new Date(reminder.event_datetime)
                : null

              return (
                <Card
                  key={reminder.id}
                  className={cn(
                    'border-l-4 transition-all hover:shadow-sm',
                    isOverdue ? 'border-l-red-500' : 'border-l-amber-500'
                  )}
                >
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Bell className={cn(
                            'h-4 w-4 shrink-0',
                            isOverdue ? 'text-red-500' : 'text-amber-500'
                          )} />
                          <h3 className="font-medium text-sm">{reminder.title}</h3>
                          {isOverdue && (
                            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                              Пропущено
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {reminder.raw_text}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          {eventDate && (
                            <span className={cn(
                              'text-[10px] flex items-center gap-1',
                              isOverdue ? 'text-red-500' : 'text-muted-foreground'
                            )}>
                              <Clock className="h-3 w-3" />
                              {eventDate.toLocaleDateString('uk-UA', {
                                day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                              })}
                            </span>
                          )}
                          {reminder.project && (
                            <Badge variant="outline" className="text-[10px]">
                              {reminder.project}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 h-8 w-8 text-emerald-600 hover:text-emerald-700"
                        onClick={() => handleDismiss(reminder.id)}
                        disabled={updatingId === reminder.id}
                        title="Відмітити як виконане"
                      >
                        {updatingId === reminder.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Done reminders */}
        {doneReminders.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Виконані
            </h3>
            {doneReminders.slice(0, 10).map((reminder) => (
              <Card key={reminder.id} className="opacity-60 border-l-4 border-l-emerald-500">
                <CardContent className="py-3">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-3.5 w-3.5 text-emerald-500" />
                    <h3 className="font-medium text-sm line-through text-muted-foreground">
                      {reminder.title}
                    </h3>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
