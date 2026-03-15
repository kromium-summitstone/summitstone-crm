import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const revalidate = 300

const STAGE_LABELS: Record<string, string> = {
  lead: 'Lead', proposal: 'Proposal', pre_construction: 'Pre-Construction',
  in_construction: 'In Construction', handover: 'Handover', completed: 'Completed',
}

export default async function InvestorProjectDetail({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const [
    { data: project },
    { data: milestones },
    { data: payments },
    { data: risks },
    { data: permits },
    { data: changeOrders },
    { data: shipments },
    { data: sitelogs },
    { data: documents },
  ] = await Promise.all([
    supabase.from('projects').select('*, client:clients(name)').eq('id', params.id).single(),
    supabase.from('milestones').select('*, contractor:contractors(name)').eq('project_id', params.id).order('sequence_order'),
    supabase.from('payments').select('*').eq('project_id', params.id).order('due_date'),
    supabase.from('risks').select('*').eq('project_id', params.id).order('risk_score', { ascending: false }),
    supabase.from('permits').select('*').eq('project_id', params.id).order('sequence_order'),
    supabase.from('change_orders').select('*').eq('project_id', params.id).order('created_at', { ascending: false }),
    supabase.from('shipments').select('*').eq('project_id', params.id).not('status', 'eq', 'delivered').order('eta_date'),
    supabase.from('site_logs').select('*').eq('project_id', params.id).order('log_date', { ascending: false }).limit(8),
    supabase.from('documents').select('*').eq('project_id', params.id).in('access_level', ['all_staff', 'investors']),
  ])

  if (!project) notFound()

  const remaining = (project.budget_usd ?? 0) - (project.spent_usd ?? 0)
  const burnPct = project.budget_usd > 0 ? Math.round(project.spent_usd / project.budget_usd * 100) : 0
  const isAtRisk = burnPct > project.completion_pct + 5
  const completedMilestones = (milestones ?? []).filter(m => m.is_completed).length
  const totalPaid = (payments ?? []).filter((p: any) => p.status === 'paid').reduce((s: number, p: any) => s + p.amount_usd, 0)
  const pendingCOValue = (changeOrders ?? []).filter((co: any) => co.status === 'pending').reduce((s: number, co: any) => s + co.value_usd, 0)

  const mono: React.CSSProperties = { fontFamily: 'var(--font-space-mono)' }
  const bebas: React.CSSProperties = { fontFamily: 'var(--font-bebas)' }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--black)', color: 'var(--cream)' }}>

      {/* Portal header */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '0 40px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/investor" style={{ ...mono, fontSize: '9px', color: 'var(--accent)', letterSpacing: '0.12em', textDecoration: 'none', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 1L3 6l5 5"/></svg>
            Portfolio
          </Link>
          <span style={{ color: 'var(--border-mid)' }}>|</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="16" height="16" viewBox="0 0 28 28" fill="none">
              <polygon points="14,2 26,22 2,22" fill="none" stroke="var(--cream)" strokeWidth="1.4" strokeLinejoin="miter"/>
              <line x1="0" y1="25" x2="28" y2="25" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="square"/>
            </svg>
            <span style={{ ...bebas, fontSize: '16px', letterSpacing: '3px', color: 'var(--cream)' }}>SUMMITSTONE</span>
            <span style={{ ...mono, fontSize: '7px', letterSpacing: '2px', color: 'var(--muted)', textTransform: 'uppercase' }}>Investor Portal</span>
          </div>
        </div>
        <div style={{ ...mono, fontSize: '8px', color: 'var(--muted)', letterSpacing: '0.1em' }}>CONFIDENTIAL</div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '36px 24px' }}>

        {/* Project hero */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
            <div>
              <div style={{ ...mono, fontSize: '9px', color: 'var(--muted)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '6px' }}>
                {project.code ?? ''} · {project.island} · {project.type?.replace(/_/g, ' ')}
                {project.client?.name ? ` · ${project.client.name}` : ''}
              </div>
              <div style={{ ...bebas, fontSize: '40px', letterSpacing: '0.04em', color: 'var(--cream)', lineHeight: 1 }}>
                {project.name}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ padding: '4px 10px', background: isAtRisk ? 'var(--red-dim)' : 'var(--green-dim)', border: `1px solid ${isAtRisk ? 'var(--red)' : 'var(--green)'}`, ...mono, fontSize: '8px', color: isAtRisk ? 'var(--red)' : 'var(--green)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                {isAtRisk ? 'At Risk' : 'On Track'}
              </span>
              <span className="badge badge-blue">{STAGE_LABELS[project.stage] ?? project.stage}</span>
              {project.contract_type && <span className="badge badge-grey">{project.contract_type.replace(/_/g, ' ')}</span>}
            </div>
          </div>

          {/* KPI grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '16px' }} className="stat-grid-responsive">
            {[
              { label: 'Contract Value', value: formatCurrency(project.budget_usd), color: 'var(--accent)' },
              { label: 'Capital Deployed', value: formatCurrency(project.spent_usd), color: burnPct > project.completion_pct + 5 ? 'var(--red)' : 'var(--cream)' },
              { label: 'Remaining Budget', value: formatCurrency(remaining), color: remaining < 0 ? 'var(--red)' : 'var(--green)' },
              { label: 'Completion', value: `${project.completion_pct}%`, color: project.completion_pct >= 60 ? 'var(--green)' : 'var(--amber)' },
            ].map(({ label, value, color }) => (
              <div key={label} className="stat-card">
                <div className="text-label">{label}</div>
                <div style={{ ...bebas, fontSize: '28px', color, lineHeight: 1, marginTop: '6px' }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="panel" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ ...mono, fontSize: '8px', color: 'var(--muted)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Overall Completion</span>
              <span style={{ ...mono, fontSize: '9px', color: 'var(--muted-2)' }}>
                {burnPct}% budget used · {project.completion_pct}% complete
                {project.start_date && ` · Started ${formatDate(project.start_date)}`}
                {project.target_end_date && ` · Target ${formatDate(project.target_end_date)}`}
              </span>
            </div>
            <div className="progress-wrap" style={{ height: '8px' }}>
              <div style={{ width: `${project.completion_pct}%`, height: '100%', background: project.completion_pct >= 60 ? 'var(--green)' : 'var(--accent)', transition: 'width 0.4s' }} />
            </div>
          </div>
        </div>

        {/* Milestones */}
        {(milestones ?? []).length > 0 && (
          <div className="panel" style={{ marginBottom: '16px' }}>
            <div className="panel-header">
              <div>
                <div className="panel-title">CONSTRUCTION MILESTONES</div>
                <div className="panel-sub">{completedMilestones} of {milestones?.length} complete</div>
              </div>
              <div style={{ display: 'flex', gap: '12px', ...mono, fontSize: '9px', color: 'var(--muted)' }}>
                <span style={{ color: 'var(--green)' }}>● Complete</span>
                <span style={{ color: 'var(--accent)' }}>● In Progress</span>
                <span style={{ color: 'var(--border-mid)' }}>● Upcoming</span>
              </div>
            </div>
            <div style={{ padding: '8px 16px' }}>
              {(milestones ?? []).map((m: any, i: number) => {
                const isLast = i === (milestones?.length ?? 0) - 1
                const dotColor = m.is_completed ? 'var(--green)' : m.is_active ? 'var(--accent)' : 'var(--surface-3)'
                const dotBorder = m.is_completed ? 'var(--green)' : m.is_active ? 'var(--accent)' : 'var(--border-mid)'
                return (
                  <div key={m.id} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, paddingTop: '12px' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: dotColor, border: `2px solid ${dotBorder}`, boxShadow: m.is_active ? `0 0 8px ${dotColor}` : 'none' }} />
                      {!isLast && <div style={{ width: '1px', minHeight: '20px', flex: 1, background: 'var(--border)', margin: '2px 0' }} />}
                    </div>
                    <div style={{ flex: 1, padding: '10px 0', paddingBottom: isLast ? '8px' : '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <div>
                          <span style={{ fontSize: '12px', fontWeight: 500, color: m.is_completed ? 'var(--muted-2)' : 'var(--cream)', textDecoration: m.is_completed ? 'line-through' : 'none' }}>
                            {m.sequence_order}. {m.title}
                          </span>
                          {m.contractor?.name && (
                            <span style={{ ...mono, fontSize: '8px', color: 'var(--muted)', marginLeft: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                              {m.contractor.name}
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span className={`badge ${m.is_completed ? 'badge-green' : m.is_active ? 'badge-blue' : 'badge-grey'}`}>
                            {m.is_completed ? 'Complete' : m.is_active ? 'In Progress' : 'Upcoming'}
                          </span>
                          <span style={{ ...mono, fontSize: '8px', color: 'var(--muted)' }}>
                            {m.is_completed && m.completed_date ? `Completed ${formatDate(m.completed_date)}` : `Target ${formatDate(m.target_date)}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Payments + COs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }} className="grid-responsive">
          <div className="panel">
            <div className="panel-header">
              <div><div className="panel-title">PAYMENT SCHEDULE</div><div className="panel-sub">Milestone disbursements</div></div>
              {totalPaid > 0 && <span style={{ ...bebas, fontSize: '18px', color: 'var(--green)' }}>{formatCurrency(totalPaid)} paid</span>}
            </div>
            {(payments ?? []).length === 0 ? (
              <div style={{ padding: '20px 16px', color: 'var(--muted)', ...mono, fontSize: '10px' }}>No payments recorded</div>
            ) : (
              <div className="table-scroll">
                <table className="data-table" style={{ minWidth: '300px' }}>
                  <thead><tr><th>Milestone</th><th>Amount</th><th>Date</th><th>Status</th></tr></thead>
                  <tbody>
                    {(payments ?? []).map((p: any) => (
                      <tr key={p.id}>
                        <td className="strong">{p.title}</td>
                        <td style={{ ...mono, fontSize: '11px' }}>{formatCurrency(p.amount_usd)}</td>
                        <td style={{ ...mono, fontSize: '9px', color: 'var(--muted-2)' }}>{formatDate(p.paid_date ?? p.due_date)}</td>
                        <td><span className={`badge ${p.status === 'paid' ? 'badge-green' : p.status === 'overdue' ? 'badge-red' : p.status === 'upcoming' ? 'badge-amber' : 'badge-grey'}`}>{p.status?.replace('_', ' ')}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="panel">
            <div className="panel-header">
              <div><div className="panel-title">CHANGE ORDERS</div><div className="panel-sub">Scope variations</div></div>
              {pendingCOValue > 0 && <span style={{ ...bebas, fontSize: '18px', color: 'var(--amber)' }}>{formatCurrency(pendingCOValue)} pending</span>}
            </div>
            {(changeOrders ?? []).length === 0 ? (
              <div style={{ padding: '20px 16px', color: 'var(--muted)', ...mono, fontSize: '10px' }}>No change orders</div>
            ) : (
              <div className="table-scroll">
                <table className="data-table" style={{ minWidth: '300px' }}>
                  <thead><tr><th>CO#</th><th>Title</th><th>Value</th><th>Status</th></tr></thead>
                  <tbody>
                    {(changeOrders ?? []).map((co: any) => (
                      <tr key={co.id}>
                        <td style={{ ...mono, fontSize: '9px', color: 'var(--accent)' }}>{co.co_number}</td>
                        <td className="strong">{co.title}</td>
                        <td style={{ ...mono, fontSize: '11px', color: 'var(--amber)' }}>{formatCurrency(co.value_usd)}</td>
                        <td><span className={`badge ${co.status === 'approved' ? 'badge-green' : co.status === 'pending' ? 'badge-amber' : 'badge-grey'}`}>{co.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Permits + Shipments */}
        {((permits ?? []).length > 0 || (shipments ?? []).length > 0) && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }} className="grid-responsive">
            {(permits ?? []).length > 0 && (
              <div className="panel">
                <div className="panel-header"><div className="panel-title">PERMITS & APPROVALS</div><div className="panel-sub">{project.island} jurisdiction</div></div>
                <div style={{ padding: '8px 16px' }}>
                  {(permits ?? []).map((p: any) => (
                    <div key={p.id} style={{ display: 'flex', gap: '10px', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0, marginTop: '4px', background: p.status === 'approved' ? 'var(--green)' : p.status === 'overdue' ? 'var(--red)' : 'var(--amber)' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '12px', color: 'var(--cream)', fontWeight: 500, marginBottom: '2px' }}>{p.title}</div>
                        <div style={{ ...mono, fontSize: '8px', color: 'var(--muted)', marginBottom: '4px' }}>{p.authority}</div>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                          <span className={`badge ${p.status === 'approved' ? 'badge-green' : p.status === 'overdue' ? 'badge-red' : 'badge-amber'}`}>
                            {p.status?.replace(/_/g, ' ')}
                          </span>
                          {p.approved_date && <span style={{ ...mono, fontSize: '8px', color: 'var(--muted)' }}>Approved {formatDate(p.approved_date)}</span>}
                          {p.expiry_date && <span style={{ ...mono, fontSize: '8px', color: 'var(--muted)' }}>Expires {formatDate(p.expiry_date)}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(shipments ?? []).length > 0 && (
              <div className="panel">
                <div className="panel-header"><div className="panel-title">ACTIVE PROCUREMENT</div><div className="panel-sub">Shipments in transit</div></div>
                <div style={{ padding: '8px 16px' }}>
                  {(shipments ?? []).map((s: any) => (
                    <div key={s.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--cream)' }}>{s.material}</span>
                        <span className={`badge ${s.status === 'in_transit' ? 'badge-blue' : s.status === 'customs_hold' ? 'badge-amber' : s.status === 'delayed' ? 'badge-red' : 'badge-grey'}`}>
                          {s.status?.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div style={{ ...mono, fontSize: '8px', color: 'var(--muted)' }}>
                        {s.origin_location} → {s.destination_island} · ETA {formatDate(s.eta_date)} · {formatCurrency(s.value_usd)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Risks */}
        {(risks ?? []).length > 0 && (
          <div className="panel" style={{ marginBottom: '16px' }}>
            <div className="panel-header"><div className="panel-title">RISK REGISTER</div><div className="panel-sub">{(risks ?? []).filter((r: any) => !r.is_resolved).length} active · {(risks ?? []).filter((r: any) => r.is_resolved).length} resolved</div></div>
            <div style={{ padding: '8px 16px' }}>
              {(risks ?? []).map((r: any) => (
                <div key={r.id} style={{ padding: '12px', marginBottom: '8px', background: r.is_resolved ? 'var(--surface-2)' : r.risk_score >= 12 ? 'var(--red-dim)' : 'var(--amber-dim)', border: `1px solid ${r.is_resolved ? 'var(--border)' : r.risk_score >= 12 ? 'rgba(255,77,77,0.25)' : 'rgba(245,166,35,0.2)'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 500, color: r.is_resolved ? 'var(--muted-2)' : 'var(--cream)', textDecoration: r.is_resolved ? 'line-through' : 'none' }}>{r.title}</span>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {r.is_resolved && <span className="badge badge-green">Resolved</span>}
                      {!r.is_resolved && <span style={{ ...bebas, fontSize: '20px', color: r.risk_score >= 12 ? 'var(--red)' : 'var(--amber)', lineHeight: 1 }}>Score {r.risk_score}</span>}
                    </div>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--muted-2)', lineHeight: 1.6 }}>{r.description}</div>
                  {r.mitigation && <div style={{ fontSize: '10px', color: 'var(--green)', marginTop: '4px' }}>↳ Mitigation: {r.mitigation}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Site logs */}
        {(sitelogs ?? []).length > 0 && (
          <div className="panel" style={{ marginBottom: '16px' }}>
            <div className="panel-header"><div className="panel-title">RECENT SITE ACTIVITY</div><div className="panel-sub">Last {(sitelogs ?? []).length} field logs</div></div>
            <div className="table-scroll">
              <table className="data-table">
                <thead><tr><th>Date</th><th>Work Performed</th><th>Workers</th><th>Weather</th><th>Safety</th></tr></thead>
                <tbody>
                  {(sitelogs ?? []).map((log: any) => (
                    <tr key={log.id}>
                      <td style={{ ...mono, fontSize: '9px', whiteSpace: 'nowrap' }}>{formatDate(log.log_date)}</td>
                      <td style={{ fontSize: '11px', color: 'var(--cream)', maxWidth: '320px' }}>{log.work_performed}</td>
                      <td style={{ ...mono, fontSize: '10px', textAlign: 'center' }}>{log.workers_on_site}</td>
                      <td style={{ ...mono, fontSize: '9px', color: 'var(--muted-2)', textTransform: 'capitalize' }}>{log.weather?.replace(/_/g, ' ')}</td>
                      <td><span className={`badge ${log.safety_status === 'clear' ? 'badge-green' : log.safety_status === 'incident' ? 'badge-red' : 'badge-amber'}`}>{log.safety_status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Documents */}
        {(documents ?? []).length > 0 && (
          <div className="panel" style={{ marginBottom: '16px' }}>
            <div className="panel-header"><div className="panel-title">PROJECT DOCUMENTS</div><div className="panel-sub">Investor-accessible files</div></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', padding: '14px 16px' }} className="grid-responsive">
              {(documents ?? []).map((doc: any) => (
                <div key={doc.id} style={{ padding: '12px', background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="var(--accent)" strokeWidth="1.5" style={{ flexShrink: 0, marginTop: '2px' }}>
                    <path d="M9 1H3a1 1 0 00-1 1v12a1 1 0 001 1h10a1 1 0 001-1V6z"/><polyline points="9,1 9,6 14,6"/>
                  </svg>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--cream)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '3px' }}>{doc.title}</div>
                    <div style={{ ...mono, fontSize: '7px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{doc.type} · v{doc.version}</div>
                    {doc.file_url && (
                      <a href={doc.file_url} target="_blank" rel="noreferrer" style={{ ...mono, fontSize: '8px', color: 'var(--accent)', textDecoration: 'none', marginTop: '4px', display: 'block' }}>View →</a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ ...mono, fontSize: '8px', color: 'var(--muted)', letterSpacing: '0.1em' }}>
            SUMMITSTONE DEVELOPMENTS LTD · CONFIDENTIAL · NOT FOR REDISTRIBUTION
          </div>
          <Link href="/investor" style={{ ...mono, fontSize: '9px', color: 'var(--accent)', textDecoration: 'none', letterSpacing: '0.1em' }}>
            ← Back to Portfolio
          </Link>
        </div>
      </div>

      <style>{`
        @media(max-width:900px){.stat-grid-responsive{grid-template-columns:1fr 1fr!important;}.grid-responsive{grid-template-columns:1fr!important;}}
        @media(max-width:480px){.stat-grid-responsive{grid-template-columns:1fr!important;}}
      `}</style>
    </div>
  )
}
