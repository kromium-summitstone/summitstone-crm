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
    supabase.from('risks').select('*').eq('project_id', params.id).eq('is_resolved', false).order('risk_score', { ascending: false }),
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
  const totalPaid = (payments ?? []).filter(p => p.status === 'paid').reduce((s: number, p: any) => s + p.amount_usd, 0)
  const pendingCOValue = (changeOrders ?? []).filter(co => co.status === 'pending').reduce((s: number, co: any) => s + co.value_usd, 0)

  const sharedStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Grotesk:wght@400;500;600&family=Space+Mono&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Space Grotesk', sans-serif; background: var(--black, #0a0a0a); color: var(--cream, #f4f2ee); font-size: 13px; }
    .mono { font-family: 'Space Mono', monospace; }
    .bebas { font-family: 'Bebas Neue', sans-serif; }
    .muted { color: var(--muted, rgba(244,242,238,0.4)); }
    .muted2 { color: var(--muted-2, rgba(244,242,238,0.65)); }
    .accent { color: var(--accent, #4a9eff); }
    .green { color: var(--green, #2ecc8a); }
    .amber { color: var(--amber, #f5a623); }
    .red { color: var(--red, #ff4d4d); }
    .section-title { font-family: 'Bebas Neue', sans-serif; font-size: 20px; letter-spacing: 0.06em; color: var(--cream, #f4f2ee); border-bottom: 1px solid var(--border, rgba(255,255,255,0.07)); padding-bottom: 10px; margin-bottom: 16px; }
    .card { background: var(--surface, #111); border: 1px solid var(--border, rgba(255,255,255,0.07)); padding: 16px; }
    .badge { font-family: 'Space Mono', monospace; font-size: 8px; letter-spacing: 0.12em; text-transform: uppercase; padding: 3px 8px; display: inline-block; }
    .badge-green { background: rgba(46,204,138,0.12); color: #2ecc8a; }
    .badge-amber { background: rgba(245,166,35,0.12); color: #f5a623; }
    .badge-red { background: rgba(255,77,77,0.12); color: #ff4d4d; }
    .badge-blue { background: rgba(74,158,255,0.12); color: #4a9eff; }
    .badge-grey { background: rgba(255,255,255,0.06); color: rgba(244,242,238,0.65); }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .grid-3 { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; }
    .grid-4 { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; }
    @media(max-width:700px){ .grid-2,.grid-3,.grid-4{ grid-template-columns:1fr!important; } .kpi-grid{ grid-template-columns:1fr 1fr!important; } }
  `

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{project.name} — SummitStone Investor Portal</title>
        <style dangerouslySetInnerHTML={{ __html: sharedStyles }} />
      </head>
      <body>
        {/* Header */}
        <header style={{ background: 'var(--surface, #111)', borderBottom: '1px solid var(--border, rgba(255,255,255,0.07))', padding: '0 40px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link href="/investor" style={{ fontFamily: 'Space Mono, monospace', fontSize: '9px', color: 'var(--accent, #4a9eff)', letterSpacing: '0.12em', textDecoration: 'none', textTransform: 'uppercase' }}>
              ← Portfolio
            </Link>
            <span style={{ color: 'rgba(244,242,238,0.2)' }}>|</span>
            <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '18px', letterSpacing: '3px', color: 'var(--cream, #f4f2ee)' }}>SUMMITSTONE</div>
          </div>
          <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '8px', color: 'var(--muted, rgba(244,242,238,0.4))', letterSpacing: '0.1em' }}>
            INVESTOR PORTAL · CONFIDENTIAL
          </div>
        </header>

        <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 24px' }}>

          {/* Project hero */}
          <div style={{ marginBottom: '36px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
              <div>
                <div className="mono muted" style={{ fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '6px' }}>
                  {project.code} · {project.island} · {project.type?.replace(/_/g, ' ')}
                </div>
                <div className="bebas" style={{ fontSize: '42px', letterSpacing: '0.04em', color: 'var(--cream, #f4f2ee)', lineHeight: 1 }}>
                  {project.name}
                </div>
                {project.client?.name && (
                  <div className="mono muted2" style={{ fontSize: '10px', marginTop: '6px' }}>
                    Client: {project.client.name}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <span className={`badge ${isAtRisk ? 'badge-red' : 'badge-green'}`}>{isAtRisk ? 'At Risk' : 'On Track'}</span>
                <span className="badge badge-blue">{STAGE_LABELS[project.stage] ?? project.stage}</span>
                {project.contract_type && <span className="badge badge-grey">{project.contract_type.replace(/_/g, ' ')}</span>}
              </div>
            </div>

            {/* KPI cards */}
            <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px' }}>
              {[
                { label: 'Contract Value', value: formatCurrency(project.budget_usd), color: 'var(--accent, #4a9eff)' },
                { label: 'Capital Deployed', value: formatCurrency(project.spent_usd), color: burnPct > project.completion_pct + 5 ? 'var(--red, #ff4d4d)' : 'var(--cream, #f4f2ee)' },
                { label: 'Remaining Budget', value: formatCurrency(remaining), color: remaining < 0 ? 'var(--red, #ff4d4d)' : 'var(--green, #2ecc8a)' },
                { label: 'Completion', value: `${project.completion_pct}%`, color: project.completion_pct >= 60 ? 'var(--green, #2ecc8a)' : 'var(--amber, #f5a623)' },
              ].map(({ label, value, color }) => (
                <div key={label} className="card">
                  <div className="mono muted" style={{ fontSize: '8px', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '8px' }}>{label}</div>
                  <div className="bebas" style={{ fontSize: '28px', color, lineHeight: 1 }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Progress bar */}
            <div style={{ marginTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span className="mono muted" style={{ fontSize: '8px', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Overall Completion</span>
                <span className="mono" style={{ fontSize: '9px', color: project.completion_pct >= 60 ? 'var(--green, #2ecc8a)' : 'var(--amber, #f5a623)' }}>
                  {burnPct}% budget used · {project.completion_pct}% complete
                </span>
              </div>
              <div style={{ height: '8px', background: 'var(--surface-3, #222)', borderRadius: '1px', overflow: 'hidden', display: 'flex' }}>
                <div style={{ width: `${project.completion_pct}%`, height: '100%', background: project.completion_pct >= 60 ? 'var(--green, #2ecc8a)' : 'var(--accent, #4a9eff)', transition: 'width 0.4s' }} />
              </div>
              <div style={{ display: 'flex', gap: '16px', marginTop: '6px' }}>
                {project.start_date && <span className="mono muted" style={{ fontSize: '8px' }}>Start: {formatDate(project.start_date)}</span>}
                {project.target_end_date && <span className="mono muted" style={{ fontSize: '8px' }}>Target completion: {formatDate(project.target_end_date)}</span>}
              </div>
            </div>
          </div>

          {/* Milestones */}
          {(milestones ?? []).length > 0 && (
            <div style={{ marginBottom: '36px' }}>
              <div className="section-title">
                Construction Milestones
                <span className="mono muted" style={{ fontSize: '9px', marginLeft: '12px', fontFamily: 'Space Mono, monospace' }}>
                  {completedMilestones}/{milestones?.length} complete
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {(milestones ?? []).map((m, i) => {
                  const isLast = i === (milestones?.length ?? 0) - 1
                  const status = m.is_completed ? 'complete' : m.is_active ? 'active' : 'upcoming'
                  const dotColor = m.is_completed ? 'var(--green, #2ecc8a)' : m.is_active ? 'var(--accent, #4a9eff)' : 'rgba(255,255,255,0.15)'
                  return (
                    <div key={m.id} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                      {/* Timeline spine */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: dotColor, border: `2px solid ${dotColor}`, marginTop: '12px', flexShrink: 0, boxShadow: m.is_active ? `0 0 8px ${dotColor}` : 'none' }} />
                        {!isLast && <div style={{ width: '1px', flex: 1, minHeight: '24px', background: 'rgba(255,255,255,0.08)' }} />}
                      </div>
                      {/* Content */}
                      <div style={{ flex: 1, padding: '10px 0', paddingBottom: isLast ? 0 : '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 500, color: m.is_completed ? 'var(--muted-2, rgba(244,242,238,0.65))' : 'var(--cream, #f4f2ee)', textDecoration: m.is_completed ? 'line-through' : 'none', marginBottom: '2px' }}>
                              {m.sequence_order}. {m.title}
                            </div>
                            {m.contractor?.name && (
                              <div className="mono muted" style={{ fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                {m.contractor.name}
                              </div>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span className={`badge ${m.is_completed ? 'badge-green' : m.is_active ? 'badge-blue' : 'badge-grey'}`}>
                              {m.is_completed ? 'Complete' : m.is_active ? 'In Progress' : 'Upcoming'}
                            </span>
                            <span className="mono muted" style={{ fontSize: '8px' }}>
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

          {/* Payments & Change Orders */}
          <div className="grid-2" style={{ marginBottom: '36px' }}>
            {/* Payments */}
            <div>
              <div className="section-title">Payment Schedule</div>
              {(payments ?? []).length === 0 ? (
                <div className="muted" style={{ fontSize: '12px', padding: '16px 0' }}>No payments recorded</div>
              ) : (
                <div>
                  {/* Summary */}
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
                    <div className="card" style={{ flex: 1, padding: '12px' }}>
                      <div className="mono muted" style={{ fontSize: '7px', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '4px' }}>Paid</div>
                      <div className="bebas green" style={{ fontSize: '22px', lineHeight: 1 }}>{formatCurrency(totalPaid)}</div>
                    </div>
                    {pendingCOValue > 0 && (
                      <div className="card" style={{ flex: 1, padding: '12px' }}>
                        <div className="mono muted" style={{ fontSize: '7px', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '4px' }}>Pending COs</div>
                        <div className="bebas amber" style={{ fontSize: '22px', lineHeight: 1 }}>{formatCurrency(pendingCOValue)}</div>
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                    {(payments ?? []).map(p => (
                      <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border, rgba(255,255,255,0.07))' }}>
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--cream, #f4f2ee)', marginBottom: '2px' }}>{p.title}</div>
                          <div className="mono muted" style={{ fontSize: '8px' }}>
                            {p.paid_date ? `Paid ${formatDate(p.paid_date)}` : `Due ${formatDate(p.due_date)}`}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <span className="mono" style={{ fontSize: '11px', color: 'var(--cream, #f4f2ee)' }}>{formatCurrency(p.amount_usd)}</span>
                          <span className={`badge ${p.status === 'paid' ? 'badge-green' : p.status === 'overdue' ? 'badge-red' : p.status === 'upcoming' ? 'badge-amber' : 'badge-grey'}`}>
                            {p.status?.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Change Orders */}
            <div>
              <div className="section-title">Change Orders</div>
              {(changeOrders ?? []).length === 0 ? (
                <div className="muted" style={{ fontSize: '12px', padding: '16px 0' }}>No change orders</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                  {(changeOrders ?? []).map(co => (
                    <div key={co.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border, rgba(255,255,255,0.07))' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                        <div>
                          <div className="mono accent" style={{ fontSize: '8px', marginBottom: '3px' }}>{co.co_number}</div>
                          <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--cream, #f4f2ee)' }}>{co.title}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span className="mono amber" style={{ fontSize: '11px' }}>{formatCurrency(co.value_usd)}</span>
                          <span className={`badge ${co.status === 'approved' ? 'badge-green' : co.status === 'pending' ? 'badge-amber' : co.status === 'rejected' ? 'badge-grey' : 'badge-red'}`}>
                            {co.status}
                          </span>
                        </div>
                      </div>
                      {co.schedule_impact_days > 0 && (
                        <div className="mono muted" style={{ fontSize: '8px' }}>Schedule impact: +{co.schedule_impact_days} days</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Permits */}
          {(permits ?? []).length > 0 && (
            <div style={{ marginBottom: '36px' }}>
              <div className="section-title">Permits & Approvals</div>
              <div className="grid-2">
                {(permits ?? []).map(p => (
                  <div key={p.id} className="card" style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div style={{
                      width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0, marginTop: '5px',
                      background: p.status === 'approved' ? 'var(--green, #2ecc8a)' : p.status === 'overdue' ? 'var(--red, #ff4d4d)' : 'var(--amber, #f5a623)',
                    }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--cream, #f4f2ee)', marginBottom: '3px' }}>{p.title}</div>
                      <div className="mono muted" style={{ fontSize: '8px', marginBottom: '4px' }}>{p.authority}</div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <span className={`badge ${p.status === 'approved' ? 'badge-green' : p.status === 'overdue' ? 'badge-red' : 'badge-amber'}`}>
                          {p.status?.replace(/_/g, ' ')}
                        </span>
                        {p.approved_date && <span className="mono muted" style={{ fontSize: '8px', paddingTop: '2px' }}>Approved {formatDate(p.approved_date)}</span>}
                        {p.expiry_date && <span className="mono muted" style={{ fontSize: '8px', paddingTop: '2px' }}>Expires {formatDate(p.expiry_date)}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active shipments */}
          {(shipments ?? []).length > 0 && (
            <div style={{ marginBottom: '36px' }}>
              <div className="section-title">Active Procurement</div>
              <div className="grid-2">
                {(shipments ?? []).map(s => (
                  <div key={s.id} className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span className="mono accent" style={{ fontSize: '9px' }}>{s.reference}</span>
                      <span className={`badge ${s.status === 'in_transit' ? 'badge-blue' : s.status === 'customs_hold' ? 'badge-amber' : s.status === 'delayed' ? 'badge-red' : 'badge-grey'}`}>
                        {s.status?.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--cream, #f4f2ee)', marginBottom: '3px' }}>{s.material}</div>
                    <div className="mono muted" style={{ fontSize: '8px' }}>
                      {s.origin_location} → {s.destination_island} · ETA {formatDate(s.eta_date)} · {formatCurrency(s.value_usd)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Risks */}
          {(risks ?? []).length > 0 && (
            <div style={{ marginBottom: '36px' }}>
              <div className="section-title">Active Risk Register</div>
              <div className="grid-2">
                {(risks ?? []).map(r => (
                  <div key={r.id} style={{ padding: '14px 16px', background: r.risk_score >= 12 ? 'rgba(255,77,77,0.06)' : 'rgba(245,166,35,0.06)', border: `1px solid ${r.risk_score >= 12 ? 'rgba(255,77,77,0.25)' : 'rgba(245,166,35,0.2)'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--cream, #f4f2ee)' }}>{r.title}</span>
                      <span className="bebas" style={{ fontSize: '22px', lineHeight: 1, color: r.risk_score >= 12 ? 'var(--red, #ff4d4d)' : 'var(--amber, #f5a623)' }}>
                        {r.risk_score}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'rgba(244,242,238,0.55)', lineHeight: 1.6 }}>{r.description}</div>
                    {r.mitigation && (
                      <div style={{ fontSize: '10px', color: 'var(--green, #2ecc8a)', marginTop: '6px' }}>↳ {r.mitigation}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent site activity */}
          {(sitelogs ?? []).length > 0 && (
            <div style={{ marginBottom: '36px' }}>
              <div className="section-title">Recent Site Activity</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {(sitelogs ?? []).map(log => (
                  <div key={log.id} style={{ display: 'flex', gap: '16px', padding: '12px 0', borderBottom: '1px solid var(--border, rgba(255,255,255,0.07))' }}>
                    <div className="mono muted" style={{ fontSize: '8px', whiteSpace: 'nowrap', paddingTop: '2px', minWidth: '70px' }}>{formatDate(log.log_date)}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '12px', color: 'var(--cream, #f4f2ee)', lineHeight: 1.6 }}>{log.work_performed}</div>
                      <div className="mono muted" style={{ fontSize: '8px', marginTop: '3px' }}>
                        {log.workers_on_site} workers · {log.weather?.replace(/_/g, ' ')}
                        {log.delays_description && ` · ⚠ ${log.delays_description}`}
                      </div>
                    </div>
                    <span className={`badge ${log.safety_status === 'clear' ? 'badge-green' : log.safety_status === 'incident' ? 'badge-red' : 'badge-amber'}`} style={{ flexShrink: 0, alignSelf: 'flex-start' }}>
                      {log.safety_status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Documents available to investors */}
          {(documents ?? []).length > 0 && (
            <div style={{ marginBottom: '36px' }}>
              <div className="section-title">Project Documents</div>
              <div className="grid-3">
                {(documents ?? []).map(doc => (
                  <div key={doc.id} className="card" style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <div style={{ width: '28px', height: '28px', background: 'var(--accent-dim, rgba(74,158,255,0.12))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="var(--accent, #4a9eff)" strokeWidth="1.5">
                        <path d="M9 1H3a1 1 0 00-1 1v12a1 1 0 001 1h10a1 1 0 001-1V6z"/><polyline points="9,1 9,6 14,6"/>
                      </svg>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--cream, #f4f2ee)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.title}</div>
                      <div className="mono muted" style={{ fontSize: '7px', textTransform: 'uppercase', marginTop: '2px' }}>{doc.type} · v{doc.version}</div>
                      {doc.file_url && (
                        <a href={doc.file_url} target="_blank" rel="noreferrer" style={{ fontFamily: 'Space Mono, monospace', fontSize: '8px', color: 'var(--accent, #4a9eff)', textDecoration: 'none', marginTop: '4px', display: 'block' }}>
                          View →
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <footer style={{ borderTop: '1px solid var(--border, rgba(255,255,255,0.07))', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div className="mono muted" style={{ fontSize: '8px', letterSpacing: '0.1em' }}>
              SUMMITSTONE DEVELOPMENTS LTD · CONFIDENTIAL INVESTOR REPORT · NOT FOR REDISTRIBUTION
            </div>
            <div className="mono muted" style={{ fontSize: '8px' }}>
              {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </div>
          </footer>

        </main>
      </body>
    </html>
  )
}
