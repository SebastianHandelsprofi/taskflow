import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  'https://xxbgmcalobabafdrxjcn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4YmdtY2Fsb2JhYmFmZHJ4amNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2OTA0ODIsImV4cCI6MjA5NTI2NjQ4Mn0.XrD62q_DtiTmInz6SqnHlQ9QPQtZNDaVPATBteoZ9xg'
)

const TENANT_ID = '1aa1d675-232e-4375-b246-b41cb76f0beb'

export async function GET() {
  const { data: teams, error: teamsError } = await sb
    .from('teams')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .order('name')

  if (teamsError) return NextResponse.json({ error: teamsError.message }, { status: 500 })

  const { data: profiles } = await sb
    .from('profiles')
    .select('id, full_name, role, team, level, points')
    .eq('tenant_id', TENANT_ID)

  const result = (teams ?? []).map(t => ({
    ...t,
    members: (profiles ?? []).filter(p => p.team === t.name),
    leader: (profiles ?? []).find(p => p.team === t.name && p.role === 'bereichsleiter'),
  }))

  return NextResponse.json(result)
}

export async function POST(request: Request) {
  const { name, color } = await request.json()
  const { data, error } = await sb
    .from('teams')
    .insert({ name, color, tenant_id: TENANT_ID })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(request: Request) {
  const { id } = await request.json()
  const { error } = await sb.from('teams').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
