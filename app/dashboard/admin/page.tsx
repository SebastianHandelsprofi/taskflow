'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const TENANT_ID = '1aa1d675-232e-4375-b246-b41cb76f0beb'
const BASE_URL = 'https://taskflow-two-livid.vercel.app'
const TEAMS = ['Vertrieb', 'Produktion', 'Kundenservice', 'IT', 'Lager', 'Marketing', 'Geschäftsleitung', 'Küche']
const ROLES = ['mitarbeiter', 'bereichsleiter', 'admin']
const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', outline: 'none' }
const lbl: React.CSSProperties = { display: 'block', fontSize: 11, color: 'var(--muted)', marginBottom: 5, letterSpacing: '0.08em', textTransform: 'uppercase' }
const ROLE_COLORS: Record<string, string> = { 'admin': '#ff4d6d', 'bereichsleiter': '#ffd166', 'mitarbeiter': '#00d4aa' }
const TEAM_COLORS: Record<string, string> = { 'Vertrieb': '#6c63ff', 'Produktion': '#ff8c42', 'Kundenservice': '#00d4aa', 'IT': '#4ecdc4', 'Lager': '#ffd166', 'Marketing': '#ff6b9d', 'Geschäftsleitung': '#a855f7', 'Küche': '#ff8c42' }

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])
  return isMobile
}

export default function AdminPage() {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('mitarbeiter')
  const [team, setTeam] = useState('Vertrieb')
  const [sending, setSending] = useState(false)
  const [inviteLink, setInviteLink] = useState('')
  const [error, setError] = useState('')
  const [invitations, setInvitations] = useState<any[]>([])
  const [profiles, setProfiles] = useState<any[]>([])
  const [authUsers, setAuthUsers] = useState<any[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'team' | 'invite' | 'pending' | 'sync'>('team')
  const [deleting, setDeleting] = useState<string | null>(null)
  const [editingProfile, setEditingProfile] = useState<any>(null)
  const [editAbteilung, setEditAbteilung] = useState('')
  const [editRole, setEditRole] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirming, setConfirming] = useState<string | null>(null)
  const isMobile = useIsMobile()

  useEffect(() => {
    createClient().auth.getUser().then(({ data }: any) => setUserId(data.user?.id ?? null))
    loadData()
  }, [])

  async function loadData() {
    const [invRes, profRes, usersRes] = await Promise.all([
      fetch('/api/invite/list'),
      fetch('/api/profiles'),
      fetch('/api/users'),
    ])
    if (invRes.ok) setInvitations(await invRes.json())
    if (profRes.ok) setProfiles(await profRes.json())
    if (usersRes.ok) setAuthUsers(await usersRes.json())
  }

  async function handleInvite() {
    if (!email) return
    setSending(true); setError(''); setInviteLink('')
    try {
      const res = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role, team, tenant_id: TENANT_ID, invited_by: userId })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setInviteLink(`${BASE_URL}/invite?token=${data.token}`)
      setEmail('')
      loadData()
    } catch (e: any) { setError(e.message) }
    setSending(false)
  }

  async function handleDeleteInvite(id: string) {
    if (!confirm('Einladung löschen?')) return
    setDeleting(id)
    await fetch('/api/invite/list', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    loadData(); setDeleting(null)
  }

  async function handleDeleteUser(uid: string, name: string) {
    if (!confirm(`User "${name}" komplett löschen?`)) return
    setDeleting(uid)
    await fetch('/api/users', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: uid }) })
    loadData(); setDeleting(null)
  }

  async function handleConfirmEmail(uid: string) {
    setConfirming(uid)
    await fetch('/api/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: uid }) })
    loadData(); setConfirming(null)
  }

  async function handleSaveProfile() {
    if (!editingProfile) return
    setSaving(true)
    await fetch('/api/teams/members', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: editingProfile.id, abteilung: editAbteilung, role: editRole }) })
    setEditingProfile(null); loadData(); setSaving(false)
  }

  function copyLink(link: string, id: string) {
    navigator.clipboard.writeText(link)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const pending = invitations.filter(i => !i.accepted)
  const accepted = invitations.filter(i => i.accepted)
  const unconfirmedUsers = authUsers.filter(u => !u.confirmed)
  const usersWithoutProfile = authUsers.filter(u => !u.profile)

  const tabs = [
    { id: 'team', label: `Team (${profiles.length})` },
    { id: 'invite', label: '+ Einladen' },
    { id: 'pending', label: `Ausstehend (${pending.length})` },
    { id: 'sync', label: `Sync${usersWithoutProfile.length > 0 || unconfirmedUsers.length > 0 ? ' ⚠️' : ''}` },
  ]

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: isMobile ? 24 : 22, fontWeight: 800, letterSpacing: '-0.03em' }}>Team verwalten</h1>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>Mitarbeiter einladen und verwalten</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id as any)} style={{ padding: '8px 16px', borderRadius: 20, border: `1px solid ${activeTab === t.id ? 'var(--accent)' : 'var(--border)'}`, background: activeTab === t.id ? 'var(--accent)' : 'transparent', color: activeTab === t.id ? '#fff' : 'var(--muted)', cursor: 'pointer', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Team */}
      {activeTab === 'team' && (
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          {isMobile ? (
            // Mobile: Karten
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {profiles.map((p: any, i: number) => (
                <div key={p.id} style={{ padding: '12px 16px', borderBottom: i < profiles.length - 1 ? '1px solid var(--border)' : 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 18, background: `${TEAM_COLORS[p.abteilung] || 'var(--accent)'}33`, border: `1px solid ${TEAM_COLORS[p.abteilung] || 'var(--accent)'}66`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: TEAM_COLORS[p.abteilung] || 'var(--accent)', flexShrink: 0 }}>
                    {p.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.full_name}</div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 3 }}>
                      <span style={{ fontSize: 11, padding: '1px 6px', borderRadius: 4, background: `${ROLE_COLORS[p.role]}22`, color: ROLE_COLORS[p.role], fontWeight: 600 }}>{p.role}</span>
                      {p.abteilung
                        ? <span style={{ fontSize: 11, padding: '1px 6px', borderRadius: 4, background: `${TEAM_COLORS[p.abteilung] || '#6c63ff'}22`, color: TEAM_COLORS[p.abteilung] || '#6c63ff', fontWeight: 600 }}>{p.abteilung}</span>
                        : <span style={{ fontSize: 11, color: 'var(--red)' }}>⚠ Keine Abt.</span>
                      }
                    </div>
                  </div>
                  <div style={{ display: 'flex', flex: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>{p.points}</div>
                    <button onClick={() => { setEditingProfile(p); setEditAbteilung(p.abteilung || ''); setEditRole(p.role) }} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted)', cursor: 'pointer', fontSize: 12 }}>✏️</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Desktop: Tabelle
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
                  {['Name', 'Rolle', 'Abteilung', 'Punkte', 'Level', 'Status', 'Bearbeiten'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {profiles.map((p: any, i: number) => (
                  <tr key={p.id} style={{ borderBottom: i < profiles.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 16, background: `${TEAM_COLORS[p.abteilung] || 'var(--accent)'}33`, border: `1px solid ${TEAM_COLORS[p.abteilung] || 'var(--accent)'}66`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: TEAM_COLORS[p.abteilung] || 'var(--accent)' }}>
                          {p.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{p.full_name}</div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}><span style={{ padding: '3px 10px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: `${ROLE_COLORS[p.role]}22`, color: ROLE_COLORS[p.role] }}>{p.role}</span></td>
                    <td style={{ padding: '14px 16px' }}>{p.abteilung ? <span style={{ padding: '3px 10px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: `${TEAM_COLORS[p.abteilung] || '#6c63ff'}22`, color: TEAM_COLORS[p.abteilung] || '#6c63ff' }}>{p.abteilung}</span> : <span style={{ color: 'var(--red)', fontSize: 11 }}>⚠ Keine</span>}</td>
                    <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>{p.points}</td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--muted)' }}>Lv.{p.level}</td>
                    <td style={{ padding: '14px 16px' }}><span style={{ padding: '3px 10px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: '#00d4aa22', color: '#00d4aa' }}>Aktiv</span></td>
                    <td style={{ padding: '14px 16px' }}><button onClick={() => { setEditingProfile(p); setEditAbteilung(p.abteilung || ''); setEditRole(p.role) }} style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted)', cursor: 'pointer', fontSize: 11 }}>✏️ Bearbeiten</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab: Einladen */}
      {activeTab === 'invite' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Neue Einladung erstellen</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div><label style={lbl}>E-Mail Adresse *</label><input style={inp} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="mitarbeiter@firma.de" /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={lbl}>Rolle</label><select style={inp} value={role} onChange={e => setRole(e.target.value)}>{ROLES.map(r => <option key={r}>{r}</option>)}</select></div>
                <div><label style={lbl}>Abteilung</label><select style={inp} value={team} onChange={e => setTeam(e.target.value)}>{TEAMS.map(t => <option key={t}>{t}</option>)}</select></div>
              </div>
            </div>
            {error && <div style={{ marginTop: 10, padding: 10, borderRadius: 8, background: '#ff4d6d22', color: 'var(--red)', fontSize: 13 }}>{error}</div>}
            <button onClick={handleInvite} disabled={!email || sending} style={{ marginTop: 16, width: '100%', padding: '12px', borderRadius: 8, border: 'none', background: email ? 'var(--accent)' : 'var(--border)', color: '#fff', cursor: email ? 'pointer' : 'not-allowed', fontWeight: 600, fontSize: 14 }}>
              {sending ? 'Erstelle Link...' : '🔗 Einladungslink generieren'}
            </button>
            {inviteLink && (
              <div style={{ marginTop: 14, padding: 14, borderRadius: 10, background: '#00d4aa18', border: '1px solid #00d4aa44' }}>
                <div style={{ fontSize: 11, color: '#00d4aa', fontWeight: 700, marginBottom: 8 }}>✅ EINLADUNGSLINK ERSTELLT</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', wordBreak: 'break-all', marginBottom: 10 }}>{inviteLink}</div>
                <button onClick={() => copyLink(inviteLink, 'new')} style={{ width: '100%', padding: '10px', borderRadius: 6, border: '1px solid #00d4aa44', background: '#00d4aa22', color: '#00d4aa', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                  {copied === 'new' ? '✅ Kopiert!' : '📋 Link kopieren'}
                </button>
              </div>
            )}
          </div>

          {/* Übersicht */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            {[
              { label: 'Teammitglieder', value: profiles.length, color: 'var(--accent)' },
              { label: 'Ausstehend', value: pending.length, color: 'var(--yellow)' },
              { label: 'Angenommen', value: accepted.length, color: 'var(--green)' },
              { label: 'Gesamt', value: invitations.length, color: 'var(--muted)' },
            ].map((s, i) => (
              <div key={i} style={{ padding: 14, borderRadius: 10, background: 'var(--card)', border: '1px solid var(--border)', textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Ausstehend */}
      {activeTab === 'pending' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {pending.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)', background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border)' }}>Keine ausstehenden Einladungen</div>
          ) : pending.map((inv: any) => (
            <div key={inv.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{inv.email}</div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: `${ROLE_COLORS[inv.role]}22`, color: ROLE_COLORS[inv.role], fontWeight: 600 }}>{inv.role}</span>
                    {inv.team && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: `${TEAM_COLORS[inv.team] || '#6c63ff'}22`, color: TEAM_COLORS[inv.team] || '#6c63ff', fontWeight: 600 }}>{inv.team}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => copyLink(`${BASE_URL}/invite?token=${inv.token}`, inv.id)} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted)', cursor: 'pointer', fontSize: 13 }}>
                    {copied === inv.id ? '✅' : '📋'}
                  </button>
                  <button onClick={() => handleDeleteInvite(inv.id)} disabled={deleting === inv.id} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #ff4d6d44', background: '#ff4d6d18', color: 'var(--red)', cursor: 'pointer', fontSize: 13 }}>
                    {deleting === inv.id ? '...' : '🗑'}
                  </button>
                </div>
              </div>
              <div style={{ fontSize: 11, color: new Date(inv.expires_at) < new Date() ? 'var(--red)' : 'var(--muted)' }}>
                Läuft ab: {new Date(inv.expires_at).toLocaleDateString('de-DE')}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Sync */}
      {activeTab === 'sync' && (
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>🔄 Alle Auth-User</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Supabase Auth synchronisiert mit App</div>
            </div>
            <button onClick={() => loadData()} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted)', cursor: 'pointer', fontSize: 12 }}>↻ Sync</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {authUsers.map((u: any, i: number) => (
              <div key={u.id} style={{ padding: '12px 16px', borderBottom: i < authUsers.length - 1 ? '1px solid var(--border)' : 'none', background: !u.profile ? '#ff4d6d08' : 'transparent' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 0, marginRight: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.profile?.full_name || <span style={{ color: 'var(--red)' }}>⚠ Kein Profil</span>}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                      {u.profile?.abteilung && <span style={{ fontSize: 11, padding: '1px 6px', borderRadius: 4, background: `${TEAM_COLORS[u.profile.abteilung] || '#6c63ff'}22`, color: TEAM_COLORS[u.profile.abteilung] || '#6c63ff', fontWeight: 600 }}>{u.profile.abteilung}</span>}
                      <span style={{ fontSize: 11, color: 'var(--muted)' }}>Login: {u.last_sign_in ? new Date(u.last_sign_in).toLocaleDateString('de-DE') : '—'}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                    {!u.confirmed && (
                      <button onClick={() => handleConfirmEmail(u.id)} disabled={confirming === u.id} style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #ffd16644', background: '#ffd16622', color: 'var(--yellow)', cursor: 'pointer', fontSize: 11 }}>
                        {confirming === u.id ? '...' : '✉️'}
                      </button>
                    )}
                    {u.confirmed && <span style={{ fontSize: 14 }}>✅</span>}
                    <button onClick={() => handleDeleteUser(u.id, u.profile?.full_name || u.email)} disabled={deleting === u.id} style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #ff4d6d44', background: '#ff4d6d18', color: 'var(--red)', cursor: 'pointer', fontSize: 11 }}>
                      {deleting === u.id ? '...' : '🗑'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingProfile && (
        <div style={{ position: 'fixed', inset: 0, background: '#00000088', backdropFilter: 'blur(4px)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', zIndex: 100 }} onClick={e => e.target === e.currentTarget && setEditingProfile(null)}>
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: isMobile ? '20px 20px 0 0' : 16, padding: 28, width: isMobile ? '100%' : 420 }}>
            {isMobile && <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--border)', margin: '0 auto 20px' }} />}
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Mitarbeiter bearbeiten</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>{editingProfile.full_name}</div>
            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Abteilung</label>
              <select style={inp} value={editAbteilung} onChange={e => setEditAbteilung(e.target.value)}>
                <option value="">— Keine Abteilung —</option>
                {TEAMS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={lbl}>Rolle</label>
              <select style={inp} value={editRole} onChange={e => setEditRole(e.target.value)}>
                {ROLES.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setEditingProfile(null)} style={{ padding: '11px 18px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted)', cursor: 'pointer' }}>Abbrechen</button>
              <button onClick={handleSaveProfile} disabled={saving} style={{ flex: isMobile ? 1 : 'none', padding: '11px 18px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
                {saving ? 'Speichere...' : 'Speichern'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
