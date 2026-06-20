'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Settings } from 'lucide-react'
import { useAppStore } from '@/lib/store'

export function NotConfiguredCard() {
  const { setActiveView } = useAppStore()
  return (
    <Card className="border-dashed">
      <CardContent className="py-12 text-center">
        <Settings className="mx-auto h-12 w-12 text-muted-foreground/30" />
        <p className="mt-3 text-muted-foreground">Supabase не налаштовано</p>
        <p className="text-xs text-muted-foreground mt-1">
          Підключіть базу даних для перегляду даних
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4 gap-2"
          onClick={() => setActiveView('settings')}
        >
          <Settings className="h-3.5 w-3.5" />
          Налаштувати
        </Button>
      </CardContent>
    </Card>
  )
}

export function ErrorCard({ message }: { message: string }) {
  return (
    <Card className="border-destructive">
      <CardContent className="py-6 text-center text-destructive">
        <AlertTriangle className="mx-auto h-8 w-8 mb-2" />
        <p className="text-sm">{message}</p>
      </CardContent>
    </Card>
  )
}
