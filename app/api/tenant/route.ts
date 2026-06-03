import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  'https://xxbgmcalobabafdrxjcn.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const TENANT_ID = '1aa1d675-232e-4375-b246-b41cb76f0beb'

export async function GET() {
  const { data, error } = await sb
    .from('tenants')
    .select('*')
    .eq('id', TENANT_ID)
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PUT(request: Request) {
  const { name, logo_url } = await request.json()
  const updates: any = {}
  if (name) updates.name = name
  if (logo_url !== undefined) updates.logo_url = logo_url
  const { data, error } = await sb
    .from('tenants')
    .update(updates)
    .eq('id', TENANT_ID)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
