'use client'
import { useEffect, useState, useCallback } from 'react'
import { fetchTasks, updateTask, deleteTask, fetchProfiles } from '@/lib/api'
import { createClient } from '@/lib/supabase/client'

const TENANT_ID = '1aa1d675-232e-4375-b246-b41cb76f0beb'
const PRIORITIES = ['Hoch', 'Mittel', 'Niedrig']
const STATUSES = ['Offen', 'In Bearbeitung', 'Erledigt', 'Ueberfaellig']
const SC: Record<string, any> = {
  'Offen': { color: 'var(--muted)', bg: '#2a2a3d' },
  'In Bearbeitung': { color: 'var(--yellow)', bg: '#ffd16622' },
  'Erledigt': { color: 'var(--green)', bg: '#00d4aa22' },
  'Ueberfaellig': { color: 'var(--red)', bg: '#ff4d6d22' }
}
const PC: Record<string, string> = { 'Hoch': 'var(--red)', 'Mittel': 'var(--yellow)', 'Niedrig': 'var(--green)' }
const EMPTY = { title: '', description: '', category: '', priority: 'Mittel', status: 'Offen', assignee_id: '', deadline: '', points_value: 80 }
const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', outline: 'none' }
const lbl: React.CSSProperties = { display: 'block', fontSize: 11, color: 'var(--muted)', marginBottom: 5, letterSpacing: '0.08em', textTransform: 'uppercase' }

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`
}

function Tag({ label, color }: { label: string; color: string }) {
  return <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: `${color}22`, color, border: `1px solid ${color}44`, whiteSpace: 'nowrap' }}>{label}</span>
}

function Avatar({ name, color = 'var(--accent)', size = 28 }: { name: string; color?: string; size?: number }) {
  const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
  return <div style={{ width: size, height: size, borderRadius: size / 2, background: `${color}33`, border: `1px solid ${color}66`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.35, fontWeight: 700, color, flexShrink: 0 }}>{initials}</div>
}

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

function getAssignableProfiles(profiles: any[], currentProfile: any) {
  if (!currentProfile) return []
  const role = currentProfile.role
  if (role === 'admin') return profiles
  if (role === 'geschaeftsfuehrung') {
    // GF weist nur Bereichsleiter zu
    return profiles.filter((p: any) => p.role === 'bereichsleiter' || p.role === 'admin')
  }
  if (role === 'bereichsleiter') {
    // BL weist sein eigenes Team zu
    return profiles.filter((p: any) => p.abteilung === currentProfile.abteilung)
  }
  // Mitarbeiter → nur sich selbst
  return profiles.filter((p: any) => p.id === currentProfile.id)
}

function TaskModal({ task, profiles, categories, currentProfile, onClose, onSave, onDelete }: any) {
  const [form, setForm] = useState({ ...task, assignee_id: task.assignee_id || '', deadline: task.deadline || '' })
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const [saving, setSaving] = useState(false)
  const [sendingComment, setSendingComment] = useState(false)
  const [tab, setTab] = useState<'details' | 'comments'>('details')
  const isMobile = useIsMobile()

  const role = currentProfile?.role
  const isAdmin = role === 'admin'
  const isGF = role === 'geschaeftsfuehrung'
  const isBL = role === 'bereichsleiter'
  const isMA = role === 'mitarbeiter'
  const canEdit = isAdmin || isGF || isBL || isMA
  const canEditMeta = isAdmin || isGF || isBL // titel, beschreibung, deadline, punkte
  const assignableProfiles = getAssignableProfiles(profiles, currentProfile)

  useEffect(() => { loadComments() }, [task.id])

  async function loadComments() {
    const res = await fetch(`/api/comments?task_id=${task.id}`)
    if (res.ok) setComments(await res.json())
  }

  async function handleSendComment() {
    if (!newComment.trim()) return
    setSendingComment(true)
    await fetch('/api/comments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ task_id: task.id, user_id: currentProfile?.id, content: newComment.trim() }) })
    setNewComment(''); loadComments(); setSendingComment(false)
  }

  async function handleDeleteComment(id: string) {
    await fetch('/api/comments', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    loadComments()
  }

  const catObj = categories.find((c: any) => c.name === form.category)
  const cc = catObj?.color || 'var(--accent)'

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#00000088', backdropFilter: 'blur(4px)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', zIndex: 100 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: isMobile ? '20px 20px 0 0' : 16, width: isMobile ? '100%' : 580, maxWidth: '100%', maxHeight: isMobile ? '92vh' : '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {isMobile && <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--border)', margin: '12px auto 0' }} />}
        <div style={{ padding: isMobile ? '16px 20px 12px' : '20px 24px', borderBottom: '1px solid var(--border)', borderLeft: `4px solid ${cc}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ flex: 1, marginRight: 12 }}>
            <div style={{ fontSize: isMobile ? 17 : 16, fontWeight: 700 }}>{task.title}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{task.category} · {task.priority}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 22, padding: 4 }}>✕</button>
        </div>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
          {[{ id: 'details', label: 'Details' }, { id: 'comments', label: `Kommentare (${comments.length})` }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)} style={{ flex: 1, padding: isMobile ? '14px' : '12px 20px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, fontWeight: tab === t.id ? 600 : 400, color: tab === t.id ? 'var(--accent)' : 'var(--muted)', borderBottom: tab === t.id ? '2px solid var(--accent)' : '2px solid transparent' }}>{t.label}</button>
          ))}
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? 16 : 24 }}>
          {tab === 'details' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div><label style={lbl}>Titel</label><input style={inp} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} disabled={!canEditMeta} /></div>
              <div><label style={lbl}>Beschreibung</label><textarea style={{ ...inp, height: 80, resize: 'vertical' }} value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} disabled={!canEditMeta} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={lbl}>Kategorie</label>
                  <select style={inp} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} disabled={!canEditMeta}>
                    <option value="">— Wählen —</option>
                    {categories.map((c: any) => <option key={c.id} value={c.name}>{c.icon} {c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Priorität</label>
                  <select style={inp} value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} disabled={!canEditMeta}>
                    {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Status</label>
                  <select style={inp} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    {STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>
                    Verantwortlicher
                    {isMA && <span style={{ color: 'var(--muted)', marginLeft: 4 }}>(nur du)</span>}
                    {isBL && <span style={{ color: 'var(--muted)', marginLeft: 4 }}>(dein Team)</span>}
                    {isGF && <span style={{ color: 'var(--muted)', marginLeft: 4 }}>(Bereichsleiter)</span>}
                  </label>
                  <select style={inp} value={form.assignee_id} onChange={e => setForm({ ...form, assignee_id: e.target.value })}>
                    <option value="">— Nicht zugewiesen —</option>
                    {assignableProfiles.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.full_name} {p.id === currentProfile?.id ? '(Ich)' : ''}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Deadline</label>
                  <input type="date" style={inp} value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} disabled={!canEditMeta} />
                </div>
                {gamificationEnabled && <div>
                  <label style={lbl}>Punkte</label>
                  <input type="number" style={inp} value={form.points_value} onChange={e => setForm({ ...form, points_value: Number(e.target.value) })} disabled={!canEditMeta} />
                </div>}

              </div>
              {isMA && (
                <div style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)', fontSize: 12, color: 'var(--muted)' }}>
                  💡 Als Mitarbeiter kannst du den Status ändern und dir selbst zuweisen.
                </div>
              )}
            </div>
          )}
          {tab === 'comments' && (
            <div>
              {comments.length === 0 && <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '20px 0', fontSize: 13 }}>Noch keine Kommentare</div>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                {comments.map((c: any) => {
                  const isMe = c.user_id === currentProfile?.id
                  return (
                    <div key={c.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      {c.author && <Avatar name={c.author.full_name} size={32} />}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <span style={{ fontSize: 12, fontWeight: 600 }}>{c.author?.full_name || 'Unbekannt'}</span>
                            {isMe && <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: 'var(--accent)22', color: 'var(--accent)', fontWeight: 700 }}>ICH</span>}
                          </div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <span style={{ fontSize: 11, color: 'var(--muted)' }}>{new Date(c.created_at).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                            {isMe && <button onClick={() => handleDeleteComment(c.id)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 14, padding: 4 }}>✕</button>}
                          </div>
                        </div>
                        <div style={{ padding: '10px 14px', borderRadius: 10, background: isMe ? 'var(--accent)18' : 'var(--surface)', border: `1px solid ${isMe ? 'var(--accent)33' : 'var(--border)'}`, fontSize: 13, lineHeight: 1.5 }}>{c.content}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                {currentProfile && <Avatar name={currentProfile.full_name} size={32} />}
                <div style={{ flex: 1 }}>
                  <textarea style={{ ...inp, height: 70, resize: 'none' }} placeholder="Kommentar schreiben..." value={newComment} onChange={e => setNewComment(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendComment() } }} />
                </div>
                <button onClick={handleSendComment} disabled={!newComment.trim() || sendingComment} style={{ padding: '12px 16px', borderRadius: 8, border: 'none', background: newComment.trim() ? 'var(--accent)' : 'var(--border)', color: '#fff', cursor: newComment.trim() ? 'pointer' : 'not-allowed', fontWeight: 600, fontSize: 18, flexShrink: 0 }}>↑</button>
              </div>
            </div>
          )}
        </div>
        <div style={{ padding: isMobile ? '12px 16px' : '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', gap: 10 }}>
          {(isAdmin || isGF || isBL) ? (
            <button onClick={() => { onDelete(task.id); onClose() }} style={{ padding: isMobile ? '12px 16px' : '8px 16px', borderRadius: 8, border: '1px solid #ff4d6d44', background: '#ff4d6d18', color: 'var(--red)', cursor: 'pointer', fontSize: 13 }}>🗑 Löschen</button>
          ) : <div />}
          <div style={{ display: 'flex', gap: 10, flex: isMobile ? 1 : 'none', justifyContent: 'flex-end' }}>
            <button onClick={onClose} style={{ padding: isMobile ? '12px 16px' : '8px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted)', cursor: 'pointer', fontSize: 13 }}>Schließen</button>
            <button onClick={async () => { setSaving(true); await onSave(form); setSaving(false) }} style={{ flex: isMobile ? 1 : 'none', padding: isMobile ? '12px 16px' : '8px 16px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              {saving ? 'Speichere...' : 'Speichern'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([])
  const [profiles, setProfiles] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [currentProfile, setCurrentProfile] = useState<any>(null)
  const [view, setView] = useState<'mine' | 'team' | 'all'>('mine')
  const [statusFilter, setStatusFilter] = useState('Alle')
  const [categoryFilter, setCategoryFilter] = useState('Alle')
  const [createModal, setCreateModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [form, setForm] = useState<any>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [tenant, setTenant] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [errMsg, setErrMsg] = useState('')
  const isMobile = useIsMobile()

  async function markOverdue(taskList: any[]) {
    const today = new Date().toISOString().split('T')[0]
    const toMark = taskList.filter(t => t.deadline && t.deadline < today && t.status !== 'Erledigt' && t.status !== 'Ueberfaellig')
    await Promise.all(toMark.map(t => updateTask(t.id, { status: 'Ueberfaellig' })))
    return toMark.length > 0
  }

  const load = useCallback(async () => {
    const [t, p, c, ten] = await Promise.all([fetchTasks(), fetchProfiles(), fetch('/api/categories').then(r => r.json()), fetch('/api/tenant').then(r => r.json())])
    const hadOverdue = await markOverdue(t)
    if (hadOverdue) { const fresh = await fetchTasks(); setTasks(fresh) } else { setTasks(t) }
    setProfiles(p); setCategories(c); setTenant(ten); setLoading(false)
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
    const role = currentProfile.role
    if (role === 'mitarbeiter') setView('mine')
    else if (role === 'bereichsleiter') setView('team')
    else setView('all')
  }, [currentProfile])

  const role = currentProfile?.role
  const isAdmin = role === 'admin'
  const isGF = role === 'geschaeftsfuehrung'
  const isBL = role === 'bereichsleiter'
  const isMA = role === 'mitarbeiter'
  const canCreate = isAdmin || isGF || isBL || isMA
  const canSeeAll = isAdmin || isGF
  const gamificationEnabled = tenant?.gamification_enabled ?? true
  const assignableProfiles = getAssignableProfiles(profiles, currentProfile)

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
    .sort((a: any, b: any) => {
      const ORDER: Record<string, number> = { 'Ueberfaellig': 0, 'Offen': 1, 'In Bearbeitung': 2, 'Erledigt': 3 }
      return (ORDER[a.status] ?? 99) - (ORDER[b.status] ?? 99)
    })

  const counts: Record<string, number> = {
    'Alle': viewFiltered.length,
    'Offen': viewFiltered.filter(t => t.status === 'Offen').length,
    'In Bearbeitung': viewFiltered.filter(t => t.status === 'In Bearbeitung').length,
    'Erledigt': viewFiltered.filter(t => t.status === 'Erledigt').length,
    'Ueberfaellig': viewFiltered.filter(t => t.status === 'Ueberfaellig').length,
  }

  async function handleCreate() {
    setErrMsg('')
    if (!form.title || !form.category) { setErrMsg('Titel und Kategorie sind Pflichtfelder'); return }
    setSaving(true)
    try {
      const assigneeId = isMA ? currentProfile?.id : (form.assignee_id || null)
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description || null,
          category: form.category,
          priority: isMA ? 'Mittel' : form.priority,
          status: 'Offen',
          assignee_id: assigneeId,
          deadline: isMA ? null : (form.deadline || null),
          points_value: isMA ? 80 : form.points_value,
          tenant_id: TENANT_ID,
          created_by: currentProfile?.id,
          kategorie: form.category,
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

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ fontSize: isMobile ? 24 : 22, fontWeight: 800, letterSpacing: '-0.03em' }}>Aufgaben</h1>
        {canCreate && (
          <button onClick={() => { setForm({ ...EMPTY, category: categories[0]?.name || '', assignee_id: isMA ? currentProfile?.id : '' }); setErrMsg(''); setCreateModal(true) }} style={{ padding: isMobile ? '10px 16px' : '9px 18px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>+ Neu</button>
        )}
      </div>

      {!isMA && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, overflowX: 'auto', paddingBottom: 4 }}>
          <button onClick={() => setView('mine')} style={{ padding: '8px 16px', borderRadius: 20, border: `1px solid ${view === 'mine' ? 'var(--accent)' : 'var(--border)'}`, background: view === 'mine' ? 'var(--accent)' : 'transparent', color: view === 'mine' ? '#fff' : 'var(--muted)', cursor: 'pointer', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>Meine</button>
          {isBL && <button onClick={() => setView('team')} style={{ padding: '8px 16px', borderRadius: 20, border: `1px solid ${view === 'team' ? 'var(--accent)' : 'var(--border)'}`, background: view === 'team' ? 'var(--accent)' : 'transparent', color: view === 'team' ? '#fff' : 'var(--muted)', cursor: 'pointer', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>Abteilung</button>}
          {canSeeAll && <button onClick={() => setView('all')} style={{ padding: '8px 16px', borderRadius: 20, border: `1px solid ${view === 'all' ? 'var(--accent)' : 'var(--border)'}`, background: view === 'all' ? 'var(--accent)' : 'transparent', color: view === 'all' ? '#fff' : 'var(--muted)', cursor: 'pointer', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>Alle</button>}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 10, overflowX: 'auto', paddingBottom: 4 }}>
        {Object.entries(counts).map(([s, c]) => (
          <button key={s} onClick={() => setStatusFilter(s)} style={{ padding: '6px 12px', borderRadius: 20, border: `1px solid ${statusFilter === s ? 'var(--accent)' : 'var(--border)'}`, background: statusFilter === s ? 'var(--accent)' : 'var(--card)', color: statusFilter === s ? '#fff' : 'var(--muted)', cursor: 'pointer', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>{s} ({c})</button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
        <button onClick={() => setCategoryFilter('Alle')} style={{ padding: '5px 12px', borderRadius: 20, border: `1px solid ${categoryFilter === 'Alle' ? 'var(--accent)' : 'var(--border)'}`, background: categoryFilter === 'Alle' ? 'var(--accent)22' : 'transparent', color: categoryFilter === 'Alle' ? 'var(--accent)' : 'var(--muted)', cursor: 'pointer', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>Alle</button>
        {categories.map((cat: any) => (
          <button key={cat.id} onClick={() => setCategoryFilter(cat.name)} style={{ padding: '5px 12px', borderRadius: 20, border: `1px solid ${categoryFilter === cat.name ? cat.color : 'var(--border)'}`, background: categoryFilter === cat.name ? `${cat.color}22` : 'transparent', color: categoryFilter === cat.name ? cat.color : 'var(--muted)', cursor: 'pointer', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>{cat.icon} {cat.name}</button>
        ))}
      </div>

      {loading ? <div style={{ color: 'var(--muted)', textAlign: 'center', padding: 40 }}>Lade...</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 8 : 10 }}>
          {filtered.length === 0 && (
            <div style={{ color: 'var(--muted)', textAlign: 'center', padding: 40, background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border)' }}>
              {view === 'mine' ? 'Dir sind keine Aufgaben zugewiesen' : 'Keine Aufgaben gefunden'}
            </div>
          )}
          {filtered.map((task: any) => {
            const sc = SC[task.status] || SC['Offen']
            const catObj = categories.find((c: any) => c.name === task.category)
            const cc = catObj?.color || 'var(--accent)'
            const catIcon = catObj?.icon || '📋'
            const pc = PC[task.priority] || 'var(--muted)'
            const assignee = profiles.find((p: any) => p.id === task.assignee_id)
            const isMyTask = task.assignee_id === currentProfile?.id
            const commentCount = (task.comments || []).length

            if (isMobile) {
              return (
                <div key={task.id} onClick={() => setSelectedTask(task)} style={{ background: 'var(--card)', border: `1px solid ${isMyTask ? cc + '44' : 'var(--border)'}`, borderLeft: `4px solid ${cc}`, borderRadius: 12, padding: '14px 16px', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div style={{ flex: 1, marginRight: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <span style={{ fontSize: 15, fontWeight: 700 }}>{task.title}</span>
                        {isMyTask && <span style={{ fontSize: 9, padding: '2px 5px', borderRadius: 3, background: 'var(--accent)22', color: 'var(--accent)', fontWeight: 700, flexShrink: 0 }}>MEINE</span>}
                      </div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: cc }}>{catIcon} {task.category}</span>
                        <span style={{ fontSize: 12, color: pc, fontWeight: 600 }}>{task.priority}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                      <span style={{ padding: '4px 10px', borderRadius: 12, background: sc.bg, color: sc.color, fontSize: 11, fontWeight: 600, border: `1px solid ${sc.color}44` }}>{task.status === 'Ueberfaellig' ? 'Überfällig' : task.status}</span>
                      {gamificationEnabled && <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>{task.points_value} Pkt</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      {assignee && (<div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Avatar name={assignee.full_name} color={cc} size={20} /><span style={{ fontSize: 12, color: 'var(--muted)' }}>{assignee.full_name.split(' ')[0]}</span></div>)}
                      {task.deadline && <span style={{ fontSize: 12, color: task.status === 'Ueberfaellig' ? 'var(--red)' : 'var(--muted)' }}>⏰ {formatDate(task.deadline)}</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {commentCount > 0 && <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>💬 {commentCount}</span>}
                      <span style={{ fontSize: 12, color: 'var(--muted)' }}>›</span>
                    </div>
                  </div>
                </div>
              )
            }

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
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: `${cc}22`, color: cc, border: `1px solid ${cc}44` }}>{catIcon} {task.category}</span>
                    <Tag label={task.priority} color={pc} />
                    {assignee ? (<div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Avatar name={assignee.full_name} color={cc} size={18} /><span style={{ fontSize: 11, color: 'var(--muted)' }}>{assignee.full_name}</span></div>) : <Tag label="Nicht zugewiesen" color="var(--muted)" />}
                    {task.deadline && <Tag label={`⏰ ${formatDate(task.deadline)}`} color={task.status === 'Ueberfaellig' ? 'var(--red)' : 'var(--muted)'} />}
                  </div>
                </div>
                <select value={task.status} onClick={e => e.stopPropagation()} onChange={e => { updateTask(task.id, { status: e.target.value }); load() }} style={{ padding: '4px 10px', borderRadius: 20, background: sc.bg, color: sc.color, border: `1px solid ${sc.color}44`, fontSize: 11, fontWeight: 600, cursor: 'pointer', outline: 'none' }}>
                  {STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
                {gamificationEnabled && <div style={{ textAlign: 'center', minWidth: 50 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent)' }}>{task.points_value}</div>
                  <div style={{ fontSize: 10, color: 'var(--muted)' }}>Pkt</div>
                </div>}
                </div>
                <div style={{ fontSize: 11, color: commentCount > 0 ? 'var(--accent)' : 'var(--muted)', fontWeight: commentCount > 0 ? 600 : 400, minWidth: 24 }}>💬{commentCount > 0 ? ` ${commentCount}` : ''}</div>
              </div>
            )
          })}
        </div>
      )}

      {createModal && (
        <div style={{ position: 'fixed', inset: 0, background: '#00000088', backdropFilter: 'blur(4px)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', zIndex: 100 }} onClick={e => e.target === e.currentTarget && setCreateModal(false)}>
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: isMobile ? '20px 20px 0 0' : 16, padding: isMobile ? '24px 16px' : 28, width: isMobile ? '100%' : 520, maxHeight: isMobile ? '90vh' : 'auto', overflowY: 'auto' }}>
            {isMobile && <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--border)', margin: '0 auto 20px' }} />}
            <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>Neue Aufgabe</div>
            {isMA && <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16, padding: '8px 12px', borderRadius: 8, background: 'var(--surface)' }}>💡 Die Aufgabe wird dir automatisch zugewiesen.</div>}
            {isGF && <div style={{ fontSize: 12, color: '#a855f7', marginBottom: 16, padding: '8px 12px', borderRadius: 8, background: '#a855f718', border: '1px solid #a855f733' }}>👔 Aufgabe wird einem Bereichsleiter zugewiesen.</div>}
            {errMsg && <div style={{ padding: '10px', borderRadius: 8, marginBottom: 16, background: '#ff4d6d22', color: 'var(--red)', fontSize: 13 }}>{errMsg}</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div><label style={lbl}>Titel *</label><input style={inp} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Aufgabentitel..." /></div>
              <div><label style={lbl}>Beschreibung</label><textarea style={{ ...inp, height: 70, resize: 'vertical' }} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={lbl}>Kategorie *</label>
                  <select style={inp} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    <option value="">— Wählen —</option>
                    {categories.map((c: any) => <option key={c.id} value={c.name}>{c.icon} {c.name}</option>)}
                  </select>
                </div>
                {!isMA && (
                  <div>
                    <label style={lbl}>Priorität</label>
                    <select style={inp} value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                      {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                )}
                {!isMA && (
                  <div>
                    <label style={lbl}>
                      Verantwortlicher
                      {isBL && <span style={{ color: 'var(--muted)', marginLeft: 4, fontSize: 10 }}>(dein Team)</span>}
                      {isGF && <span style={{ color: 'var(--muted)', marginLeft: 4, fontSize: 10 }}>(Bereichsleiter)</span>}
                    </label>
                    <select style={inp} value={form.assignee_id} onChange={e => setForm({ ...form, assignee_id: e.target.value })}>
                      <option value="">— Nicht zugewiesen —</option>
                      {assignableProfiles.map((p: any) => (<option key={p.id} value={p.id}>{p.full_name} {p.id === currentProfile?.id ? '(Ich)' : ''}</option>))}
                    </select>
                  </div>
                )}
                {!isMA && (
                  <div>
                    <label style={lbl}>Deadline</label>
                    <input type="date" style={inp} value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} />
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
              <button onClick={() => setCreateModal(false)} style={{ padding: '12px 18px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted)', cursor: 'pointer' }}>Abbrechen</button>
              <button onClick={handleCreate} disabled={!form.title || !form.category || saving} style={{ flex: isMobile ? 1 : 'none', padding: '12px 18px', borderRadius: 8, border: 'none', background: form.title && form.category ? 'var(--accent)' : 'var(--border)', color: '#fff', cursor: form.title && form.category ? 'pointer' : 'not-allowed', fontWeight: 600, fontSize: 14 }}>
                {saving ? 'Speichere...' : 'Erstellen'}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedTask && (
        <TaskModal task={selectedTask} profiles={profiles} categories={categories} currentProfile={currentProfile} onClose={() => setSelectedTask(null)} onSave={handleSaveTask} onDelete={(id: string) => { deleteTask(id); load() }} />
      )}
    </div>
  )
}
