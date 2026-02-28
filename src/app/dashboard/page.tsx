import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatCurrency, formatShortDate, ISLAND_LABELS, getStatusVariant } from '@/lib/utils'
import type { Project } from '@/types'

export const revalidate = 60

export default async function DashboardPage() {
  const supabase = createClient()

  const [
    { data: projects },
    { data: activity },
    { data: overduePermits },
    { data: pendingCOs },
    { data: overduePayments },
    { data: shipments },
  ] = await Promise.all([
    supabase.from('projects').select('*, client:clients(name)').in('stage', ['lead','proposal','pre_construction','in_construction','handover']).order('created_at', { ascending: false }),
    supabase.from('activity_log').select('*, project:projects(name)').order('created_at', { ascending: false }).limit(6),
    supabase.from('permits').select('*, project:projects(name,island)').eq('status', 'overdue'),
    supabase.from('change_orders').select('*, project:projects(name)').eq('status', 'pending').limit(3),
    supabase.from('payments').select('*, project:projects(name)').eq('status', 'overdue'),
    supabase.from('shipments').select('*, project:projects(name)').not('status', 'eq', 'delivered').order('eta_date').limit(4),
  ])

  const activeProjects = (projects ?? []).filter(p => p.stage === 'in_construction' || p.stage === 'pre_construction')
  const totalBudget = (projects ?? []).reduce((s, p) => s + (p.budget_usd ?? 0), 0)
  const onSchedule = activeProjects.filter(p => p.completion_pct >= 30).length

  const islandTotals: Record<string, { budget: number; count: number }> = {}
  for (const p of projects ?? []) {
    if (!islandTotals[p.island]) islandTotals[p.island] = { budget: 0, count: 0 }
    islandTotals[p.island].budget += p.budget_usd ?? 0
    islandTotals[p.island].count += 1
  }

  const statusVariantMap: Record<string, string> = {
    green: 'badge-green', amber: 'badge-amber', red: 'badge-red', blue: 'badge-blue', grey: 'badge-grey'
  }

  return (
    <div>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }} className="stat-grid-responsive">
        <div className="stat-card">
          <div className="text-label">Active Projects</div>
          <div className="stat-value text-accent" style={{ marginTop: '6px' }}>{activeProjects.length}</div>
          <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '4px' }}>Across {Object.keys(islandTotals).length} island markets</div>
        </div>
        <div className="stat-card">
          <div className="text-label">Total Budget Under Mgmt</div>
          <div className="stat-value" style={{ marginTop: '6px', fontSize: '28px' }}>{formatCurrency(totalBudget)}</div>
          <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '4px' }}>{(projects ?? []).length} total projects</div>
        </div>
        <div className="stat-card">
          <div className="text-label">On-Schedule Projects</div>
          <div className="stat-value text-green" style={{ marginTop: '6px' }}>{onSchedule}/{activeProjects.length}</div>
          <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '4px' }}>{activeProjects.length > 0 ? Math.round(onSchedule / activeProjects.length * 100) : 0}% delivery rate</div>
        </div>
        <div className="stat-card">
          <div className="text-label">Pending Actions</div>
          <div className="stat-value text-amber" style={{ marginTop: '6px' }}>
            {(overduePermits?.length ?? 0) + (pendingCOs?.length ?? 0) + (overduePayments?.length ?? 0)}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '4px' }}>
            {overduePermits?.length ?? 0} permits · {overduePayments?.length ?? 0} payments overdue
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '12px', marginBottom: '12px' }} className="grid-responsive">
        {/* Active Projects Table */}
        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="panel-title">ACTIVE PROJECTS</div>
              <div className="panel-sub">All islands · Live tracking</div>
            </div>
            <Link href="/dashboard/pipeline" className="panel-action">View Pipeline →</Link>
          </div>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Island</th>
                  <th>Budget</th>
                  <th>Progress</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(projects ?? []).filter(p => ['in_construction','pre_construction'].includes(p.stage)).slice(0,6).map(p => {
                  const variant = p.completion_pct >= 60 ? 'green' : p.completion_pct >= 30 ? 'blue' : 'amber'
                  return (
                    <tr key={p.id}>
                      <td className="strong">
                        <Link href={`/dashboard/pipeline?project=${p.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                          {p.name}
                        </Link>
                      </td>
                      <td><span className={`badge badge-blue`}>{p.island}</span></td>
                      <td>{formatCurrency(p.budget_usd)}</td>
                      <td>
                        <div style={{ minWidth: '80px' }}>
                          <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px' }}>{p.completion_pct}%</span>
                          <div className="progress-wrap" style={{ marginTop: '3px' }}>
                            <div className={`progress-fill progress-${variant}`} style={{ width: `${p.completion_pct}%` }} />
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge badge-${p.stage === 'in_construction' ? 'green' : 'amber'}`}>
                          {p.stage === 'in_construction' ? 'Active' : 'Pre-Const'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
                {(projects ?? []).filter(p => ['in_construction','pre_construction'].includes(p.stage)).length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--muted)', padding: '20px' }}>No active projects</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Alerts */}
          <div className="panel">
            <div className="panel-header">
              <div><div className="panel-title">ALERTS</div><div className="panel-sub">Requires attention</div></div>
            </div>
            <div style={{ padding: '10px 12px' }}>
              {(overduePermits ?? []).map(p => (
                <div key={p.id} className="alert-item alert-red">
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--cream)' }}>Permit Overdue — {p.project?.name}</div>
                    <div style={{ fontSize: '10px', color: 'var(--muted-2)', marginTop: '1px' }}>{p.title} · {p.authority}</div>
                  </div>
                </div>
              ))}
              {(pendingCOs ?? []).map(co => (
                <div key={co.id} className="alert-item alert-amber">
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--cream)' }}>Change Order Pending — {co.project?.name}</div>
                    <div style={{ fontSize: '10px', color: 'var(--muted-2)', marginTop: '1px' }}>{co.co_number} · {formatCurrency(co.value_usd)}</div>
                  </div>
                </div>
              ))}
              {(overduePayments ?? []).map(p => (
                <div key={p.id} className="alert-item alert-red">
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--cream)' }}>Payment Overdue — {p.project?.name}</div>
                    <div style={{ fontSize: '10px', color: 'var(--muted-2)', marginTop: '1px' }}>{p.title} · {formatCurrency(p.amount_usd)} due {formatShortDate(p.due_date)}</div>
                  </div>
                </div>
              ))}
              {(overduePermits?.length ?? 0) + (pendingCOs?.length ?? 0) + (overduePayments?.length ?? 0) === 0 && (
                <div className="alert-item alert-green">
                  <div style={{ fontSize: '11px', color: 'var(--cream)' }}>No critical alerts — all systems operational</div>
                </div>
              )}
            </div>
          </div>

          {/* Activity */}
          <div className="panel" style={{ flex: 1 }}>
            <div className="panel-header">
              <div className="panel-title">RECENT ACTIVITY</div>
            </div>
            <div style={{ padding: '0 14px' }}>
              {(activity ?? []).map(a => (
                <div key={a.id} style={{ display: 'flex', gap: '10px', padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
                  <div className="activity-dot" style={{ background: a.entity_type === 'site_log' ? 'var(--green)' : a.entity_type === 'change_order' ? 'var(--amber)' : 'var(--accent)', marginTop: '5px' }} />
                  <div style={{ flex: 1, fontSize: '11px', color: 'var(--muted-2)', lineHeight: 1.6 }}>{a.action}</div>
                  <div style={{ fontFamily: 'var(--font-space-mono)', fontSize: '8px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                    {new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }} className="grid-responsive">
        {/* Islands */}
        <div className="panel">
          <div className="panel-header">
            <div><div className="panel-title">BUDGET BY ISLAND</div><div className="panel-sub">USD equivalent</div></div>
          </div>
          <div style={{ padding: '14px 16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              {(['BRB','KYD','JAM','TTD'] as const).map(island => (
                <div key={island} style={{
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  padding: '12px',
                  textAlign: 'center',
                }}>
                  <div style={{ fontFamily: 'var(--font-bebas)', fontSize: '22px', color: 'var(--cream)', lineHeight: 1 }}>{island}</div>
                  <div style={{ fontFamily: 'var(--font-space-mono)', fontSize: '7px', color: 'var(--muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: '3px' }}>{ISLAND_LABELS[island]}</div>
                  <div style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px', color: 'var(--accent)', marginTop: '6px' }}>
                    {islandTotals[island] ? `${formatCurrency(islandTotals[island].budget)} · ${islandTotals[island].count}p` : 'No projects'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Procurement snapshot */}
        <div className="panel">
          <div className="panel-header">
            <div><div className="panel-title">SHIPMENTS IN TRANSIT</div><div className="panel-sub">Active procurement · All islands</div></div>
            <Link href="/dashboard/procurement" className="panel-action">All →</Link>
          </div>
          <div className="table-scroll">
            <table className="data-table">
              <thead><tr><th>Ref</th><th>Material</th><th>Destination</th><th>ETA</th><th>Status</th></tr></thead>
              <tbody>
                {(shipments ?? []).map(s => {
                  const v = getStatusVariant(s.status)
                  return (
                    <tr key={s.id}>
                      <td style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px', color: 'var(--accent)' }}>{s.reference}</td>
                      <td className="strong">{s.material}</td>
                      <td><span className="badge badge-blue">{s.destination_island}</span></td>
                      <td style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px' }}>{formatShortDate(s.eta_date)}</td>
                      <td><span className={`badge badge-${v}`}>{s.status.replace('_', ' ')}</span></td>
                    </tr>
                  )
                })}
                {!shipments?.length && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--muted)', padding: '20px' }}>No active shipments</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .stat-grid-responsive { grid-template-columns: 1fr 1fr !important; }
          .grid-responsive { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 480px) {
          .stat-grid-responsive { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
