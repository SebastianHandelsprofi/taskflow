'use client'
import { useState, useEffect } from 'react'

const COLORS = ['#6c63ff', '#ff8c42', '#00d4aa', '#4ecdc4', '#ffd166', '#ff6b9d', '#ff4d6d', '#a855f7']
const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', outline: 'none' }
const lbl: React.CSSProperties = { display: 'block', fontSize: 11, color: 'var(--muted)', marginBottom: 5, letterSpacing: '0.08em', textTransform: 'uppercase' }

export default function TeamsPage() {
  const [teams, setTeams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState('#6c63ff')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

  async function loadTeams() {
    const res = await fetch('/api/teams')
    if (res.ok) setTeams(await res.json())
    setLoading(false)
  }

  useEffect(() => { loadTeams() }, [])

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
      loadTeams()
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
    loadTeams()
    setDeleting(null)
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em' }}>Abteilungen</h1>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>Teams verwalten und Mitglieder zuordnen</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24 }}>
        {/* Neue Abteilung */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, alignSelf: 'start' }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Neue Abteilung</div>
          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Name *</label>
            <input style={inp} value={newName} onChange={e => setNewName(e.target.value)} placeholder="z.B. Einkauf" />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={lbl}>Farbe</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
              {COLORS.map(c => (
                <div key={c} onClick={() => setNewColor(c)} style={{
                  width: 28, height: 28, borderRadius: 14, background: c, cursor: 'pointer',
                  border: newColor === c ? '3px solid white' : '3px solid transparent',
                  boxShadow: newColor === c ? `0 0 0 2px ${c}` : 'none',
                  transition: 'all 0.2s',
                }} />
              ))}
            </div>
          </div>
          {error && <div style={{ padding: 10, borderRadius: 8, background: '#ff4d6d22', color: 'var(--red)', fontSize: 13, marginBottom: 12 }}>{error}</div>}
          <button onClick={handleCreate} disabled={!newName || saving} style={{ width: '100%', padding: '10px', borderRadius: 8, border: 'none', background: newName ? 'var(--accent)' : 'var(--border)', color: '#fff', cursor: newName ? 'pointer' : 'not-allowed', fontWeight: 600 }}>
            {saving ? 'Erstelle...' : '+ Abteilung erstellen'}
          </button>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: `${team.color}22`, border: `2px solid ${team.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                      {team.name[0]}
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700 }}>{team.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{team.members?.length ?? 0} Mitglieder</div>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(team.id)} disabled={deleting === team.id} style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid #ff4d6d44', background: '#ff4d6d18', color: 'var(--red)', cursor: 'pointer', fontSize: 11 }}>
                    {deleting === team.id ? '...' : '🗑 Löschen'}
                  </button>
                </div>

                {/* Bereichsleiter */}
                {team.leader && (
                  <div style={{ marginBottom: 12, padding: '8px 12px', borderRadius: 8, background: `${team.color}11`, border: `1px solid ${team.color}33` }}>
                    <div style={{ fontSize: 10, color: team.color, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 3 }}>Bereichsleiter</div>
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
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>Noch keine Mitglieder</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
