'use client'

import { useEvents } from '@/hooks/use-events'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { StickyNote, Loader2, RefreshCw, Search } from 'lucide-react'
import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { NotConfiguredCard, ErrorCard } from '@/components/dashboard/shared'

export function NotesView() {
  const { data, count, loading, error, refetch } = useEvents({
    type: 'note',
  })
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search.trim()) return data
    const q = search.toLowerCase()
    return data.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.raw_text.toLowerCase().includes(q) ||
        (n.project && n.project.toLowerCase().includes(q))
    )
  }, [data, search])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Нотатки</h2>
          <p className="text-muted-foreground">
            {count} {count === 1 ? 'нотатка' : count < 4 ? 'нотатки' : 'нотаток'}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refetch} className="gap-2">
          <RefreshCw className="h-3.5 w-3.5" />
          Оновити
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Пошук нотаток..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
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
            <StickyNote className="mx-auto h-12 w-12 text-muted-foreground/30" />
            <p className="mt-3 text-muted-foreground">Нотаток немає</p>
            <p className="text-xs text-muted-foreground mt-1">
              Скажіть асистенту &quot;запиши...&quot; або &quot;нотатка...&quot; через Telegram
            </p>
          </CardContent>
        </Card>
      )}

      {!loading && !error && search && filtered.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Нічого не знайдено за запитом &quot;{search}&quot;</p>
          </CardContent>
        </Card>
      )}

      <ScrollArea className="max-h-[calc(100vh-320px)]">
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((note) => (
            <Card
              key={note.id}
              className={cn(
                'border-l-4 border-l-teal-500 transition-all hover:shadow-sm'
              )}
            >
              <CardContent className="py-4">
                <div className="flex items-start gap-2 mb-2">
                  <StickyNote className="h-4 w-4 text-teal-500 shrink-0 mt-0.5" />
                  <h3 className="font-medium text-sm">{note.title}</h3>
                </div>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-4">
                  {note.raw_text}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  {note.project && (
                    <span className="text-[10px] bg-muted px-2 py-0.5 rounded">
                      {note.project}
                    </span>
                  )}
                  {note.person && (
                    <span className="text-[10px] bg-muted px-2 py-0.5 rounded">
                      {note.person}
                    </span>
                  )}
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(note.created_at).toLocaleDateString('uk-UA', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </span>
                  {note.source_type === 'voice' && (
                    <span className="text-[10px] bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded">
                      Голос
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
