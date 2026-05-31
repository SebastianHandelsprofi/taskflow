'use client'
import { useState, useEffect } from 'react'

const COLORS = ['#6c63ff', '#ff8c42', '#00d4aa', '#4ecdc4', '#ffd166', '#ff6b9d', '#ff4d6d', '#a855f7']
const ROLES = ['mitarbeiter', 'bereichsleiter', 'admin']
const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', outline: 'none' }
const lbl: React.CSSProperties = { display: 'block', fontSize: 11, color: 'var(--muted)', marginBottom: 5, letterSpacing: '0.08em', textTransform: 'uppercase' }

export default function TeamsPage() {
  const [teams, setTeams] = useState<any[]>([])
  const [profiles, setProfiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState('#6c63ff')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)
  const [assignModal, setAssignModal] = useState<any>(null)
  const [selectedUser, setSelectedUser] = useState('')
  const [selectedRole, setSelectedRole] = useState('mitarbeiter')
  const [assigning, setAssigning] = useState(false)

  async function loadData() {
    const [tRes, pRes] = await Promise.all([fetch('/api/teams'), fetch('/api/profiles')])
    if (tRes.ok) setTeams(await tRes.json())
    if (pRes.ok) setProfiles(await pRes.json())
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  async function handleCreate() {
    if (!newName) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, color: newColor })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setNewName('')
      loadData()
    } catch (e: any) { setError(e.message) }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Abteilung löschen?')) return
    setDeleting(id)
    await fetch('/api/teams', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    loadData()
    setDeleting(null)
  }

  async function handleAssign() {
    if (!selectedUser || !assignModal) return
    setAssigning(true)
    await fetch('/api/teams/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: selectedUser, abteilung: assignModal.name, role: selectedRole })
    })
    setAssignModal(null)
    setSelectedUser('')
    setSelectedRole('mitarbeiter')
    loadData()
    setAssigning(false)
  }

  async function handleRemove(userId: string) {
    if (!confirm('Mitglied entfernen?')) return
    await fetch('/api/teams/members', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId })
    })
    loadData()
  }

  async function handleSetLeader(userId: string, abteilung: string) {
    await fetch('/api/teams/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, abteilung, role: 'bereichsleiter' })
    })
    loadData()
  }

  // Nutzer ohne Abteilung oder aus anderer Abteilung
  const unassigned = profiles.filter(p => !p.abteilung)
  const allProfiles = profiles

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em' }}>Abteilungen</h1>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>Teams verwalten und Mitglieder zuordnen</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24 }}>
        {/* Neue Abteilung */}
        <div>
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Neue Abteilung</div>
            <div style={{ marginBottom: 12 }}>
              <label style={lbl}>Name *</label>
              <input style={inp} value={newName} onChange={e => setNewName(e.target.value)} placeholder="z.B. Einkauf" />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={lbl}>Farbe</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                {COLORS.map(c => (
                  <div key={c} onClick={() => setNewColor(c)} style={{ width: 26, height: 26, borderRadius: 13, background: c, cursor: 'pointer', border: newColor === c ? '3px solid white' : '3px solid transparent', boxShadow: newColor === c ? `0 0 0 2px ${c}` : 'none', transition: 'all 0.2s' }} />
                ))}
              </div>
            </div>
            {error && <div style={{ padding: 8, borderRadius: 8, background: '#ff4d6d22', color: 'var(--red)', fontSize: 12, marginBottom: 10 }}>{error}</div>}
            <button onClick={handleCreate} disabled={!newName || saving} style={{ width: '100%', padding: '9px', borderRadius: 8, border: 'none', background: newName ? 'var(--accent)' : 'var(--border)', color: '#fff', cursor: newName ? 'pointer' : 'not-allowed', fontWeight: 600, fontSize: 13 }}>
              {saving ? 'Erstelle...' : '+ Abteilung erstellen'}
            </button>
          </div>

          {/* Nicht zugeordnete Nutzer */}
          {unassigned.length > 0 && (
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--yellow)' }}>⚠ Ohne Abteilung ({unassigned.length})</div>
              {unassigned.map(p => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{p.full_name}</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)' }}>{p.role}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Abteilungen Liste */}
        <div>
          {loading && <div style={{ color: 'var(--muted)', textAlign: 'center', padding: 40 }}>Lade...</div>}
          {!loading && teams.length === 0 && (
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
              Noch keine Abteilungen — erstelle die erste!
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {teams.map(team => (
              <div key={team.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderLeft: `4px solid ${team.color}`, borderRadius: 12, padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: `${team.color}22`, border: `2px solid ${team.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: team.color }}>
                      {team.name[0]}
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700 }}>{team.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>{team.members?.length ?? 0} Mitglieder</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => { setAssignModal(team); setSelectedUser(''); setSelectedRole('mitarbeiter') }} style={{ padding: '5px 12px', borderRadius: 6, border: `1px solid ${team.color}44`, background: `${team.color}18`, color: team.color, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
                      + Mitglied
                    </button>
                    <button onClick={() => handleDelete(team.id)} disabled={deleting === team.id} style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid #ff4d6d44', background: '#ff4d6d18', color: 'var(--red)', cursor: 'pointer', fontSize: 11 }}>
                      {deleting === team.id ? '...' : '🗑'}
                    </button>
                  </div>
                </div>

                {/* Bereichsleiter */}
                {team.leader && (
                  <div style={{ marginBottom: 12, padding: '8px 12px', borderRadius: 8, background: `${team.color}11`, border: `1px solid ${team.color}33` }}>
                    <div style={{ fontSize: 10, color: team.color, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>⭐ Bereichsleiter</div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{team.leader.full_name}</div>
                  </div>
                )}

                {/* Mitglieder */}
                {team.members?.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {team.members.map((m: any) => (
                      <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)' }}>
                        <div style={{ width: 24, height: 24, borderRadius: 12, background: `${team.color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: team.color }}>
                          {m.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600 }}>{m.full_name}</div>
                          <div style={{ fontSize: 10, color: 'var(--muted)' }}>{m.role} · Lv.{m.level}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 4, marginLeft: 4 }}>
                          {m.role !== 'bereichsleiter' && (
                            <button onClick={() => handleSetLeader(m.id, team.name)} title="Als Bereichsleiter setzen" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, opacity: 0.5 }}>⭐</button>
                          )}
                          <button onClick={() => handleRemove(m.id)} title="Entfernen" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, opacity: 0.5, color: 'var(--red)' }}>✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>Noch keine Mitglieder — klicke "+ Mitglied"</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mitglied zuordnen Modal */}
      {assignModal && (
        <div style={{ position: 'fixed', inset: 0, background: '#00000088', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={e => e.target === e.currentTarget && setAssignModal(null)}>
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, width: 420 }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Mitglied zuordnen</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>Abteilung: <strong style={{ color: assignModal.color }}>{assignModal.name}</strong></div>

            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Mitarbeiter auswählen</label>
              <select style={inp} value={selectedUser} onChange={e => setSelectedUser(e.target.value)}>
                <option value="">— Wählen —</option>
                {allProfiles.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name} {p.abteilung ? `(${p.abteilung})` : '(ohne Abteilung)'}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={lbl}>Rolle in dieser Abteilung</label>
              <select style={inp} value={selectedRole} onChange={e => setSelectedRole(e.target.value)}>
                {ROLES.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setAssignModal(null)} style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted)', cursor: 'pointer' }}>Abbrechen</button>
              <button onClick={handleAssign} disabled={!selectedUser || assigning} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: selectedUser ? 'var(--accent)' : 'var(--border)', color: '#fff', cursor: selectedUser ? 'pointer' : 'not-allowed', fontWeight: 600 }}>
                {assigning ? 'Zuordnen...' : 'Zuordnen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
