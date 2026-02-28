import { createClient } from '@/lib/supabase/server'
import { formatCurrency, CURRENCY_RATES, convertCurrency } from '@/lib/utils'

export const revalidate = 60

export default async function BudgetPage() {
  const supabase = createClient()
  const { data: projects } = await supabase
    .from('projects')
    .select('*, client:clients(name)')
    .not('stage', 'eq', 'completed')
    .order('budget_usd', { ascending: false })

  const totalBudget = (projects ?? []).reduce((s, p) => s + (p.budget_usd ?? 0), 0)
  const totalSpent = (projects ?? []).reduce((s, p) => s + (p.spent_usd ?? 0), 0)
  const overrunProjects = (projects ?? []).filter(p => {
    const expectedSpent = (p.completion_pct / 100) * p.budget_usd
    return p.spent_usd > expectedSpent * 1.05
  })
  const overrunRisk = overrunProjects.reduce((s, p) => {
    const expectedSpent = (p.completion_pct / 100) * p.budget_usd
    return s + Math.max(0, p.spent_usd - expectedSpent)
  }, 0)

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }} className="stat-grid-responsive">
        <div className="stat-card">
          <div className="text-label">Total Portfolio Value</div>
          <div className="stat-value text-accent" style={{ marginTop: '6px', fontSize: '28px' }}>{formatCurrency(totalBudget)}</div>
          <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '4px' }}>{projects?.length} active projects</div>
        </div>
        <div className="stat-card">
          <div className="text-label">Spent To Date</div>
          <div className="stat-value" style={{ marginTop: '6px', fontSize: '28px' }}>{formatCurrency(totalSpent)}</div>
          <div style={{ marginTop: '8px' }}>
            <div className="progress-wrap">
              <div className="progress-fill progress-accent" style={{ width: `${Math.min(100, totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0)}%` }} />
            </div>
            <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '3px' }}>{totalBudget > 0 ? Math.round(totalSpent / totalBudget * 100) : 0}% of total budget</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="text-label">Projected Overrun Risk</div>
          <div className="stat-value text-amber" style={{ marginTop: '6px', fontSize: '28px' }}>{formatCurrency(overrunRisk)}</div>
          <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '4px' }}>{overrunProjects.length} project{overrunProjects.length !== 1 ? 's' : ''} tracking over budget</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '12px' }} className="grid-responsive">
        {/* Projects table */}
        <div className="panel">
          <div className="panel-header">
            <div><div className="panel-title">PROJECT BUDGETS</div><div className="panel-sub">Fixed price & cost-plus contracts</div></div>
          </div>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr><th>Project</th><th>Contract</th><th>Budget</th><th>Spent</th><th>Remaining</th><th>Burn</th><th>Status</th></tr>
              </thead>
              <tbody>
                {(projects ?? []).map(p => {
                  const remaining = p.budget_usd - p.spent_usd
                  const burnPct = p.budget_usd > 0 ? (p.spent_usd / p.budget_usd) * 100 : 0
                  const expectedBurn = p.completion_pct
                  const isOver = burnPct > expectedBurn + 5
                  const isUnder = burnPct < expectedBurn - 5
                  const statusLabel = isOver ? 'At Risk' : isUnder ? 'Underspend' : 'On Budget'
                  const statusClass = isOver ? 'badge-red' : isUnder ? 'badge-blue' : 'badge-green'
                  return (
                    <tr key={p.id}>
                      <td className="strong">{p.name}</td>
                      <td><span className={`badge ${p.contract_type === 'fixed' ? 'badge-blue' : 'badge-grey'}`}>{p.contract_type === 'fixed' ? 'Fixed' : 'Cost+'}</span></td>
                      <td style={{ fontFamily: 'var(--font-space-mono)', fontSize: '11px' }}>{formatCurrency(p.budget_usd)}</td>
                      <td style={{ fontFamily: 'var(--font-space-mono)', fontSize: '11px' }}>{formatCurrency(p.spent_usd)}</td>
                      <td style={{ fontFamily: 'var(--font-space-mono)', fontSize: '11px', color: remaining < 0 ? 'var(--red)' : 'var(--green)' }}>{formatCurrency(remaining)}</td>
                      <td>
                        <div style={{ minWidth: '70px' }}>
                          <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px' }}>{Math.round(burnPct)}%</span>
                          <div className="progress-wrap">
                            <div className={`progress-fill ${isOver ? 'progress-red' : isUnder ? 'progress-accent' : 'progress-green'}`} style={{ width: `${Math.min(100, burnPct)}%` }} />
                          </div>
                        </div>
                      </td>
                      <td><span className={`badge ${statusClass}`}>{statusLabel}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Multi-currency panel */}
        <div className="panel">
          <div className="panel-header">
            <div><div className="panel-title">MULTI-CURRENCY</div><div className="panel-sub">Total portfolio · Live rates</div></div>
          </div>
          <div className="panel-body">
            <div style={{ fontFamily: 'var(--font-space-mono)', fontSize: '8px', color: 'var(--muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px' }}>
              PORTFOLIO VALUE IN REGIONAL CURRENCIES
            </div>
            {Object.values(CURRENCY_RATES).map(({ code, name, rate }) => (
              <div key={code} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '10px', color: 'var(--accent)', width: '44px' }}>{code}</span>
                <span style={{ fontSize: '11px', color: 'var(--muted-2)', flex: 1 }}>{name}</span>
                <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '11px', color: 'var(--green)', textAlign: 'right' }}>
                  {code === 'USD'
                    ? formatCurrency(totalBudget, 'USD')
                    : `${code} ${Math.round(convertCurrency(totalBudget, code)).toLocaleString()}`}
                </span>
              </div>
            ))}
            <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
              <div style={{ fontFamily: 'var(--font-space-mono)', fontSize: '8px', color: 'var(--muted)', letterSpacing: '0.1em', marginBottom: '4px' }}>RATES LAST UPDATED</div>
              <div style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px', color: 'var(--accent)' }}>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .stat-grid-responsive { grid-template-columns: 1fr 1fr !important; }
          .grid-responsive { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
