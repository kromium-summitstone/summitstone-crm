'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Profile } from '@/types'

const navItems = [
  { section: 'Overview', items: [
    { href: '/dashboard', label: 'Dashboard', icon: 'grid' },
    { href: '/dashboard/pipeline', label: 'Project Pipeline', icon: 'pipeline' },
    { href: '/dashboard/clients', label: 'Clients', icon: 'clients' },
  ]},
  { section: 'Financials', items: [
    { href: '/dashboard/budget', label: 'Budget & Forecasting', icon: 'budget' },
    { href: '/dashboard/payments', label: 'Payment Schedules', icon: 'payments' },
    { href: '/dashboard/changeorders', label: 'Change Orders', icon: 'changeorders' },
  ]},
  { section: 'Operations', items: [
    { href: '/dashboard/procurement', label: 'Procurement', icon: 'box' },
    { href: '/dashboard/contractors', label: 'Contractors', icon: 'user' },
    { href: '/dashboard/sitelogs', label: 'Site Logs', icon: 'file' },
  ]},
  { section: 'Caribbean Ops', items: [
    { href: '/dashboard/permits', label: 'Permits & Approvals', icon: 'star' },
    { href: '/dashboard/investor', label: 'Investor Portal', icon: 'chart' },
    { href: '/dashboard/risk', label: 'Risk Heatmap', icon: 'alert' },
  ]},
  { section: 'Assets', items: [
    { href: '/dashboard/documents', label: 'Documents', icon: 'doc' },
  ]},
]

const icons: Record<string, React.ReactNode> = {
  grid: <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="1" width="6" height="6"/><rect x="9" y="1" width="6" height="6"/><rect x="1" y="9" width="6" height="6"/><rect x="9" y="9" width="6" height="6" opacity="0.4"/></svg>,
  pipeline: <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="3" cy="8" r="2"/><circle cx="8" cy="8" r="2"/><circle cx="13" cy="8" r="2"/><line x1="5" y1="8" x2="6" y2="8"/><line x1="10" y1="8" x2="11" y2="8"/></svg>,
  budget: <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="3" width="14" height="10" rx="1"/><line x1="1" y1="6" x2="15" y2="6"/><line x1="4" y1="10" x2="7" y2="10"/></svg>,
  payments: <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="8" y1="1" x2="8" y2="15"/><path d="M5 4h4.5a2.5 2.5 0 010 5H5"/><path d="M5 9h5a2.5 2.5 0 010 5H5"/></svg>,
  changeorders: <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 8h9M8 5l3 3-3 3"/><path d="M14 4v8" strokeDasharray="1.5 1.5"/></svg>,
  box: <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="8" width="12" height="7"/><path d="M5 8V5a3 3 0 016 0v3"/></svg>,
  user: <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="5" r="3"/><path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6"/></svg>,
  file: <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="1" width="10" height="14" rx="1"/><line x1="6" y1="5" x2="10" y2="5"/><line x1="6" y1="8" x2="10" y2="8"/><line x1="6" y1="11" x2="8" y2="11"/></svg>,
  star: <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 1l1.8 3.6L14 5.6l-3 2.9.7 4.1L8 10.5l-3.7 2.1.7-4.1-3-2.9 4.2-.4z"/></svg>,
  chart: <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="1,12 5,7 9,9 15,3"/><polyline points="11,3 15,3 15,7"/></svg>,
  alert: <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 1l7 14H1z"/><line x1="8" y1="6" x2="8" y2="10"/><circle cx="8" cy="12" r="0.8" fill="currentColor"/></svg>,
  doc: <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 1H3a1 1 0 00-1 1v12a1 1 0 001 1h10a1 1 0 001-1V6z"/><polyline points="9,1 9,6 14,6"/></svg>,
  clients: <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="5" cy="5" r="2.5"/><circle cx="11" cy="5" r="2.5"/><path d="M0 13c0-2.5 2.2-4.5 5-4.5s5 2 5 4.5"/><path d="M11 8.5c2.8 0 5 2 5 4.5" opacity="0.5"/></svg>,
}

export default function Sidebar({ profile }: { profile: Profile | null }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  function toggleMobileSidebar() {
    const sidebar = document.getElementById('crm-sidebar')
    const backdrop = document.getElementById('sidebar-backdrop')
    sidebar?.classList.toggle('open')
    backdrop?.classList.toggle('show')
    backdrop?.addEventListener('click', () => {
      sidebar?.classList.remove('open')
      backdrop?.classList.remove('show')
    }, { once: true })
  }

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="mobile-nav-toggle"
        onClick={toggleMobileSidebar}
        aria-label="Open navigation"
      >
        <span/><span/><span/>
      </button>

      <aside id="crm-sidebar" style={{
        width: 'var(--sidebar-w)',
        background: '#111',
        borderRight: '1px solid rgba(255,255,255,0.07)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
        position: 'fixed',
        left: 0, top: 0, bottom: 0,
        zIndex: 160,
        transition: 'transform 0.25s',
      }}>
        {/* Logo */}
        <div style={{ padding: '18px 18px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '3px' }}>
            <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
              <polygon points="14,2 26,22 2,22" fill="none" stroke="rgba(244,242,238,0.9)" strokeWidth="1.4" strokeLinejoin="miter"/>
              <line x1="14" y1="8" x2="14" y2="21.5" stroke="rgba(244,242,238,0.2)" strokeWidth="0.7" strokeDasharray="1.2 2"/>
              <line x1="0" y1="25" x2="28" y2="25" stroke="#4a9eff" strokeWidth="1.8" strokeLinecap="square"/>
              <line x1="5" y1="25" x2="5" y2="27.5" stroke="#4a9eff" strokeWidth="0.9" strokeLinecap="square"/>
              <line x1="14" y1="25" x2="14" y2="28" stroke="#4a9eff" strokeWidth="0.9" strokeLinecap="square"/>
              <line x1="23" y1="25" x2="23" y2="27.5" stroke="#4a9eff" strokeWidth="0.9" strokeLinecap="square"/>
            </svg>
            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '16px', letterSpacing: '2px', color: '#f4f2ee' }}>SUMMITSTONE</span>
          </div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '7px', letterSpacing: '3px', color: '#4a9eff', opacity: 0.8, paddingLeft: '36px' }}>CONSTRUCTION OS</div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', paddingBottom: '8px' }}>
          {navItems.map(section => (
            <div key={section.section}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '8px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(244,242,238,0.4)', padding: '14px 18px 5px' }}>
                {section.section}
              </div>
              {section.items.map(item => {
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
                return (
                  <Link key={item.href} href={item.href} style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '8px 18px',
                    borderLeft: `2px solid ${isActive ? '#4a9eff' : 'transparent'}`,
                    background: isActive ? 'rgba(74,158,255,0.1)' : 'transparent',
                    color: isActive ? '#f4f2ee' : 'rgba(244,242,238,0.65)',
                    textDecoration: 'none',
                    fontSize: '12px',
                    fontWeight: 500,
                    transition: 'all 0.15s',
                  }}>
                    {icons[item.icon]}
                    <span style={{ flex: 1 }}>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <div style={{
            width: '30px', height: '30px',
            background: 'rgba(74,158,255,0.12)',
            border: '1px solid rgba(74,158,255,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Space Mono', monospace",
            fontSize: '10px', color: '#4a9eff', fontWeight: 700, flexShrink: 0,
          }}>
            {profile?.avatar_initials ?? profile?.full_name?.slice(0,2).toUpperCase() ?? 'SS'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#f4f2ee', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {profile?.full_name ?? 'User'}
            </div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '8px', color: 'rgba(244,242,238,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {profile?.role ?? 'viewer'}
            </div>
          </div>
          <button onClick={handleSignOut} title="Sign out" style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'rgba(244,242,238,0.4)', padding: '4px', display: 'flex', alignItems: 'center',
          }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 14H2V2h4M11 11l3-3-3-3M14 8H6"/>
            </svg>
          </button>
        </div>
      </aside>

      <style>{`
        @media (max-width: 900px) {
          #crm-sidebar { transform: translateX(-100%); }
          #crm-sidebar.open { transform: translateX(0); box-shadow: 4px 0 24px rgba(0,0,0,0.7); }
          #main-content { margin-left: 0 !important; }
        }
      `}</style>
    </>
  )
}
