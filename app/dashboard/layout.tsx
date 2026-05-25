'use client'
import { usePathname, useRouter } from 'next/navigation'
import { signOut } from '@/lib/api'

const NAV = [
  { href: '/dashboard', icon: '◉', label: 'Dashboard' },
  { href: '/dashboard/tasks', icon: '◈', label: 'Aufgaben' },
  { href: '/dashboard/team', icon: '◎', label: 'Team' },
  { href: '/dashboard/gamification', icon: '◆', label: 'Rangliste' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    await signOut()
    router.push('/login')
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <aside style={{ width: 220, background: 'var(--surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', padding: '24px 0', flexShrink: 0 }}>
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid var(--border)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #6c63ff, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, color: '#fff' }}>TF</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>TaskFlow</div>
            <div style={{ fontSize: 10, color: 'var(--muted)' }}>PRO · v1.0</div>
          </div>
        </div>

        {NAV.map(n => {
          const active = pathname === n.href
          return (
            <a key={n.href} href={n.href} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px', background: active ? '#6c63ff18' : 'transparent', borderLeft: active ? '3px solid var(--accent)' : '3px solid transparent', color: active ? 'var(--text)' : 'var(--muted)', fontSize: 13, fontWeight: active ? 600 : 400, transition: 'all 0.2s' }}>
              <span>{n.icon}</span>{n.label}
            </a>
          )
        })}

        <div style={{ flex: 1 }} />
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
          <button onClick={handleSignOut} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted)', cursor: 'pointer', fontSize: 12 }}>← Abmelden</button>
        </div>
      </aside>

      <main style={{ flex: 1, overflowY: 'auto', padding: 28 }}>
        {children}
      </main>
    </div>
  )
}
