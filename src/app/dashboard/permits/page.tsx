'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDate, ISLAND_LABELS } from '@/lib/utils'
import type { Island } from '@/types'

const ISLAND_AUTHORITIES: Record<Island, string> = {
  BRB: 'Town & Country Planning · BSSI',
  KYD: 'Planning Department · DOE',
  JAM: 'NEPA · Parish Council',
  TTD: 'TCPD · EMA',
}

const STATUS_OPTIONS = ['not_started', 'submitted', 'under_review', 'approved', 'overdue', 'expired']
const ISLANDS: Island[] = ['BRB', 'KYD', 'JAM', 'TTD']

export default function PermitsPage() {
  const [permits, setPermits] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedPermit, setSelectedPermit] = useState<any>(null)
  const [form, setForm] = useState({
    project_id: '', title: '', authority: '', island: 'BRB',
    status: 'not_started', sequence_order: '1',
    submitted_date: '', approved_date: '', expiry_date: '', notes: ''
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  async function load() {
    const [{ data: p }, { data: pr }] = await Promise.all([
      supabase.from('permits').select('*, project:projects(name, island)').order('island').order('sequence_order'),
      supabase.from('projects').select('id, name, island').not('stage', 'eq', 'completed'),
    ])
    setPermits(p ?? [])
    setProjects(pr ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const { error: err } = await supabase.from('permits').insert({
      project_id: form.project_id || null,
      title: form.title,
      authority: form.authority,
      island: form.island,
      status: form.status,
      sequence_order: parseInt(form.sequence_order) || 1,
      submitted_date: form.submitted_date || null,
      approved_date: form.approved_date || null,
      expiry_date: form.expiry_date || null,
      notes: form.notes || null,
    })
    setSaving(false)
    if (err) { setError(err.message); return }
    setShowForm(false)
    setForm({ project_id: '', title: '', authority: '', island: 'BRB', status: 'not_started', sequence_order: '1', submitted_date: '', approved_date: '', expiry_date: '', notes: '' })
    load()
  }

  async function updateStatus(id: string, status: string) {
    const update: any = { status }
    if (status === 'submitted' && !permits.find(p => p.id === id)?.submitted_date) {
      update.submitted_date = new Date().toISOString().slice(0, 10)
    }
    if (status === 'approved') {
      update.approved_date = new Date().toISOString().slice(0, 10)
    }
    await supabase.from('permits').update(update).eq('id', id)
    setSelectedPermit(null)
    load()
  }

  const byIsland = ISLANDS.reduce((acc, island) => {
    acc[island] = permits.filter(p => p.island === island)
    return acc
  }, {} as Record<Island, any[]>)

  const overdue = permits.filter(p => p.status === 'overdue').length

  const statusClass: Record<string, string> = {
    approved: 'badge-green', submitted: 'badge-blue', under_review: 'badge-blue',
    overdue: 'badge-red', expired: 'badge-red', not_started: 'badge-grey'
  }

  function getStepStyle(status: string) {
    if (status === 'approved') return 'permit-step permit-step-done'
    if (status === 'overdue') return 'permit-step permit-step-overdue'
    if (['submitted', 'under_review'].includes(status)) return 'permit-step permit-step-active'
    return 'permit-step'
  }

  return (
    <div>
      {overdue > 0 && (
        <div className="alert-item alert-red" style={{ marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--cream)' }}>{overdue} permit{overdue > 1 ? 's' : ''} overdue — immediate action required</div>
            <div style={{ fontSize: '10px', color: 'var(--muted-2)', marginTop: '2px' }}>Construction may be suspended if not resolved promptly</div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>+ Log Permit</button>
      </div>

      {/* Add permit form */}
      {showForm && (
        <div className="panel" style={{ marginBottom: '16px' }}>
          <div className="panel-header"><div className="panel-title">LOG NEW PERMIT</div></div>
          <div className="panel-body">
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Permit Title *</label>
                  <input className="form-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Planning Permission" required />
                </div>
                <div>
                  <label className="form-label">Issuing Authority *</label>
                  <input className="form-input" value={form.authority} onChange={e => setForm(f => ({ ...f, authority: e.target.value }))} placeholder="Town & Country Planning" required />
                </div>
                <div>
                  <label className="form-label">Island</label>
                  <select className="form-select" value={form.island} onChange={e => setForm(f => ({ ...f, island: e.target.value }))}>
                    {ISLANDS.map(i => <option key={i} value={i}>{ISLAND_LABELS[i]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Project</label>
                  <select className="form-select" value={form.project_id} onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))}>
                    <option value="">Portfolio-level</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Sequence Order</label>
                  <input className="form-input" type="number" value={form.sequence_order} onChange={e => setForm(f => ({ ...f, sequence_order: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Status</label>
                  <select className="form-select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Submitted Date</label>
                  <input className="form-input" type="date" value={form.submitted_date} onChange={e => setForm(f => ({ ...f, submitted_date: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Approved Date</label>
                  <input className="form-input" type="date" value={form.approved_date} onChange={e => setForm(f => ({ ...f, approved_date: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Expiry Date</label>
                  <input className="form-input" type="date" value={form.expiry_date} onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))} />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Notes</label>
                  <textarea className="form-textarea" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
              </div>
              {error && <div style={{ padding: '10px', background: 'var(--red-dim)', border: '1px solid var(--red)', color: 'var(--red)', fontSize: '11px', marginTop: '12px' }}>{error}</div>}
              <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Log Permit'}</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Permit detail panel */}
      {selectedPermit && (
        <div className="panel" style={{ marginBottom: '16px', borderColor: 'var(--accent-line)' }}>
          <div className="panel-header">
            <div><div className="panel-title">{selectedPermit.title}</div><div className="panel-sub">{selectedPermit.authority} · {ISLAND_LABELS[selectedPermit.island as Island]}</div></div>
            <button className="btn btn-secondary" onClick={() => setSelectedPermit(null)}>✕ Close</button>
          </div>
          <div className="panel-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <table style={{ width: '100%' }}>
                  <tbody>
                    {[
                      ['Status', <span className={`badge ${statusClass[selectedPermit.status] ?? 'badge-grey'}`}>{selectedPermit.status.replace('_', ' ')}</span>],
                      ['Project', selectedPermit.project?.name || 'Portfolio-level'],
                      ['Sequence', selectedPermit.sequence_order],
                      ['Submitted', formatDate(selectedPermit.submitted_date)],
                      ['Approved', formatDate(selectedPermit.approved_date)],
                      ['Expires', formatDate(selectedPermit.expiry_date)],
                    ].map(([label, value]: any) => (
                      <tr key={label} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px', color: 'var(--muted)', padding: '7px 0', textTransform: 'uppercase', letterSpacing: '0.1em', width: '100px' }}>{label}</td>
                        <td style={{ fontSize: '11px', color: 'var(--cream)', padding: '7px 0' }}>{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {selectedPermit.notes && (
                  <div style={{ marginTop: '12px', padding: '10px', background: 'var(--surface-2)', border: '1px solid var(--border)', fontSize: '11px', color: 'var(--muted-2)', lineHeight: 1.6 }}>
                    {selectedPermit.notes}
                  </div>
                )}
              </div>
              <div>
                <div className="text-label" style={{ marginBottom: '10px' }}>Update Status</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {STATUS_OPTIONS.map(status => (
                    <button key={status} className={`btn ${selectedPermit.status === status ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ justifyContent: 'flex-start', textTransform: 'capitalize' }}
                      onClick={() => updateStatus(selectedPermit.id, status)}
                      disabled={selectedPermit.status === status}>
                      {status === selectedPermit.status ? '✓ ' : ''}{status.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }} className="grid-responsive">
        {ISLANDS.map(island => (
          <div key={island} className="panel">
            <div className="panel-header">
              <div>
                <div className="panel-title">{ISLAND_LABELS[island].toUpperCase()}</div>
                <div className="panel-sub">{ISLAND_AUTHORITIES[island]}</div>
              </div>
              <span className="badge badge-grey">{byIsland[island].length} permits</span>
            </div>
            <div className="panel-body">
              {loading && <div style={{ color: 'var(--muted)', fontSize: '11px' }}>Loading...</div>}
              {byIsland[island].map(permit => (
                <div key={permit.id}
                  onClick={() => setSelectedPermit(selectedPermit?.id === permit.id ? null : permit)}
                  style={{ display: 'flex', gap: '12px', padding: '10px 0', borderBottom: '1px solid var(--border)', alignItems: 'flex-start', cursor: 'pointer' }}>
                  <div className={getStepStyle(permit.status)} style={{ marginTop: '2px' }}>
                    {permit.status === 'approved' ? '✓' : permit.status === 'overdue' ? '!' : permit.sequence_order}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--cream)' }}>{permit.title}</div>
                    <div style={{ fontFamily: 'var(--font-space-mono)', fontSize: '8px', color: 'var(--muted)', letterSpacing: '0.1em', marginTop: '2px' }}>
                      {permit.authority}
                      {permit.approved_date && ` · Approved ${formatDate(permit.approved_date)}`}
                      {permit.submitted_date && !permit.approved_date && ` · Submitted ${formatDate(permit.submitted_date)}`}
                      {permit.expiry_date && ` · Expires ${formatDate(permit.expiry_date)}`}
                    </div>
                    {permit.project?.name && (
                      <div style={{ fontFamily: 'var(--font-space-mono)', fontSize: '8px', color: 'var(--accent)', marginTop: '2px' }}>{permit.project.name}</div>
                    )}
                  </div>
                  <span className={`badge ${statusClass[permit.status] ?? 'badge-grey'}`} style={{ flexShrink: 0 }}>
                    {permit.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
              {byIsland[island].length === 0 && !loading && (
                <div style={{ fontFamily: 'var(--font-space-mono)', fontSize: '8px', color: 'var(--muted)', textAlign: 'center', padding: '16px 0', letterSpacing: '0.1em' }}>
                  NO PERMITS LOGGED
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <style>{`@media(max-width:900px){.grid-responsive{grid-template-columns:1fr!important;}}`}</style>
    </div>
  )
}
