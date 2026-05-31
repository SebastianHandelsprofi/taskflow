import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  'https://xxbgmcalobabafdrxjcn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4YmdtY2Fsb2JhYmFmZHJ4amNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2OTA0ODIsImV4cCI6MjA5NTI2NjQ4Mn0.XrD62q_DtiTmInz6SqnHlQ9QPQtZNDaVPATBteoZ9xg'
)

export async function POST(request: Request) {
  const { email, role, team, tenant_id, invited_by } = await request.json()
  const { data, error } = await sb
    .from('invitations')
    .insert({ email, role, team, tenant_id, invited_by })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ token: data.token, invitation: data })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Kein Token' }, { status: 400 })
  const { data, error } = await sb
    .from('invitations')
    .select('*')
    .eq('token', token)
    .eq('accepted', false)
    .single()
  if (error || !data) return NextResponse.json({ error: 'Ungültige Einladung' }, { status: 404 })
  if (new Date(data.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Einladung abgelaufen' }, { status: 410 })
  }
  return NextResponse.json(data)
}

export async function PATCH(request: Request) {
  const { token } = await request.json()
  const { error } = await sb
    .from('invitations')
    .update({ accepted: true })
    .eq('token', token)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
