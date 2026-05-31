'use client'
import { useEffect, useState, useCallback } from 'react'
import { fetchTasks, updateTask, deleteTask, fetchProfiles } from '@/lib/api'
import { createClient } from '@/lib/supabase/client'

const TENANT_ID = '1aa1d675-232e-4375-b246-b41cb76f0beb'
const CATEGORIES = ['Vertrieb', 'Produktion', 'Kundenservice', 'IT', 'Lager', 'Marketing']
const PRIORITIES = ['Hoch', 'Mittel', 'Niedrig']
const STATUSES = ['Offen', 'In Bearbeitung', 'Erledigt', 'Ueberfaellig']
const CC: Record<string, string> = { 'Vertrieb': '#6c63ff', 'Produktion': '#ff8c42', 'Kundenservice': '#00d4aa', 'IT': '#4ecdc4', 'Lager': '#ffd166', 'Marketing': '#ff6b9d' }
const SC: Record<string, any> = { 'Offen': { color: 'var(--muted)', bg: '#2a2a3d' }, 'In Bearbeitung': { color: 'var(--yellow)', bg: '#ffd16622' }, 'Erledigt': { color: 'var(--green)', bg: '#00d4aa22' }, 'Ueberfaellig': { color: 'var(--red)', bg: '#ff4d6d22' } }
const PC: Record<string, string> = { 'Hoch': 'var(--red)', 'Mittel': 'var(--yellow)', 'Niedrig': 'var(--green)' }
const EMPTY = { title: '', description: '', category: 'Vertrieb', priority: 'Mittel', status: 'Offen', assignee_id: '', deadline: '', points_value: 80 }
const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', outline: 'none' }
const lbl: React.CSSProperties = { display: 'block', fontSize: 11, color: 'var(--muted)', marginBottom: 5, letterSpacing: '0.08em', textTransform: 'uppercase' }

function Tag({ label, color }: { label: string; color: string }) {
  return <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: `${color}22`, color, border: `1px solid ${color}44` }}>{label}</span>
}

function Avatar({ name, color = 'var(--accent)', size = 28 }: { name: string; color?: string; size?: number }) {
  const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
  return <div style={{ width: size, height: size, borderRadius: size / 2, background: `${color}33`, border: `1px solid ${color}66`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.35, fontWeight: 700, color, flexShrink: 0 }}>{initials}</div>
}

function TaskModal({ task, profiles, currentProfile, onClose, onSave, onDelete }: any) {
  const [form, setForm] = useState({ ...task, assignee_id: task.assignee_id || '', deadline: task.deadline || '' })
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const [saving, setSaving] = useState(false)
  const [sendingComment, setSendingComment] = useState(false)
  const [tab, setTab] = useState<'details' | 'comments'>('details')

  useEffect(() => { loadComments() }, [task.id])

  async function loadComments() {
    const res = await fetch(`/api/comments?task_id=${task.id}`)
    if (res.ok) setComments(await res.json())
  }

  async function handleSendComment() {
    if (!newComment.trim()) return
    setSendingComment(true)
    await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task_id: task.id, user_id: currentProfile?.id, content: newComment.trim() })
    })
    setNewComment('')
    loadComments()
    setSendingComment(false)
  }

  async function handleDeleteComment(id: string) {
    await fetch('/api/comments', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    loadComments()
  }

  const cc = CC[form.category] || 'var(--accent)'
  const isAdminOrLeiter = currentProfile?.role === 'admin' || currentProfile?.role === 'bereichsleiter'

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#00000088', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, width: 580, maxWidth: '95vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', borderLeft: `4px solid ${cc}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{task.title}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{task.category} · {task.priority}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 20 }}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)' }}>
          {[{ id: 'details', label: 'Details' }, { id: 'comments', label: `Kommentare (${comments.length})` }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)} style={{ padding: '12px 20px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: tab === t.id ? 600 : 400, color: tab === t.id ? 'var(--accent)' : 'var(--muted)', borderBottom: tab === t.id ? '2px solid var(--accent)' : '2px solid transparent' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {tab === 'details' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div><label style={lbl}>Titel</label><input style={inp} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
              <div><label style={lbl}>Beschreibung</label><textarea style={{ ...inp, height: 80, resize: 'vertical' }} value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={lbl}>Kategorie</label><select style={inp} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
                <div><label style={lbl}>Priorität</label><select style={inp} value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>{PRIORITIES.map(p => <option key={p}>{p}</option>)}</select></div>
                <div><label style={lbl}>Status</label><select style={inp} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>{STATUSES.map(s => <option key={s}>{s}</option>)}</select></div>
                <div>
                  <label style={lbl}>Verantwortlicher</label>
                  <select style={inp} value={form.assignee_id} onChange={e => setForm({ ...form, assignee_id: e.target.value })}>
                    <option value="">— Nicht zugewiesen —</option>
                    {profiles.map((p: any) => <option key={p.id} value={p.id}>{p.full_name} ({p.abteilung || p.role})</option>)}
                  </select>
                </div>
                <div><label style={lbl}>Deadline</label><input type="date" style={inp} value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} /></div>
                <div><label style={lbl}>Punkte</label><input type="number" style={inp} value={form.points_value} onChange={e => setForm({ ...form, points_value: Number(e.target.value) })} /></div>
              </div>
            </div>
          )}

          {tab === 'comments' && (
            <div>
              {comments.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '20px 0', fontSize: 13 }}>Noch keine Kommentare — schreib den ersten!</div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                {comments.map((c: any) => {
                  const isMe = c.user_id === currentProfile?.id
                  const abtColor = CC[c.author?.abteilung] || 'var(--accent)'
                  return (
                    <div key={c.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      {c.author && <Avatar name={c.author.full_name} color={abtColor} size={32} />}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <span style={{ fontSize: 12, fontWeight: 600 }}>{c.author?.full_name || 'Unbekannt'}</span>
                            {isMe && <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: 'var(--accent)22', color: 'var(--accent)', fontWeight: 700 }}>ICH</span>}
                          </div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <span style={{ fontSize: 11, color: 'var(--muted)' }}>{new Date(c.created_at).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                            {isMe && <button onClick={() => handleDeleteComment(c.id)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 12, opacity: 0.5 }}>✕</button>}
                          </div>
                        </div>
                        <div style={{ padding: '10px 14px', borderRadius: 10, background: isMe ? 'var(--accent)18' : 'var(--surface)', border: `1px solid ${isMe ? 'var(--accent)33' : 'var(--border)'}`, fontSize: 13, lineHeight: 1.5 }}>
                          {c.content}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Neuer Kommentar */}
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                {currentProfile && <Avatar name={currentProfile.full_name} color={CC[currentProfile.abteilung] || 'var(--accent)'} size={32} />}
                <div style={{ flex: 1 }}>
                  <textarea
                    style={{ ...inp, height: 70, resize: 'none', marginBottom: 0 }}
                    placeholder="Kommentar schreiben..."
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendComment() } }}
                  />
                </div>
                <button onClick={handleSendComment} disabled={!newComment.trim() || sendingComment} style={{ padding: '9px 16px', borderRadius: 8, border: 'none', background: newComment.trim() ? 'var(--accent)' : 'var(--border)', color: '#fff', cursor: newComment.trim() ? 'pointer' : 'not-allowed', fontWeight: 600, fontSize: 13, flexShrink: 0 }}>
                  {sendingComment ? '...' : '↑ Senden'}
                </button>
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>Enter zum Senden · Shift+Enter für neue Zeile</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
          {isAdminOrLeiter ? (
            <button onClick={() => { onDelete(task.id); onClose() }} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #ff4d6d44', background: '#ff4d6d18', color: 'var(--red)', cursor: 'pointer', fontSize: 13 }}>🗑 Löschen</button>
          ) : <div />}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted)', cursor: 'pointer', fontSize: 13 }}>Schließen</button>
            {isAdminOrLeiter && (
              <button onClick={async () => { setSaving(true); await onSave(form); setSaving(false) }} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                {saving ? 'Speichere...' : 'Speichern'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([])
  const [profiles, setProfiles] = useState<any[]>([])
  const [currentProfile, setCurrentProfile] = useState<any>(null)
  const [view, setView] = useState<'mine' | 'team' | 'all'>('mine')
  const [statusFilter, setStatusFilter] = useState('Alle')
  const [categoryFilter, setCategoryFilter] = useState('Alle')
  const [createModal, setCreateModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [form, setForm] = useState<any>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errMsg, setErrMsg] = useState('')

  const load = useCallback(async () => {
    const [t, p] = await Promise.all([fetchTasks(), fetchProfiles()])
    setTasks(t); setProfiles(p); setLoading(false)
  }, [])

  useEffect(() => {
    load()
    createClient().auth.getUser().then(async ({ data }: { data: any }) => {
      if (data.user) {
        const res = await fetch('/api/profiles')
        const profiles = await res.json()
        setCurrentProfile(profiles.find((p: any) => p.id === data.user.id))
      }
    })
  }, [load])

  useEffect(() => {
    if (!currentProfile) return
    if (currentProfile.role === 'mitarbeiter') setView('mine')
    else if (currentProfile.role === 'bereichsleiter') setView('team')
    else setView('all')
  }, [currentProfile])

  const viewFiltered = tasks.filter((t: any) => {
    if (view === 'mine') return t.assignee_id === currentProfile?.id
    if (view === 'team') {
      const teamMembers = profiles.filter((p: any) => p.abteilung === currentProfile?.abteilung).map((p: any) => p.id)
      return teamMembers.includes(t.assignee_id) || t.assignee_id === currentProfile?.id
    }
    return true
  })

  const filtered = viewFiltered
    .filter(t => statusFilter === 'Alle' || t.status === statusFilter)
    .filter(t => categoryFilter === 'Alle' || t.category === categoryFilter)

  const counts: Record<string, number> = {
    'Alle': viewFiltered.length,
    'Offen': viewFiltered.filter(t => t.status === 'Offen').length,
    'In Bearbeitung': viewFiltered.filter(t => t.status === 'In Bearbeitung').length,
    'Erledigt': viewFiltered.filter(t => t.status === 'Erledigt').length,
    'Ueberfaellig': viewFiltered.filter(t => t.status === 'Ueberfaellig').length,
  }

  async function handleCreate() {
    setErrMsg('')
    if (!form.title) return
    setSaving(true)
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title, description: form.description || null,
          category: form.category, priority: form.priority, status: 'Offen',
          assignee_id: form.assignee_id || null, deadline: form.deadline || null,
          points_value: form.points_value, tenant_id: TENANT_ID,
          created_by: currentProfile?.id, kategorie: form.category,
        })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setCreateModal(false); setForm(EMPTY); load()
    } catch (e: any) { setErrMsg('Fehler: ' + e.message) }
    setSaving(false)
  }

  async function handleSaveTask(updatedForm: any) {
    await updateTask(updatedForm.id, {
      title: updatedForm.title, description: updatedForm.description || null,
      category: updatedForm.category, priority: updatedForm.priority,
      status: updatedForm.status, assignee_id: updatedForm.assignee_id || null,
      deadline: updatedForm.deadline || null, points_value: updatedForm.points_value,
      kategorie: updatedForm.category,
    })
    setSelectedTask(null); load()
  }

  const isAdminOrLeiter = currentProfile?.role === 'admin' || currentProfile?.role === 'bereichsleiter'
  const abteilungColor = CC[currentProfile?.abteilung] || 'var(--accent)'

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em' }}>Aufgaben</h1>
          {currentProfile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <Avatar name={currentProfile.full_name} color={abteilungColor} />
              <span style={{ color: 'var(--muted)', fontSize: 13 }}>{currentProfile.full_name} · {currentProfile.abteilung || currentProfile.role}</span>
            </div>
          )}
        </div>
        {isAdminOrLeiter && (
          <button onClick={() => { setForm(EMPTY); setErrMsg(''); setCreateModal(true) }} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>+ Neue Aufgabe</button>
        )}
      </div>

      {currentProfile?.role !== 'mitarbeiter' && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button onClick={() => setView('mine')} style={{ padding: '6px 14px', borderRadius: 20, border: `1px solid ${view === 'mine' ? 'var(--accent)' : 'var(--border)'}`, background: view === 'mine' ? 'var(--accent)' : 'transparent', color: view === 'mine' ? '#fff' : 'var(--muted)', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Meine Aufgaben</button>
          {currentProfile?.role === 'bereichsleiter' && (
            <button onClick={() => setView('team')} style={{ padding: '6px 14px', borderRadius: 20, border: `1px solid ${view === 'team' ? 'var(--accent)' : 'var(--border)'}`, background: view === 'team' ? 'var(--accent)' : 'transparent', color: view === 'team' ? '#fff' : 'var(--muted)', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Meine Abteilung</button>
          )}
          {currentProfile?.role === 'admin' && (
            <>
              <button onClick={() => setView('team')} style={{ padding: '6px 14px', borderRadius: 20, border: `1px solid ${view === 'team' ? 'var(--accent)' : 'var(--border)'}`, background: view === 'team' ? 'var(--accent)' : 'transparent', color: view === 'team' ? '#fff' : 'var(--muted)', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Meine Abteilung</button>
              <button onClick={() => setView('all')} style={{ padding: '6px 14px', borderRadius: 20, border: `1px solid ${view === 'all' ? 'var(--accent)' : 'var(--border)'}`, background: view === 'all' ? 'var(--accent)' : 'transparent', color: view === 'all' ? '#fff' : 'var(--muted)', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Alle Aufgaben</button>
            </>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {Object.entries(counts).map(([s, c]) => (
          <button key={s} onClick={() => setStatusFilter(s)} style={{ padding: '6px 14px', borderRadius: 20, border: `1px solid ${statusFilter === s ? 'var(--accent)' : 'var(--border)'}`, background: statusFilter === s ? 'var(--accent)' : 'var(--card)', color: statusFilter === s ? '#fff' : 'var(--muted)', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>{s} ({c})</button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {['Alle', ...CATEGORIES].map(cat => (
          <button key={cat} onClick={() => setCategoryFilter(cat)} style={{ padding: '4px 12px', borderRadius: 20, border: `1px solid ${categoryFilter === cat ? (CC[cat] || 'var(--accent)') : 'var(--border)'}`, background: categoryFilter === cat ? `${CC[cat] || 'var(--accent)'}22` : 'transparent', color: categoryFilter === cat ? (CC[cat] || 'var(--accent)') : 'var(--muted)', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>{cat}</button>
        ))}
      </div>

      {loading ? <div style={{ color: 'var(--muted)', textAlign: 'center', padding: 40 }}>Lade...</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.length === 0 && (
            <div style={{ color: 'var(--muted)', textAlign: 'center', padding: 40, background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border)' }}>
              {view === 'mine' ? 'Dir sind keine Aufgaben zugewiesen' : 'Keine Aufgaben gefunden'}
            </div>
          )}
          {filtered.map((task: any) => {
            const sc = SC[task.status] || SC['Offen']
            const cc = CC[task.category] || 'var(--accent)'
            const pc = PC[task.priority] || 'var(--muted)'
            const assignee = profiles.find((p: any) => p.id === task.assignee_id)
            const isMyTask = task.assignee_id === currentProfile?.id
            return (
              <div key={task.id} onClick={() => setSelectedTask(task)} style={{ background: 'var(--card)', border: `1px solid ${isMyTask ? cc + '44' : 'var(--border)'}`, borderLeft: `3px solid ${cc}`, borderRadius: 12, padding: 18, display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', transition: 'transform 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'translateX(3px)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{task.title}</div>
                    {isMyTask && <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'var(--accent)22', color: 'var(--accent)', fontWeight: 700 }}>MEINE</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Tag label={task.category} color={cc} />
                    <Tag label={task.priority} color={pc} />
                    {assignee ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Avatar name={assignee.full_name} color={CC[assignee.abteilung] || 'var(--accent)'} size={18} />
                        <span style={{ fontSize: 11, color: 'var(--muted)' }}>{assignee.full_name}</span>
                      </div>
                    ) : <Tag label="Nicht zugewiesen" color="var(--muted)" />}
                    {task.deadline && <Tag label={`⏰ ${task.deadline}`} color="var(--muted)" />}
                  </div>
                </div>
                <select value={task.status} onClick={e => e.stopPropagation()} onChange={e => { updateTask(task.id, { status: e.target.value }); load() }} style={{ padding: '4px 10px', borderRadius: 20, background: sc.bg, color: sc.color, border: `1px solid ${sc.color}44`, fontSize: 11, fontWeight: 600, cursor: 'pointer', outline: 'none' }}>
                  {STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
                <div style={{ textAlign: 'center', minWidth: 50 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent)' }}>{task.points_value}</div>
                  <div style={{ fontSize: 10, color: 'var(--muted)' }}>Pkt</div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>💬 Klicken</div>
              </div>
            )
          })}
        </div>
      )}

      {/* Neue Aufgabe Modal */}
      {createModal && (
        <div style={{ position: 'fixed', inset: 0, background: '#00000088', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={e => e.target === e.currentTarget && setCreateModal(false)}>
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, width: 520, maxWidth: '90vw' }}>
            <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 20 }}>Neue Aufgabe</div>
            {errMsg && <div style={{ padding: '10px', borderRadius: 8, marginBottom: 16, background: '#ff4d6d22', color: 'var(--red)', fontSize: 13 }}>{errMsg}</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div><label style={lbl}>Titel *</label><input style={inp} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Aufgabentitel..." /></div>
              <div><label style={lbl}>Beschreibung</label><textarea style={{ ...inp, height: 70, resize: 'vertical' }} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={lbl}>Kategorie</label><select style={inp} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
                <div><label style={lbl}>Priorität</label><select style={inp} value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>{PRIORITIES.map(p => <option key={p}>{p}</option>)}</select></div>
                <div><label style={lbl}>Verantwortlicher</label><select style={inp} value={form.assignee_id} onChange={e => setForm({ ...form, assignee_id: e.target.value })}><option value="">— Nicht zugewiesen —</option>{profiles.map((p: any) => <option key={p.id} value={p.id}>{p.full_name} ({p.abteilung || p.role})</option>)}</select></div>
                <div><label style={lbl}>Deadline</label><input type="date" style={inp} value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} /></div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
              <button onClick={() => setCreateModal(false)} style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted)', cursor: 'pointer' }}>Abbrechen</button>
              <button onClick={handleCreate} disabled={!form.title || saving} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: form.title ? 'var(--accent)' : 'var(--border)', color: '#fff', cursor: form.title ? 'pointer' : 'not-allowed', fontWeight: 600 }}>{saving ? 'Speichere...' : 'Erstellen'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Task Detail + Kommentare Modal */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          profiles={profiles}
          currentProfile={currentProfile}
          onClose={() => setSelectedTask(null)}
          onSave={handleSaveTask}
          onDelete={(id: string) => { deleteTask(id); load() }}
        />
      )}
    </div>
  )
}
