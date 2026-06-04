'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const COLORS = ['#6c63ff', '#ff8c42', '#00d4aa', '#4ecdc4', '#ffd166', '#ff6b9d', '#ff4d6d', '#a855f7', '#3b82f6', '#10b981']
const ICONS = ['📋', '📦', '📞', '🔧', '📊', '💰', '🚨', '🛒', '📝', '🎯', '⚡', '🔥', '✅', '🏆', '📅', '🔍', '💡', '🤝', '📈', '🚀']

const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', outline: 'none' }
const lbl: React.CSSProperties = { display: 'block', fontSize: 11, color: 'var(--muted)', marginBottom: 5, letterSpacing: '0.08em', textTransform: 'uppercase' }

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentProfile, setCurrentProfile] = useState<any>(null)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState('#6c63ff')
  const [newIcon, setNewIcon] = useState('📋')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')
  const [editIcon, setEditIcon] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

  async function loadData() {
    const [cRes, tRes] = await Promise.all([fetch('/api/categories'), fetch('/api/tasks')])
    if (cRes.ok) setCategories(await cRes.json())
    if (tRes.ok) setTasks(await tRes.json())
    setLoading(false)
  }

  useEffect(() => {
    loadData()
    createClient().auth.getUser().then(async ({ data }: any) => {
      if (data.user) {
        const res = await fetch('/api/profiles')
        const profiles = await res.json()
        setCurrentProfile(profiles.find((p: any) => p.id === data.user.id))
      }
    })
  }, [])

  const isAdmin = currentProfile?.role === 'admin'

  async function handleCreate() {
    if (!newName.trim() || !isAdmin) return
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newName.trim(), color: newColor, icon: newIcon }) })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setNewName(''); setNewColor('#6c63ff'); setNewIcon('📋')
      loadData()
    } catch (e: any) { setError(e.message) }
    setSaving(false)
  }

  async function handleEdit(id: string) {
    if (!isAdmin) return
    setSaving(true)
    try {
      const res = await fetch('/api/categories', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, name: editName, color: editColor, icon: editIcon }) })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setEditingId(null); loadData()
    } catch (e: any) { setError(e.message) }
    setSaving(false)
  }

  async function handleDelete(id: string, name: string) {
    if (!isAdmin) return
    const taskCount = tasks.filter(t => t.category === name).length
    if (taskCount > 0) { if (!confirm(`Diese Kategorie hat ${taskCount} Aufgaben. Trotzdem löschen?`)) return }
    else { if (!confirm('Kategorie löschen?')) return }
    setDeleting(id)
    await fetch('/api/categories', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    loadData(); setDeleting(null)
  }

  function startEdit(cat: any) { setEditingId(cat.id); setEditName(cat.name); setEditColor(cat.color); setEditIcon(cat.icon) }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em' }}>Kategorien</h1>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>Aufgaben-Kategorien verwalten und anpassen</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isAdmin ? '320px 1fr' : '1fr', gap: 24 }}>

        {/* Neue Kategorie — nur Admin */}
        {isAdmin && (
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, alignSelf: 'start' }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Neue Kategorie</div>
            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Name *</label>
              <input style={inp} value={newName} onChange={e => setNewName(e.target.value)} placeholder="z.B. Schulung" onKeyDown={e => e.key === 'Enter' && handleCreate()} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Icon</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {ICONS.map(icon => (
                  <button key={icon} onClick={() => setNewIcon(icon)} style={{ width: 34, height: 34, borderRadius: 8, border: `2px solid ${newIcon === icon ? 'var(--accent)' : 'var(--border)'}`, background: newIcon === icon ? 'var(--accent)22' : 'var(--surface)', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={lbl}>Farbe</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                {COLORS.map(c => (
                  <div key={c} onClick={() => setNewColor(c)} style={{ width: 26, height: 26, borderRadius: 13, background: c, cursor: 'pointer', border: newColor === c ? '3px solid white' : '3px solid transparent', boxShadow: newColor === c ? `0 0 0 2px ${c}` : 'none', transition: 'all 0.2s' }} />
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 8, background: `${newColor}18`, border: `1px solid ${newColor}44`, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>{newIcon}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: newColor }}>{newName || 'Vorschau'}</span>
            </div>
            {error && <div style={{ padding: 8, borderRadius: 8, background: '#ff4d6d22', color: 'var(--red)', fontSize: 12, marginBottom: 10 }}>{error}</div>}
            <button onClick={handleCreate} disabled={!newName.trim() || saving} style={{ width: '100%', padding: '10px', borderRadius: 8, border: 'none', background: newName.trim() ? 'var(--accent)' : 'var(--border)', color: '#fff', cursor: newName.trim() ? 'pointer' : 'not-allowed', fontWeight: 600, fontSize: 13 }}>
              {saving ? 'Erstelle...' : '+ Kategorie erstellen'}
            </button>
          </div>
        )}

        {/* Kategorien Liste */}
        <div>
          {!isAdmin && (
            <div style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)', fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>
              💡 Kategorien können nur von Admins bearbeitet werden.
            </div>
          )}
          {loading && <div style={{ color: 'var(--muted)', textAlign: 'center', padding: 40 }}>Lade...</div>}
          {!loading && categories.length === 0 && (
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Noch keine Kategorien</div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {categories.map(cat => {
              const taskCount = tasks.filter(t => t.category === cat.name).length
              const isEditing = editingId === cat.id
              return (
                <div key={cat.id} style={{ background: 'var(--card)', border: `1px solid ${isEditing ? cat.color + '66' : 'var(--border)'}`, borderLeft: `4px solid ${cat.color}`, borderRadius: 12, padding: 18, transition: 'all 0.2s' }}>
                  {isEditing ? (
                    <div>
                      <div style={{ marginBottom: 10 }}><label style={lbl}>Name</label><input style={inp} value={editName} onChange={e => setEditName(e.target.value)} /></div>
                      <div style={{ marginBottom: 10 }}>
                        <label style={lbl}>Icon</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                          {ICONS.map(icon => (<button key={icon} onClick={() => setEditIcon(icon)} style={{ width: 30, height: 30, borderRadius: 6, border: `2px solid ${editIcon === icon ? 'var(--accent)' : 'var(--border)'}`, background: editIcon === icon ? 'var(--accent)22' : 'var(--surface)', cursor: 'pointer', fontSize: 14 }}>{icon}</button>))}
                        </div>
                      </div>
                      <div style={{ marginBottom: 14 }}>
                        <label style={lbl}>Farbe</label>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {COLORS.map(c => (<div key={c} onClick={() => setEditColor(c)} style={{ width: 22, height: 22, borderRadius: 11, background: c, cursor: 'pointer', border: editColor === c ? '3px solid white' : '3px solid transparent', boxShadow: editColor === c ? `0 0 0 2px ${c}` : 'none' }} />))}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => setEditingId(null)} style={{ flex: 1, padding: '7px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted)', cursor: 'pointer', fontSize: 12 }}>Abbrechen</button>
                        <button onClick={() => handleEdit(cat.id)} disabled={saving} style={{ flex: 1, padding: '7px', borderRadius: 6, border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>Speichern</button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 40, height: 40, borderRadius: 10, background: `${cat.color}22`, border: `2px solid ${cat.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{cat.icon}</div>
                          <div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: cat.color }}>{cat.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{taskCount > 0 ? `${taskCount} Aufgabe${taskCount !== 1 ? 'n' : ''}` : 'Keine Aufgaben'}</div>
                          </div>
                        </div>
                        {isAdmin && (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={() => startEdit(cat)} style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted)', cursor: 'pointer', fontSize: 11 }}>✏️</button>
                            <button onClick={() => handleDelete(cat.id, cat.name)} disabled={deleting === cat.id} style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #ff4d6d44', background: '#ff4d6d18', color: 'var(--red)', cursor: 'pointer', fontSize: 11 }}>{deleting === cat.id ? '...' : '🗑'}</button>
                          </div>
                        )}
                      </div>
                      {taskCount > 0 && (
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {(['Offen', 'In Bearbeitung', 'Erledigt', 'Ueberfaellig'] as const).map(status => {
                            const count = tasks.filter(t => t.category === cat.name && t.status === status).length
                            if (count === 0) return null
                            const colors: Record<string, string> = { 'Offen': 'var(--muted)', 'In Bearbeitung': 'var(--yellow)', 'Erledigt': 'var(--green)', 'Ueberfaellig': 'var(--red)' }
                            const labels: Record<string, string> = { 'Offen': 'Offen', 'In Bearbeitung': 'Aktiv', 'Erledigt': 'Erledigt', 'Ueberfaellig': 'Überfällig' }
                            return (<div key={status} style={{ padding: '3px 8px', borderRadius: 4, background: `${colors[status]}22`, border: `1px solid ${colors[status]}44`, fontSize: 11, color: colors[status], fontWeight: 600 }}>{count} {labels[status]}</div>)
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
