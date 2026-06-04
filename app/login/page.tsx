'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function LoginForm() {
  const params = useSearchParams()
  const tenantSlug = params.get('tenant')

  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPass] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [tenant, setTenant] = useState<{ name: string; slug: string } | null>(null)

  useEffect(() => {
    if (!tenantSlug) return
    const sb = createClient()
    sb.from('tenants').select('name, slug').eq('slug', tenantSlug).single()
      .then(({ data }: { data: any }) => { if (data) setTenant(data) })
  }, [tenantSlug])

  async function handleSubmit() {
    setError('')
    setLoading(true)
    try {
      const sb = createClient()
      if (mode === 'login') {
        const { error } = await sb.auth.signInWithPassword({ email, password })
        if (error) throw error
        window.location.href = '/dashboard'
      } else {
        const { error } = await sb.auth.signUp({ email, password, options: { data: { full_name: name } } })
        if (error) throw error
        setError('Bestätige deine E-Mail, dann kannst du dich einloggen.')
      }
    } catch (e: any) {
      setError(e.message || 'Fehler aufgetreten')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', backgroundImage: 'radial-gradient(ellipse at 60% 0%, #6c63ff18 0%, transparent 60%)' }}>
      <div style={{ width: 400, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg, #6c63ff, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, color: '#fff' }}>
            {tenant ? tenant.name.charAt(0) : 'TF'}
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{tenant ? tenant.name : 'TaskFlow'}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>{tenant ? `${tenant.slug}.taskflow.app` : 'Team Performance Platform'}</div>
          </div>
        </div>

        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 24 }}>{mode === 'login' ? 'Willkommen zurück' : 'Account erstellen'}</div>

        {error && <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 16, background: '#ff4d6d22', border: '1px solid #ff4d6d44', color: '#ff4d6d', fontSize: 13 }}>{error}</div>}

        {mode === 'signup' && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 11, color: 'var(--muted)', marginBottom: 5, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Name</label>
            <input style={{ width: '100%', padding: '10px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', outline: 'none', boxSizing: 'border-box' }} value={name} onChange={e => setName(e.target.value)} placeholder="Max Mustermann" />
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 11, color: 'var(--muted)', marginBottom: 5, letterSpacing: '0.08em', textTransform: 'uppercase' }}>E-Mail</label>
          <input style={{ width: '100%', padding: '10px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', outline: 'none', boxSizing: 'border-box' }} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="max@firma.de" />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 11, color: 'var(--muted)', marginBottom: 5, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Passwort</label>
          <input style={{ width: '100%', padding: '10px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', outline: 'none', boxSizing: 'border-box' }} type="password" value={password} onChange={e => setPass(e.target.value)} placeholder="••••••••" />
        </div>

        <button onClick={handleSubmit} disabled={loading} style={{ width: '100%', padding: '12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14, background: loading ? 'var(--border)' : 'var(--accent)', color: '#fff' }}>
          {loading ? 'Lade...' : mode === 'login' ? 'Einloggen' : 'Registrieren'}
        </button>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--muted)' }}>
          {mode === 'login' ? (<>Noch kein Account? <span style={{ color: 'var(--accent)', cursor: 'pointer' }} onClick={() => setMode('signup')}>Registrieren</span></>) : (<>Schon registriert? <span style={{ color: 'var(--accent)', cursor: 'pointer' }} onClick={() => setMode('login')}>Einloggen</span></>)}
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}><div style={{ color: 'var(--muted)' }}>Lade...</div></div>}>
      <LoginForm />
    </Suspense>
  )
}
