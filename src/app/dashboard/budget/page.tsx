'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, CURRENCY_RATES, convertCurrency } from '@/lib/utils'
import Link from 'next/link'

const CURRENCIES = Object.values(CURRENCY_RATES)

export default function BudgetPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currency, setCurrency] = useState('USD')
  const [tab, setTab] = useState<'portfolio' | 'forecast' | 'multicurrency'>('portfolio')
  const supabase = createClient()

  useEffect(() => {
    supabase.from('projects').select('*, client:clients(name)')
      .not('stage', 'eq', 'completed')
      .order('budget_usd', { ascending: false })
      .then(({ data }) => { setProjects(data ?? []); setLoading(false) })
  }, [])

  const rate = CURRENCY_RATES[currency]?.rate ?? 1
  const cvt = (n: number) => n * rate
  const fmtCurr = (n: number) => {
    if (currency === 'USD') return formatCurrency(n)
    return `${currency} ${Math.round(cvt(n)).toLocaleString()}`
  }

  const totalBudget = projects.reduce((s, p) => s + (p.budget_usd ?? 0), 0)
  const totalSpent = projects.reduce((s, p) => s + (p.spent_usd ?? 0), 0)
  const totalRemaining = totalBudget - totalSpent
  const overrunProjects = projects.filter(p => {
    const expected = (p.completion_pct / 100) * p.budget_usd
    return p.spent_usd > expected * 1.05
  })
  const overrunRisk = overrunProjects.reduce((s, p) => {
    const expected = (p.completion_pct / 100) * p.budget_usd
    return s + Math.max(0, p.spent_usd - expected)
  }, 0)

  // Forecast: project remaining spend based on burn rate
  const projectedFinalCost = projects.reduce((s, p) => {
    if (p.completion_pct === 0 || p.completion_pct === 100) return s + p.budget_usd
    const burnRate = p.spent_usd / (p.completion_pct / 100)
    return s + burnRate
  }, 0)
  const projectedOverrun = Math.max(0, projectedFinalCost - totalBudget)

  return (
    <div>
      {/* Top controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '2px', borderBottom: '1px solid var(--border)' }}>
          {(['portfolio', 'forecast', 'multicurrency'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: '8px 16px',
              fontFamily: 'var(--font-space-mono)', fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase',
              color: tab === t ? 'var(--cream)' : 'var(--muted)',
              borderBottom: `2px solid ${tab === t ? 'var(--accent)' : 'transparent'}`,
            }}>
              {t === 'portfolio' ? 'Portfolio View' : t === 'forecast' ? 'Cost Forecast' : 'Multi-Currency'}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px', color: 'var(--muted)', textTransform: 'uppercase' }}>Display in</span>
          <select className="form-select" style={{ width: 'auto', padding: '6px 10px' }} value={currency} onChange={e => setCurrency(e.target.value)}>
            {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} — {c.name}</option>)}
          </select>
        </div>
      </div>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '20px' }} className="stat-grid-responsive">
        <div className="stat-card">
          <div className="text-label">Total Portfolio Value</div>
          <div className="stat-value text-accent" style={{ marginTop: '6px', fontSize: '26px' }}>{fmtCurr(totalBudget)}</div>
          <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '4px' }}>{projects.length} active projects</div>
        </div>
        <div className="stat-card">
          <div className="text-label">Capital Deployed</div>
          <div className="stat-value" style={{ marginTop: '6px', fontSize: '26px' }}>{fmtCurr(totalSpent)}</div>
          <div style={{ marginTop: '8px' }}>
            <div className="progress-wrap">
              <div className="progress-fill progress-accent" style={{ width: `${Math.min(100, totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0)}%` }} />
            </div>
            <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '3px' }}>{totalBudget > 0 ? Math.round(totalSpent / totalBudget * 100) : 0}% of total budget</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="text-label">Remaining Budget</div>
          <div className="stat-value text-green" style={{ marginTop: '6px', fontSize: '26px' }}>{fmtCurr(totalRemaining)}</div>
          <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '4px' }}>Uncommitted capital</div>
        </div>
        <div className="stat-card">
          <div className="text-label">Projected Overrun Risk</div>
          <div className="stat-value text-amber" style={{ marginTop: '6px', fontSize: '26px' }}>{fmtCurr(projectedOverrun)}</div>
          <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '4px' }}>{overrunProjects.length} project{overrunProjects.length !== 1 ? 's' : ''} at risk</div>
        </div>
      </div>

      {/* ── Portfolio View ── */}
      {tab === 'portfolio' && (
        <div className="panel">
          <div className="panel-header">
            <div><div className="panel-title">PROJECT BUDGETS</div><div className="panel-sub">All values in {currency} · {CURRENCY_RATES[currency]?.rate !== 1 ? `Rate: 1 USD = ${CURRENCY_RATES[currency]?.rate} ${currency}` : 'Base currency'}</div></div>
          </div>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr><th>Project</th><th>Client</th><th>Contract</th><th>Budget</th><th>Spent</th><th>Remaining</th><th>Burn Rate</th><th>vs Expected</th><th>Status</th></tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={9} style={{ textAlign: 'center', padding: '20px', color: 'var(--muted)' }}>Loading...</td></tr>}
                {projects.map(p => {
                  const remaining = p.budget_usd - p.spent_usd
                  const burnPct = p.budget_usd > 0 ? (p.spent_usd / p.budget_usd) * 100 : 0
                  const expectedBurn = p.completion_pct
                  const isOver = burnPct > expectedBurn + 5
                  const isUnder = burnPct < expectedBurn - 5
                  const statusLabel = isOver ? 'At Risk' : isUnder ? 'Underspend' : 'On Budget'
                  const statusClass = isOver ? 'badge-red' : isUnder ? 'badge-blue' : 'badge-green'
                  return (
                    <tr key={p.id}>
                      <td className="strong">
                        <Link href={`/dashboard/pipeline/${p.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>{p.name}</Link>
                      </td>
                      <td style={{ color: 'var(--muted-2)', fontSize: '11px' }}>{p.client?.name ?? '—'}</td>
                      <td><span className={`badge ${p.contract_type === 'fixed' ? 'badge-blue' : 'badge-grey'}`}>{p.contract_type === 'fixed' ? 'Fixed' : p.contract_type.replace('_', '+')}</span></td>
                      <td style={{ fontFamily: 'var(--font-space-mono)', fontSize: '11px' }}>{fmtCurr(p.budget_usd)}</td>
                      <td style={{ fontFamily: 'var(--font-space-mono)', fontSize: '11px' }}>{fmtCurr(p.spent_usd)}</td>
                      <td style={{ fontFamily: 'var(--font-space-mono)', fontSize: '11px', color: remaining < 0 ? 'var(--red)' : 'var(--green)' }}>{fmtCurr(remaining)}</td>
                      <td>
                        <div style={{ minWidth: '80px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '8px', color: 'var(--muted)' }}>Spent {Math.round(burnPct)}%</span>
                            <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '8px', color: 'var(--muted)' }}>Done {p.completion_pct}%</span>
                          </div>
                          <div className="progress-wrap" style={{ marginTop: '2px' }}>
                            <div className={`progress-fill ${isOver ? 'progress-red' : isUnder ? 'progress-accent' : 'progress-green'}`} style={{ width: `${Math.min(100, burnPct)}%` }} />
                          </div>
                        </div>
                      </td>
                      <td style={{ fontFamily: 'var(--font-space-mono)', fontSize: '10px', color: isOver ? 'var(--red)' : isUnder ? 'var(--accent)' : 'var(--green)' }}>
                        {isOver ? `+${Math.round(burnPct - expectedBurn)}%` : isUnder ? `-${Math.round(expectedBurn - burnPct)}%` : '='}
                      </td>
                      <td><span className={`badge ${statusClass}`}>{statusLabel}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Cost Forecast ── */}
      {tab === 'forecast' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }} className="grid-responsive">
          <div className="panel">
            <div className="panel-header">
              <div><div className="panel-title">COST-TO-COMPLETION FORECAST</div><div className="panel-sub">Based on current burn rates</div></div>
            </div>
            <div className="panel-body">
              {projects.filter(p => p.completion_pct > 0 && p.completion_pct < 100).map(p => {
                const burnRate = p.completion_pct > 0 ? p.spent_usd / (p.completion_pct / 100) : p.budget_usd
                const remaining = burnRate - p.spent_usd
                const overrun = burnRate - p.budget_usd
                const pct = p.budget_usd > 0 ? Math.min(160, (burnRate / p.budget_usd) * 100) : 0
                return (
                  <div key={p.id} style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--cream)' }}>{p.name}</span>
                      <span className={`badge ${overrun > 0 ? 'badge-red' : 'badge-green'}`}>
                        {overrun > 0 ? `+${fmtCurr(overrun)} overrun` : 'On budget'}
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginBottom: '8px' }}>
                      {[
                        ['Contract', fmtCurr(p.budget_usd), 'var(--muted-2)'],
                        ['Projected Final', fmtCurr(burnRate), overrun > 0 ? 'var(--red)' : 'var(--green)'],
                        ['To Complete', fmtCurr(remaining), 'var(--accent)'],
                      ].map(([label, value, color]) => (
                        <div key={label as string} style={{ textAlign: 'center', padding: '6px', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                          <div style={{ fontFamily: 'var(--font-space-mono)', fontSize: '7px', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '2px' }}>{label}</div>
                          <div style={{ fontFamily: 'var(--font-space-mono)', fontSize: '10px', color: color as string }}>{value as string}</div>
                        </div>
                      ))}
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                        <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '8px', color: 'var(--muted)' }}>Projected vs Budget</span>
                        <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '8px', color: overrun > 0 ? 'var(--red)' : 'var(--green)' }}>{Math.round(pct)}%</span>
                      </div>
                      <div style={{ height: '6px', background: 'var(--surface-3)', borderRadius: '2px', overflow: 'hidden', position: 'relative' }}>
                        <div style={{ width: '100%', height: '100%', background: 'var(--green)', opacity: 0.3 }} />
                        <div style={{ position: 'absolute', top: 0, left: 0, width: `${Math.min(100, pct)}%`, height: '100%', background: overrun > 0 ? 'var(--red)' : 'var(--green)' }} />
                      </div>
                    </div>
                  </div>
                )
              })}
              {projects.filter(p => p.completion_pct > 0 && p.completion_pct < 100).length === 0 && (
                <div style={{ color: 'var(--muted)', textAlign: 'center', padding: '20px' }}>No active construction projects</div>
              )}
            </div>
          </div>

          <div className="panel">
            <div className="panel-header"><div className="panel-title">PORTFOLIO FORECAST SUMMARY</div></div>
            <div className="panel-body">
              {[
                ['Total Contract Value', fmtCurr(totalBudget), 'var(--muted-2)'],
                ['Capital Deployed', fmtCurr(totalSpent), 'var(--accent)'],
                ['Projected Final Cost', fmtCurr(projectedFinalCost), projectedOverrun > 0 ? 'var(--red)' : 'var(--green)'],
                ['Projected Overrun', projectedOverrun > 0 ? fmtCurr(projectedOverrun) : 'None', projectedOverrun > 0 ? 'var(--red)' : 'var(--green)'],
                ['Uncommitted Budget', fmtCurr(Math.max(0, totalBudget - totalSpent)), 'var(--amber)'],
              ].map(([label, value, color]) => (
                <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '10px', color: 'var(--muted-2)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</span>
                  <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '12px', color: color as string, fontWeight: 600 }}>{value as string}</span>
                </div>
              ))}
              <div style={{ marginTop: '14px' }}>
                <div style={{ fontFamily: 'var(--font-space-mono)', fontSize: '8px', color: 'var(--muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '6px' }}>Budget vs Projected Final</div>
                <div style={{ height: '20px', background: 'var(--surface-3)', borderRadius: '2px', overflow: 'hidden', position: 'relative' }}>
                  <div style={{
                    width: `${Math.min(100, totalBudget > 0 ? (projectedFinalCost / totalBudget) * 100 : 0)}%`,
                    height: '100%',
                    background: projectedOverrun > 0 ? 'var(--red)' : 'var(--green)',
                    transition: 'width 0.4s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '8px', color: '#fff', fontWeight: 600 }}>
                      {totalBudget > 0 ? Math.round((projectedFinalCost / totalBudget) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </div>
              <div style={{ marginTop: '16px', padding: '12px', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                <div style={{ fontFamily: 'var(--font-space-mono)', fontSize: '8px', color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>Management Fee Revenue Estimate</div>
                {[0.08, 0.10, 0.12, 0.15].map(pct => (
                  <div key={pct} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                    <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px', color: 'var(--muted)' }}>{(pct * 100).toFixed(0)}% fee on {fmtCurr(totalBudget)}</span>
                    <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '10px', color: 'var(--green)' }}>{fmtCurr(totalBudget * pct)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Multi-Currency ── */}
      {tab === 'multicurrency' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }} className="grid-responsive">
          <div className="panel">
            <div className="panel-header"><div className="panel-title">PORTFOLIO IN ALL CURRENCIES</div><div className="panel-sub">Total budget · Live conversion rates</div></div>
            <div className="panel-body">
              {CURRENCIES.map(({ code, name, rate }) => (
                <div key={code} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-bebas)', fontSize: '22px', color: 'var(--accent)', width: '50px' }}>{code}</span>
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--cream)', fontWeight: 500 }}>{name}</div>
                      <div style={{ fontFamily: 'var(--font-space-mono)', fontSize: '8px', color: 'var(--muted)' }}>1 USD = {rate} {code}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--font-space-mono)', fontSize: '14px', color: 'var(--green)', fontWeight: 600 }}>
                      {code === 'USD'
                        ? formatCurrency(totalBudget)
                        : `${code} ${Math.round(totalBudget * rate).toLocaleString()}`}
                    </div>
                    <div style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px', color: 'var(--muted)', marginTop: '2px' }}>
                      {code === 'USD'
                        ? `Spent: ${formatCurrency(totalSpent)}`
                        : `Spent: ${code} ${Math.round(totalSpent * rate).toLocaleString()}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panel-header"><div className="panel-title">ISLAND BUDGET BREAKDOWN</div><div className="panel-sub">By destination market · {currency}</div></div>
            <div className="panel-body">
              {(['BRB', 'KYD', 'JAM', 'TTD'] as const).map(island => {
                const islandProjects = projects.filter(p => p.island === island)
                const islandBudget = islandProjects.reduce((s, p) => s + (p.budget_usd ?? 0), 0)
                const islandSpent = islandProjects.reduce((s, p) => s + (p.spent_usd ?? 0), 0)
                const pct = totalBudget > 0 ? (islandBudget / totalBudget) * 100 : 0
                const labels = { BRB: 'Barbados', KYD: 'Cayman Islands', JAM: 'Jamaica', TTD: 'Trinidad & Tobago' }
                return (
                  <div key={island} style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ fontFamily: 'var(--font-bebas)', fontSize: '18px', color: 'var(--cream)' }}>{island}</span>
                        <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px', color: 'var(--muted)' }}>{labels[island]} · {islandProjects.length}p</span>
                      </div>
                      <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '11px', color: 'var(--accent)' }}>{fmtCurr(islandBudget)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '8px', color: 'var(--muted)' }}>{pct.toFixed(1)}% of portfolio</span>
                      <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '8px', color: 'var(--muted)' }}>Spent: {fmtCurr(islandSpent)}</span>
                    </div>
                    <div className="progress-wrap">
                      <div className="progress-fill progress-accent" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="panel" style={{ gridColumn: 'span 2' }}>
            <div className="panel-header"><div className="panel-title">PER-PROJECT MULTI-CURRENCY VIEW</div><div className="panel-sub">Budget equivalents · All Caribbean markets</div></div>
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Island</th>
                    {CURRENCIES.map(c => <th key={c.code}>{c.code}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {projects.map(p => (
                    <tr key={p.id}>
                      <td className="strong">{p.name}</td>
                      <td><span className="badge badge-blue">{p.island}</span></td>
                      {CURRENCIES.map(c => (
                        <td key={c.code} style={{ fontFamily: 'var(--font-space-mono)', fontSize: '10px', color: 'var(--muted-2)' }}>
                          {c.code === 'USD'
                            ? formatCurrency(p.budget_usd)
                            : `${Math.round(p.budget_usd * c.rate).toLocaleString()}`
                          }
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media(max-width:900px){.stat-grid-responsive{grid-template-columns:1fr 1fr!important;}.grid-responsive{grid-template-columns:1fr!important;}}
        @media(max-width:480px){.stat-grid-responsive{grid-template-columns:1fr!important;}}
      `}</style>
    </div>
  )
}
