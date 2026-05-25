'use client'
import { useEffect, useState } from 'react'
import { fetchDashboardKPIs, fetchWeeklyActivity, fetchTasks } from '@/lib/api'

const CATEGORY_COLORS: Record<string, string> = {
  'Vertrieb': '#6c63ff', 'Produktion': '#ff8c42', 'Kundenservice': '#00d4aa',
  'IT': '#4ecdc4', 'Lager': '#ffd166', 'Marketing': '#ff6b9d',
}

function XPBar({ current, max, color = 'var(--accent)' }: { current: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min((current / max) * 100, 100) : 0
  return (
    <div style={{ width: '100%', height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', borderRadius: 3, background: color, transition: 'width 0.8s ease' }} />
    </div>
  )
}

export default function DashboardPage() {
  const [kpis, setKpis] = useState<any>(null)
  const [week, setWeek] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([fetchDashboardKPIs(), fetchWeeklyActivity(), fetchTasks()])
      .then(([k, w, t]) => { setKpis(k); setWeek(w); setTasks(t); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const maxWeek = Math.max(...week.map(d => d.value), 1)
  const catStats = Object.keys(CATEGORY_COLORS).map(cat => ({
    cat,
    count: tasks.filter((t: any) => t.category === cat).length,
    done: tasks.filter((t: any) => t.category === cat && t.status === 'Erledigt').length,
  })).filter(c => c.count > 0)

  const kpiCards = [
    { label: 'Erledigt', value: kpis?.done ?? '–', color: 'var(--green)', icon: '✅' },
    { label: 'In Bearbeitung', value: kpis?.in_progress ?? '–', color: 'var(--accent)', icon: '⚡' },
    { label: 'Überfällig', value: kpis?.overdue ?? '–', color: 'var(--red)', icon: '⚠️' },
    { label: 'Offen', value: kpis?.open ?? '–', color: 'var(--yellow)', icon: '📋' },
  ]

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--muted)' }}>Lade Dashboard...</div>

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em' }}>Dashboard</h1>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>{new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        {kpiCards.map((k, i) => (
          <div key={i} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -16, right: -10, fontSize: 52, opacity: 0.07 }}>{k.icon}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>{k.label}</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: k.color, letterSpacing: '-0.03em' }}>{k.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Wochenaktivität</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80 }}>
            {week.map((d, i) => {
              const h = Math.max(Math.round((d.value / maxWeek) * 64), 2)
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 9, color: 'var(--muted)' }}>{d.value || ''}</span>
                  <div style={{ width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', height: 64 }}>
                    <div style={{ width: '70%', height: h, borderRadius: 3, background: 'var(--accent)' }} />
                  </div>
                  <span style={{ fontSize: 9, color: 'var(--muted)' }}>{d.day}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Bereiche</div>
          {catStats.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 13 }}>Noch keine Aufgaben</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {catStats.map((c, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: 'var(--muted)' }}>{c.cat}</span>
                  <span style={{ color: CATEGORY_COLORS[c.cat] }}>{c.done}/{c.count}</span>
                </div>
                <XPBar current={c.done} max={c.count} color={CATEGORY_COLORS[c.cat]} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
