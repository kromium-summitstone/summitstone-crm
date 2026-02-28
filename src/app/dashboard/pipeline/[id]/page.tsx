'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency, formatDate, STAGE_LABELS, ISLAND_LABELS } from '@/lib/utils'

export default function ProjectDetailPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const supabase = createClient()

  const [project, setProject] = useState<any>(null)
  const [milestones, setMilestones] = useState<any[]>([])
  const [changeOrders, setChangeOrders] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [sitelogs, setSitelogs] = useState<any[]>([])
  const [risks, setRisks] = useState<any[]>([])
  const [permits, setPermits] = useState<any[]>([])
  const [shipments, setShipments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [showEditStage, setShowEditStage] = useState(false)
  const [editForm, setEditForm] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const [showMilestoneForm, setShowMilestoneForm] = useState(false)
  const [milestoneForm, setMilestoneForm] = useState({ title: '', target_date: '', sequence_order: '1', notes: '' })

  async function load() {
    const [
      { data: proj },
      { data: ms },
      { data: cos },
      { data: pays },
      { data: logs },
      { data: rs },
      { data: perms },
      { data: ships },
    ] = await Promise.all([
      supabase.from('projects').select('*, client:clients(name, email, phone), project_manager:profiles(full_name)').eq('id', id).single(),
      supabase.from('milestones').select('*, contractor:contractors(name)').eq('project_id', id).order('sequence_order'),
      supabase.from('change_orders').select('*').eq('project_id', id).order('created_at', { ascending: false }),
      supabase.from('payments').select('*').eq('project_id', id).order('due_date'),
      supabase.from('site_logs').select('*').eq('project_id', id).order('log_date', { ascending: false }).limit(10),
      supabase.from('risks').select('*').eq('project_id', id).eq('is_resolved', false).order('risk_score', { ascending: false }),
      supabase.from('permits').select('*').eq('project_id', id).order('sequence_order'),
      supabase.from('shipments').select('*').eq('project_id', id).order('created_at', { ascending: false }),
    ])
    if (!proj) { router.push('/dashboard/pipeline'); return }
    setProject(proj)
    setEditForm({ stage: proj.stage, completion_pct: proj.completion_pct, spent_usd: proj.spent_usd || 0 })
    setMilestones(ms ?? [])
    setChangeOrders(cos ?? [])
    setPayments(pays ?? [])
    setSitelogs(logs ?? [])
    setRisks(rs ?? [])
    setPermits(perms ?? [])
    setShipments(ships ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  async function saveProjectUpdate() {
    setSaving(true)
    await supabase.from('projects').update({
      stage: editForm.stage,
      completion_pct: parseInt(editForm.completion_pct),
      spent_usd: parseFloat(editForm.spent_usd) || 0,
    }).eq('id', id)
    setSaving(false)
    setShowEditStage(false)
    load()
  }

  async function toggleMilestone(ms: any) {
    await supabase.from('milestones').update({ is_completed: !ms.is_completed }).eq('id', ms.id)
    load()
  }

  async function updateCOStatus(coId: string, status: string) {
    await supabase.from('change_orders').update({ status }).eq('id', coId)
    load()
  }

  async function addMilestone(e: React.FormEvent) {
    e.preventDefault()
    await supabase.from('milestones').insert({
      project_id: id,
      title: milestoneForm.title,
      target_date: milestoneForm.target_date || null,
      sequence_order: parseInt(milestoneForm.sequence_order) || 1,
      notes: milestoneForm.notes || null,
    })
    setShowMilestoneForm(false)
    setMilestoneForm({ title: '', target_date: '', sequence_order: '1', notes: '' })
    load()
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: 'var(--muted)' }}>
      Loading project...
    </div>
  )
  if (!project) return null

  const stageColors: Record<string, string> = {
    lead: 'badge-grey', proposal: 'badge-blue', pre_construction: 'badge-amber',
    in_construction: 'badge-green', handover: 'badge-blue', completed: 'badge-grey'
  }
  const budgetUsedPct = project.budget_usd > 0 ? Math.round((project.spent_usd ?? 0) / project.budget_usd * 100) : 0
  const pendingCOs = changeOrders.filter(co => co.status === 'pending').length
  const totalCOValue = changeOrders.filter(co => co.status === 'approved').reduce((s: number, co: any) => s + (co.value_usd ?? 0), 0)

  const TABS = ['overview', 'milestones', 'change-orders', 'payments', 'permits', 'procurement', 'site-logs', 'risks']

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <Link href="/dashboard/pipeline" style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px', color: 'var(--muted)', letterSpacing: '0.12em', textDecoration: 'none', textTransform: 'uppercase' }}>
          ← Pipeline
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '8px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-bebas)', fontSize: '32px', color: 'var(--cream)', lineHeight: 1, letterSpacing: '0.04em' }}>
              {project.name}
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span className={`badge ${stageColors[project.stage]}`}>{STAGE_LABELS[project.stage as keyof typeof STAGE_LABELS]}</span>
              <span className="badge badge-blue">{ISLAND_LABELS[project.island as keyof typeof ISLAND_LABELS]}</span>
              <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px', color: 'var(--muted)' }}>{project.code}</span>
              {project.client && <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px', color: 'var(--accent)' }}>{project.client.name}</span>}
            </div>
          </div>
          <button className="btn btn-secondary" onClick={() => setShowEditStage(!showEditStage)}>
            ✎ Update Progress
          </button>
        </div>
      </div>

      {/* Inline edit form */}
      {showEditStage && (
        <div className="panel" style={{ marginBottom: '16px' }}>
          <div className="panel-header"><div className="panel-title">UPDATE PROJECT STATUS</div></div>
          <div className="panel-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px' }}>
              <div>
                <label className="form-label">Pipeline Stage</label>
                <select className="form-select" value={editForm.stage} onChange={e => setEditForm((f: any) => ({ ...f, stage: e.target.value }))}>
                  <option value="lead">Lead</option>
                  <option value="proposal">Proposal</option>
                  <option value="pre_construction">Pre-Construction</option>
                  <option value="in_construction">In Construction</option>
                  <option value="handover">Handover</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div>
                <label className="form-label">Completion % (0–100)</label>
                <input className="form-input" type="number" min="0" max="100" value={editForm.completion_pct} onChange={e => setEditForm((f: any) => ({ ...f, completion_pct: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Amount Spent (USD)</label>
                <input className="form-input" type="number" value={editForm.spent_usd} onChange={e => setEditForm((f: any) => ({ ...f, spent_usd: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
              <button className="btn btn-primary" onClick={saveProjectUpdate} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
              <button className="btn btn-secondary" onClick={() => setShowEditStage(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '20px' }} className="stat-grid-responsive">
        <div className="stat-card">
          <div className="text-label">Contract Value</div>
          <div className="stat-value text-accent" style={{ marginTop: '6px', fontSize: '26px' }}>{formatCurrency(project.budget_usd)}</div>
          {totalCOValue > 0 && <div style={{ fontSize: '10px', color: 'var(--amber)', marginTop: '4px' }}>+{formatCurrency(totalCOValue)} approved COs</div>}
        </div>
        <div className="stat-card">
          <div className="text-label">Budget Spent</div>
          <div className="stat-value" style={{ marginTop: '6px', fontSize: '26px' }}>{formatCurrency(project.spent_usd ?? 0)}</div>
          <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '4px' }}>{budgetUsedPct}% of budget</div>
        </div>
        <div className="stat-card">
          <div className="text-label">Completion</div>
          <div className="stat-value text-green" style={{ marginTop: '6px' }}>{project.completion_pct}%</div>
          <div style={{ marginTop: '6px' }}>
            <div className="progress-wrap"><div className="progress-fill progress-green" style={{ width: `${project.completion_pct}%` }} /></div>
          </div>
        </div>
        <div className="stat-card">
          <div className="text-label">Open Items</div>
          <div className="stat-value text-amber" style={{ marginTop: '6px' }}>
            {pendingCOs} CO{pendingCOs !== 1 ? 's' : ''} · {risks.length} risk{risks.length !== 1 ? 's' : ''}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '4px' }}>{permits.filter(p => p.status === 'overdue').length} overdue permits</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '2px', marginBottom: '16px', borderBottom: '1px solid var(--border)', overflowX: 'auto' }}>
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: '8px 14px',
            fontFamily: 'var(--font-space-mono)', fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase',
            color: activeTab === tab ? 'var(--cream)' : 'var(--muted)',
            borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
            whiteSpace: 'nowrap',
          }}>
            {tab.replace('-', ' ')}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }} className="grid-responsive">
          <div className="panel">
            <div className="panel-header"><div className="panel-title">PROJECT DETAILS</div></div>
            <div className="panel-body">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {[
                    ['Type', project.type?.replace('_', ' ')],
                    ['Contract', project.contract_type?.replace('_', ' ')],
                    ['Island', ISLAND_LABELS[project.island as keyof typeof ISLAND_LABELS]],
                    ['Start Date', formatDate(project.start_date)],
                    ['Target End', formatDate(project.target_end_date)],
                    ['Address', project.address || '—'],
                    ['Client', project.client?.name || '—'],
                    ['PM', project.project_manager?.full_name || '—'],
                  ].map(([label, value]) => (
                    <tr key={label} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px', color: 'var(--muted)', padding: '8px 0', letterSpacing: '0.1em', textTransform: 'uppercase', width: '120px' }}>{label}</td>
                      <td style={{ fontSize: '12px', color: 'var(--cream)', padding: '8px 0', textTransform: 'capitalize' }}>{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {project.description && (
                <div style={{ marginTop: '14px', padding: '12px', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                  <div className="text-label" style={{ marginBottom: '6px' }}>Description</div>
                  <div style={{ fontSize: '12px', color: 'var(--muted-2)', lineHeight: 1.6 }}>{project.description}</div>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Milestones summary */}
            <div className="panel">
              <div className="panel-header">
                <div><div className="panel-title">MILESTONES</div></div>
                <button className="panel-action" onClick={() => setActiveTab('milestones')}>View All →</button>
              </div>
              <div style={{ padding: '10px 14px' }}>
                {milestones.slice(0, 5).map(ms => (
                  <div key={ms.id} style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: ms.is_completed ? 'var(--green)' : 'var(--surface-3)', border: '1px solid var(--border)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px' }}>
                      {ms.is_completed ? '✓' : ms.sequence_order}
                    </div>
                    <div style={{ flex: 1, fontSize: '11px', color: ms.is_completed ? 'var(--muted)' : 'var(--cream)', textDecoration: ms.is_completed ? 'line-through' : 'none' }}>{ms.title}</div>
                    <div style={{ fontFamily: 'var(--font-space-mono)', fontSize: '8px', color: 'var(--muted)' }}>{formatDate(ms.target_date)}</div>
                  </div>
                ))}
                {milestones.length === 0 && <div style={{ color: 'var(--muted)', fontSize: '11px', padding: '8px 0' }}>No milestones yet</div>}
              </div>
            </div>

            {/* Risks summary */}
            {risks.length > 0 && (
              <div className="panel">
                <div className="panel-header"><div className="panel-title">ACTIVE RISKS</div></div>
                <div style={{ padding: '10px 14px' }}>
                  {risks.slice(0, 3).map(r => (
                    <div key={r.id} className={`alert-item ${r.risk_score >= 12 ? 'alert-red' : r.risk_score >= 6 ? 'alert-amber' : 'alert-blue'}`} style={{ marginBottom: '6px' }}>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--cream)' }}>{r.title}</div>
                        <div style={{ fontSize: '9px', color: 'var(--muted-2)', marginTop: '2px' }}>Score: {r.risk_score} · L{r.likelihood}×I{r.impact}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Milestones tab */}
      {activeTab === 'milestones' && (
        <div className="panel">
          <div className="panel-header">
            <div><div className="panel-title">MILESTONES & PHASES</div></div>
            <button className="btn btn-primary" onClick={() => setShowMilestoneForm(!showMilestoneForm)}>+ Add Milestone</button>
          </div>
          {showMilestoneForm && (
            <div className="panel-body" style={{ borderBottom: '1px solid var(--border)' }}>
              <form onSubmit={addMilestone}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px', gap: '12px' }}>
                  <div style={{ gridColumn: 'span 2' }}><label className="form-label">Title *</label><input className="form-input" value={milestoneForm.title} onChange={e => setMilestoneForm(f => ({ ...f, title: e.target.value }))} required /></div>
                  <div><label className="form-label">Order</label><input className="form-input" type="number" value={milestoneForm.sequence_order} onChange={e => setMilestoneForm(f => ({ ...f, sequence_order: e.target.value }))} /></div>
                  <div><label className="form-label">Target Date</label><input className="form-input" type="date" value={milestoneForm.target_date} onChange={e => setMilestoneForm(f => ({ ...f, target_date: e.target.value }))} /></div>
                  <div style={{ gridColumn: 'span 2' }}><label className="form-label">Notes</label><input className="form-input" value={milestoneForm.notes} onChange={e => setMilestoneForm(f => ({ ...f, notes: e.target.value }))} /></div>
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
                  <button type="submit" className="btn btn-primary">Add</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowMilestoneForm(false)}>Cancel</button>
                </div>
              </form>
            </div>
          )}
          <div style={{ padding: '0 14px' }}>
            {milestones.map(ms => (
              <div key={ms.id} style={{ display: 'flex', gap: '12px', padding: '12px 0', borderBottom: '1px solid var(--border)', alignItems: 'flex-start' }}>
                <button onClick={() => toggleMilestone(ms)} style={{
                  width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0, cursor: 'pointer',
                  background: ms.is_completed ? 'var(--green)' : 'var(--surface-3)', border: `1px solid ${ms.is_completed ? 'var(--green)' : 'var(--border)'}`,
                  color: '#fff', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {ms.is_completed ? '✓' : ms.sequence_order}
                </button>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: ms.is_completed ? 'var(--muted)' : 'var(--cream)', textDecoration: ms.is_completed ? 'line-through' : 'none' }}>{ms.title}</div>
                  {ms.notes && <div style={{ fontSize: '10px', color: 'var(--muted-2)', marginTop: '3px' }}>{ms.notes}</div>}
                  {ms.contractor && <div style={{ fontSize: '10px', color: 'var(--accent)', marginTop: '3px' }}>Contractor: {ms.contractor.name}</div>}
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px', color: 'var(--muted)' }}>Target</div>
                  <div style={{ fontFamily: 'var(--font-space-mono)', fontSize: '10px', color: 'var(--cream)', marginTop: '2px' }}>{formatDate(ms.target_date)}</div>
                  {ms.is_completed && ms.completed_date && (
                    <div style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px', color: 'var(--green)', marginTop: '2px' }}>Done {formatDate(ms.completed_date)}</div>
                  )}
                </div>
              </div>
            ))}
            {milestones.length === 0 && <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--muted)' }}>No milestones added yet</div>}
          </div>
        </div>
      )}

      {/* Change Orders tab */}
      {activeTab === 'change-orders' && (
        <div className="panel">
          <div className="panel-header">
            <div><div className="panel-title">CHANGE ORDERS</div><div className="panel-sub">{project.name}</div></div>
            <Link href="/dashboard/changeorders" className="btn btn-primary">+ Raise CO</Link>
          </div>
          <div className="table-scroll">
            <table className="data-table">
              <thead><tr><th>CO#</th><th>Title</th><th>Raised By</th><th>Value</th><th>Schedule</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {changeOrders.map(co => (
                  <tr key={co.id}>
                    <td style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px', color: 'var(--accent)' }}>{co.co_number}</td>
                    <td className="strong">{co.title}</td>
                    <td style={{ color: 'var(--muted-2)' }}>{co.raised_by}</td>
                    <td style={{ fontFamily: 'var(--font-space-mono)', fontSize: '11px', color: 'var(--amber)' }}>+{formatCurrency(co.value_usd)}</td>
                    <td style={{ fontFamily: 'var(--font-space-mono)', fontSize: '10px', color: co.schedule_impact_days > 0 ? 'var(--amber)' : 'var(--muted)' }}>
                      {co.schedule_impact_days > 0 ? `+${co.schedule_impact_days}d` : '—'}
                    </td>
                    <td>
                      <span className={`badge ${co.status === 'approved' ? 'badge-green' : co.status === 'rejected' ? 'badge-grey' : co.status === 'disputed' ? 'badge-red' : 'badge-amber'}`}>
                        {co.status}
                      </span>
                    </td>
                    <td>
                      {co.status === 'pending' && (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button className="btn btn-secondary" style={{ height: '24px', padding: '0 8px', fontSize: '10px' }} onClick={() => updateCOStatus(co.id, 'approved')}>Approve</button>
                          <button className="btn btn-danger" style={{ height: '24px', padding: '0 8px', fontSize: '10px' }} onClick={() => updateCOStatus(co.id, 'rejected')}>Reject</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {changeOrders.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: '20px', color: 'var(--muted)' }}>No change orders for this project</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payments tab */}
      {activeTab === 'payments' && (
        <div className="panel">
          <div className="panel-header"><div className="panel-title">PAYMENT SCHEDULE</div></div>
          <div className="table-scroll">
            <table className="data-table">
              <thead><tr><th>Milestone</th><th>Amount</th><th>Due Date</th><th>Paid Date</th><th>Status</th></tr></thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id}>
                    <td className="strong">{p.title}</td>
                    <td style={{ fontFamily: 'var(--font-space-mono)', fontSize: '11px' }}>{formatCurrency(p.amount_usd)}</td>
                    <td style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px' }}>{formatDate(p.due_date)}</td>
                    <td style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px', color: 'var(--green)' }}>{formatDate(p.paid_date)}</td>
                    <td><span className={`badge ${p.status === 'paid' ? 'badge-green' : p.status === 'overdue' ? 'badge-red' : p.status === 'upcoming' ? 'badge-amber' : 'badge-grey'}`}>{p.status.replace('_', ' ')}</span></td>
                  </tr>
                ))}
                {payments.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: '20px', color: 'var(--muted)' }}>No payment records</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Permits tab */}
      {activeTab === 'permits' && (
        <div className="panel">
          <div className="panel-header">
            <div><div className="panel-title">PERMITS & APPROVALS</div></div>
            <Link href="/dashboard/permits" className="panel-action">Manage All Permits →</Link>
          </div>
          <div style={{ padding: '0 14px' }}>
            {permits.map(permit => (
              <div key={permit.id} style={{ display: 'flex', gap: '12px', padding: '12px 0', borderBottom: '1px solid var(--border)', alignItems: 'flex-start' }}>
                <div className={`permit-step ${permit.status === 'approved' ? 'permit-step-done' : permit.status === 'overdue' ? 'permit-step-overdue' : ['submitted','under_review'].includes(permit.status) ? 'permit-step-active' : ''}`}>
                  {permit.status === 'approved' ? '✓' : permit.status === 'overdue' ? '!' : permit.sequence_order}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--cream)' }}>{permit.title}</div>
                  <div style={{ fontSize: '10px', color: 'var(--muted-2)', marginTop: '3px' }}>{permit.authority}</div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                    <span className={`badge ${permit.status === 'approved' ? 'badge-green' : permit.status === 'overdue' ? 'badge-red' : ['submitted','under_review'].includes(permit.status) ? 'badge-blue' : 'badge-grey'}`}>
                      {permit.status.replace('_', ' ')}
                    </span>
                    {permit.submitted_date && <span style={{ fontSize: '9px', color: 'var(--muted)', fontFamily: 'var(--font-space-mono)' }}>Submitted {formatDate(permit.submitted_date)}</span>}
                    {permit.approved_date && <span style={{ fontSize: '9px', color: 'var(--green)', fontFamily: 'var(--font-space-mono)' }}>Approved {formatDate(permit.approved_date)}</span>}
                    {permit.expiry_date && <span style={{ fontSize: '9px', color: 'var(--amber)', fontFamily: 'var(--font-space-mono)' }}>Expires {formatDate(permit.expiry_date)}</span>}
                  </div>
                </div>
              </div>
            ))}
            {permits.length === 0 && <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--muted)' }}>No permits for this project</div>}
          </div>
        </div>
      )}

      {/* Procurement tab */}
      {activeTab === 'procurement' && (
        <div className="panel">
          <div className="panel-header">
            <div><div className="panel-title">SHIPMENTS & PROCUREMENT</div></div>
            <Link href="/dashboard/procurement" className="panel-action">Manage All →</Link>
          </div>
          <div className="table-scroll">
            <table className="data-table">
              <thead><tr><th>Ref</th><th>Material</th><th>Supplier</th><th>Origin</th><th>ETA</th><th>Status</th></tr></thead>
              <tbody>
                {shipments.map(s => (
                  <tr key={s.id}>
                    <td style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px', color: 'var(--accent)' }}>{s.reference}</td>
                    <td className="strong">{s.material}</td>
                    <td style={{ color: 'var(--muted-2)' }}>{s.supplier}</td>
                    <td style={{ color: 'var(--muted-2)' }}>{s.origin_location}</td>
                    <td style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px' }}>{formatDate(s.eta_date)}</td>
                    <td><span className={`badge ${s.status === 'delivered' ? 'badge-green' : s.status === 'customs_hold' ? 'badge-red' : s.status === 'in_transit' ? 'badge-blue' : 'badge-grey'}`}>{s.status.replace('_', ' ')}</span></td>
                  </tr>
                ))}
                {shipments.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: '20px', color: 'var(--muted)' }}>No shipments</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Site Logs tab */}
      {activeTab === 'site-logs' && (
        <div className="panel">
          <div className="panel-header">
            <div><div className="panel-title">SITE LOGS</div></div>
            <Link href="/dashboard/sitelogs" className="panel-action">Log Entry →</Link>
          </div>
          <div style={{ padding: '0 14px' }}>
            {sitelogs.map(log => (
              <div key={log.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <div style={{ fontFamily: 'var(--font-space-mono)', fontSize: '10px', color: 'var(--accent)' }}>{formatDate(log.log_date)}</div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <span className={`badge ${log.safety_status === 'clear' ? 'badge-green' : log.safety_status === 'minor' ? 'badge-amber' : 'badge-red'}`}>{log.safety_status}</span>
                    <span className="badge badge-grey">{log.weather}</span>
                  </div>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--cream)', marginBottom: '4px' }}>{log.work_performed}</div>
                <div style={{ fontSize: '10px', color: 'var(--muted-2)' }}>{log.workers_on_site} workers on site</div>
                {log.delays_description && <div style={{ fontSize: '10px', color: 'var(--amber)', marginTop: '4px' }}>⚠ {log.delays_description} ({log.delay_hours}h)</div>}
              </div>
            ))}
            {sitelogs.length === 0 && <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--muted)' }}>No site logs yet</div>}
          </div>
        </div>
      )}

      {/* Risks tab */}
      {activeTab === 'risks' && (
        <div className="panel">
          <div className="panel-header">
            <div><div className="panel-title">PROJECT RISKS</div></div>
            <Link href="/dashboard/risk" className="panel-action">Risk Register →</Link>
          </div>
          <div style={{ padding: '0 14px' }}>
            {risks.map(r => (
              <div key={r.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--cream)' }}>{r.title}</div>
                  <span style={{
                    fontFamily: 'var(--font-space-mono)', fontSize: '11px', fontWeight: 700,
                    color: r.risk_score >= 12 ? 'var(--red)' : r.risk_score >= 6 ? 'var(--amber)' : 'var(--green)',
                    background: r.risk_score >= 12 ? 'var(--red-dim)' : r.risk_score >= 6 ? 'var(--amber-dim)' : 'var(--green-dim)',
                    padding: '2px 6px',
                  }}>{r.risk_score}</span>
                </div>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                  <span className="badge badge-grey">{r.category}</span>
                  <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '8px', color: 'var(--muted)' }}>L{r.likelihood}×I{r.impact}</span>
                </div>
                {r.description && <div style={{ fontSize: '10px', color: 'var(--muted-2)', marginBottom: '4px' }}>{r.description}</div>}
                {r.mitigation && <div style={{ fontSize: '10px', color: 'var(--muted-2)' }}><strong style={{ color: 'var(--muted)' }}>Mitigation: </strong>{r.mitigation}</div>}
              </div>
            ))}
            {risks.length === 0 && <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--green)' }}>No active risks for this project</div>}
          </div>
        </div>
      )}

      <style>{`
        @media(max-width:900px){.stat-grid-responsive{grid-template-columns:1fr 1fr!important;}.grid-responsive{grid-template-columns:1fr!important;}}
        @media(max-width:480px){.stat-grid-responsive{grid-template-columns:1fr!important;}}
        .btn-danger { background: var(--red-dim); border: 1px solid var(--red); color: var(--red); font-family: var(--font-space-mono); font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; cursor: pointer; padding: 0 12px; height: 30px; display: inline-flex; align-items: center; }
        .btn-danger:hover { background: var(--red); color: #fff; }
      `}</style>
    </div>
  )
}
