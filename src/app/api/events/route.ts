import { NextRequest, NextResponse } from 'next/server'
import { supabase, EventRow } from '@/lib/supabase'
import { z } from 'zod'

const createEventSchema = z.object({
  type: z.enum(['task', 'reminder', 'expense', 'note', 'calendar', 'meeting', 'work']),
  title: z.string().min(1, 'Title is required'),
  raw_text: z.string().min(1, 'Raw text is required'),
  amount: z.number().nullable().optional(),
  currency: z.enum(['CZK', 'UAH', 'USD', 'EUR']).nullable().optional(),
  person: z.string().nullable().optional(),
  project: z.string().nullable().optional(),
  event_datetime: z.string().nullable().optional(),
  due_datetime: z.string().nullable().optional(),
  status: z.string().optional().default('open'),
  source: z.string().optional().default('api'),
  source_type: z.string().optional().default('text'),
})

const updateEventStatusSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
  status: z.string().min(1, 'Status is required'),
})

export async function GET(request: NextRequest) {
  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase credentials are not configured on the server.' },
      { status: 500 }
    )
  }

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')
  const status = searchParams.get('status')
  const period = searchParams.get('period')
  const dateFrom = searchParams.get('dateFrom')
  const dateTo = searchParams.get('dateTo')
  const limit = parseInt(searchParams.get('limit') || '100')
  const offset = parseInt(searchParams.get('offset') || '0')

  let query = supabase
    .from('events')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (type) {
    query = query.eq('type', type)
  }
  if (status) {
    query = query.eq('status', status)
  }

  // Period filter for expenses
  if (period || dateFrom || dateTo) {
    const now = new Date()
    let from: Date | null = null
    let to: Date | null = null

    if (period === 'day') {
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      to = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    } else if (period === 'week') {
      const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek)
      to = new Date(from.getFullYear(), from.getMonth(), from.getDate() + 7)
    } else if (period === 'month') {
      from = new Date(now.getFullYear(), now.getMonth(), 1)
      to = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    } else if (dateFrom || dateTo) {
      if (dateFrom) from = new Date(dateFrom)
      if (dateTo) to = new Date(dateTo)
    }

    if (from) query = query.gte('created_at', from.toISOString())
    if (to) query = query.lt('created_at', to.toISOString())
  }

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: data as EventRow[], count: count || 0 })
}

export async function POST(request: NextRequest) {
  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase credentials are not configured on the server.' },
      { status: 500 }
    )
  }

  try {
    const body = await request.json()
    const result = createEventSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation Failed', details: result.error.format() },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('events')
      .insert(result.data)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: data as EventRow }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
}

export async function PATCH(request: NextRequest) {
  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase credentials are not configured on the server.' },
      { status: 500 }
    )
  }

  try {
    const body = await request.json()
    const result = updateEventStatusSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation Failed', details: result.error.format() },
        { status: 400 }
      )
    }

    const { id, status } = result.data

    const { data, error } = await supabase
      .from('events')
      .update({ status })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: data as EventRow })
  } catch (err) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest) {
  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase credentials are not configured on the server.' },
      { status: 500 }
    )
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'id parameter is required' }, { status: 400 })
  }

  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return new NextResponse(null, { status: 204 })
}

