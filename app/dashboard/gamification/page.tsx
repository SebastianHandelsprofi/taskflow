'use client'
import { useEffect, useState } from 'react'
import { fetchLeaderboard, fetchAllBadges, fetchActiveChallenges } from '@/lib/api'

const TEAM_COLORS: Record<string, string> = { 'Vertrieb': '#6c63ff', 'Produktion': '#ff8c42', 'Kundenservice': '#00d4aa', 'IT': '#4ecdc4', 'Lager': '#ffd166', 'Marketing': '#ff6b9d' }

function XPBar({ current, max, color }: { current: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((current / max) * 100, 100) : 0
  return <div style={{ width: '100%', height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}><div style={{ width: `${pct}%`, height: '100%', borderRadius: 3, background: color, transition: 'width 0.8s ease' }} /></div>
}

function Avatar({ name, color }: { name: string; color: string }) {
  const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
  return <div style={{ width: 36, height: 36, borderRadius: 18, background: `${color}33`, border: `2px solid ${color}66`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color, flexShrink: 0 }}>{initials}</div>
}

export default function GamificationPage() {
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [badges, setBadges] = useState<any[]>([])
  const [challenges, setChallenges] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([fetchLeaderboard(), fetchAllBadges(), fetchActiveChallenges()])
      .then(([l, b, c]) => { setLeaderboard(l); setBadges(b); setChallenges(c); setLoading(false) })
  }, [])

  const medals = ['🥇', '🥈', '🥉']
  if (loading) return <div style={{ color: 'var(--muted)', textAlign: 'center', padding: 40 }}>Lade...</div>

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em' }}>Rangliste & Achievements</h1>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>🏆 Monats-Rangliste</div>
          {leaderboard.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 13 }}>Noch keine Daten</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {leaderboard.map((emp: any, i: number) => {
              const color = TEAM_COLORS[emp.team ?? ''] || 'var(--accent)'
              const isTop = i === 0
              return (
                <div key={emp.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, background: isTop ? '#6c63ff18' : 'var(--surface)', border: `1px solid ${isTop ? '#6c63ff44' : 'var(--border)'}` }}>
                  <span style={{ fontSize: isTop ? 22 : 15, minWidth: 28, textAlign: 'center' }}>{medals[i] ?? `${i + 1}.`}</span>
                  <Avatar name={emp.full_name} color={color} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{emp.full_name}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{emp.completed_tasks} erledigt · Lv.{emp.level}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: isTop ? 'var(--yellow)' : 'var(--accent)' }}>{emp.points}</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)' }}>Punkte</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>🎖 Achievements</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
            {badges.map((b: any) => (
              <div key={b.id} style={{ padding: 14, borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 26, marginBottom: 6 }}>{b.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 3 }}>{b.name}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.4 }}>{b.description}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {challenges.map((c: any) => {
        const pct = Math.min((c.current / c.goal) * 100, 100)
        const daysLeft = Math.ceil((new Date(c.ends_at).getTime() - Date.now()) / 86400000)
        return (
          <div key={c.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, marginTop: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>🔥 {c.title}</div>
            {c.description && <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>{c.description}</div>}
            <XPBar current={c.current} max={c.goal} color="var(--green)" />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: 'var(--muted)' }}>
              <span>{c.current} / {c.goal}</span>
              <span style={{ color: 'var(--green)' }}>{pct.toFixed(0)}% · noch {daysLeft} Tage</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
