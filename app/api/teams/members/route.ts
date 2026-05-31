import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  'https://xxbgmcalobabafdrxjcn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4YmdtY2Fsb2JhYmFmZHJ4amNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2OTA0ODIsImV4cCI6MjA5NTI2NjQ4Mn0.XrD62q_DtiTmInz6SqnHlQ9QPQtZNDaVPATBteoZ9xg'
)

export async function POST(request: Request) {
  const { user_id, abteilung, role } = await request.json()
  console.log('Assigning:', user_id, abteilung, role)
  
  const updates: any = { abteilung }
  if (role) updates.role = role

  const { data, error } = await sb
    .from('profiles')
    .update(updates)
    .eq('id', user_id)
    .select()
    .single()

  if (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}

export async function DELETE(request: Request) {
  const { user_id } = await request.json()
  const { data, error } = await sb
    .from('profiles')
    .update({ abteilung: null })
    .eq('id', user_id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
