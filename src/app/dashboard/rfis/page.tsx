'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'

const RFI_STATUS = ['open', 'pending_response', 'responded', 'closed', 'void'] as const
const SUBMITTAL_STATUS = ['draft', 'submitted', 'under_review', 'approved', 'approved_as_noted', 'rejected', 'resubmit'] as const
const PRIORITY = ['low', 'medium', 'high', 'urgent'] as const
const DISCIPLINE = ['architectural', 'structural', 'mechanical', 'electrical', 'plumbing', 'civil', 'landscape', 'other'] as const

type RFIStatus = typeof RFI_STATUS[number]
type SubmittalStatus = typeof SUBMITTAL_STATUS[number]

export default function RFIsPage() {
  const [tab, setTab] = useState<'rfis' | 'submittals'>('rfis')
  const [rfis, setRfis] = useState<any[]>([])
  const [submittals, setSubmittals] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState<any>(null)
  const [statusFilter, setStatusFilter] = useState('all')

  const [rfiForm, setRfiForm] = useState({
    project_id: '', rfi_number: '', subject: '', discipline: 'architectural',
    priority: 'medium', question: '', raised_by: '', assigned_to: '',
    due_date: '', drawing_ref: '',
  })
  const [submittalForm, setSubmittalForm] = useState({
    project_id: '', submittal_number: '', title: '', discipline: 'architectural',
    spec_section: '', revision: '0', submitted_by: '', reviewer: '',
    submitted_date: '', required_date: '', notes: '',
  })

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  async function load() {
    const [{ data: r }, { data: s }, { data: p }] = await Promise.all([
      supabase.from('rfis').select('*, project:projects(name, island)').order('created_at', { ascending: false }),
      supabase.from('submittals').select('*, project:projects(name, island)').order('created_at', { ascending: false }),
      supabase.from('projects').select('id, name').not('stage', 'eq', 'completed'),
    ])
    setRfis(r ?? [])
    setSubmittals(s ?? [])
    setProjects(p ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function submitRFI(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const { error: err } = await supabase.from('rfis').insert({
      ...rfiForm,
      project_id: rfiForm.project_id || null,
      due_date: rfiForm.due_date || null,
      status: 'open',
    })
    setSaving(false)
    if (err) { setError(err.message); return }
    setShowForm(false)
    setRfiForm({ project_id: '', rfi_number: '', subject: '', discipline: 'architectural', priority: 'medium', question: '', raised_by: '', assigned_to: '', due_date: '', drawing_ref: '' })
    load()
  }

  async function submitSubmittal(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const { error: err } = await supabase.from('submittals').insert({
      ...submittalForm,
      project_id: submittalForm.project_id || null,
      submitted_date: submittalForm.submitted_date || null,
      required_date: submittalForm.required_date || null,
      revision: parseInt(submittalForm.revision) || 0,
      status: 'submitted',
    })
    setSaving(false)
    if (err) { setError(err.message); return }
    setShowForm(false)
    setSubmittalForm({ project_id: '', submittal_number: '', title: '', discipline: 'architectural', spec_section: '', revision: '0', submitted_by: '', reviewer: '', submitted_date: '', required_date: '', notes: '' })
    load()
  }

  async function updateRFIStatus(id: string, status: string, response?: string) {
    const update: any = { status }
    if (status === 'responded' || status === 'closed') {
      update.responded_at = new Date().toISOString()
      if (response) update.response = response
    }
    await supabase.from('rfis').update(update).eq('id', id)
    setSelected(null)
    load()
  }

  async function updateSubmittalStatus(id: string, status: string) {
    await supabase.from('submittals').update({ status, reviewed_date: new Date().toISOString().slice(0, 10) }).eq('id', id)
    setSelected(null)
    load()
  }

  const rfiStatusColor: Record<RFIStatus, string> = {
    open: 'badge-red', pending_response: 'badge-amber', responded: 'badge-green',
    closed: 'badge-grey', void: 'badge-grey',
  }
  const submittalStatusColor: Record<SubmittalStatus, string> = {
    draft: 'badge-grey', submitted: 'badge-blue', under_review: 'badge-amber',
    approved: 'badge-green', approved_as_noted: 'badge-green', rejected: 'badge-red', resubmit: 'badge-red',
  }
  const priorityColor: Record<string, string> = { low: 'badge-grey', medium: 'badge-blue', high: 'badge-amber', urgent: 'badge-red' }

  const filteredRFIs = statusFilter === 'all' ? rfis : rfis.filter(r => r.status === statusFilter)
  const filteredSubmittals = statusFilter === 'all' ? submittals : submittals.filter(s => s.status === statusFilter)

  // Stats
  const openRFIs = rfis.filter(r => ['open', 'pending_response'].includes(r.status)).length
  const overdueRFIs = rfis.filter(r => r.due_date && new Date(r.due_date) < new Date() && !['closed', 'void', 'responded'].includes(r.status)).length
  const pendingSubmittals = submittals.filter(s => ['submitted', 'under_review'].includes(s.status)).length
  const rejectedSubmittals = submittals.filter(s => ['rejected', 'resubmit'].includes(s.status)).length

  return (
    <div>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '20px' }} className="stat-grid-responsive">
        <div className="stat-card">
          <div className="text-label">Open RFIs</div>
          <div className="stat-value text-amber" style={{ marginTop: '6px' }}>{openRFIs}</div>
          <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '4px' }}>{rfis.length} total</div>
        </div>
        <div className="stat-card">
          <div className="text-label">Overdue RFIs</div>
          <div className="stat-value" style={{ marginTop: '6px', color: overdueRFIs > 0 ? 'var(--red)' : 'var(--green)' }}>{overdueRFIs}</div>
          <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '4px' }}>Past due date</div>
        </div>
        <div className="stat-card">
          <div className="text-label">Submittals In Review</div>
          <div className="stat-value text-accent" style={{ marginTop: '6px' }}>{pendingSubmittals}</div>
          <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '4px' }}>{submittals.length} total</div>
        </div>
        <div className="stat-card">
          <div className="text-label">Rejected / Resubmit</div>
          <div className="stat-value" style={{ marginTop: '6px', color: rejectedSubmittals > 0 ? 'var(--red)' : 'var(--green)' }}>{rejectedSubmittals}</div>
          <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '4px' }}>Action required</div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '2px', borderBottom: '1px solid var(--border)' }}>
          {(['rfis', 'submittals'] as const).map(t => (
            <button key={t} onClick={() => { setTab(t); setStatusFilter('all'); setSelected(null) }} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '8px 20px',
              fontFamily: 'var(--font-space-mono)', fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase',
              color: tab === t ? 'var(--cream)' : 'var(--muted)',
              borderBottom: `2px solid ${tab === t ? 'var(--accent)' : 'transparent'}`,
            }}>
              {t === 'rfis' ? `RFIs (${rfis.length})` : `Submittals (${submittals.length})`}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select className="form-select" style={{ width: 'auto', padding: '6px 10px' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            {(tab === 'rfis' ? RFI_STATUS : SUBMITTAL_STATUS).map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
          </select>
          <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); setSelected(null) }}>
            + {tab === 'rfis' ? 'Raise RFI' : 'Add Submittal'}
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && tab === 'rfis' && (
        <div className="panel" style={{ marginBottom: '16px' }}>
          <div className="panel-header"><div className="panel-title">RAISE RFI</div><div className="panel-sub">Request for Information</div></div>
          <div className="panel-body">
            <form onSubmit={submitRFI}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label">Project</label>
                  <select className="form-select" value={rfiForm.project_id} onChange={e => setRfiForm(f => ({ ...f, project_id: e.target.value }))}>
                    <option value="">Select project...</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">RFI Number *</label>
                  <input className="form-input" value={rfiForm.rfi_number} onChange={e => setRfiForm(f => ({ ...f, rfi_number: e.target.value }))} placeholder="RFI-0041" required />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Subject *</label>
                  <input className="form-input" value={rfiForm.subject} onChange={e => setRfiForm(f => ({ ...f, subject: e.target.value }))} placeholder="Clarification on foundation anchor bolt spec" required />
                </div>
                <div>
                  <label className="form-label">Discipline</label>
                  <select className="form-select" value={rfiForm.discipline} onChange={e => setRfiForm(f => ({ ...f, discipline: e.target.value }))}>
                    {DISCIPLINE.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Priority</label>
                  <select className="form-select" value={rfiForm.priority} onChange={e => setRfiForm(f => ({ ...f, priority: e.target.value }))}>
                    {PRIORITY.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Raised By</label>
                  <input className="form-input" value={rfiForm.raised_by} onChange={e => setRfiForm(f => ({ ...f, raised_by: e.target.value }))} placeholder="Site Engineer / PM" />
                </div>
                <div>
                  <label className="form-label">Assigned To (Architect / Engineer)</label>
                  <input className="form-input" value={rfiForm.assigned_to} onChange={e => setRfiForm(f => ({ ...f, assigned_to: e.target.value }))} placeholder="Lead Architect" />
                </div>
                <div>
                  <label className="form-label">Response Due Date</label>
                  <input className="form-input" type="date" value={rfiForm.due_date} onChange={e => setRfiForm(f => ({ ...f, due_date: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Drawing / Spec Reference</label>
                  <input className="form-input" value={rfiForm.drawing_ref} onChange={e => setRfiForm(f => ({ ...f, drawing_ref: e.target.value }))} placeholder="DWG-S-004, Section 3.2.1" />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Question / Description *</label>
                  <textarea className="form-textarea" value={rfiForm.question} onChange={e => setRfiForm(f => ({ ...f, question: e.target.value }))} placeholder="Describe the clarification needed in detail..." required style={{ minHeight: '80px' }} />
                </div>
              </div>
              {error && <div style={{ padding: '10px', background: 'var(--red-dim)', border: '1px solid var(--red)', color: 'var(--red)', fontSize: '11px', marginTop: '12px' }}>{error}</div>}
              <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Submitting...' : 'Raise RFI'}</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showForm && tab === 'submittals' && (
        <div className="panel" style={{ marginBottom: '16px' }}>
          <div className="panel-header"><div className="panel-title">LOG SUBMITTAL</div><div className="panel-sub">Shop drawings, product data, samples</div></div>
          <div className="panel-body">
            <form onSubmit={submitSubmittal}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label">Project</label>
                  <select className="form-select" value={submittalForm.project_id} onChange={e => setSubmittalForm(f => ({ ...f, project_id: e.target.value }))}>
                    <option value="">Select project...</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Submittal Number *</label>
                  <input className="form-input" value={submittalForm.submittal_number} onChange={e => setSubmittalForm(f => ({ ...f, submittal_number: e.target.value }))} placeholder="SUB-0012" required />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Title *</label>
                  <input className="form-input" value={submittalForm.title} onChange={e => setSubmittalForm(f => ({ ...f, title: e.target.value }))} placeholder="Structural Steel Shop Drawings" required />
                </div>
                <div>
                  <label className="form-label">Discipline</label>
                  <select className="form-select" value={submittalForm.discipline} onChange={e => setSubmittalForm(f => ({ ...f, discipline: e.target.value }))}>
                    {DISCIPLINE.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Spec Section</label>
                  <input className="form-input" value={submittalForm.spec_section} onChange={e => setSubmittalForm(f => ({ ...f, spec_section: e.target.value }))} placeholder="05 12 00" />
                </div>
                <div>
                  <label className="form-label">Revision #</label>
                  <input className="form-input" type="number" value={submittalForm.revision} onChange={e => setSubmittalForm(f => ({ ...f, revision: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Submitted By</label>
                  <input className="form-input" value={submittalForm.submitted_by} onChange={e => setSubmittalForm(f => ({ ...f, submitted_by: e.target.value }))} placeholder="Contractor / Sub-contractor" />
                </div>
                <div>
                  <label className="form-label">Reviewer (Architect/Engineer)</label>
                  <input className="form-input" value={submittalForm.reviewer} onChange={e => setSubmittalForm(f => ({ ...f, reviewer: e.target.value }))} placeholder="Lead Architect" />
                </div>
                <div>
                  <label className="form-label">Date Submitted</label>
                  <input className="form-input" type="date" value={submittalForm.submitted_date} onChange={e => setSubmittalForm(f => ({ ...f, submitted_date: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Response Required By</label>
                  <input className="form-input" type="date" value={submittalForm.required_date} onChange={e => setSubmittalForm(f => ({ ...f, required_date: e.target.value }))} />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Notes</label>
                  <textarea className="form-textarea" value={submittalForm.notes} onChange={e => setSubmittalForm(f => ({ ...f, notes: e.target.value }))} placeholder="Additional context, references..." />
                </div>
              </div>
              {error && <div style={{ padding: '10px', background: 'var(--red-dim)', border: '1px solid var(--red)', color: 'var(--red)', fontSize: '11px', marginTop: '12px' }}>{error}</div>}
              <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Submitting...' : 'Log Submittal'}</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Selected item detail */}
      {selected && tab === 'rfis' && (
        <div className="panel" style={{ marginBottom: '16px', borderColor: 'var(--accent-line)' }}>
          <div className="panel-header">
            <div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px', color: 'var(--accent)' }}>{selected.rfi_number}</span>
                <span className={`badge ${priorityColor[selected.priority]}`}>{selected.priority}</span>
                <span className={`badge ${rfiStatusColor[selected.status as RFIStatus]}`}>{selected.status.replace(/_/g, ' ')}</span>
              </div>
              <div className="panel-title" style={{ marginTop: '4px' }}>{selected.subject}</div>
              <div className="panel-sub">{selected.project?.name} · {selected.discipline} · {selected.raised_by}</div>
            </div>
            <button className="btn btn-secondary" onClick={() => setSelected(null)}>✕</button>
          </div>
          <div className="panel-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <div className="text-label" style={{ marginBottom: '8px' }}>Question</div>
                <div style={{ fontSize: '12px', color: 'var(--muted-2)', lineHeight: 1.7, padding: '12px', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                  {selected.question}
                </div>
                {selected.drawing_ref && (
                  <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--muted-2)' }}>
                    <span style={{ color: 'var(--muted)', fontFamily: 'var(--font-space-mono)', fontSize: '9px', textTransform: 'uppercase' }}>Ref: </span>{selected.drawing_ref}
                  </div>
                )}
                {selected.response && (
                  <div style={{ marginTop: '12px' }}>
                    <div className="text-label" style={{ marginBottom: '6px' }}>Response</div>
                    <div style={{ fontSize: '12px', color: 'var(--green)', lineHeight: 1.7, padding: '12px', background: 'rgba(46,204,138,0.06)', border: '1px solid rgba(46,204,138,0.2)' }}>
                      {selected.response}
                    </div>
                  </div>
                )}
              </div>
              <div>
                <div className="text-label" style={{ marginBottom: '8px' }}>Update Status</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  {RFI_STATUS.map(status => (
                    <button key={status} className={`btn ${selected.status === status ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ justifyContent: 'center', textTransform: 'capitalize', fontSize: '10px' }}
                      onClick={() => updateRFIStatus(selected.id, status)}
                      disabled={selected.status === status}>
                      {status.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
                <div style={{ marginTop: '12px' }}>
                  <table style={{ width: '100%' }}>
                    <tbody>
                      {[
                        ['Assigned To', selected.assigned_to || '—'],
                        ['Due Date', formatDate(selected.due_date)],
                        ['Responded', formatDate(selected.responded_at)],
                        ['Logged', formatDate(selected.created_at)],
                      ].map(([label, value]) => (
                        <tr key={label} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px', color: 'var(--muted)', padding: '6px 0', textTransform: 'uppercase', width: '100px' }}>{label}</td>
                          <td style={{ fontSize: '11px', color: 'var(--cream)', padding: '6px 0' }}>{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selected && tab === 'submittals' && (
        <div className="panel" style={{ marginBottom: '16px', borderColor: 'var(--accent-line)' }}>
          <div className="panel-header">
            <div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px', color: 'var(--accent)' }}>{selected.submittal_number}</span>
                <span className="badge badge-grey">Rev {selected.revision}</span>
                <span className={`badge ${submittalStatusColor[selected.status as SubmittalStatus]}`}>{selected.status.replace(/_/g, ' ')}</span>
              </div>
              <div className="panel-title" style={{ marginTop: '4px' }}>{selected.title}</div>
              <div className="panel-sub">{selected.project?.name} · {selected.discipline} · {selected.spec_section}</div>
            </div>
            <button className="btn btn-secondary" onClick={() => setSelected(null)}>✕</button>
          </div>
          <div className="panel-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                {selected.notes && (
                  <div style={{ padding: '12px', background: 'var(--surface-2)', border: '1px solid var(--border)', fontSize: '12px', color: 'var(--muted-2)', lineHeight: 1.7, marginBottom: '12px' }}>
                    {selected.notes}
                  </div>
                )}
                <table style={{ width: '100%' }}>
                  <tbody>
                    {[
                      ['Submitted By', selected.submitted_by || '—'],
                      ['Reviewer', selected.reviewer || '—'],
                      ['Submitted Date', formatDate(selected.submitted_date)],
                      ['Required By', formatDate(selected.required_date)],
                      ['Reviewed', formatDate(selected.reviewed_date)],
                    ].map(([label, value]) => (
                      <tr key={label} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px', color: 'var(--muted)', padding: '6px 0', textTransform: 'uppercase', width: '110px' }}>{label}</td>
                        <td style={{ fontSize: '11px', color: 'var(--cream)', padding: '6px 0' }}>{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div>
                <div className="text-label" style={{ marginBottom: '8px' }}>Review Decision</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {SUBMITTAL_STATUS.filter(s => s !== 'draft').map(status => (
                    <button key={status} className={`btn ${selected.status === status ? 'btn-primary' : 'btn-secondary'}`}
                      style={{
                        justifyContent: 'flex-start', textTransform: 'capitalize', fontSize: '10px',
                        borderColor: status === 'approved' ? 'rgba(46,204,138,0.3)' : status.includes('reject') || status === 'resubmit' ? 'rgba(255,77,77,0.3)' : undefined,
                      }}
                      onClick={() => updateSubmittalStatus(selected.id, status)}
                      disabled={selected.status === status}>
                      {selected.status === status ? '✓ ' : ''}{status.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {tab === 'rfis' && (
        <div className="panel">
          <div className="panel-header">
            <div><div className="panel-title">RFI LOG</div><div className="panel-sub">All requests for information · Click to view details</div></div>
            <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px', color: 'var(--muted)' }}>{filteredRFIs.length} records</span>
          </div>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr><th>RFI#</th><th>Subject</th><th>Project</th><th>Discipline</th><th>Priority</th><th>Assigned</th><th>Due</th><th>Status</th></tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={8} style={{ textAlign: 'center', padding: '20px', color: 'var(--muted)' }}>Loading...</td></tr>}
                {filteredRFIs.map(rfi => {
                  const isOverdue = rfi.due_date && new Date(rfi.due_date) < new Date() && !['closed', 'void', 'responded'].includes(rfi.status)
                  return (
                    <tr key={rfi.id} onClick={() => setSelected(selected?.id === rfi.id ? null : rfi)} style={{ cursor: 'pointer', background: selected?.id === rfi.id ? 'var(--accent-dim)' : undefined }}>
                      <td style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px', color: 'var(--accent)' }}>{rfi.rfi_number}</td>
                      <td className="strong" style={{ maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rfi.subject}</td>
                      <td style={{ color: 'var(--muted-2)', fontSize: '11px' }}>{rfi.project?.name ?? '—'}</td>
                      <td style={{ color: 'var(--muted-2)', fontSize: '11px', textTransform: 'capitalize' }}>{rfi.discipline}</td>
                      <td><span className={`badge ${priorityColor[rfi.priority]}`}>{rfi.priority}</span></td>
                      <td style={{ color: 'var(--muted-2)', fontSize: '11px' }}>{rfi.assigned_to || '—'}</td>
                      <td style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px', color: isOverdue ? 'var(--red)' : 'var(--muted-2)' }}>
                        {formatDate(rfi.due_date)}{isOverdue && ' ⚠'}
                      </td>
                      <td><span className={`badge ${rfiStatusColor[rfi.status as RFIStatus] ?? 'badge-grey'}`}>{rfi.status.replace(/_/g, ' ')}</span></td>
                    </tr>
                  )
                })}
                {!loading && filteredRFIs.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: 'var(--muted)' }}>No RFIs — raise one above</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'submittals' && (
        <div className="panel">
          <div className="panel-header">
            <div><div className="panel-title">SUBMITTAL LOG</div><div className="panel-sub">Shop drawings, product data, samples · Click to review</div></div>
            <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px', color: 'var(--muted)' }}>{filteredSubmittals.length} records</span>
          </div>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr><th>Sub#</th><th>Title</th><th>Project</th><th>Discipline</th><th>Spec</th><th>Rev</th><th>Submitted By</th><th>Required By</th><th>Status</th></tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={9} style={{ textAlign: 'center', padding: '20px', color: 'var(--muted)' }}>Loading...</td></tr>}
                {filteredSubmittals.map(sub => {
                  const isOverdue = sub.required_date && new Date(sub.required_date) < new Date() && !['approved', 'approved_as_noted'].includes(sub.status)
                  return (
                    <tr key={sub.id} onClick={() => setSelected(selected?.id === sub.id ? null : sub)} style={{ cursor: 'pointer', background: selected?.id === sub.id ? 'var(--accent-dim)' : undefined }}>
                      <td style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px', color: 'var(--accent)' }}>{sub.submittal_number}</td>
                      <td className="strong" style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub.title}</td>
                      <td style={{ color: 'var(--muted-2)', fontSize: '11px' }}>{sub.project?.name ?? '—'}</td>
                      <td style={{ color: 'var(--muted-2)', fontSize: '11px', textTransform: 'capitalize' }}>{sub.discipline}</td>
                      <td style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px', color: 'var(--muted)' }}>{sub.spec_section || '—'}</td>
                      <td style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px', color: 'var(--muted)' }}>{sub.revision}</td>
                      <td style={{ color: 'var(--muted-2)', fontSize: '11px' }}>{sub.submitted_by || '—'}</td>
                      <td style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px', color: isOverdue ? 'var(--red)' : 'var(--muted-2)' }}>
                        {formatDate(sub.required_date)}{isOverdue && ' ⚠'}
                      </td>
                      <td><span className={`badge ${submittalStatusColor[sub.status as SubmittalStatus] ?? 'badge-grey'}`}>{sub.status.replace(/_/g, ' ')}</span></td>
                    </tr>
                  )
                })}
                {!loading && filteredSubmittals.length === 0 && <tr><td colSpan={9} style={{ textAlign: 'center', padding: '30px', color: 'var(--muted)' }}>No submittals logged yet</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <style>{`@media(max-width:900px){.stat-grid-responsive{grid-template-columns:1fr 1fr!important;}}`}</style>
    </div>
  )
}
