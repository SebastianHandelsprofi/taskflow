'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const TEAM_COLORS: Record<string, string> = {
  'Vertrieb': '#6c63ff', 'Produktion': '#ff8c42', 'Kundenservice': '#00d4aa',
  'IT': '#4ecdc4', 'Lager': '#ffd166', 'Marketing': '#ff6b9d',
  'Geschäftsleitung': '#a855f7', 'Küche': '#ff8c42',
}

function getColor(abteilung: string) {
  return TEAM_COLORS[abteilung] || '#6c63ff'
}

function Avatar({ name, color, size = 36 }: { name: string; color: string; size?: number }) {
  const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div style={{ width: size, height: size, borderRadius: size / 2, background: `${color}33`, border: `2px solid ${color}66`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.33, fontWeight: 700, color, flexShrink: 0 }}>
      {initials}
    </div>
  )
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

const ROLE_COLORS: Record<string, string> = {
  'admin': '#ff4d6d', 'bereichsleiter': '#ffd166', 'mitarbeiter': '#00d4aa'
}

export default function TeamPage() {
  const [profiles, setProfiles] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [currentProfile, setCurrentProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const isMobile = useIsMobile()

  useEffect(() => {
    Promise.all([fetch('/api/profiles'), fetch('/api/tasks')])
      .then(async ([pRes, tRes]) => {
        const p = await pRes.json()
        const t = await tRes.json()
        setProfiles(p)
        setTasks(t)
        setLoading(false)
      })

    createClient().auth.getUser().then(async ({ data }: any) => {
      if (data.user) {
        const res = await fetch('/api/profiles')
        const profiles = await res.json()
        setCurrentProfile(profiles.find((p: any) => p.id === data.user.id))
      }
    })
  }, [])

  if (loading) return <div style={{ color: 'var(--muted)', textAlign: 'center', padding: 40 }}>Lade Team...</div>

  const isAdmin = currentProfile?.role === 'admin' || currentProfile?.role === 'geschaeftsfuehrung'
  const isBereichsleiter = currentProfile?.role === 'bereichsleiter'

  const visibleProfiles = isAdmin
    ? profiles
    : profiles.filter(p => p.abteilung === currentProfile?.abteilung)

  const abteilungen: Record<string, any[]> = {}
  visibleProfiles.forEach(p => {
    const key = p.abteilung || 'Ohne Abteilung'
    if (!abteilungen[key]) abteilungen[key] = []
    abteilungen[key].push(p)
  })

  function getMemberStats(userId: string) {
    const memberTasks = tasks.filter(t => t.assignee_id === userId)
    return {
      total: memberTasks.length,
      offen: memberTasks.filter(t => t.status === 'Offen').length,
      inBearbeitung: memberTasks.filter(t => t.status === 'In Bearbeitung').length,
      erledigt: memberTasks.filter(t => t.status === 'Erledigt').length,
      ueberfaellig: memberTasks.filter(t => t.status === 'Ueberfaellig').length,
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: isMobile ? 24 : 22, fontWeight: 800, letterSpacing: '-0.03em' }}>Team</h1>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
          {isAdmin ? `${profiles.length} Mitarbeiter · ${Object.keys(abteilungen).length} Abteilungen` : `Abteilung: ${currentProfile?.abteilung || '—'}`}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {Object.entries(abteilungen).map(([abteilung, members]) => {
          const color = getColor(abteilung)
          const leader = members.find(m => m.role === 'bereichsleiter')
          const totalTasks = members.reduce((sum, m) => sum + getMemberStats(m.id).total, 0)
          const doneTasks = members.reduce((sum, m) => sum + getMemberStats(m.id).erledigt, 0)
          const overdueTasks = members.reduce((sum, m) => sum + getMemberStats(m.id).ueberfaellig, 0)

          return (
            <div key={abteilung} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderLeft: `4px solid ${color}`, borderRadius: 12, overflow: 'hidden' }}>
              {/* Abteilung Header */}
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: `${color}08` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}22`, border: `2px solid ${color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color }}>
                    {abteilung[0]}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{abteilung}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                      {members.length} Mitglieder
                      {leader && <span> · <span style={{ color: 'var(--yellow)' }}>⭐ {leader.full_name.split(' ')[0]}</span></span>}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, textAlign: 'center' }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color }}>{totalTasks}</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)' }}>Aufg.</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--green)' }}>{doneTasks}</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)' }}>Erl.</div>
                  </div>
                  {overdueTasks > 0 && (
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--red)' }}>{overdueTasks}</div>
                      <div style={{ fontSize: 10, color: 'var(--muted)' }}>Überf.</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Mitglieder — kompakte Liste */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {members.map((member, i) => {
                  const stats = getMemberStats(member.id)
                  const isMe = member.id === currentProfile?.id
                  return (
                    <div key={member.id} style={{
                      padding: '10px 16px',
                      borderBottom: i < members.length - 1 ? '1px solid var(--border)' : 'none',
                      background: isMe ? `${color}08` : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                    }}>
                      <Avatar name={member.full_name} color={color} size={32} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.full_name}</span>
                          {isMe && <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: `${color}22`, color, fontWeight: 700, flexShrink: 0 }}>ICH</span>}
                        </div>
                        <div style={{ display: 'flex', gap: 6, marginTop: 2, alignItems: 'center' }}>
                          <span style={{ fontSize: 11, padding: '1px 6px', borderRadius: 4, background: `${ROLE_COLORS[member.role]}22`, color: ROLE_COLORS[member.role], fontWeight: 600 }}>{member.role}</span>
                          <span style={{ fontSize: 11, color: 'var(--muted)' }}>Lv.{member.level}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color }}>{member.points}</div>
                          <div style={{ fontSize: 9, color: 'var(--muted)' }}>Pkt</div>
                        </div>
                        {stats.total > 0 && (
                          <div style={{ display: 'flex', gap: 4 }}>
                            {stats.ueberfaellig > 0 && <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, background: '#ff4d6d22', color: 'var(--red)', fontWeight: 600 }}>{stats.ueberfaellig}⚠</span>}
                            {stats.inBearbeitung > 0 && <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, background: '#ffd16622', color: 'var(--yellow)', fontWeight: 600 }}>{stats.inBearbeitung}▶</span>}
                            {stats.erledigt > 0 && <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, background: '#00d4aa22', color: 'var(--green)', fontWeight: 600 }}>{stats.erledigt}✓</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
