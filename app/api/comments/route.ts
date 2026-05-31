import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  'https://xxbgmcalobabafdrxjcn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4YmdtY2Fsb2JhYmFmZHJ4amNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2OTA0ODIsImV4cCI6MjA5NTI2NjQ4Mn0.XrD62q_DtiTmInz6SqnHlQ9QPQtZNDaVPATBteoZ9xg'
)

const TENANT_ID = '1aa1d675-232e-4375-b246-b41cb76f0beb'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const task_id = searchParams.get('task_id')
  if (!task_id) return NextResponse.json({ error: 'task_id fehlt' }, { status: 400 })

  const { data, error } = await sb
    .from('comments')
    .select('*, author:profiles!user_id(id, full_name, abteilung)')
    .eq('task_id', task_id)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: Request) {
  const { task_id, user_id, content } = await request.json()
  if (!task_id || !content) return NextResponse.json({ error: 'Fehlende Felder' }, { status: 400 })

  const { data, error } = await sb
    .from('comments')
    .insert({ task_id, user_id, content, tenant_id: TENANT_ID })
    .select('*, author:profiles!user_id(id, full_name, abteilung)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(request: Request) {
  const { id } = await request.json()
  const { error } = await sb.from('comments').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
