import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'

export const revalidate = 60

export default async function InvestorPortalPage() {
  const supabase = createClient()
  const [{ data: projects }, { data: payments }, { data: risks }] = await Promise.all([
    supabase.from('projects').select('*, client:clients(name)').in('stage', ['in_construction','pre_construction','handover']).order('budget_usd', { ascending: false }),
    supabase.from('payments').select('*, project:projects(name)').not('status', 'eq', 'scheduled').order('due_date').limit(8),
    supabase.from('risks').select('*, project:projects(name)').eq('is_resolved', false).order('risk_score', { ascending: false }).limit(4),
  ])

  const totalPortfolio = (projects ?? []).reduce((s, p) => s + p.budget_usd, 0)
  const totalSpent = (projects ?? []).reduce((s, p) => s + p.spent_usd, 0)
  const onSchedule = (projects ?? []).filter(p => p.completion_pct >= 30).length
  const nextPayment = (payments ?? []).find(p => p.status === 'upcoming')

  const statusClass: Record<string, string> = { paid: 'badge-green', upcoming: 'badge-amber', overdue: 'badge-red', pending_permit: 'badge-grey' }

  return (
    <div>
      {/* Banner with share link */}
      <div style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent-line)', padding: '10px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#4a9eff" strokeWidth="1.5"><circle cx="7" cy="7" r="6"/><line x1="7" y1="5" x2="7" y2="7"/><circle cx="7" cy="9.5" r="0.6" fill="#4a9eff"/></svg>
          <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px', color: 'var(--accent)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            INTERNAL VIEW — Staff dashboard · {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
        </div>
        <Link href="/investor" target="_blank" style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '5px 14px',
          background: 'rgba(74,158,255,0.15)',
          border: '1px solid rgba(74,158,255,0.4)',
          color: 'var(--accent)',
          fontFamily: 'var(--font-space-mono)',
          fontSize: '9px',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          textDecoration: 'none',
        }}>
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 2H2v8h8V7M7 1h4v4M11 1L5 7"/></svg>
          Share Investor Portal
        </Link>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '20px' }} className="stat-grid-responsive">
        <div className="stat-card"><div className="text-label">Portfolio Value</div><div className="stat-value text-accent" style={{ marginTop: '6px', fontSize: '26px' }}>{formatCurrency(totalPortfolio)}</div><div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '4px' }}>{projects?.length} active projects</div></div>
        <div className="stat-card"><div className="text-label">Capital Deployed</div><div className="stat-value" style={{ marginTop: '6px', fontSize: '26px' }}>{formatCurrency(totalSpent)}</div><div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '4px' }}>{totalPortfolio > 0 ? Math.round(totalSpent/totalPortfolio*100) : 0}% of committed</div></div>
        <div className="stat-card"><div className="text-label">On Schedule</div><div className="stat-value text-green" style={{ marginTop: '6px' }}>{onSchedule}/{projects?.length}</div></div>
        <div className="stat-card"><div className="text-label">Next Milestone Payment</div><div className="stat-value text-amber" style={{ marginTop: '6px', fontSize: '24px' }}>{nextPayment ? formatCurrency(nextPayment.amount_usd) : '—'}</div><div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '4px' }}>{nextPayment ? `${(nextPayment as any).project?.name} · ${formatDate(nextPayment.due_date)}` : 'None upcoming'}</div></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }} className="grid-responsive">
        {/* Project progress */}
        <div className="panel">
          <div className="panel-header">
            <div><div className="panel-title">PROJECT PROGRESS REPORTS</div><div className="panel-sub">Live status · All active projects</div></div>
          </div>
          <div className="panel-body">
            {(projects ?? []).map((p, i) => (
              <div key={p.id} style={{ marginBottom: i < (projects?.length ?? 0) - 1 ? '18px' : 0, paddingBottom: i < (projects?.length ?? 0) - 1 ? '18px' : 0, borderBottom: i < (projects?.length ?? 0) - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <Link href={'/dashboard/pipeline/' + p.id} style={{ fontSize: '12px', fontWeight: 600, color: 'var(--cream)', textDecoration: 'none' }}>{p.name}</Link>
                  <span className={`badge ${p.completion_pct >= 60 ? 'badge-green' : p.completion_pct >= 20 ? 'badge-blue' : 'badge-amber'}`}>
                    {p.completion_pct >= 60 ? 'On Track' : p.completion_pct >= 20 ? 'In Progress' : 'Early Stage'}
                  </span>
                </div>
                <div style={{ fontSize: '10px', color: 'var(--muted-2)', marginBottom: '8px' }}>
                  {p.island} · {p.type.replace('_',' ')} · {formatCurrency(p.budget_usd)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="progress-wrap" style={{ flex: 1 }}>
                    <div className={`progress-fill ${p.completion_pct >= 60 ? 'progress-green' : 'progress-accent'}`} style={{ width: `${p.completion_pct}%` }} />
                  </div>
                  <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px', color: 'var(--muted-2)' }}>{p.completion_pct}%</span>
                </div>
              </div>
            ))}
            {!(projects?.length) && <div style={{ color: 'var(--muted)', textAlign: 'center', padding: '20px' }}>No active projects</div>}
          </div>
        </div>

        {/* Payment schedule */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="panel">
            <div className="panel-header"><div><div className="panel-title">PAYMENT SCHEDULE</div><div className="panel-sub">Upcoming disbursements</div></div></div>
            <div className="table-scroll">
              <table className="data-table">
                <thead><tr><th>Milestone</th><th>Project</th><th>Amount</th><th>Due</th><th>Status</th></tr></thead>
                <tbody>
                  {(payments ?? []).map(p => (
                    <tr key={p.id}>
                      <td className="strong">{p.title}</td>
                      <td style={{ color: 'var(--muted-2)' }}>{(p as any).project?.name}</td>
                      <td style={{ fontFamily: 'var(--font-space-mono)', fontSize: '11px' }}>{formatCurrency(p.amount_usd)}</td>
                      <td style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px' }}>{formatDate(p.due_date)}</td>
                      <td><span className={`badge ${statusClass[p.status as string] ?? 'badge-grey'}`}>{(p.status as string).replace('_',' ')}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Risk summary */}
          <div className="panel">
            <div className="panel-header"><div><div className="panel-title">RISK SUMMARY</div><div className="panel-sub">Active flags for investor awareness</div></div></div>
            <div style={{ padding: '10px 12px' }}>
              {(risks ?? []).map(r => (
                <div key={r.id} className={`alert-item ${r.risk_score >= 12 ? 'alert-red' : r.risk_score >= 6 ? 'alert-amber' : 'alert-blue'}`}>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--cream)' }}>{r.title}</div>
                    <div style={{ fontSize: '10px', color: 'var(--muted-2)', marginTop: '1px' }}>{r.description}</div>
                  </div>
                </div>
              ))}
              {!risks?.length && (
                <div className="alert-item alert-green"><div style={{ fontSize: '11px', color: 'var(--cream)' }}>No active risk flags</div></div>
              )}
            </div>
          </div>
        </div>
      </div>
      <style>{`@media(max-width:900px){.stat-grid-responsive{grid-template-columns:1fr 1fr!important;}.grid-responsive{grid-template-columns:1fr!important;}}`}</style>
    </div>
  )
}
