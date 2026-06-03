'use client'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

const NAV = [
  { href: '/dashboard', icon: '◉', label: 'Dashboard' },
  { href: '/dashboard/tasks', icon: '◈', label: 'Aufgaben' },
  { href: '/dashboard/team', icon: '◎', label: 'Team' },
  { href: '/dashboard/gamification', icon: '◆', label: 'Rangliste' },
]

const ADMIN_NAV = [
  { href: '/dashboard/admin', icon: '⚙', label: 'Team verwalten' },
  { href: '/dashboard/teams', icon: '◫', label: 'Abteilungen' },
  { href: '/dashboard/categories', icon: '⊞', label: 'Kategorien' },
  { href: '/dashboard/settings', icon: '🏢', label: 'Unternehmen' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [profile, setProfile] = useState<any>(null)
  const [tenant, setTenant] = useState<any>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    createClient().auth.getUser().then(async ({ data }: any) => {
      if (data.user) {
        const [profRes, tenantRes] = await Promise.all([
          fetch('/api/profiles'),
          fetch('/api/tenant')
        ])
        const profiles = await profRes.json()
        const tenantData = await tenantRes.json()
        const me = profiles.find((p: any) => p.id === data.user.id)
        setProfile(me)
        setTenant(tenantData)
      }
    })
  }, [])

  async function handleSignOut() {
    await createClient().auth.signOut()
    window.location.href = '/login'
  }

  const isAdmin = profile?.role === 'admin'

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>

        {/* Mobile Header — Option B: Logo prominent oben */}
        <header style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', flexShrink: 0, zIndex: 10 }}>
          {/* Obere Zeile: Unternehmens-Branding */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: tenant?.name ? '1px solid var(--border)' : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Unternehmens-Logo groß */}
              <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                {tenant?.logo_url
                  ? <img src={tenant.logo_url} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 2 }} />
                  : <span style={{ fontSize: 24 }}>🏢</span>
                }
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, lineHeight: 1.2 }}>{tenant?.name || 'Ihr Unternehmen'}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 14, height: 14, borderRadius: 3, background: 'linear-gradient(135deg, #6c63ff, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 900, color: '#fff' }}>TF</div>
                  <span style={{ fontSize: 10, color: 'var(--muted)' }}>powered by TaskFlow</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {profile && (
                <div style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'right' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: 11 }}>{profile.full_name}</div>
                  <div style={{ fontSize: 10 }}>{profile.role} · {profile.abteilung || '—'}</div>
                </div>
              )}
              <button onClick={() => setMenuOpen(!menuOpen)} style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid var(--border)', background: menuOpen ? 'var(--accent)' : 'transparent', color: menuOpen ? '#fff' : 'var(--muted)', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                ☰
              </button>
            </div>
          </div>
        </header>

        {menuOpen && (
          <div style={{ position: 'absolute', top: 68, right: 8, zIndex: 100, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 8, minWidth: 200, boxShadow: '0 8px 32px #00000044' }}>
            {isAdmin && (
              <>
                <div style={{ fontSize: 10, color: 'var(--muted)', padding: '6px 14px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Admin</div>
                {ADMIN_NAV.map(n => (
                  <a key={n.href} href={n.href} onClick={() => setMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 8, background: pathname === n.href ? 'var(--accent)22' : 'transparent', color: pathname === n.href ? 'var(--accent)' : 'var(--text)', fontSize: 14, fontWeight: pathname === n.href ? 600 : 400, textDecoration: 'none' }}>
                    <span>{n.icon}</span>{n.label}
                  </a>
                ))}
                <div style={{ margin: '8px 0', borderTop: '1px solid var(--border)' }} />
              </>
            )}
            <button onClick={handleSignOut} style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: 'none', background: 'transparent', color: 'var(--red)', cursor: 'pointer', fontSize: 14, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10 }}>
              ← Abmelden
            </button>
          </div>
        )}

        <main style={{ flex: 1, overflowY: 'auto', padding: '16px', paddingBottom: 80 }} onClick={() => menuOpen && setMenuOpen(false)}>
          {children}
        </main>

        <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--surface)', borderTop: '1px solid var(--border)', display: 'flex', zIndex: 50, paddingBottom: 'env(safe-area-inset-bottom)' }}>
          {NAV.map(n => {
            const active = pathname === n.href
            return (
              <a key={n.href} href={n.href} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10px 4px', color: active ? 'var(--accent)' : 'var(--muted)', fontSize: 10, fontWeight: active ? 700 : 400, gap: 4, transition: 'color 0.2s', textDecoration: 'none' }}>
                <span style={{ fontSize: 20 }}>{n.icon}</span>
                <span>{n.label}</span>
              </a>
            )
          })}
        </nav>
      </div>
    )
  }

  // Desktop Layout
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <aside style={{ width: 220, background: 'var(--surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', padding: '20px 0', flexShrink: 0 }}>

        {/* Unternehmens-Branding oben — Option B */}
        <div style={{ padding: '0 16px 16px', borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
          {/* Unternehmens-Logo + Name prominent */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
              {tenant?.logo_url
                ? <img src={tenant.logo_url} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 4 }} />
                : <span style={{ fontSize: 24 }}>🏢</span>
              }
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tenant?.name || 'Ihr Unternehmen'}</div>
              <div style={{ fontSize: 10, color: 'var(--muted)' }}>Ihr Unternehmen</div>
            </div>
          </div>

          {/* TaskFlow klein darunter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 8, background: 'var(--bg)', border: '1px solid var(--border)' }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, background: 'linear-gradient(135deg, #6c63ff, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 900, color: '#fff', flexShrink: 0 }}>TF</div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700 }}>TaskFlow</div>
              <div style={{ fontSize: 9, color: 'var(--muted)' }}>PRO · v1.0</div>
            </div>
          </div>
        </div>

        {NAV.map(n => {
          const active = pathname === n.href
          return (
            <a key={n.href} href={n.href} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px', background: active ? '#6c63ff18' : 'transparent', borderLeft: active ? '3px solid var(--accent)' : '3px solid transparent', color: active ? 'var(--text)' : 'var(--muted)', fontSize: 13, fontWeight: active ? 600 : 400, transition: 'all 0.2s', textDecoration: 'none' }}>
              <span>{n.icon}</span>{n.label}
            </a>
          )
        })}

        {isAdmin && (
          <>
            <div style={{ margin: '12px 20px 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              <span style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Admin</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>
            {ADMIN_NAV.map(n => {
              const active = pathname === n.href
              return (
                <a key={n.href} href={n.href} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px', background: active ? '#6c63ff18' : 'transparent', borderLeft: active ? '3px solid var(--accent)' : '3px solid transparent', color: active ? 'var(--text)' : 'var(--muted)', fontSize: 13, fontWeight: active ? 600 : 400, transition: 'all 0.2s', textDecoration: 'none' }}>
                  <span>{n.icon}</span>{n.label}
                </a>
              )
            })}
          </>
        )}

        <div style={{ flex: 1 }} />

        {profile && (
          <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{profile.full_name}</div>
            <div style={{ fontSize: 10, color: 'var(--muted)' }}>{profile.role} · {profile.abteilung || '—'}</div>
          </div>
        )}

        <div style={{ padding: '0 20px' }}>
          <button onClick={handleSignOut} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted)', cursor: 'pointer', fontSize: 12 }}>← Abmelden</button>
        </div>
      </aside>

      <main style={{ flex: 1, overflowY: 'auto', padding: 28 }}>
        {children}
      </main>
    </div>
  )
}
