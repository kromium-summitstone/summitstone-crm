import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/utils'

// Public investor portal - no auth required, read-only view
export const revalidate = 300 // refresh every 5 minutes

export default async function PublicInvestorPortal() {
  const supabase = createClient()
  const [{ data: projects }, { data: payments }, { data: risks }, { data: milestones }] = await Promise.all([
    supabase.from('projects').select('*, client:clients(name)').in('stage', ['in_construction', 'pre_construction', 'handover']).order('budget_usd', { ascending: false }),
    supabase.from('payments').select('*, project:projects(name)').in('status', ['upcoming', 'overdue']).order('due_date').limit(10),
    supabase.from('risks').select('*, project:projects(name)').eq('is_resolved', false).gte('risk_score', 6).order('risk_score', { ascending: false }).limit(6),
    supabase.from('milestones').select('*, project:projects(name, island)').eq('is_active', true).limit(10),
  ])

  const totalPortfolio = (projects ?? []).reduce((s, p) => s + (p.budget_usd ?? 0), 0)
  const totalSpent = (projects ?? []).reduce((s, p) => s + (p.spent_usd ?? 0), 0)
  const avgCompletion = projects && projects.length > 0
    ? Math.round(projects.reduce((s, p) => s + (p.completion_pct ?? 0), 0) / projects.length)
    : 0

  const statusClass: Record<string, string> = {
    upcoming: 'badge-amber', overdue: 'badge-red', paid: 'badge-green', scheduled: 'badge-grey'
  }
  const stageLabel: Record<string, string> = {
    pre_construction: 'Pre-Construction', in_construction: 'In Construction',
    handover: 'Handover', completed: 'Completed', lead: 'Lead', proposal: 'Proposal'
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--black)',
      color: 'var(--cream)',
      fontFamily: "'Space Grotesk', sans-serif",
    }}>
      {/* Google Fonts */}
      <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Grotesk:wght@400;500;600&family=Space+Mono&display=swap" rel="stylesheet" />

      {/* Header */}
      <header style={{
        borderBottom: '1px solid var(--border)',
        padding: '0 40px',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--surface)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <polygon points="14,2 26,22 2,22" fill="none" stroke="rgba(244,242,238,0.9)" strokeWidth="1.4" strokeLinejoin="miter"/>
            <line x1="0" y1="25" x2="28" y2="25" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="square"/>
            <line x1="5" y1="25" x2="5" y2="27.5" stroke="var(--accent)" strokeWidth="0.9" strokeLinecap="square"/>
            <line x1="14" y1="25" x2="14" y2="28" stroke="var(--accent)" strokeWidth="0.9" strokeLinecap="square"/>
            <line x1="23" y1="25" x2="23" y2="27.5" stroke="var(--accent)" strokeWidth="0.9" strokeLinecap="square"/>
          </svg>
          <div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '18px', letterSpacing: '3px', color: 'var(--cream)', lineHeight: 1 }}>SUMMITSTONE</div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '7px', letterSpacing: '2px', color: 'var(--accent)', opacity: 0.8 }}>INVESTOR REPORTING PORTAL</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            padding: '4px 12px',
            background: 'var(--green-dim)',
            border: '1px solid rgba(46,204,138,0.25)',
            fontFamily: "'Space Mono', monospace",
            fontSize: '8px',
            color: 'var(--green)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}>
            ● Live Data
          </div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '8px', color: 'var(--muted)', letterSpacing: '0.1em' }}>
            {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()}
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px' }}>

        {/* Hero KPIs */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', letterSpacing: '3px', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '8px' }}>
            Portfolio Summary
          </div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '44px', letterSpacing: '0.04em', color: 'var(--cream)', lineHeight: 1, marginBottom: '24px' }}>
            Active Construction Portfolio
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            {[
              { label: 'Total Portfolio Value', value: formatCurrency(totalPortfolio), sub: `${projects?.length ?? 0} active projects`, color: 'var(--accent)' },
              { label: 'Capital Deployed', value: formatCurrency(totalSpent), sub: `${totalPortfolio > 0 ? Math.round(totalSpent / totalPortfolio * 100) : 0}% of committed`, color: 'var(--cream)' },
              { label: 'Avg. Completion', value: `${avgCompletion}%`, sub: 'Across active portfolio', color: avgCompletion >= 50 ? 'var(--green)' : 'var(--amber)' },
              { label: 'Remaining Budget', value: formatCurrency(totalPortfolio - totalSpent), sub: 'Uncommitted capital', color: 'var(--green)' },
            ].map(({ label, value, sub, color }) => (
              <div key={label} style={{
                padding: '20px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
              }}>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '8px', color: 'var(--muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px' }}>{label}</div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '32px', color, lineHeight: 1 }}>{value}</div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px', color: 'var(--muted)', marginTop: '4px' }}>{sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Project Cards */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '22px', letterSpacing: '0.06em', color: 'var(--cream)', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
            Project Progress Reports
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            {(projects ?? []).map(p => {
              const remaining = p.budget_usd - p.spent_usd
              const burnPct = p.budget_usd > 0 ? Math.round(p.spent_usd / p.budget_usd * 100) : 0
              const isAtRisk = burnPct > p.completion_pct + 5
              return (
                <div key={p.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--cream)', marginBottom: '4px' }}>{p.name}</div>
                      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '8px', color: 'var(--muted)', letterSpacing: '0.1em' }}>
                        {p.island} · {p.type?.replace(/_/g, ' ')} · {p.contract_type?.replace(/_/g, ' ')}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <span style={{
                        padding: '3px 10px',
                        background: isAtRisk ? 'rgba(255,77,77,0.1)' : 'rgba(46,204,138,0.1)',
                        border: `1px solid ${isAtRisk ? 'var(--red)' : 'var(--green)'}`,
                        fontFamily: "'Space Mono', monospace",
                        fontSize: '8px',
                        color: isAtRisk ? 'var(--red)' : 'var(--green)',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                      }}>
                        {isAtRisk ? 'At Risk' : 'On Track'}
                      </span>
                      <span style={{
                        padding: '3px 10px',
                        background: 'var(--accent-dim)',
                        border: '1px solid rgba(74,158,255,0.25)',
                        fontFamily: "'Space Mono', monospace",
                        fontSize: '8px',
                        color: 'var(--accent)',
                        letterSpacing: '0.08em',
                      }}>
                        {stageLabel[p.stage] ?? p.stage}
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '8px', color: 'var(--muted)', letterSpacing: '0.08em' }}>COMPLETION</span>
                      <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '18px', color: p.completion_pct >= 60 ? 'var(--green)' : 'var(--amber)', lineHeight: 1 }}>{p.completion_pct}%</span>
                    </div>
                    <div style={{ height: '6px', background: 'var(--border)', borderRadius: '1px', overflow: 'hidden' }}>
                      <div style={{ width: `${p.completion_pct}%`, height: '100%', background: p.completion_pct >= 60 ? 'var(--green)' : 'var(--accent)', transition: 'width 0.4s' }} />
                    </div>
                  </div>

                  {/* Financials grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    {[
                      ['Contract Value', formatCurrency(p.budget_usd), 'var(--cream)'],
                      ['Spent to Date', formatCurrency(p.spent_usd), burnPct > p.completion_pct + 5 ? 'var(--red)' : 'var(--cream)'],
                      ['Remaining', formatCurrency(remaining), remaining < 0 ? 'var(--red)' : 'var(--green)'],
                    ].map(([label, value, color]) => (
                      <div key={label as string} style={{ padding: '8px', background: 'var(--surface-2)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '7px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '3px' }}>{label}</div>
                        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: color as string }}>{value as string}</div>
                      </div>
                    ))}
                  </div>

                  {/* Timeline */}
                  {(p.start_date || p.target_end_date) && (
                    <div style={{ marginTop: '10px', display: 'flex', gap: '12px', fontFamily: "'Space Mono', monospace", fontSize: '8px', color: 'var(--muted)' }}>
                      {p.start_date && <span>Start: {formatDate(p.start_date)}</span>}
                      {p.target_end_date && <span>Target: {formatDate(p.target_end_date)}</span>}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Milestone & Payments grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '40px' }}>
          {/* Active milestones */}
          <div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '22px', letterSpacing: '0.06em', color: 'var(--cream)', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
              Active Milestones
            </div>
            {(milestones ?? []).map(m => (
              <div key={m.id} style={{ padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)', flexShrink: 0, marginTop: '4px' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', color: 'var(--cream)', fontWeight: 500, marginBottom: '2px' }}>{m.title}</div>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '8px', color: 'var(--muted)' }}>
                    {m.project?.name} · Target: {formatDate(m.target_date)}
                  </div>
                </div>
              </div>
            ))}
            {!(milestones?.length) && (
              <div style={{ color: 'var(--muted)', fontSize: '12px', padding: '20px 0' }}>No active milestones</div>
            )}
          </div>

          {/* Payment schedule */}
          <div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '22px', letterSpacing: '0.06em', color: 'var(--cream)', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
              Payment Schedule
            </div>
            {(payments ?? []).map(p => (
              <div key={p.id} style={{ padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--cream)', fontWeight: 500, marginBottom: '2px' }}>{p.title}</div>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '8px', color: 'var(--muted)' }}>
                    {(p as any).project?.name} · {formatDate(p.due_date)}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '11px', color: 'var(--cream)' }}>{formatCurrency(p.amount_usd)}</span>
                  <span style={{
                    padding: '2px 8px',
                    background: p.status === 'overdue' ? 'rgba(255,77,77,0.1)' : 'rgba(245,166,35,0.1)',
                    border: `1px solid ${p.status === 'overdue' ? 'var(--red)' : 'var(--amber)'}`,
                    fontFamily: "'Space Mono', monospace",
                    fontSize: '8px',
                    color: p.status === 'overdue' ? '#ff4d4d' : '#f5a623',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}>
                    {p.status}
                  </span>
                </div>
              </div>
            ))}
            {!(payments?.length) && (
              <div style={{ color: 'var(--muted)', fontSize: '12px', padding: '20px 0' }}>No upcoming payments</div>
            )}
          </div>
        </div>

        {/* Risk flags */}
        {risks && risks.length > 0 && (
          <div style={{ marginBottom: '40px' }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '22px', letterSpacing: '0.06em', color: 'var(--cream)', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
              Active Risk Flags
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              {risks.map(r => (
                <div key={r.id} style={{
                  padding: '14px 16px',
                  background: r.risk_score >= 12 ? 'rgba(255,77,77,0.06)' : 'rgba(245,166,35,0.06)',
                  border: `1px solid ${r.risk_score >= 12 ? 'rgba(255,77,77,0.2)' : 'rgba(245,166,35,0.2)'}`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--cream)' }}>{r.title}</span>
                    <span style={{
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: '20px',
                      color: r.risk_score >= 12 ? '#ff4d4d' : '#f5a623',
                      lineHeight: 1,
                    }}>{r.risk_score}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--muted-2)', lineHeight: 1.6 }}>{r.description}</div>
                  {r.project && (
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '8px', color: 'var(--muted)', marginTop: '6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {r.project.name}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <footer style={{ borderTop: '1px solid var(--border)', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '8px', color: 'var(--muted)', letterSpacing: '0.1em' }}>
            SUMMITSTONE DEVELOPMENTS LTD · CONFIDENTIAL INVESTOR REPORT<br />
            Data refreshed every 5 minutes · All figures in USD unless stated
          </div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '8px', color: 'var(--muted)' }}>
            {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </div>
        </footer>
      </main>
    </div>
  )
}
