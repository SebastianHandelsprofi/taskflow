'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function InvitePage() {
  const [invitation, setInvitation] = useState<any>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [password, setPass] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [token, setToken] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const t = params.get('token')
    if (!t) { setError('Kein Einladungstoken gefunden'); setLoading(false); return }
    setToken(t)
    fetch(`/api/invite?token=${t}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error)
        else setInvitation(data)
        setLoading(false)
      })
  }, [])

  async function handleRegister() {
    if (!name || !password) return
    setSaving(true)
    try {
      const sb = createClient()
      const { data: authData, error: authError } = await sb.auth.signUp({
        email: invitation.email,
        password,
        options: { data: { full_name: name, tenant_id: invitation.tenant_id, role: invitation.role } }
      })
      if (authError) throw authError
      const userId = authData.user?.id
      if (userId) {
        await fetch('/api/profiles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: userId,
            tenant_id: invitation.tenant_id,
            full_name: name,
            role: invitation.role,
            team: invitation.team,
          })
        })
        await fetch('/api/invite', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        })
      }
      setSuccess(true)
    } catch (e: any) { setError(e.message) }
    setSaving(false)
  }

  const inp: React.CSSProperties = { width: '100%', padding: '10px 14px', background: '#12121a', border: '1px solid #2a2a3d', borderRadius: 8, color: '#e8e8f0', outline: 'none', marginBottom: 16 }
  const lbl: React.CSSProperties = { display: 'block', fontSize: 11, color: '#6b6b8a', marginBottom: 5, letterSpacing: '0.08em', textTransform: 'uppercase' }

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0f', color: '#6b6b8a' }}>Lade Einladung...</div>

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0f' }}>
      <div style={{ background: '#1a1a26', border: '1px solid #ff4d6d44', borderRadius: 16, padding: 36, textAlign: 'center', maxWidth: 400 }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>❌</div>
        <div style={{ color: '#ff4d6d', fontWeight: 700, marginBottom: 8 }}>Einladung ungültig</div>
        <div style={{ color: '#6b6b8a', fontSize: 13 }}>{error}</div>
      </div>
    </div>
  )

  if (success) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0f' }}>
      <div style={{ background: '#1a1a26', border: '1px solid #00d4aa44', borderRadius: 16, padding: 36, textAlign: 'center', maxWidth: 400 }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>🎉</div>
        <div style={{ color: '#00d4aa', fontWeight: 700, marginBottom: 8 }}>Account erstellt!</div>
        <div style={{ color: '#6b6b8a', fontSize: 13, marginBottom: 20 }}>Du kannst dich jetzt einloggen.</div>
        <a href="/login" style={{ padding: '10px 24px', borderRadius: 8, background: '#6c63ff', color: '#fff', fontWeight: 600, fontSize: 14 }}>Zum Login</a>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0f', backgroundImage: 'radial-gradient(ellipse at 60% 0%, #6c63ff18 0%, transparent 60%)' }}>
      <div style={{ width: 420, background: '#1a1a26', border: '1px solid #2a2a3d', borderRadius: 16, padding: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg, #6c63ff, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, color: '#fff' }}>TF</div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#e8e8f0' }}>TaskFlow</div>
            <div style={{ fontSize: 11, color: '#6b6b8a' }}>Einladung annehmen</div>
          </div>
        </div>
        <div style={{ background: '#6c63ff18', border: '1px solid #6c63ff44', borderRadius: 10, padding: '12px 16px', marginBottom: 24 }}>
          <div style={{ fontSize: 12, color: '#6b6b8a', marginBottom: 4 }}>Du wurdest eingeladen als</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#e8e8f0' }}>{invitation?.email}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: '#6c63ff22', color: '#6c63ff' }}>{invitation?.role}</span>
            {invitation?.team && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: '#00d4aa22', color: '#00d4aa' }}>{invitation?.team}</span>}
          </div>
        </div>
        <label style={lbl}>Dein Name</label>
        <input style={inp} value={name} onChange={e => setName(e.target.value)} placeholder="Max Mustermann" />
        <label style={lbl}>Passwort wählen</label>
        <input style={inp} type="password" value={password} onChange={e => setPass(e.target.value)} placeholder="Mindestens 6 Zeichen" />
        <button onClick={handleRegister} disabled={!name || !password || saving} style={{ width: '100%', padding: '12px', borderRadius: 8, border: 'none', cursor: name && password ? 'pointer' : 'not-allowed', fontWeight: 700, fontSize: 14, background: name && password ? '#6c63ff' : '#2a2a3d', color: '#fff' }}>
          {saving ? 'Erstelle Account...' : 'Account erstellen & loslegen'}
        </button>
      </div>
    </div>
  )
}
