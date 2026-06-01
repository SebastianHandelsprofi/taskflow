import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Service Role Client mit Admin-Rechten
const adminSb = createClient(
  'https://xxbgmcalobabafdrxjcn.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// User komplett löschen (Auth + Profil)
export async function DELETE(request: Request) {
  const { user_id } = await request.json()
  if (!user_id) return NextResponse.json({ error: 'user_id fehlt' }, { status: 400 })

  // Profil löschen
  await adminSb.from('profiles').delete().eq('id', user_id)

  // Auth User löschen
  const { error } = await adminSb.auth.admin.deleteUser(user_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}

// Alle Auth Users mit Profil-Status abrufen
export async function GET() {
  const { data: authUsers, error } = await adminSb.auth.admin.listUsers()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: profiles } = await adminSb.from('profiles').select('*')

  const result = authUsers.users.map(u => ({
    id: u.id,
    email: u.email,
    created_at: u.created_at,
    last_sign_in: u.last_sign_in_at,
    confirmed: !!u.email_confirmed_at,
    profile: profiles?.find(p => p.id === u.id) || null,
  }))

  return NextResponse.json(result)
}

// E-Mail Bestätigung manuell setzen
export async function PATCH(request: Request) {
  const { user_id } = await request.json()
  const { error } = await adminSb.auth.admin.updateUserById(user_id, {
    email_confirm: true,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
