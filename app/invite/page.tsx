'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function InvitePage() {
  const [invitation, setInvitation] = useState<any>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [vorname, setVorname] = useState('')
  const [nachname, setNachname] = useState('')
  const [password, setPass] = useState('')
  const [passwordConfirm, setPassConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [token, setToken] = useState('')
  const [fieldError, setFieldError] = useState('')

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
    setFieldError('')

    // Validierung
    if (!vorname.trim()) { setFieldError('Bitte Vornamen eingeben'); return }
    if (!nachname.trim()) { setFieldError('Bitte Nachnamen eingeben'); return }
    if (password.length < 6) { setFieldError('Passwort muss mindestens 6 Zeichen haben'); return }
    if (password !== passwordConfirm) { setFieldError('Passwörter stimmen nicht überein'); return }

    setSaving(true)
    try {
      const fullName = `${vorname.trim()} ${nachname.trim()}`
      const sb = createClient()
      const { data: authData, error: authError } = await sb.auth.signUp({
        email: invitation.email,
        password,
        options: { data: { full_name: fullName, tenant_id: invitation.tenant_id, role: invitation.role } }
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
            full_name: fullName,
            role: invitation.role,
            abteilung: invitation.team,
          })
        })
        await fetch('/api/invite', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        })
      }
      setSuccess(true)
    } catch (e: any) { setFieldError(e.message) }
    setSaving(false)
  }

  const inp: React.CSSProperties = { width: '100%', padding: '10px 14px', background: '#12121a', border: '1px solid #2a2a3d', borderRadius: 8, color: '#e8e8f0', outline: 'none', marginBottom: 12 }
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

  const isValid = vorname.trim() && nachname.trim() && password.length >= 6 && password === passwordConfirm

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0f', backgroundImage: 'radial-gradient(ellipse at 60% 0%, #6c63ff18 0%, transparent 60%)' }}>
      <div style={{ width: 440, background: '#1a1a26', border: '1px solid #2a2a3d', borderRadius: 16, padding: 36 }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg, #6c63ff, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, color: '#fff' }}>TF</div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#e8e8f0' }}>TaskFlow</div>
            <div style={{ fontSize: 11, color: '#6b6b8a' }}>Einladung annehmen</div>
          </div>
        </div>

        {/* Einladungs-Info */}
        <div style={{ background: '#6c63ff18', border: '1px solid #6c63ff44', borderRadius: 10, padding: '12px 16px', marginBottom: 24 }}>
          <div style={{ fontSize: 12, color: '#6b6b8a', marginBottom: 4 }}>Du wurdest eingeladen als</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#e8e8f0', marginBottom: 6 }}>{invitation?.email}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: '#ff4d6d22', color: '#ff4d6d' }}>{invitation?.role}</span>
            {invitation?.team && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: '#00d4aa22', color: '#00d4aa' }}>{invitation?.team}</span>}
          </div>
        </div>

        {/* Fehlermeldung */}
        {fieldError && (
          <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 16, background: '#ff4d6d22', border: '1px solid #ff4d6d44', color: '#ff4d6d', fontSize: 13 }}>
            ⚠️ {fieldError}
          </div>
        )}

        {/* Name */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 4 }}>
          <div>
            <label style={lbl}>Vorname *</label>
            <input style={inp} value={vorname} onChange={e => setVorname(e.target.value)} placeholder="Max" />
          </div>
          <div>
            <label style={lbl}>Nachname *</label>
            <input style={inp} value={nachname} onChange={e => setNachname(e.target.value)} placeholder="Mustermann" />
          </div>
        </div>

        {/* Passwort */}
        <div style={{ marginTop: 4 }}>
          <label style={lbl}>Passwort * (min. 6 Zeichen)</label>
          <input style={inp} type="password" value={password} onChange={e => setPass(e.target.value)} placeholder="••••••••" />
        </div>

        <div>
          <label style={lbl}>Passwort bestätigen *</label>
          <input
            style={{ ...inp, border: passwordConfirm && password !== passwordConfirm ? '1px solid #ff4d6d' : '1px solid #2a2a3d' }}
            type="password"
            value={passwordConfirm}
            onChange={e => setPassConfirm(e.target.value)}
            placeholder="••••••••"
          />
          {passwordConfirm && password !== passwordConfirm && (
            <div style={{ fontSize: 11, color: '#ff4d6d', marginTop: -8, marginBottom: 12 }}>Passwörter stimmen nicht überein</div>
          )}
          {passwordConfirm && password === passwordConfirm && password.length >= 6 && (
            <div style={{ fontSize: 11, color: '#00d4aa', marginTop: -8, marginBottom: 12 }}>✅ Passwörter stimmen überein</div>
          )}
        </div>

        <button
          onClick={handleRegister}
          disabled={!isValid || saving}
          style={{ width: '100%', padding: '12px', borderRadius: 8, border: 'none', cursor: isValid ? 'pointer' : 'not-allowed', fontWeight: 700, fontSize: 14, background: isValid ? '#6c63ff' : '#2a2a3d', color: '#fff', marginTop: 8, transition: 'background 0.2s' }}
        >
          {saving ? 'Erstelle Account...' : '🚀 Account erstellen & loslegen'}
        </button>

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 11, color: '#6b6b8a' }}>
          Mit der Registrierung stimmst du den Nutzungsbedingungen zu.
        </div>
      </div>
    </div>
  )
}
