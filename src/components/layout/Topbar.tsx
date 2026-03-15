'use client'

import { usePathname } from 'next/navigation'
import { useTheme } from '@/components/providers/ThemeProvider'
import type { Profile } from '@/types'

const pageTitles: Record<string, { title: string; sub: string }> = {
  '/dashboard': { title: 'DASHBOARD', sub: 'Construction Operations Overview' },
  '/dashboard/pipeline/new': { title: 'NEW PROJECT', sub: 'Add project to pipeline' },
  '/dashboard/pipeline': { title: 'PROJECT PIPELINE', sub: 'Lead tracking · Active builds · Handover' },
  '/dashboard/budget': { title: 'BUDGET & FORECASTING', sub: 'Multi-currency · Cost control · Variance tracking' },
  '/dashboard/payments': { title: 'PAYMENT SCHEDULES', sub: 'Milestone disbursements · All contracts' },
  '/dashboard/changeorders': { title: 'CHANGE ORDERS', sub: 'CO log · Approvals · Audit trail' },
  '/dashboard/procurement': { title: 'PROCUREMENT', sub: 'Multi-island import tracking · All shipments' },
  '/dashboard/contractors': { title: 'CONTRACTORS', sub: 'Performance intelligence · Regional network · Trade comparison' },
  '/dashboard/sitelogs': { title: 'SITE LOGS', sub: 'Daily field documentation' },
  '/dashboard/permits': { title: 'PERMITS & APPROVALS', sub: 'Government workflows · All jurisdictions' },
  '/dashboard/investor': { title: 'INVESTOR PORTAL', sub: 'Remote reporting · Portfolio overview' },
  '/dashboard/risk': { title: 'RISK HEATMAP', sub: 'Project risk matrix · Live exposure tracking' },
  '/dashboard/documents': { title: 'DOCUMENTS', sub: 'Role-based access · Secure storage' },
  '/dashboard/rfis': { title: 'RFIs & SUBMITTALS', sub: 'Requests for Information · Shop drawings · Approval tracking' },
  '/dashboard/safety': { title: 'SAFETY COMPLIANCE', sub: 'Incident register · Site checklist · Caribbean OSHA' },
  '/dashboard/feasibility': { title: 'FEASIBILITY & ROI ENGINE', sub: 'Development appraisal · Caribbean benchmarks · Multi-currency' },
  '/dashboard/clients': { title: 'CLIENTS', sub: 'Developer & investor directory · Portfolio overview' },
  '/dashboard/reports': { title: 'CLIENT REPORTS', sub: 'Progress reports · Financial summaries · PDF export' },
}

export default function Topbar({ profile }: { profile: Profile | null }) {
  const pathname = usePathname()
  const { theme, toggle } = useTheme()
  const meta = pageTitles[pathname] ?? { title: pathname.split('/').pop()?.toUpperCase() ?? 'CRM', sub: '' }
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()

  return (
    <header style={{
      height: '52px',
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
      gap: '16px',
      flexShrink: 0,
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: 'var(--font-bebas)', fontSize: '20px', letterSpacing: '2px', color: 'var(--cream)', lineHeight: 1 }}>
          {meta.title}
        </div>
        <div style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px', letterSpacing: '0.15em', color: 'var(--muted)', textTransform: 'uppercase', marginTop: '1px' }} className="hide-mobile">
          {meta.sub}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px', color: 'var(--muted)', letterSpacing: '0.1em' }} className="hide-mobile">
          {dateStr}
        </span>
        <button
          onClick={toggle}
          className="theme-toggle"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? '☀' : '☾'}
        </button>
      </div>

      <style>{`
        @media (max-width: 600px) {
          .hide-mobile { display: none; }
        }
        @media (max-width: 900px) {
          header { padding: 0 12px 0 54px !important; }
        }
      `}</style>
    </header>
  )
}
