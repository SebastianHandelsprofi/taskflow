'use client'
import { useState, useEffect, useRef } from 'react'

const TENANT_ID = '1aa1d675-232e-4375-b246-b41cb76f0beb'
const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', outline: 'none' }
const lbl: React.CSSProperties = { display: 'block', fontSize: 11, color: 'var(--muted)', marginBottom: 5, letterSpacing: '0.08em', textTransform: 'uppercase' }

export default function SettingsPage() {
  const [tenant, setTenant] = useState<any>(null)
  const [name, setName] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/tenant').then(r => r.json()).then(data => {
      setTenant(data)
      setName(data.name || '')
      setLogoUrl(data.logo_url || '')
    })
  }, [])

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/tenant/logo', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setLogoUrl(data.url)
    } catch (e: any) { setError(e.message) }
    setUploading(false)
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    setSuccess(false)
    try {
      const res = await fetch('/api/tenant', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, logo_url: logoUrl })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (e: any) { setError(e.message) }
    setSaving(false)
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em' }}>Unternehmens-Einstellungen</h1>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>Logo und Name deines Unternehmens</p>
      </div>

      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, marginBottom: 16 }}>

        {/* Logo Upload */}
        <div style={{ marginBottom: 24 }}>
          <label style={lbl}>Unternehmens-Logo</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 80, height: 80, borderRadius: 16, background: 'var(--surface)', border: '2px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
              {logoUrl
                ? <img src={logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                : <span style={{ fontSize: 32 }}>🏢</span>
              }
            </div>
            <div style={{ flex: 1 }}>
              <button onClick={() => fileRef.current?.click()} disabled={uploading} style={{ padding: '10px 18px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer', fontSize: 13, fontWeight: 600, marginBottom: 8, width: '100%' }}>
                {uploading ? '⏳ Lädt hoch...' : '📁 Logo hochladen'}
              </button>
              <input ref={fileRef} type="file" accept="image/png,image/jpg,image/jpeg,image/svg+xml" onChange={handleLogoUpload} style={{ display: 'none' }} />
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>PNG, JPG oder SVG · Max 2MB · Empfohlen: 200x200px</div>
              {logoUrl && (
                <button onClick={() => setLogoUrl('')} style={{ marginTop: 6, fontSize: 11, color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>✕ Logo entfernen</button>
              )}
            </div>
          </div>
        </div>

        {/* Firmenname */}
        <div style={{ marginBottom: 20 }}>
          <label style={lbl}>Unternehmensname *</label>
          <input style={inp} value={name} onChange={e => setName(e.target.value)} placeholder="z.B. Eisenkrätzer GmbH" />
        </div>

        {/* Vorschau */}
        <div style={{ marginBottom: 20, padding: 16, borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 12, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Vorschau Sidebar</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #6c63ff, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, color: '#fff' }}>TF</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>TaskFlow</div>
              <div style={{ fontSize: 10, color: 'var(--muted)' }}>PRO · v1.0</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
              {logoUrl ? <img src={logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <span style={{ fontSize: 18 }}>🏢</span>}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{name || 'Unternehmensname'}</div>
              <div style={{ fontSize: 10, color: 'var(--muted)' }}>Ihr Unternehmen</div>
            </div>
          </div>
        </div>

        {error && <div style={{ padding: 10, borderRadius: 8, background: '#ff4d6d22', color: 'var(--red)', fontSize: 13, marginBottom: 14 }}>{error}</div>}
        {success && <div style={{ padding: 10, borderRadius: 8, background: '#00d4aa22', color: 'var(--green)', fontSize: 13, marginBottom: 14 }}>✅ Gespeichert! Seite neu laden um Änderungen zu sehen.</div>}

        <button onClick={handleSave} disabled={!name || saving} style={{ width: '100%', padding: '12px', borderRadius: 8, border: 'none', background: name ? 'var(--accent)' : 'var(--border)', color: '#fff', cursor: name ? 'pointer' : 'not-allowed', fontWeight: 600, fontSize: 14 }}>
          {saving ? 'Speichere...' : '💾 Einstellungen speichern'}
        </button>
      </div>
    </div>
  )
}
