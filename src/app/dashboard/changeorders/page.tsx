'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate, CO_STATUS_LABELS, getStatusVariant } from '@/lib/utils'
import type { ChangeOrder, ChangeOrderStatus } from '@/types'

export default function ChangeOrdersPage() {
  const [cos, setCos] = useState<ChangeOrder[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ project_id: '', co_number: '', title: '', description: '', raised_by: '', value_usd: '', schedule_impact_days: '0', status: 'pending' })
  const supabase = createClient()

  async function load() {
    const [{ data: c }, { data: p }] = await Promise.all([
      supabase.from('change_orders').select('*, project:projects(name)').order('created_at', { ascending: false }),
      supabase.from('projects').select('id, name').not('stage', 'eq', 'completed'),
    ])
    setCos(c ?? [])
    setProjects(p ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await supabase.from('change_orders').insert({
      ...form,
      value_usd: parseFloat(form.value_usd) || 0,
      schedule_impact_days: parseInt(form.schedule_impact_days) || 0,
    })
    setShowForm(false)
    load()
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('change_orders').update({ status }).eq('id', id)
    load()
  }

  const pending = cos.filter(c => c.status === 'pending').length
  const pendingValue = cos.filter(c => c.status === 'pending').reduce((s, c) => s + (c.value_usd ?? 0), 0)
  const approvedValue = cos.filter(c => c.status === 'approved').reduce((s, c) => s + (c.value_usd ?? 0), 0)
  const disputedValue = cos.filter(c => c.status === 'disputed').reduce((s, c) => s + (c.value_usd ?? 0), 0)

  const statusClass: Record<string, string> = { pending: 'badge-amber', approved: 'badge-green', rejected: 'badge-grey', disputed: 'badge-red' }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '20px' }} className="stat-grid-responsive">
        <div className="stat-card"><div className="text-label">Open Change Orders</div><div className="stat-value text-amber" style={{ marginTop: '6px' }}>{pending}</div></div>
        <div className="stat-card"><div className="text-label">Value Pending</div><div className="stat-value" style={{ marginTop: '6px', fontSize: '24px' }}>{formatCurrency(pendingValue)}</div></div>
        <div className="stat-card"><div className="text-label">Approved YTD</div><div className="stat-value text-green" style={{ marginTop: '6px', fontSize: '24px' }}>{formatCurrency(approvedValue)}</div></div>
        <div className="stat-card"><div className="text-label">Disputed</div><div className="stat-value" style={{ color: 'var(--red)', marginTop: '6px', fontSize: '24px' }}>{formatCurrency(disputedValue)}</div></div>
      </div>

      {showForm && (
        <div className="panel" style={{ marginBottom: '16px' }}>
          <div className="panel-header"><div className="panel-title">RAISE CHANGE ORDER</div></div>
          <div className="panel-body">
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><label className="form-label">Project *</label>
                  <select className="form-select" value={form.project_id} onChange={e => setForm(f => ({...f, project_id: e.target.value}))} required>
                    <option value="">Select...</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div><label className="form-label">CO Number *</label><input className="form-input" value={form.co_number} onChange={e => setForm(f => ({...f, co_number: e.target.value}))} placeholder="CO-009" required /></div>
                <div style={{ gridColumn: 'span 2' }}><label className="form-label">Title *</label><input className="form-input" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} required /></div>
                <div><label className="form-label">Raised By</label><input className="form-input" value={form.raised_by} onChange={e => setForm(f => ({...f, raised_by: e.target.value}))} placeholder="Client / Site Team / Contractor" /></div>
                <div><label className="form-label">Value (USD)</label><input className="form-input" type="number" value={form.value_usd} onChange={e => setForm(f => ({...f, value_usd: e.target.value}))} placeholder="0" /></div>
                <div><label className="form-label">Schedule Impact (days)</label><input className="form-input" type="number" value={form.schedule_impact_days} onChange={e => setForm(f => ({...f, schedule_impact_days: e.target.value}))} /></div>
                <div><label className="form-label">Initial Status</label>
                  <select className="form-select" value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))}>
                    <option value="pending">Pending</option><option value="approved">Approved</option><option value="disputed">Disputed</option>
                  </select>
                </div>
                <div style={{ gridColumn: 'span 2' }}><label className="form-label">Description</label><textarea className="form-textarea" value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} /></div>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
                <button type="submit" className="btn btn-primary">Submit CO</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="panel">
        <div className="panel-header">
          <div><div className="panel-title">CHANGE ORDER LOG</div><div className="panel-sub">Full audit trail</div></div>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>+ Raise CO</button>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead><tr><th>CO#</th><th>Project</th><th>Raised By</th><th>Description</th><th>Value</th><th>Schedule</th><th>Date</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {loading && <tr><td colSpan={9} style={{ textAlign: 'center', padding: '20px', color: 'var(--muted)' }}>Loading...</td></tr>}
              {cos.map(co => (
                <tr key={co.id}>
                  <td style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px', color: 'var(--accent)' }}>{co.co_number}</td>
                  <td className="strong">{(co as any).project?.name}</td>
                  <td style={{ color: 'var(--muted-2)' }}>{co.raised_by}</td>
                  <td style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{co.title}</td>
                  <td style={{ fontFamily: 'var(--font-space-mono)', fontSize: '11px', color: co.value_usd > 0 ? 'var(--amber)' : 'var(--muted-2)' }}>+{formatCurrency(co.value_usd)}</td>
                  <td style={{ fontFamily: 'var(--font-space-mono)', fontSize: '10px', color: co.schedule_impact_days > 0 ? 'var(--amber)' : 'var(--muted)' }}>
                    {co.schedule_impact_days > 0 ? `+${co.schedule_impact_days}d` : '—'}
                  </td>
                  <td style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px' }}>{formatDate(co.created_at)}</td>
                  <td><span className={`badge ${statusClass[co.status as string] ?? 'badge-grey'}`}>{CO_STATUS_LABELS[co.status as ChangeOrderStatus] ?? co.status}</span></td>
                  <td>
                    {co.status === 'pending' && (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button className="btn btn-secondary" style={{ height: '24px', padding: '0 8px', fontSize: '10px' }} onClick={() => updateStatus(co.id, 'approved')}>Approve</button>
                        <button className="btn btn-danger" style={{ height: '24px', padding: '0 8px', fontSize: '10px' }} onClick={() => updateStatus(co.id, 'rejected')}>Reject</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {!loading && !cos.length && <tr><td colSpan={9} style={{ textAlign: 'center', padding: '20px', color: 'var(--muted)' }}>No change orders</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      <style>{`@media(max-width:900px){.stat-grid-responsive{grid-template-columns:1fr 1fr!important;}}`}</style>
    </div>
  )
}
