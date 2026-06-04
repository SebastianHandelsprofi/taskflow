'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function InviteForm() {
  const params = useSearchParams()
  const router = useRouter()
  const token = params.get('token')

  const [invitation, setInvitation] = useState<any>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [password, setPass] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!token) { setError('Kein Einladungstoken gefunden.'); setLoading(false); return }
    fetch(`/api/invitations?token=${token}`)
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setInvitation(d.invitation) })
      .catch(() => setError('Fehler beim Laden der Einladung.'))
      .finally(() => setLoading(false))
  }, [token])

  async function handleRegister() {
    if (!name || !password) { setError('Bitte alle Felder ausfüllen.'); return }
    setSubmitting(true); setError('')
    try {
      const sb = createClient()
      const { data: authData, error: signUpError } = await sb.auth.signUp({
        email: invitation.email,
        password,
        options: { data: { full_name: name } }
      })
      if (signUpError) throw signUpError
      const userId = authData.user?.id
      if (!userId) throw new Error('User ID fehlt')

      const { error: profileError } = await sb.from('profiles').insert({
        id: userId,
        tenant_id: invitation.tenant_id,
        full_name: name,
        email: invitation.email,
        role: invitation.role,
        team_id: invitation.team || null,
      })
      if (profileError) throw profileError

      await sb.from('invitations').update({ accepted: true }).eq('token', token)
      setDone(true)
      setTimeout(() => router.push('/dashboard'), 2000)
    } catch (e: any) {
      setError(e.message || 'Fehler bei der Registrierung')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ color: 'var(--muted)' }}>Einladung wird geladen...</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', backgroundImage: 'radial-gradient(ellipse at 60% 0%, #6c63ff18 0%, transparent 60%)' }}>
      <div style={{ width: 400, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg, #6c63ff, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, color: '#fff' }}>
            {invitation?.tenants?.name?.charAt(0) ?? '?'}
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{invitation?.tenants?.name ?? 'Unbekannt'}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>Einladung zur Zusammenarbeit</div>
          </div>
        </div>

        {error && !done && (
          <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 16, background: '#ff4d6d22', border: '1px solid #ff4d6d44', color: '#ff4d6d', fontSize: 13 }}>{error}</div>
        )}

        {done ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>✅</div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Konto erstellt!</div>
            <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 8 }}>Du wirst weitergeleitet...</div>
          </div>
        ) : invitation ? (
          <>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 24 }}>
              Du wurdest eingeladen als <strong style={{ color: 'var(--text)' }}>{invitation.role}</strong> beizutreten. Erstelle dein Konto für <strong style={{ color: 'var(--accent)' }}>{invitation.email}</strong>.
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--muted)', marginBottom: 5, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Dein Name</label>
              <input style={{ width: '100%', padding: '10px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', outline: 'none', boxSizing: 'border-box' }} value={name} onChange={e => setName(e.target.value)} placeholder="Max Mustermann" />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--muted)', marginBottom: 5, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Passwort wählen</label>
              <input style={{ width: '100%', padding: '10px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', outline: 'none', boxSizing: 'border-box' }} type="password" value={password} onChange={e => setPass(e.target.value)} placeholder="••••••••" />
            </div>
            <button onClick={handleRegister} disabled={submitting} style={{ width: '100%', padding: '12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14, background: submitting ? 'var(--border)' : 'var(--accent)', color: '#fff' }}>
              {submitting ? 'Wird erstellt...' : 'Konto erstellen & beitreten'}
            </button>
          </>
        ) : null}
      </div>
    </div>
  )
}

export default function InvitePage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}><div style={{ color: 'var(--muted)' }}>Lade...</div></div>}>
      <InviteForm />
    </Suspense>
  )
}
