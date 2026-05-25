'use client'
import { useEffect, useState } from 'react'
import { fetchProfiles, fetchUserBadges } from '@/lib/api'

const TEAM_COLORS: Record<string, string> = { 'Vertrieb': '#6c63ff', 'Produktion': '#ff8c42', 'Kundenservice': '#00d4aa', 'IT': '#4ecdc4', 'Lager': '#ffd166', 'Marketing': '#ff6b9d' }

function XPBar({ current, max, color }: { current: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((current / max) * 100, 100) : 0
  return <div style={{ width: '100%', height: 5, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}><div style={{ width: `${pct}%`, height: '100%', borderRadius: 3, background: color, transition: 'width 0.8s ease' }} /></div>
}

function Avatar({ name, color, size = 44 }: { name: string; color: string; size?: number }) {
  const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
  return <div style={{ width: size, height: size, borderRadius: size / 2, background: `${color}33`, border: `2px solid ${color}66`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.33, fontWeight: 700, color, flexShrink: 0 }}>{initials}</div>
}

export default function TeamPage() {
  const [profiles, setProfiles] = useState<any[]>([])
  const [badgesMap, setBadgesMap] = useState<Record<string, any[]>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProfiles().then(async p => {
      setProfiles(p)
      const map: Record<string, any[]> = {}
      await Promise.all(p.map(async (profile: any) => { map[profile.id] = await fetchUserBadges(profile.id) }))
      setBadgesMap(map)
      setLoading(false)
    })
  }, [])

  if (loading) return <div style={{ color: 'var(--muted)', textAlign: 'center', padding: 40 }}>Lade Team...</div>

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em' }}>Team</h1>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>{profiles.length} Mitarbeiter</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        {profiles.map((emp: any) => {
          const color = TEAM_COLORS[emp.team ?? ''] || 'var(--accent)'
          const badges = badgesMap[emp.id] || []
          return (
            <div key={emp.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${color}, transparent)` }} />
              <div style={{ display: 'flex', gap: 14, marginBottom: 16 }}>
                <Avatar name={emp.full_name} color={color} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{emp.full_name}</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, background: 'var(--surface)', color: 'var(--muted)' }}>{emp.role}</span>
                    {emp.team && <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, background: `${color}22`, color }}>{emp.team}</span>}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color }}>Lv.{emp.level}</div>
                  <div style={{ fontSize: 10, color: 'var(--muted)' }}>{emp.points} Pkt</div>
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>
                  <span>{emp.xp} XP</span><span>Lv.{emp.level + 1} in {emp.xp_next - emp.xp} XP</span>
                </div>
                <XPBar current={emp.xp} max={emp.xp_next} color={color} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  {badges.slice(0, 4).map((ub: any, i: number) => <span key={i} title={ub.badge?.name} style={{ fontSize: 18 }}>{ub.badge?.icon}</span>)}
                  {badges.length === 0 && <span style={{ fontSize: 12, color: 'var(--muted)' }}>Noch keine Badges</span>}
                </div>
                <div><span style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent)' }}>{emp.points}</span><span style={{ fontSize: 11, color: 'var(--muted)' }}> Punkte</span></div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
