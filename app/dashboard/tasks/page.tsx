'use client'
import { useEffect, useState, useCallback } from 'react'
import { fetchTasks, createTask, updateTask, deleteTask, fetchProfiles } from '@/lib/api'
import { createClient } from '@/lib/supabase/client'

const CATEGORIES = ['Vertrieb', 'Produktion', 'Kundenservice', 'IT', 'Lager', 'Marketing']
const PRIORITIES = ['Hoch', 'Mittel', 'Niedrig']
const STATUSES = ['Offen', 'In Bearbeitung', 'Erledigt', 'Ueberfaellig']
const CATEGORY_COLORS: Record<string, string> = { 'Vertrieb': '#6c63ff', 'Produktion': '#ff8c42', 'Kundenservice': '#00d4aa', 'IT': '#4ecdc4', 'Lager': '#ffd166', 'Marketing': '#ff6b9d' }
const STATUS_CFG: Record<string, any> = { 'Offen': { color: 'var(--muted)', bg: '#2a2a3d' }, 'In Bearbeitung': { color: 'var(--yellow)', bg: '#ffd16622' }, 'Erledigt': { color: 'var(--green)', bg: '#00d4aa22' }, 'Ueberfaellig': { color: 'var(--red)', bg: '#ff4d6d22' } }
const PRIORITY_CFG: Record<string, string> = { 'Hoch': 'var(--red)', 'Mittel': 'var(--yellow)', 'Niedrig': 'var(--green)' }
const EMPTY = { title: '', description: '', category: 'Vertrieb', priority: 'Mittel', status: 'Offen', assignee_id: '', deadline: '', points_value: 80 }
const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', outline: 'none' }
const lbl: React.CSSProperties = { display: 'block', fontSize: 11, color: 'var(--muted)', marginBottom: 5, letterSpacing: '0.08em', textTransform: 'uppercase' }

function Tag({ label, color }: { label: string; color: string }) {
  return <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: `${color}22`, color, border: `1px solid ${color}44` }}>{label}</span>
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([])
  const [profiles, setProfiles] = useState<any[]>([])
  const [filter, setFilter] = useState('Alle')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [currentUser, setCurrentUser] = useState<string | null>(null)

  const load = useCallback(async () => {
    const [t, p] = await Promise.all([fetchTasks(), fetchProfiles()])
    setTasks(t); setProfiles(p); setLoading(false)
  }, [])

  useEffect(() => {
    load()
    createClient().auth.getUser().then(({ data }) => setCurrentUser(data.user?.id ?? null))
  }, [load])

  useEffect(() => {
    const sb = createClient()
    const channel = sb.channel('tasks-rt').on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => load()).subscribe()
    return () => { sb.removeChannel(channel) }
  }, [load])

  async function handleCreate() {
    setSaving(true)
    try { await createTask({ ...form, created_by: currentUser, tenant_id: profiles.find(p => p.id === currentUser)?.tenant_id }); setModal(false); setForm(EMPTY) }
    catch (e) { console.error(e) }
    setSaving(false)
  }

  const counts: Record<string, number> = { 'Alle': tasks.length, 'Offen': tasks.filter(t => t.status === 'Offen').length, 'In Bearbeitung': tasks.filter(t => t.status === 'In Bearbeitung').length, 'Erledigt': tasks.filter(t => t.status === 'Erledigt').length, 'Ueberfaellig': tasks.filter(t => t.status === 'Ueberfaellig').length }
  const filtered = filter === 'Alle' ? tasks : tasks.filter(t => t.status === filter)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em' }}>Aufgaben</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>{tasks.length} gesamt</p>
        </div>
        <button onClick={() => setModal(true)} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>+ Neue Aufgabe</button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {Object.entries(counts).map(([s, c]) => (
          <button key={s} onClick={() => setFilter(s)} style={{ padding: '6px 14px', borderRadius: 20, border: `1px solid ${filter === s ? 'var(--accent)' : 'var(--border)'}`, background: filter === s ? 'var(--accent)' : 'var(--card)', color: filter === s ? '#fff' : 'var(--muted)', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>{s} ({c})</button>
        ))}
      </div>

      {loading ? <div style={{ color: 'var(--muted)', textAlign: 'center', padding: 40 }}>Lade...</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.length === 0 && <div style={{ color: 'var(--muted)', textAlign: 'center', padding: 40 }}>Keine Aufgaben</div>}
          {filtered.map((task: any) => {
            const sc = STATUS_CFG[task.status] || STATUS_CFG['Offen']
            const cc = CATEGORY_COLORS[task.category] || 'var(--accent)'
            const pc = PRIORITY_CFG[task.priority] || 'var(--muted)'
            return (
              <div key={task.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderLeft: `3px solid ${cc}`, borderRadius: 12, padding: 18, display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>{task.title}</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Tag label={task.category} color={cc} />
                    <Tag label={task.priority} color={pc} />
                    {task.assignee && <Tag label={task.assignee.full_name} color="var(--muted)" />}
                  </div>
                </div>
                <select value={task.status} onChange={e => updateTask(task.id, { status: e.target.value })} style={{ padding: '4px 10px', borderRadius: 20, background: sc.bg, color: sc.color, border: `1px solid ${sc.color}44`, fontSize: 11, fontWeight: 600, cursor: 'pointer', outline: 'none' }}>
                  {STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
                <div style={{ textAlign: 'center', minWidth: 56 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent)' }}>{task.points_value}</div>
                  <div style={{ fontSize: 10, color: 'var(--muted)' }}>Pkt</div>
                </div>
                <button onClick={() => deleteTask(task.id)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 16, opacity: 0.5 }}>✕</button>
              </div>
            )
          })}
        </div>
      )}

      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: '#00000088', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, width: 480, maxWidth: '90vw' }}>
            <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 20 }}>Neue Aufgabe</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div><label style={lbl}>Titel *</label><input style={inp} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Aufgabentitel..." /></div>
              <div><label style={lbl}>Beschreibung</label><textarea style={{ ...inp, height: 70, resize: 'vertical' }} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={lbl}>Kategorie</label><select style={inp} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
                <div><label style={lbl}>Priorität</label><select style={inp} value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>{PRIORITIES.map(p => <option key={p}>{p}</option>)}</select></div>
                <div><label style={lbl}>Verantwortlicher</label><select style={inp} value={form.assignee_id} onChange={e => setForm({ ...form, assignee_id: e.target.value })}><option value="">— Wählen —</option>{profiles.map((p: any) => <option key={p.id} value={p.id}>{p.full_name}</option>)}</select></div>
                <div><label style={lbl}>Deadline</label><input type="date" style={inp} value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} /></div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
              <button onClick={() => setModal(false)} style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted)', cursor: 'pointer' }}>Abbrechen</button>
              <button onClick={handleCreate} disabled={!form.title || saving} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: form.title ? 'var(--accent)' : 'var(--border)', color: '#fff', cursor: form.title ? 'pointer' : 'not-allowed', fontWeight: 600 }}>{saving ? 'Speichere...' : 'Erstellen'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
