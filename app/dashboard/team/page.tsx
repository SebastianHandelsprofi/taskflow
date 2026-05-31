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

function Avatar({ name, color, size = 40 }: { name: string; color: string; size?: number }) {
  const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div style={{ width: size, height: size, borderRadius: size / 2, background: `${color}33`, border: `2px solid ${color}66`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.33, fontWeight: 700, color, flexShrink: 0 }}>
      {initials}
    </div>
  )
}

function XPBar({ current, max, color }: { current: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((current / max) * 100, 100) : 0
  return (
    <div style={{ width: '100%', height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', borderRadius: 2, background: color, transition: 'width 0.8s ease' }} />
    </div>
  )
}

const ROLE_LABELS: Record<string, string> = {
  'admin': 'Admin',
  'bereichsleiter': 'Bereichsleiter',
  'mitarbeiter': 'Mitarbeiter',
}

const ROLE_COLORS: Record<string, string> = {
  'admin': '#ff4d6d',
  'bereichsleiter': '#ffd166',
  'mitarbeiter': '#00d4aa',
}

export default function TeamPage() {
  const [profiles, setProfiles] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [currentProfile, setCurrentProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

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

  const isAdmin = currentProfile?.role === 'admin'
  const isBereichsleiter = currentProfile?.role === 'bereichsleiter'

  // Welche Profile anzeigen
  const visibleProfiles = isAdmin
    ? profiles
    : profiles.filter(p => p.abteilung === currentProfile?.abteilung)

  // Gruppieren nach Abteilung
  const abteilungen: Record<string, any[]> = {}
  visibleProfiles.forEach(p => {
    const key = p.abteilung || 'Ohne Abteilung'
    if (!abteilungen[key]) abteilungen[key] = []
    abteilungen[key].push(p)
  })

  // Aufgaben-Stats je Mitglied
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
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em' }}>Team</h1>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
          {isAdmin ? `${profiles.length} Mitarbeiter · ${Object.keys(abteilungen).length} Abteilungen` : `Abteilung: ${currentProfile?.abteilung || '—'}`}
        </p>
      </div>

      {/* Abteilungen */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {Object.entries(abteilungen).map(([abteilung, members]) => {
          const color = getColor(abteilung)
          const leader = members.find(m => m.role === 'bereichsleiter')
          const totalTasks = members.reduce((sum, m) => sum + getMemberStats(m.id).total, 0)
          const doneTasks = members.reduce((sum, m) => sum + getMemberStats(m.id).erledigt, 0)
          const overdueTasks = members.reduce((sum, m) => sum + getMemberStats(m.id).ueberfaellig, 0)

          return (
            <div key={abteilung} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderLeft: `4px solid ${color}`, borderRadius: 12, overflow: 'hidden' }}>
              {/* Abteilung Header */}
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: `${color}08` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: `${color}22`, border: `2px solid ${color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color }}>
                    {abteilung[0]}
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>{abteilung}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                      {members.length} Mitglieder
                      {leader && <span> · <span style={{ color: 'var(--yellow)' }}>⭐ {leader.full_name}</span></span>}
                    </div>
                  </div>
                </div>
                {/* Abteilungs-Stats */}
                <div style={{ display: 'flex', gap: 16, textAlign: 'center' }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, color }}>{totalTasks}</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)' }}>Aufgaben</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--green)' }}>{doneTasks}</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)' }}>Erledigt</div>
                  </div>
                  {overdueTasks > 0 && (
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--red)' }}>{overdueTasks}</div>
                      <div style={{ fontSize: 10, color: 'var(--muted)' }}>Überfällig</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Mitglieder Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 0 }}>
                {members.map((member, i) => {
                  const stats = getMemberStats(member.id)
                  const isMe = member.id === currentProfile?.id
                  return (
                    <div key={member.id} style={{
                      padding: 20,
                      borderRight: (i + 1) % 3 !== 0 ? '1px solid var(--border)' : 'none',
                      borderBottom: '1px solid var(--border)',
                      background: isMe ? `${color}08` : 'transparent',
                    }}>
                      <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                        <Avatar name={member.full_name} color={color} size={42} />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                            <div style={{ fontSize: 14, fontWeight: 700 }}>{member.full_name}</div>
                            {isMe && <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: `${color}22`, color, fontWeight: 700 }}>ICH</span>}
                          </div>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: `${ROLE_COLORS[member.role]}22`, color: ROLE_COLORS[member.role], fontWeight: 600 }}>
                              {ROLE_LABELS[member.role]}
                            </span>
                            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'var(--surface)', color: 'var(--muted)' }}>
                              Lv.{member.level}
                            </span>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 18, fontWeight: 800, color }}>{member.points}</div>
                          <div style={{ fontSize: 10, color: 'var(--muted)' }}>Punkte</div>
                        </div>
                      </div>

                      {/* XP Bar */}
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--muted)', marginBottom: 4 }}>
                          <span>{member.xp} XP</span>
                          <span>Lv.{member.level + 1} in {member.xp_next - member.xp} XP</span>
                        </div>
                        <XPBar current={member.xp} max={member.xp_next} color={color} />
                      </div>

                      {/* Aufgaben Stats */}
                      {stats.total > 0 ? (
                        <div style={{ display: 'flex', gap: 8 }}>
                          {stats.offen > 0 && (
                            <div style={{ flex: 1, textAlign: 'center', padding: '6px', borderRadius: 6, background: 'var(--surface)' }}>
                              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--muted)' }}>{stats.offen}</div>
                              <div style={{ fontSize: 9, color: 'var(--muted)' }}>Offen</div>
                            </div>
                          )}
                          {stats.inBearbeitung > 0 && (
                            <div style={{ flex: 1, textAlign: 'center', padding: '6px', borderRadius: 6, background: '#ffd16622' }}>
                              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--yellow)' }}>{stats.inBearbeitung}</div>
                              <div style={{ fontSize: 9, color: 'var(--yellow)', opacity: 0.8 }}>Aktiv</div>
                            </div>
                          )}
                          {stats.erledigt > 0 && (
                            <div style={{ flex: 1, textAlign: 'center', padding: '6px', borderRadius: 6, background: '#00d4aa22' }}>
                              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--green)' }}>{stats.erledigt}</div>
                              <div style={{ fontSize: 9, color: 'var(--green)', opacity: 0.8 }}>Erledigt</div>
                            </div>
                          )}
                          {stats.ueberfaellig > 0 && (
                            <div style={{ flex: 1, textAlign: 'center', padding: '6px', borderRadius: 6, background: '#ff4d6d22' }}>
                              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--red)' }}>{stats.ueberfaellig}</div>
                              <div style={{ fontSize: 9, color: 'var(--red)', opacity: 0.8 }}>Überfällig</div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', padding: '8px 0' }}>Keine Aufgaben zugewiesen</div>
                      )}
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
