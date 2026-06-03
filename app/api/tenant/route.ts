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
    .select('id, name, logo_url, plan, max_users, active')
    .eq('id', TENANT_ID)
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PUT(request: Request) {
  const { name, logo_url } = await request.json()

  // Raw SQL um slug nicht anzufassen
  const parts: string[] = []
  const values: any[] = []
  let idx = 1

  if (name !== undefined) {
    parts.push(`name = $${idx}`)
    values.push(name)
    idx++
  }
  if (logo_url !== undefined) {
    parts.push(`logo_url = $${idx}`)
    values.push(logo_url)
    idx++
  }

  if (parts.length === 0) return NextResponse.json({ success: true })

  values.push(TENANT_ID)
  const sql = `update public.tenants set ${parts.join(', ')} where id = $${idx}`

  const { error } = await sb.rpc('exec_sql', { sql_query: sql, params: values })

  if (error) {
    // Fallback: direkt updaten ohne slug
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (logo_url !== undefined) updateData.logo_url = logo_url

    const { error: error2 } = await sb
      .from('tenants')
      .update(updateData)
      .eq('id', TENANT_ID)

    if (error2) return NextResponse.json({ error: error2.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
