'use client'

import { useEvents } from '@/hooks/use-events'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CheckSquare, Circle, Loader2, Clock, AlertTriangle, RefreshCw } from 'lucide-react'
import { STATUS_LABELS } from '@/lib/supabase'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { NotConfiguredCard, ErrorCard } from '@/components/dashboard/shared'

const statusFilters = [
  { value: '', label: 'Усі' },
  { value: 'open', label: 'Відкриті' },
  { value: 'in-progress', label: 'В процесі' },
  { value: 'done', label: 'Виконані' },
]

const statusIcons: Record<string, React.ElementType> = {
  open: Circle,
  'in-progress': Clock,
  done: CheckSquare,
  cancelled: AlertTriangle,
}

export function TasksView() {
  const [statusFilter, setStatusFilter] = useState('')
  const { data, count, loading, error, refetch, updateStatus } = useEvents({
    type: 'task',
    status: statusFilter || undefined,
  })
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const handleStatusChange = async (id: string, newStatus: string) => {
    setUpdatingId(id)
    try {
      await updateStatus(id, newStatus)
    } finally {
      setUpdatingId(null)
    }
  }

  const getNextStatus = (current: string) => {
    switch (current) {
      case 'open': return 'in-progress'
      case 'in-progress': return 'done'
      case 'done': return 'open'
      default: return 'done'
    }
  }

  const statusColorMap: Record<string, string> = {
    open: 'border-l-blue-500',
    'in-progress': 'border-l-amber-500',
    done: 'border-l-emerald-500',
    cancelled: 'border-l-red-500',
  }

  const badgeVariant: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
    open: 'outline',
    'in-progress': 'secondary',
    done: 'default',
    cancelled: 'destructive',
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Задачі</h2>
          <p className="text-muted-foreground">
            {count} {count === 1 ? 'задача' : count < 4 ? 'задачі' : 'задач'}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refetch} className="gap-2">
          <RefreshCw className="h-3.5 w-3.5" />
          Оновити
        </Button>
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2">
        {statusFilters.map((f) => (
          <Button
            key={f.value}
            variant={statusFilter === f.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(f.value)}
          >
            {f.label}
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
            <CheckSquare className="mx-auto h-12 w-12 text-muted-foreground/30" />
            <p className="mt-3 text-muted-foreground">Задачі не знайдені</p>
            <p className="text-xs text-muted-foreground mt-1">
              Відправте голосове або текстове повідомлення через Telegram для створення задач
            </p>
          </CardContent>
        </Card>
      )}

      <ScrollArea className="max-h-[calc(100vh-280px)]">
        <div className="space-y-3">
          {data.map((task) => {
            const StatusIcon = statusIcons[task.status] || Circle
            const isOverdue = task.due_datetime && new Date(task.due_datetime) < new Date() && task.status !== 'done'
            const nextStatus = getNextStatus(task.status)

            return (
              <Card
                key={task.id}
                className={cn(
                  'border-l-4 transition-all hover:shadow-sm',
                  statusColorMap[task.status] || 'border-l-gray-400',
                  isOverdue && 'border-l-red-500 bg-red-50/30 dark:bg-red-950/10'
                )}
              >
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={cn(
                          'font-medium text-sm',
                          task.status === 'done' && 'line-through text-muted-foreground'
                        )}>
                          {task.title}
                        </h3>
                        {isOverdue && (
                          <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                            Прострочено
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {task.raw_text}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <Badge variant={badgeVariant[task.status] || 'outline'} className="text-[10px]">
                          {STATUS_LABELS[task.status] || task.status}
                        </Badge>
                        {task.project && (
                          <Badge variant="outline" className="text-[10px]">
                            {task.project}
                          </Badge>
                        )}
                        {task.person && (
                          <Badge variant="outline" className="text-[10px]">
                            {task.person}
                          </Badge>
                        )}
                        {task.due_datetime && (
                          <span className="text-[10px] text-muted-foreground">
                            Дедлайн: {new Date(task.due_datetime).toLocaleDateString('uk-UA', {
                              day: 'numeric', month: 'short', year: 'numeric'
                            })}
                          </span>
                        )}
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(task.created_at).toLocaleDateString('uk-UA', {
                            day: 'numeric', month: 'short'
                          })}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 h-8 w-8"
                      onClick={() => handleStatusChange(task.id, nextStatus)}
                      disabled={updatingId === task.id}
                      title={`Змінити статус на: ${STATUS_LABELS[nextStatus]}`}
                    >
                      {updatingId === task.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <StatusIcon className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
