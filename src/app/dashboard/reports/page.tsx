'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function ReportsPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [selectedProject, setSelectedProject] = useState<string>('all')
  const [reportType, setReportType] = useState<'progress' | 'financial' | 'full'>('full')
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [reportData, setReportData] = useState<any>(null)
  const reportRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  async function loadProjects() {
    const { data } = await supabase.from('projects').select('*, client:clients(name, email)').not('stage', 'eq', 'lead').order('budget_usd', { ascending: false })
    setProjects(data ?? [])
    setLoading(false)
  }
  useEffect(() => { loadProjects() }, [])

  async function generateReport() {
    setGenerating(true)
    const projectFilter = selectedProject === 'all' ? null : selectedProject
    const [
      { data: projs },
      { data: milestones },
      { data: payments },
      { data: changeOrders },
      { data: risks },
      { data: shipments },
      { data: permits },
      { data: sitelogs },
    ] = await Promise.all([
      projectFilter
        ? supabase.from('projects').select('*, client:clients(name,email,phone)').eq('id', projectFilter)
        : supabase.from('projects').select('*, client:clients(name,email,phone)').not('stage', 'eq', 'lead').not('stage', 'eq', 'completed'),
      supabase.from('milestones').select('*, project:projects(name)').match(projectFilter ? { project_id: projectFilter } : {}).order('sequence_order'),
      supabase.from('payments').select('*, project:projects(name)').match(projectFilter ? { project_id: projectFilter } : {}).order('due_date'),
      supabase.from('change_orders').select('*, project:projects(name)').match(projectFilter ? { project_id: projectFilter } : {}).in('status', ['pending', 'approved']),
      supabase.from('risks').select('*, project:projects(name)').match(projectFilter ? { project_id: projectFilter } : {}).eq('is_resolved', false),
      supabase.from('shipments').select('*, project:projects(name)').match(projectFilter ? { project_id: projectFilter } : {}).not('status', 'eq', 'delivered'),
      supabase.from('permits').select('*, project:projects(name)').match(projectFilter ? { project_id: projectFilter } : {}).not('status', 'eq', 'approved'),
      supabase.from('site_logs').select('*, project:projects(name)').match(projectFilter ? { project_id: projectFilter } : {}).order('log_date', { ascending: false }).limit(10),
    ])
    setReportData({ projs, milestones, payments, changeOrders, risks, shipments, permits, sitelogs, generatedAt: new Date() })
    setGenerating(false)
  }

  function handlePrint() {
    window.print()
  }

  const totalBudget = (reportData?.projs ?? []).reduce((s: number, p: any) => s + (p.budget_usd ?? 0), 0)
  const totalSpent = (reportData?.projs ?? []).reduce((s: number, p: any) => s + (p.spent_usd ?? 0), 0)
  const pendingCOs = (reportData?.changeOrders ?? []).filter((co: any) => co.status === 'pending')
  const pendingCOValue = pendingCOs.reduce((s: number, co: any) => s + (co.value_usd ?? 0), 0)

  const stageLabel: Record<string, string> = {
    pre_construction: 'Pre-Construction', in_construction: 'In Construction',
    handover: 'Handover', completed: 'Completed', proposal: 'Proposal'
  }

  return (
    <div>
      {/* Controls - hidden on print */}
      <div className="no-print" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '12px', alignItems: 'end' }}>
          <div>
            <label className="form-label">Project / Portfolio</label>
            <select className="form-select" value={selectedProject} onChange={e => setSelectedProject(e.target.value)}>
              <option value="all">All Active Projects (Portfolio Report)</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Report Type</label>
            <select className="form-select" value={reportType} onChange={e => setReportType(e.target.value as any)}>
              <option value="full">Full Project Report</option>
              <option value="progress">Progress Report (Client-facing)</option>
              <option value="financial">Financial Summary Only</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-primary" onClick={generateReport} disabled={generating}>
              {generating ? 'Generating...' : '⚡ Generate Report'}
            </button>
            {reportData && (
              <button className="btn btn-secondary" onClick={handlePrint}>
                🖨 Print / Export PDF
              </button>
            )}
          </div>
        </div>

        {/* Report type descriptions */}
        <div style={{ marginTop: '10px', padding: '10px 14px', background: 'var(--surface-2)', border: '1px solid var(--border)', fontSize: '11px', color: 'var(--muted-2)' }}>
          {reportType === 'full' && '📋 Full report: All project data including financials, milestones, change orders, risks, permits, and site log summary. Best for internal reviews.'}
          {reportType === 'progress' && '📊 Progress report: Completion status, milestone updates, key risks. Clean client-facing format — no sensitive financial details.'}
          {reportType === 'financial' && '💰 Financial summary: Budget vs spent, change orders, payment schedule, cost projections. Best for investor/financial review meetings.'}
        </div>
      </div>

      {/* Empty state */}
      {!reportData && (
        <div style={{ padding: '60px', textAlign: 'center', border: '1px dashed var(--border)', color: 'var(--muted)' }}>
          <div style={{ fontFamily: 'var(--font-bebas)', fontSize: '28px', letterSpacing: '0.06em', marginBottom: '8px' }}>SELECT OPTIONS AND GENERATE</div>
          <div style={{ fontFamily: 'var(--font-space-mono)', fontSize: '10px' }}>Choose a project or portfolio view above, then click Generate Report</div>
        </div>
      )}

      {/* ── THE REPORT ── */}
      {reportData && (
        <div ref={reportRef} style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>

          {/* Report Header */}
          <div style={{ padding: '28px 32px', borderBottom: '2px solid var(--accent)', background: '#111' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
                    <polygon points="14,2 26,22 2,22" fill="none" stroke="rgba(244,242,238,0.9)" strokeWidth="1.4"/>
                    <line x1="0" y1="25" x2="28" y2="25" stroke="#4a9eff" strokeWidth="1.8" strokeLinecap="square"/>
                  </svg>
                  <span style={{ fontFamily: 'var(--font-bebas)', fontSize: '22px', letterSpacing: '3px' }}>SUMMITSTONE DEVELOPMENTS</span>
                </div>
                <div style={{ fontFamily: 'var(--font-bebas)', fontSize: '32px', letterSpacing: '0.04em', color: 'var(--accent)', lineHeight: 1 }}>
                  {reportType === 'full' ? 'PROJECT STATUS REPORT' : reportType === 'progress' ? 'PROGRESS REPORT' : 'FINANCIAL SUMMARY'}
                </div>
                <div style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px', color: 'var(--muted)', marginTop: '6px', letterSpacing: '0.1em' }}>
                  {selectedProject === 'all' ? 'FULL PORTFOLIO · ALL ACTIVE PROJECTS' : `SINGLE PROJECT · ${projects.find(p => p.id === selectedProject)?.name?.toUpperCase()}`}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--font-space-mono)', fontSize: '8px', color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>Generated</div>
                <div style={{ fontFamily: 'var(--font-space-mono)', fontSize: '10px', color: 'var(--cream)' }}>{reportData.generatedAt.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                <div style={{ fontFamily: 'var(--font-space-mono)', fontSize: '10px', color: 'var(--muted)', marginTop: '2px' }}>CONFIDENTIAL — NOT FOR DISTRIBUTION</div>
              </div>
            </div>
          </div>

          {/* Executive Summary */}
          <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontFamily: 'var(--font-bebas)', fontSize: '16px', letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: '14px' }}>EXECUTIVE SUMMARY</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              {[
                { label: 'Total Portfolio Value', value: formatCurrency(totalBudget), color: 'var(--accent)' },
                { label: 'Capital Deployed', value: formatCurrency(totalSpent), color: 'var(--cream)' },
                { label: 'Remaining Budget', value: formatCurrency(totalBudget - totalSpent), color: 'var(--green)' },
                { label: 'Pending CO Value', value: formatCurrency(pendingCOValue), color: pendingCOValue > 0 ? 'var(--amber)' : 'var(--green)' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ padding: '14px', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                  <div style={{ fontFamily: 'var(--font-space-mono)', fontSize: '8px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>{label}</div>
                  <div style={{ fontFamily: 'var(--font-bebas)', fontSize: '24px', color, lineHeight: 1 }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Project statuses */}
          <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontFamily: 'var(--font-bebas)', fontSize: '16px', letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: '14px' }}>PROJECT STATUS</div>
            {(reportData.projs ?? []).map((p: any) => {
              const burnPct = p.budget_usd > 0 ? Math.round(p.spent_usd / p.budget_usd * 100) : 0
              const isAtRisk = burnPct > p.completion_pct + 5
              return (
                <div key={p.id} style={{ marginBottom: '18px', paddingBottom: '18px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--cream)' }}>{p.name}</span>
                      <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '8px', color: 'var(--muted)', marginLeft: '12px', letterSpacing: '0.08em' }}>
                        {p.island} · {stageLabel[p.stage] ?? p.stage} · {p.contract_type?.replace(/_/g, ' ')}
                      </span>
                      {p.client && <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '8px', color: 'var(--accent)', marginLeft: '12px' }}>CLIENT: {p.client.name}</span>}
                    </div>
                    <span className={`badge ${isAtRisk ? 'badge-red' : 'badge-green'}`}>{isAtRisk ? 'At Risk' : 'On Track'}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 200px', gap: '12px', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontFamily: 'var(--font-space-mono)', fontSize: '8px', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Completion</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="progress-wrap" style={{ flex: 1 }}>
                          <div className={`progress-fill ${p.completion_pct >= 60 ? 'progress-green' : 'progress-accent'}`} style={{ width: `${p.completion_pct}%` }} />
                        </div>
                        <span style={{ fontFamily: 'var(--font-bebas)', fontSize: '18px', color: 'var(--cream)' }}>{p.completion_pct}%</span>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontFamily: 'var(--font-space-mono)', fontSize: '8px', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '2px' }}>Budget</div>
                      <div style={{ fontFamily: 'var(--font-space-mono)', fontSize: '11px', color: 'var(--cream)' }}>{formatCurrency(p.budget_usd)}</div>
                    </div>
                    <div>
                      <div style={{ fontFamily: 'var(--font-space-mono)', fontSize: '8px', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '2px' }}>Spent ({burnPct}%)</div>
                      <div style={{ fontFamily: 'var(--font-space-mono)', fontSize: '11px', color: isAtRisk ? 'var(--red)' : 'var(--cream)' }}>{formatCurrency(p.spent_usd)}</div>
                    </div>
                    <div>
                      <div style={{ fontFamily: 'var(--font-space-mono)', fontSize: '8px', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '2px' }}>Timeline</div>
                      <div style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px', color: 'var(--muted-2)' }}>
                        {p.start_date ? formatDate(p.start_date) : '—'} → {p.target_end_date ? formatDate(p.target_end_date) : '—'}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Milestones - shown in full and progress reports */}
          {(reportType === 'full' || reportType === 'progress') && reportData.milestones?.length > 0 && (
            <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontFamily: 'var(--font-bebas)', fontSize: '16px', letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: '14px' }}>ACTIVE MILESTONES</div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Milestone', 'Project', 'Target Date', 'Status'].map(h => (
                      <th key={h} style={{ fontFamily: 'var(--font-space-mono)', fontSize: '8px', color: 'var(--muted)', textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid var(--border)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reportData.milestones.map((m: any) => (
                    <tr key={m.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '8px', fontSize: '12px', color: 'var(--cream)', fontWeight: 500 }}>{m.title}</td>
                      <td style={{ padding: '8px', fontSize: '11px', color: 'var(--muted-2)' }}>{m.project?.name}</td>
                      <td style={{ padding: '8px', fontFamily: 'var(--font-space-mono)', fontSize: '9px', color: 'var(--muted-2)' }}>{formatDate(m.target_date)}</td>
                      <td style={{ padding: '8px' }}><span className={`badge ${m.is_completed ? 'badge-green' : m.is_active ? 'badge-amber' : 'badge-grey'}`}>{m.is_completed ? 'Complete' : m.is_active ? 'In Progress' : 'Upcoming'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Financials - full and financial reports */}
          {(reportType === 'full' || reportType === 'financial') && (
            <>
              {reportData.payments?.length > 0 && (
                <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontFamily: 'var(--font-bebas)', fontSize: '16px', letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: '14px' }}>PAYMENT SCHEDULE</div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        {['Milestone', 'Project', 'Amount', 'Due Date', 'Status'].map(h => (
                          <th key={h} style={{ fontFamily: 'var(--font-space-mono)', fontSize: '8px', color: 'var(--muted)', textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid var(--border)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.payments.map((p: any) => (
                        <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '8px', fontSize: '12px', color: 'var(--cream)' }}>{p.title}</td>
                          <td style={{ padding: '8px', fontSize: '11px', color: 'var(--muted-2)' }}>{p.project?.name}</td>
                          <td style={{ padding: '8px', fontFamily: 'var(--font-space-mono)', fontSize: '11px', color: 'var(--cream)' }}>{formatCurrency(p.amount_usd)}</td>
                          <td style={{ padding: '8px', fontFamily: 'var(--font-space-mono)', fontSize: '9px', color: 'var(--muted-2)' }}>{formatDate(p.due_date)}</td>
                          <td style={{ padding: '8px' }}><span className={`badge ${p.status === 'paid' ? 'badge-green' : p.status === 'overdue' ? 'badge-red' : 'badge-amber'}`}>{p.status.replace('_',' ')}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {reportData.changeOrders?.length > 0 && (
                <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontFamily: 'var(--font-bebas)', fontSize: '16px', letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: '14px' }}>PENDING CHANGE ORDERS</div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        {['CO#', 'Title', 'Project', 'Value', 'Schedule Impact', 'Status'].map(h => (
                          <th key={h} style={{ fontFamily: 'var(--font-space-mono)', fontSize: '8px', color: 'var(--muted)', textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid var(--border)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.changeOrders.map((co: any) => (
                        <tr key={co.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '8px', fontFamily: 'var(--font-space-mono)', fontSize: '9px', color: 'var(--accent)' }}>{co.co_number}</td>
                          <td style={{ padding: '8px', fontSize: '12px', color: 'var(--cream)' }}>{co.title}</td>
                          <td style={{ padding: '8px', fontSize: '11px', color: 'var(--muted-2)' }}>{co.project?.name}</td>
                          <td style={{ padding: '8px', fontFamily: 'var(--font-space-mono)', fontSize: '11px', color: 'var(--amber)' }}>{formatCurrency(co.value_usd)}</td>
                          <td style={{ padding: '8px', fontFamily: 'var(--font-space-mono)', fontSize: '9px', color: co.schedule_impact_days > 0 ? 'var(--red)' : 'var(--green)' }}>
                            {co.schedule_impact_days > 0 ? `+${co.schedule_impact_days} days` : 'No impact'}
                          </td>
                          <td style={{ padding: '8px' }}><span className={`badge ${co.status === 'approved' ? 'badge-green' : co.status === 'pending' ? 'badge-amber' : 'badge-red'}`}>{co.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* Risks - full and progress */}
          {(reportType === 'full' || reportType === 'progress') && reportData.risks?.length > 0 && (
            <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontFamily: 'var(--font-bebas)', fontSize: '16px', letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: '14px' }}>ACTIVE RISK REGISTER</div>
              {reportData.risks.map((r: any) => (
                <div key={r.id} style={{ marginBottom: '10px', padding: '12px 14px', background: r.risk_score >= 12 ? 'rgba(255,77,77,0.06)' : 'rgba(245,166,35,0.06)', border: `1px solid ${r.risk_score >= 12 ? 'rgba(255,77,77,0.2)' : 'rgba(245,166,35,0.15)'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--cream)' }}>{r.title}</span>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px', color: 'var(--muted)' }}>{r.project?.name}</span>
                      <span style={{ fontFamily: 'var(--font-bebas)', fontSize: '20px', color: r.risk_score >= 12 ? 'var(--red)' : 'var(--amber)', lineHeight: 1 }}>Score: {r.risk_score}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--muted-2)', lineHeight: 1.6 }}>{r.description}</div>
                  {r.mitigation && <div style={{ fontSize: '10px', color: 'var(--green)', marginTop: '4px' }}>↳ {r.mitigation}</div>}
                </div>
              ))}
            </div>
          )}

          {/* Recent site log summary */}
          {reportType === 'full' && reportData.sitelogs?.length > 0 && (
            <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontFamily: 'var(--font-bebas)', fontSize: '16px', letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: '14px' }}>RECENT SITE ACTIVITY</div>
              {reportData.sitelogs.slice(0, 5).map((log: any) => (
                <div key={log.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '8px', color: 'var(--muted)', whiteSpace: 'nowrap', paddingTop: '2px', width: '70px' }}>{formatDate(log.log_date)}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '11px', color: 'var(--muted-2)', marginBottom: '2px' }}>{log.project?.name} · {log.workers_on_site} workers</div>
                    <div style={{ fontSize: '11px', color: 'var(--cream)', lineHeight: 1.5 }}>{log.work_performed}</div>
                  </div>
                  <span className={`badge ${log.safety_status === 'clear' ? 'badge-green' : log.safety_status === 'incident' ? 'badge-red' : 'badge-amber'}`}>{log.safety_status}</span>
                </div>
              ))}
            </div>
          )}

          {/* Report footer */}
          <div style={{ padding: '18px 32px', background: '#111', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontFamily: 'var(--font-space-mono)', fontSize: '8px', color: 'var(--muted)', letterSpacing: '0.1em' }}>
              SUMMITSTONE DEVELOPMENTS LTD · CONFIDENTIAL · NOT FOR REDISTRIBUTION
            </div>
            <div style={{ fontFamily: 'var(--font-space-mono)', fontSize: '8px', color: 'var(--muted)' }}>
              Generated {reportData.generatedAt.toLocaleString()}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; color: black !important; }
          [style*="background: var(--surface)"], [style*="background: var(--surface-2)"], [style*="background: #111"] {
            background: white !important;
            color: black !important;
          }
        }
      `}</style>
    </div>
  )
}
