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
    .select('id, name, logo_url, plan, max_users, active, gamification_enabled')
    .eq('id', TENANT_ID)
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PUT(request: Request) {
  const body = await request.json()
  const { name, logo_url, gamification_enabled } = body

  const updateData: any = {}
  if (name !== undefined) updateData.name = name
  if (logo_url !== undefined) updateData.logo_url = logo_url
  if (gamification_enabled !== undefined) updateData.gamification_enabled = gamification_enabled

  if (Object.keys(updateData).length === 0) return NextResponse.json({ success: true })

  const { error } = await sb.from('tenants').update(updateData).eq('id', TENANT_ID)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
