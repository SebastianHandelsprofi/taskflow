'use client'
import { useState, useEffect } from 'react'

const COLORS = ['#6c63ff', '#ff8c42', '#00d4aa', '#4ecdc4', '#ffd166', '#ff6b9d', '#ff4d6d', '#a855f7', '#3b82f6', '#10b981']
const ROLES = ['mitarbeiter', 'bereichsleiter', 'admin']
const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', outline: 'none' }
const lbl: React.CSSProperties = { display: 'block', fontSize: 11, color: 'var(--muted)', marginBottom: 5, letterSpacing: '0.08em', textTransform: 'uppercase' }

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
  const [editingTeam, setEditingTeam] = useState<any>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')
  const isMobile = useIsMobile()

  async function loadData() {
    const [tRes, pRes] = await Promise.all([fetch('/api/teams'), fetch('/api/profiles')])
    if (tRes.ok) setTeams(await tRes.json())
    if (pRes.ok) setProfiles(await pRes.json())
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  async function handleCreate() {
    if (!newName) return
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, color: newColor })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setNewName(''); loadData()
    } catch (e: any) { setError(e.message) }
    setSaving(false)
  }

  async function handleEdit() {
    if (!editingTeam || !editName) return
    setSaving(true)
    try {
      const res = await fetch('/api/teams', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingTeam.id, name: editName, color: editColor, oldName: editingTeam.name })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setEditingTeam(null); loadData()
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
    loadData(); setDeleting(null)
  }

  async function handleAssign() {
    if (!selectedUser || !assignModal) return
    setAssigning(true)
    await fetch('/api/teams/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: selectedUser, abteilung: assignModal.name, role: selectedRole })
    })
    setAssignModal(null); setSelectedUser(''); setSelectedRole('mitarbeiter')
    loadData(); setAssigning(false)
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

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: isMobile ? 24 : 22, fontWeight: 800, letterSpacing: '-0.03em' }}>Abteilungen</h1>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>Teams verwalten und Mitglieder zuordnen</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '300px 1fr', gap: 24 }}>

        {/* Neue Abteilung */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, alignSelf: 'start' }}>
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
          <button onClick={handleCreate} disabled={!newName || saving} style={{ width: '100%', padding: '10px', borderRadius: 8, border: 'none', background: newName ? 'var(--accent)' : 'var(--border)', color: '#fff', cursor: newName ? 'pointer' : 'not-allowed', fontWeight: 600, fontSize: 13 }}>
            {saving ? 'Erstelle...' : '+ Abteilung erstellen'}
          </button>
        </div>

        {/* Abteilungen Liste */}
        <div>
          {loading && <div style={{ color: 'var(--muted)', textAlign: 'center', padding: 40 }}>Lade...</div>}
          {!loading && teams.length === 0 && (
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
              Noch keine Abteilungen
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {teams.map(team => (
              <div key={team.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderLeft: `4px solid ${team.color}`, borderRadius: 12, padding: 16 }}>

                {editingTeam?.id === team.id ? (
                  // Edit Modus
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--accent)' }}>✏️ Abteilung bearbeiten</div>
                    <div style={{ marginBottom: 10 }}>
                      <label style={lbl}>Name</label>
                      <input style={inp} value={editName} onChange={e => setEditName(e.target.value)} />
                    </div>
                    <div style={{ marginBottom: 14 }}>
                      <label style={lbl}>Farbe</label>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                        {COLORS.map(c => (
                          <div key={c} onClick={() => setEditColor(c)} style={{ width: 24, height: 24, borderRadius: 12, background: c, cursor: 'pointer', border: editColor === c ? '3px solid white' : '3px solid transparent', boxShadow: editColor === c ? `0 0 0 2px ${c}` : 'none' }} />
                        ))}
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--yellow)', marginBottom: 12, padding: '8px 10px', borderRadius: 6, background: '#ffd16618', border: '1px solid #ffd16633' }}>
                      ⚠️ Bei Namensänderung werden alle Mitglieder automatisch aktualisiert.
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => setEditingTeam(null)} style={{ flex: 1, padding: '8px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted)', cursor: 'pointer', fontSize: 12 }}>Abbrechen</button>
                      <button onClick={handleEdit} disabled={saving} style={{ flex: 1, padding: '8px', borderRadius: 6, border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>
                        {saving ? 'Speichere...' : '✓ Speichern'}
                      </button>
                    </div>
                  </div>
                ) : (
                  // Normal Modus
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: team.members?.length > 0 ? 12 : 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 8, background: `${team.color}22`, border: `2px solid ${team.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: team.color }}>
                          {team.name[0]}
                        </div>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 700 }}>{team.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--muted)' }}>{team.members?.length ?? 0} Mitglieder</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => { setAssignModal(team); setSelectedUser(''); setSelectedRole('mitarbeiter') }} style={{ padding: '5px 10px', borderRadius: 6, border: `1px solid ${team.color}44`, background: `${team.color}18`, color: team.color, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>+ Mitglied</button>
                        <button onClick={() => { setEditingTeam(team); setEditName(team.name); setEditColor(team.color) }} style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted)', cursor: 'pointer', fontSize: 11 }}>✏️</button>
                        <button onClick={() => handleDelete(team.id)} disabled={deleting === team.id} style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #ff4d6d44', background: '#ff4d6d18', color: 'var(--red)', cursor: 'pointer', fontSize: 11 }}>
                          {deleting === team.id ? '...' : '🗑'}
                        </button>
                      </div>
                    </div>

                    {team.leader && (
                      <div style={{ marginBottom: 10, padding: '6px 10px', borderRadius: 6, background: `${team.color}11`, border: `1px solid ${team.color}33`, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 11 }}>⭐</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: team.color }}>{team.leader.full_name}</span>
                        <span style={{ fontSize: 11, color: 'var(--muted)' }}>Bereichsleiter</span>
                      </div>
                    )}

                    {team.members?.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {team.members.map((m: any) => (
                          <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px', borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)' }}>
                            <div style={{ width: 22, height: 22, borderRadius: 11, background: `${team.color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: team.color }}>
                              {m.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 600 }}>{m.full_name}</span>
                            <span style={{ fontSize: 10, color: 'var(--muted)' }}>{m.role}</span>
                            <div style={{ display: 'flex', gap: 3 }}>
                              {m.role !== 'bereichsleiter' && (
                                <button onClick={() => handleSetLeader(m.id, team.name)} title="Als Bereichsleiter setzen" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, opacity: 0.5 }}>⭐</button>
                              )}
                              <button onClick={() => handleRemove(m.id)} title="Entfernen" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, opacity: 0.5, color: 'var(--red)' }}>✕</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {(!team.members || team.members.length === 0) && (
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>Noch keine Mitglieder</div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mitglied zuordnen Modal */}
      {assignModal && (
        <div style={{ position: 'fixed', inset: 0, background: '#00000088', backdropFilter: 'blur(4px)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', zIndex: 100 }} onClick={e => e.target === e.currentTarget && setAssignModal(null)}>
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: isMobile ? '20px 20px 0 0' : 16, padding: 28, width: isMobile ? '100%' : 420 }}>
            {isMobile && <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--border)', margin: '0 auto 20px' }} />}
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Mitglied zuordnen</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>Abteilung: <strong style={{ color: assignModal.color }}>{assignModal.name}</strong></div>
            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Mitarbeiter auswählen</label>
              <select style={inp} value={selectedUser} onChange={e => setSelectedUser(e.target.value)}>
                <option value="">— Wählen —</option>
                {profiles.map((p: any) => (
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
              <button onClick={() => setAssignModal(null)} style={{ padding: '10px 18px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted)', cursor: 'pointer' }}>Abbrechen</button>
              <button onClick={handleAssign} disabled={!selectedUser || assigning} style={{ flex: isMobile ? 1 : 'none', padding: '10px 18px', borderRadius: 8, border: 'none', background: selectedUser ? 'var(--accent)' : 'var(--border)', color: '#fff', cursor: selectedUser ? 'pointer' : 'not-allowed', fontWeight: 600 }}>
                {assigning ? 'Zuordnen...' : 'Zuordnen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
