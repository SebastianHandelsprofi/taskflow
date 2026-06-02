'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

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

function formatDate(d: string) {
  if (!d) return ''
  const date = new Date(d)
  return `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}`
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Guten Morgen'
  if (h < 17) return 'Guten Tag'
  return 'Guten Abend'
}

function getMotivation(points: number, erledigt: number, ueberfaellig: number) {
  if (ueberfaellig > 0) return `⚠️ Du hast ${ueberfaellig} überfällige Aufgabe${ueberfaellig > 1 ? 'n' : ''} — jetzt anpacken!`
  if (erledigt > 3) return '🔥 Starke Leistung heute — weiter so!'
  if (points > 200) return '🏆 Top-Performer — du machst das großartig!'
  return '💪 Einen produktiven Tag!'
}

const TEAM_COLORS: Record<string, string> = {
  'Vertrieb': '#6c63ff', 'Produktion': '#ff8c42', 'Kundenservice': '#00d4aa',
  'IT': '#4ecdc4', 'Lager': '#ffd166', 'Marketing': '#ff6b9d',
  'Geschäftsleitung': '#a855f7', 'Küche': '#ff8c42',
}

const SC: Record<string, any> = {
  'Offen': { color: 'var(--muted)', bg: '#2a2a3d', label: 'Offen' },
  'In Bearbeitung': { color: 'var(--yellow)', bg: '#ffd16622', label: 'Aktiv' },
  'Erledigt': { color: 'var(--green)', bg: '#00d4aa22', label: 'Erledigt' },
  'Ueberfaellig': { color: 'var(--red)', bg: '#ff4d6d22', label: 'Überfällig' },
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<any>(null)
  const [tasks, setTasks] = useState<any[]>([])
  const [profiles, setProfiles] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const isMobile = useIsMobile()

  useEffect(() => {
    createClient().auth.getUser().then(async ({ data }: any) => {
      if (!data.user) return
      const [profRes, taskRes, catRes] = await Promise.all([
        fetch('/api/profiles'),
        fetch('/api/tasks'),
        fetch('/api/categories'),
      ])
      const profs = await profRes.json()
      const taskData = await taskRes.json()
      const catData = await catRes.json()
      const me = profs.find((p: any) => p.id === data.user.id)
      setProfile(me)
      setProfiles(profs)
      setTasks(taskData)
      setCategories(catData)
      setLoading(false)
    })
  }, [])

  if (loading) return <div style={{ color: 'var(--muted)', textAlign: 'center', padding: 60 }}>Lade Dashboard...</div>

  const isAdmin = profile?.role === 'admin'
  const isBereichsleiter = profile?.role === 'bereichsleiter'
  const abteilungColor = TEAM_COLORS[profile?.abteilung] || 'var(--accent)'

  const myTasks = tasks.filter((t: any) => t.assignee_id === profile?.id)
  const myOffen = myTasks.filter((t: any) => t.status === 'Offen').length
  const myAktiv = myTasks.filter((t: any) => t.status === 'In Bearbeitung').length
  const myErledigt = myTasks.filter((t: any) => t.status === 'Erledigt').length
  const myUeberfaellig = myTasks.filter((t: any) => t.status === 'Ueberfaellig').length

  const teamMembers = profiles.filter((p: any) => p.abteilung === profile?.abteilung)
  const teamTasks = tasks.filter((t: any) => teamMembers.some((m: any) => m.id === t.assignee_id))
  const teamUeberfaellig = teamTasks.filter((t: any) => t.status === 'Ueberfaellig').length
  const teamErledigt = teamTasks.filter((t: any) => t.status === 'Erledigt').length

  const alleUeberfaellig = tasks.filter((t: any) => t.status === 'Ueberfaellig').length
  const alleErledigt = tasks.filter((t: any) => t.status === 'Erledigt').length
  const alleOffen = tasks.filter((t: any) => t.status === 'Offen').length
  const alleAktiv = tasks.filter((t: any) => t.status === 'In Bearbeitung').length

  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const urgentTasks = myTasks
    .filter((t: any) => t.status === 'Ueberfaellig' || (t.status === 'Offen' && t.deadline && t.deadline <= nextWeek))
    .sort((a: any, b: any) => {
      const order: Record<string, number> = { 'Ueberfaellig': 0, 'Offen': 1 }
      return (order[a.status] ?? 99) - (order[b.status] ?? 99)
    })
    .slice(0, 5)

  const today2 = new Date().toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  const myStatusRows = [
    { label: 'Überfällig', value: myUeberfaellig, color: 'var(--red)', bg: '#ff4d6d22' },
    { label: 'Offen', value: myOffen, color: 'var(--muted)', bg: 'var(--surface)' },
    { label: 'In Bearbeitung', value: myAktiv, color: 'var(--yellow)', bg: '#ffd16622' },
    { label: 'Erledigt', value: myErledigt, color: 'var(--green)', bg: '#00d4aa22' },
  ]

  const adminStatusRows = [
    { label: 'Überfällig', value: alleUeberfaellig, color: 'var(--red)', bg: '#ff4d6d22' },
    { label: 'Offen', value: alleOffen, color: 'var(--muted)', bg: 'var(--surface)' },
    { label: 'In Bearbeitung', value: alleAktiv, color: 'var(--yellow)', bg: '#ffd16622' },
    { label: 'Erledigt', value: alleErledigt, color: 'var(--green)', bg: '#00d4aa22' },
  ]

  const teamStatusRows = [
    { label: 'Überfällig', value: teamUeberfaellig, color: 'var(--red)', bg: '#ff4d6d22' },
    { label: 'Erledigt', value: teamErledigt, color: 'var(--green)', bg: '#00d4aa22' },
    { label: 'Team-Mitglieder', value: teamMembers.length, color: abteilungColor, bg: `${abteilungColor}22` },
    { label: 'Aufgaben gesamt', value: teamTasks.length, color: 'var(--muted)', bg: 'var(--surface)' },
  ]

  const schnellaktionen = [
    { label: 'Aufgaben', href: '/dashboard/tasks', icon: '◈', color: 'var(--accent)' },
    { label: 'Team', href: '/dashboard/team', icon: '◎', color: '#00d4aa' },
    { label: 'Rangliste', href: '/dashboard/gamification', icon: '◆', color: 'var(--yellow)' },
    ...(isAdmin ? [{ label: 'Einladen', href: '/dashboard/admin', icon: '⊕', color: '#a855f7' }] : []),
  ]

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>

      {/* Begrüßung */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>{today2}</div>
        <h1 style={{ fontSize: isMobile ? 26 : 28, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 8 }}>
          {getGreeting()}, {profile?.full_name?.split(' ')[0]} 👋
        </h1>
        <div style={{ fontSize: 13, color: 'var(--muted)', padding: '8px 14px', borderRadius: 8, background: myUeberfaellig > 0 ? '#ff4d6d18' : 'var(--surface)', border: `1px solid ${myUeberfaellig > 0 ? '#ff4d6d44' : 'var(--border)'}`, display: 'inline-block' }}>
          {getMotivation(profile?.points || 0, myErledigt, myUeberfaellig)}
        </div>
      </div>

      {/* KPI Karten */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Meine Punkte', value: profile?.points || 0, color: abteilungColor, icon: '⭐' },
          { label: 'Level', value: `Lv.${profile?.level || 1}`, color: 'var(--yellow)', icon: '🏆' },
          { label: 'Erledigt', value: myErledigt, color: 'var(--green)', icon: '✅' },
          { label: 'Überfällig', value: myUeberfaellig, color: myUeberfaellig > 0 ? 'var(--red)' : 'var(--muted)', icon: myUeberfaellig > 0 ? '🚨' : '✓' },
        ].map((kpi, i) => (
          <div key={i} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>{kpi.icon}</div>
            <div style={{ fontSize: isMobile ? 22 : 26, fontWeight: 800, color: kpi.color, lineHeight: 1 }}>{kpi.value}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Dringende Aufgaben */}
      {urgentTasks.length > 0 && (
        <div style={{ background: 'var(--card)', border: '1px solid #ff4d6d44', borderRadius: 12, marginBottom: 20, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', background: '#ff4d6d08', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--red)' }}>🚨 Dringend — Meine Aufgaben</div>
            <a href="/dashboard/tasks" style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>Alle →</a>
          </div>
          {urgentTasks.map((task: any, i: number) => {
            const sc = SC[task.status] || SC['Offen']
            const catObj = categories.find((c: any) => c.name === task.category)
            const cc = catObj?.color || 'var(--accent)'
            return (
              <a href="/dashboard/tasks" key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: i < urgentTasks.length - 1 ? '1px solid var(--border)' : 'none', textDecoration: 'none', color: 'inherit' }}>
                <div style={{ width: 3, height: 36, borderRadius: 2, background: cc, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                    {catObj?.icon} {task.category}
                    {task.deadline && <span style={{ color: task.status === 'Ueberfaellig' ? 'var(--red)' : 'var(--muted)', marginLeft: 8 }}>⏰ {formatDate(task.deadline)}</span>}
                  </div>
                </div>
                <span style={{ padding: '3px 8px', borderRadius: 10, background: sc.bg, color: sc.color, fontSize: 11, fontWeight: 600, border: `1px solid ${sc.color}44`, flexShrink: 0 }}>{sc.label}</span>
              </a>
            )
          })}
        </div>
      )}

      {/* Aufgaben Status + Team */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>📋 Meine Aufgaben</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {myStatusRows.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1, fontSize: 13 }}>{s.label}</div>
                <div style={{ padding: '3px 12px', borderRadius: 20, background: s.bg, color: s.color, fontSize: 13, fontWeight: 700, minWidth: 36, textAlign: 'center' }}>{s.value}</div>
                <div style={{ width: 80, height: 6, borderRadius: 3, background: 'var(--border)', overflow: 'hidden' }}>
                  <div style={{ width: `${myTasks.length > 0 ? (s.value / myTasks.length) * 100 : 0}%`, height: '100%', background: s.color, borderRadius: 3 }} />
                </div>
              </div>
            ))}
            <div style={{ marginTop: 4, fontSize: 12, color: 'var(--muted)', textAlign: 'right' }}>{myTasks.length} Aufgaben total</div>
          </div>
        </div>

        {(isAdmin || isBereichsleiter) && (
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>
              {isAdmin ? '🏢 Gesamt-Übersicht' : `👥 ${profile?.abteilung || 'Mein Team'}`}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(isAdmin ? adminStatusRows : teamStatusRows).map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1, fontSize: 13 }}>{s.label}</div>
                  <div style={{ padding: '3px 12px', borderRadius: 20, background: s.bg, color: s.color, fontSize: 13, fontWeight: 700, minWidth: 36, textAlign: 'center' }}>{s.value}</div>
                </div>
              ))}
              {isAdmin && <div style={{ marginTop: 4, fontSize: 12, color: 'var(--muted)', textAlign: 'right' }}>{tasks.length} Aufgaben · {profiles.length} Mitarbeiter</div>}
            </div>
          </div>
        )}

        {!isAdmin && !isBereichsleiter && (
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>🎮 Mein Fortschritt</div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>
                <span>{profile?.xp || 0} XP</span>
                <span>Lv.{(profile?.level || 1) + 1} in {(profile?.xp_next || 500) - (profile?.xp || 0)} XP</span>
              </div>
              <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(((profile?.xp || 0) / (profile?.xp_next || 500)) * 100, 100)}%`, height: '100%', background: `linear-gradient(90deg, ${abteilungColor}, var(--accent))`, borderRadius: 4 }} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ textAlign: 'center', padding: 12, borderRadius: 8, background: 'var(--surface)' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: abteilungColor }}>{profile?.points || 0}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>Punkte</div>
              </div>
              <div style={{ textAlign: 'center', padding: 12, borderRadius: 8, background: 'var(--surface)' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--yellow)' }}>Lv.{profile?.level || 1}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>Level</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Schnellaktionen */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>⚡ Schnellaktionen</div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 10 }}>
          {schnellaktionen.map((a, i) => (
            <a key={i} href={a.href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '16px 8px', borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)', textDecoration: 'none', transition: 'all 0.2s' }}>
              <span style={{ fontSize: 24, color: a.color }}>{a.icon}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{a.label}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Abteilungs-Info */}
      {profile?.abteilung && (
        <div style={{ background: `${abteilungColor}10`, border: `1px solid ${abteilungColor}33`, borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: `${abteilungColor}22`, border: `2px solid ${abteilungColor}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: abteilungColor, flexShrink: 0 }}>
            {profile.abteilung[0]}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: abteilungColor }}>{profile.abteilung}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
              {teamMembers.length} Mitglieder · {teamTasks.length} Aufgaben · {teamErledigt} erledigt
            </div>
          </div>
          <a href="/dashboard/team" style={{ marginLeft: 'auto', fontSize: 12, color: abteilungColor, fontWeight: 600, flexShrink: 0 }}>Team →</a>
        </div>
      )}
    </div>
  )
}
