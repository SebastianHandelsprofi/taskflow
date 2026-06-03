import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  'https://xxbgmcalobabafdrxjcn.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const TENANT_ID = '1aa1d675-232e-4375-b246-b41cb76f0beb'

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get('file') as File
  if (!file) return NextResponse.json({ error: 'Keine Datei' }, { status: 400 })

  const ext = file.name.split('.').pop()
  const path = `${TENANT_ID}/logo.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error } = await sb.storage
    .from('logos')
    .upload(path, buffer, {
      contentType: file.type,
      upsert: true
    })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data } = sb.storage.from('logos').getPublicUrl(path)
  return NextResponse.json({ url: data.publicUrl })
}
