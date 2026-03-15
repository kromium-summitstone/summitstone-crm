'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'

const PROJECTS_PER_PAGE = 6

const stageLabel: Record<string, string> = {
  pre_construction: 'Pre-Construction', in_construction: 'In Construction',
  handover: 'Handover', completed: 'Completed', lead: 'Lead', proposal: 'Proposal',
}

export default function PublicInvestorPortal() {
  const [projects, setProjects] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [risks, setRisks] = useState<any[]>([])
  const [milestones, setMilestones] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [islandFilter, setIslandFilter] = useState('all')
  const [stageFilter, setStageFilter] = useState('active')
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const [{ data: projs }, { data: pays }, { data: rs }, { data: ms }] = await Promise.all([
        supabase.from('projects').select('*, client:clients(name)').order('budget_usd', { ascending: false }),
        supabase.from('payments').select('*, project:projects(name)').in('status', ['upcoming', 'overdue']).order('due_date').limit(12),
        supabase.from('risks').select('*, project:projects(name)').eq('is_resolved', false).gte('risk_score', 6).order('risk_score', { ascending: false }).limit(6),
        supabase.from('milestones').select('*, project:projects(name, island)').eq('is_active', true).limit(12),
      ])
      setProjects(projs ?? [])
      setPayments(pays ?? [])
      setRisks(rs ?? [])
      setMilestones(ms ?? [])
      setLoading(false)
    }
    load()
  }, [])

  // Filtered projects
  const filtered = projects.filter(p => {
    if (islandFilter !== 'all' && p.island !== islandFilter) return false
    if (stageFilter === 'active') return ['in_construction', 'pre_construction', 'handover'].includes(p.stage)
    if (stageFilter === 'completed') return p.stage === 'completed'
    return true
  })

  const totalPages = Math.ceil(filtered.length / PROJECTS_PER_PAGE)
  const paginated = filtered.slice(page * PROJECTS_PER_PAGE, (page + 1) * PROJECTS_PER_PAGE)

  const activeProjects = projects.filter(p => ['in_construction', 'pre_construction', 'handover'].includes(p.stage))
  const totalPortfolio = activeProjects.reduce((s, p) => s + (p.budget_usd ?? 0), 0)
  const totalSpent = activeProjects.reduce((s, p) => s + (p.spent_usd ?? 0), 0)
  const avgCompletion = activeProjects.length > 0
    ? Math.round(activeProjects.reduce((s, p) => s + (p.completion_pct ?? 0), 0) / activeProjects.length)
    : 0

  const islands = ['all', ...Array.from(new Set(projects.map(p => p.island))).sort()]

  const s = {
    mono: { fontFamily: "'Space Mono', monospace" } as React.CSSProperties,
    bebas: { fontFamily: "'Bebas Neue', sans-serif" } as React.CSSProperties,
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--black)', color: 'var(--cream)', fontFamily: "'Space Grotesk', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Grotesk:wght@400;500;600&family=Space+Mono&display=swap" rel="stylesheet" />

      {/* Header */}
      <header style={{ borderBottom: '1px solid var(--border)', padding: '0 40px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <polygon points="14,2 26,22 2,22" fill="none" stroke="var(--cream)" strokeWidth="1.4" strokeLinejoin="miter"/>
            <line x1="0" y1="25" x2="28" y2="25" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="square"/>
            <line x1="5" y1="25" x2="5" y2="27.5" stroke="var(--accent)" strokeWidth="0.9" strokeLinecap="square"/>
            <line x1="14" y1="25" x2="14" y2="28" stroke="var(--accent)" strokeWidth="0.9" strokeLinecap="square"/>
            <line x1="23" y1="25" x2="23" y2="27.5" stroke="var(--accent)" strokeWidth="0.9" strokeLinecap="square"/>
          </svg>
          <div>
            <div style={{ ...s.bebas, fontSize: '18px', letterSpacing: '3px', color: 'var(--cream)', lineHeight: 1 }}>SUMMITSTONE</div>
            <div style={{ ...s.mono, fontSize: '7px', letterSpacing: '2px', color: 'var(--accent)', opacity: 0.8 }}>INVESTOR REPORTING PORTAL</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '4px 12px', background: 'var(--green-dim)', border: '1px solid rgba(46,204,138,0.25)', ...s.mono, fontSize: '8px', color: 'var(--green)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            ● Live Data
          </div>
          <div style={{ ...s.mono, fontSize: '8px', color: 'var(--muted)', letterSpacing: '0.1em' }}>
            {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()}
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px' }}>

        {/* Hero KPIs */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{ ...s.mono, fontSize: '9px', letterSpacing: '3px', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '8px' }}>Portfolio Summary</div>
          <div style={{ ...s.bebas, fontSize: '44px', letterSpacing: '0.04em', color: 'var(--cream)', lineHeight: 1, marginBottom: '24px' }}>Active Construction Portfolio</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }} className="kpi-grid-resp">
            {[
              { label: 'Active Portfolio Value', value: formatCurrency(totalPortfolio), sub: `${activeProjects.length} active projects`, color: 'var(--accent)' },
              { label: 'Capital Deployed', value: formatCurrency(totalSpent), sub: `${totalPortfolio > 0 ? Math.round(totalSpent / totalPortfolio * 100) : 0}% of committed`, color: 'var(--cream)' },
              { label: 'Avg. Completion', value: `${avgCompletion}%`, sub: 'Across active portfolio', color: avgCompletion >= 50 ? 'var(--green)' : 'var(--amber)' },
              { label: 'Remaining Budget', value: formatCurrency(totalPortfolio - totalSpent), sub: 'Uncommitted capital', color: 'var(--green)' },
            ].map(({ label, value, sub, color }) => (
              <div key={label} style={{ padding: '20px', background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div style={{ ...s.mono, fontSize: '8px', color: 'var(--muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px' }}>{label}</div>
                <div style={{ ...s.bebas, fontSize: '32px', color, lineHeight: 1 }}>{value}</div>
                <div style={{ ...s.mono, fontSize: '9px', color: 'var(--muted)', marginTop: '4px' }}>{sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Project Cards with pagination */}
        <div style={{ marginBottom: '40px' }}>
          {/* Section header + filters */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '20px' }}>
            <div style={{ ...s.bebas, fontSize: '22px', letterSpacing: '0.06em', color: 'var(--cream)' }}>
              Project Progress Reports
              <span style={{ ...s.mono, fontSize: '10px', color: 'var(--muted)', marginLeft: '12px', letterSpacing: '0.1em' }}>
                {filtered.length} project{filtered.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {/* Stage filter */}
              {['active', 'completed', 'all'].map(s2 => (
                <button key={s2} onClick={() => { setStageFilter(s2); setPage(0) }} style={{
                  padding: '5px 12px', cursor: 'pointer',
                  background: stageFilter === s2 ? 'var(--accent)' : 'var(--surface-2)',
                  border: `1px solid ${stageFilter === s2 ? 'var(--accent)' : 'var(--border-mid)'}`,
                  color: stageFilter === s2 ? '#fff' : 'var(--muted-2)',
                  fontFamily: "'Space Mono', monospace", fontSize: '8px', letterSpacing: '0.1em', textTransform: 'uppercase',
                }}>
                  {s2 === 'active' ? 'Active' : s2 === 'completed' ? 'Completed' : 'All'}
                </button>
              ))}
              {/* Island filter */}
              <select value={islandFilter} onChange={e => { setIslandFilter(e.target.value); setPage(0) }} style={{
                background: 'var(--surface-2)', border: '1px solid var(--border-mid)', color: 'var(--muted-2)',
                fontFamily: "'Space Mono', monospace", fontSize: '8px', padding: '5px 10px', cursor: 'pointer',
                letterSpacing: '0.08em', textTransform: 'uppercase',
              }}>
                <option value="all">All Islands</option>
                <option value="BRB">Barbados</option>
                <option value="KYD">Cayman Islands</option>
                <option value="JAM">Jamaica</option>
                <option value="TTD">Trinidad & Tobago</option>
              </select>
            </div>
          </div>

          {loading && (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)', ...s.mono, fontSize: '10px', letterSpacing: '0.12em' }}>
              LOADING PORTFOLIO DATA...
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }} className="proj-grid-resp">
            {paginated.map(p => {
              const remaining = p.budget_usd - p.spent_usd
              const burnPct = p.budget_usd > 0 ? Math.round(p.spent_usd / p.budget_usd * 100) : 0
              const isAtRisk = burnPct > p.completion_pct + 5
              return (
                <Link key={p.id} href={`/investor/${p.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                  <div style={{
                    background: 'var(--surface)', border: '1px solid var(--border)', padding: '20px',
                    cursor: 'pointer', transition: 'border-color 0.15s',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent-line)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <div style={{ ...s.mono, fontSize: '8px', color: 'var(--muted)', letterSpacing: '0.1em', marginBottom: '4px' }}>
                          {p.code ?? ''} · {p.island} · {p.type?.replace(/_/g, ' ')}
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--cream)', marginBottom: '2px' }}>{p.name}</div>
                        {p.client?.name && <div style={{ ...s.mono, fontSize: '8px', color: 'var(--muted)', letterSpacing: '0.06em' }}>{p.client.name}</div>}
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <span style={{
                          padding: '3px 8px',
                          background: isAtRisk ? 'var(--red-dim)' : 'var(--green-dim)',
                          border: `1px solid ${isAtRisk ? 'var(--red)' : 'var(--green)'}`,
                          ...s.mono, fontSize: '8px',
                          color: isAtRisk ? 'var(--red)' : 'var(--green)',
                          letterSpacing: '0.1em', textTransform: 'uppercase',
                        }}>
                          {isAtRisk ? 'At Risk' : 'On Track'}
                        </span>
                        <span style={{ padding: '3px 8px', background: 'var(--accent-dim)', border: '1px solid var(--accent-line)', ...s.mono, fontSize: '8px', color: 'var(--accent)', letterSpacing: '0.08em' }}>
                          {stageLabel[p.stage] ?? p.stage}
                        </span>
                      </div>
                    </div>

                    {/* Progress */}
                    <div style={{ marginBottom: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ ...s.mono, fontSize: '8px', color: 'var(--muted)', letterSpacing: '0.08em' }}>COMPLETION</span>
                        <span style={{ ...s.bebas, fontSize: '18px', color: p.completion_pct >= 60 ? 'var(--green)' : 'var(--amber)', lineHeight: 1 }}>{p.completion_pct}%</span>
                      </div>
                      <div style={{ height: '5px', background: 'var(--surface-3)', overflow: 'hidden' }}>
                        <div style={{ width: `${p.completion_pct}%`, height: '100%', background: p.completion_pct >= 60 ? 'var(--green)' : 'var(--accent)', transition: 'width 0.4s' }} />
                      </div>
                    </div>

                    {/* Financials */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '6px', marginBottom: '10px' }}>
                      {[
                        ['Contract', formatCurrency(p.budget_usd), 'var(--muted-2)'],
                        ['Spent', formatCurrency(p.spent_usd), burnPct > p.completion_pct + 5 ? 'var(--red)' : 'var(--cream)'],
                        ['Remaining', formatCurrency(remaining), remaining < 0 ? 'var(--red)' : 'var(--green)'],
                      ].map(([label, value, color]) => (
                        <div key={label as string} style={{ padding: '6px 8px', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                          <div style={{ ...s.mono, fontSize: '7px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2px' }}>{label}</div>
                          <div style={{ ...s.mono, fontSize: '9px', color: color as string }}>{value as string}</div>
                        </div>
                      ))}
                    </div>

                    {/* Timeline + View link */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        {p.start_date && <span style={{ ...s.mono, fontSize: '8px', color: 'var(--muted)' }}>Start: {formatDate(p.start_date)}</span>}
                        {p.target_end_date && <span style={{ ...s.mono, fontSize: '8px', color: 'var(--muted)' }}>Target: {formatDate(p.target_end_date)}</span>}
                      </div>
                      <span style={{ ...s.mono, fontSize: '8px', color: 'var(--accent)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                        View Details →
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '24px' }}>
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} style={{
                padding: '6px 14px', background: page === 0 ? 'var(--surface-2)' : 'var(--surface)',
                border: '1px solid var(--border-mid)', color: page === 0 ? 'var(--muted)' : 'var(--cream)',
                ...s.mono, fontSize: '9px', cursor: page === 0 ? 'not-allowed' : 'pointer', letterSpacing: '0.08em',
              }}>← Prev</button>

              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i} onClick={() => setPage(i)} style={{
                  width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: page === i ? 'var(--accent)' : 'var(--surface)',
                  border: `1px solid ${page === i ? 'var(--accent)' : 'var(--border-mid)'}`,
                  color: page === i ? '#fff' : 'var(--muted-2)',
                  ...s.mono, fontSize: '10px', cursor: 'pointer',
                }}>
                  {i + 1}
                </button>
              ))}

              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1} style={{
                padding: '6px 14px', background: page === totalPages - 1 ? 'var(--surface-2)' : 'var(--surface)',
                border: '1px solid var(--border-mid)', color: page === totalPages - 1 ? 'var(--muted)' : 'var(--cream)',
                ...s.mono, fontSize: '9px', cursor: page === totalPages - 1 ? 'not-allowed' : 'pointer', letterSpacing: '0.08em',
              }}>Next →</button>

              <span style={{ ...s.mono, fontSize: '9px', color: 'var(--muted)', marginLeft: '8px' }}>
                {page * PROJECTS_PER_PAGE + 1}–{Math.min((page + 1) * PROJECTS_PER_PAGE, filtered.length)} of {filtered.length}
              </span>
            </div>
          )}
        </div>

        {/* Milestones & Payments */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '40px' }} className="two-col-resp">
          <div>
            <div style={{ ...s.bebas, fontSize: '22px', letterSpacing: '0.06em', color: 'var(--cream)', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>Active Milestones</div>
            {milestones.map(m => (
              <div key={m.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border)', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)', flexShrink: 0, marginTop: '4px' }} />
                <div style={{ flex: 1 }}>
                  <Link href={`/investor/${m.project_id}`} style={{ fontSize: '12px', color: 'var(--cream)', fontWeight: 500, textDecoration: 'none' }}>{m.title}</Link>
                  <div style={{ ...s.mono, fontSize: '8px', color: 'var(--muted)', marginTop: '2px' }}>
                    {m.project?.name} · Target: {formatDate(m.target_date)}
                  </div>
                </div>
              </div>
            ))}
            {!milestones.length && <div style={{ color: 'var(--muted)', fontSize: '12px', padding: '16px 0' }}>No active milestones</div>}
          </div>

          <div>
            <div style={{ ...s.bebas, fontSize: '22px', letterSpacing: '0.06em', color: 'var(--cream)', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>Payment Schedule</div>
            {payments.map(p => (
              <div key={p.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Link href={`/investor/${p.project_id}`} style={{ fontSize: '12px', color: 'var(--cream)', fontWeight: 500, textDecoration: 'none' }}>{p.title}</Link>
                  <div style={{ ...s.mono, fontSize: '8px', color: 'var(--muted)', marginTop: '2px' }}>{(p as any).project?.name} · {formatDate(p.due_date)}</div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ ...s.mono, fontSize: '11px', color: 'var(--cream)' }}>{formatCurrency(p.amount_usd)}</span>
                  <span style={{
                    padding: '2px 7px', ...s.mono, fontSize: '8px', letterSpacing: '0.08em', textTransform: 'uppercase',
                    background: p.status === 'overdue' ? 'var(--red-dim)' : 'var(--amber-dim)',
                    border: `1px solid ${p.status === 'overdue' ? 'var(--red)' : 'var(--amber)'}`,
                    color: p.status === 'overdue' ? 'var(--red)' : 'var(--amber)',
                  }}>{p.status}</span>
                </div>
              </div>
            ))}
            {!payments.length && <div style={{ color: 'var(--muted)', fontSize: '12px', padding: '16px 0' }}>No upcoming payments</div>}
          </div>
        </div>

        {/* Risk flags */}
        {risks.length > 0 && (
          <div style={{ marginBottom: '40px' }}>
            <div style={{ ...s.bebas, fontSize: '22px', letterSpacing: '0.06em', color: 'var(--cream)', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>Active Risk Flags</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '12px' }} className="proj-grid-resp">
              {risks.map(r => (
                <div key={r.id} style={{ padding: '14px 16px', background: r.risk_score >= 12 ? 'var(--red-dim)' : 'var(--amber-dim)', border: `1px solid ${r.risk_score >= 12 ? 'rgba(255,77,77,0.25)' : 'rgba(245,166,35,0.2)'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--cream)' }}>{r.title}</span>
                    <span style={{ ...s.bebas, fontSize: '22px', color: r.risk_score >= 12 ? 'var(--red)' : 'var(--amber)', lineHeight: 1 }}>{r.risk_score}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--muted-2)', lineHeight: 1.6 }}>{r.description}</div>
                  {r.project && (
                    <Link href={`/investor/${r.project_id}`} style={{ ...s.mono, fontSize: '8px', color: 'var(--accent)', marginTop: '6px', display: 'block', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {r.project.name} →
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <footer style={{ borderTop: '1px solid var(--border)', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ ...s.mono, fontSize: '8px', color: 'var(--muted)', letterSpacing: '0.1em' }}>
            SUMMITSTONE DEVELOPMENTS LTD · CONFIDENTIAL INVESTOR REPORT<br />
            Data refreshed on page load · All figures in USD unless stated
          </div>
          <div style={{ ...s.mono, fontSize: '8px', color: 'var(--muted)' }}>
            {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </div>
        </footer>
      </main>

      <style>{`
        @media(max-width:800px){.kpi-grid-resp{grid-template-columns:1fr 1fr!important;}.proj-grid-resp{grid-template-columns:1fr!important;}.two-col-resp{grid-template-columns:1fr!important;}}
        @media(max-width:480px){.kpi-grid-resp{grid-template-columns:1fr!important;}}
      `}</style>
    </div>
  )
}
