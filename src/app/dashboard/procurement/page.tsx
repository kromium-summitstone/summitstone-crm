'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatShortDate, getStatusVariant, SHIPMENT_STATUS_LABELS } from '@/lib/utils'
import type { Shipment, ShipmentStatus } from '@/types'

export default function ProcurementPage() {
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ project_id: '', reference: '', material: '', supplier: '', origin_location: '', destination_island: 'BRB', value_usd: '', eta_date: '', status: 'ordered', notes: '' })
  const supabase = createClient()

  async function load() {
    const [{ data: s }, { data: p }] = await Promise.all([
      supabase.from('shipments').select('*, project:projects(name)').order('created_at', { ascending: false }),
      supabase.from('projects').select('id, name').not('stage', 'eq', 'completed'),
    ])
    setShipments(s ?? [])
    setProjects(p ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function updateStatus(id: string, status: string) {
    await supabase.from('shipments').update({ status }).eq('id', id)
    load()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await supabase.from('shipments').insert({ ...form, value_usd: parseFloat(form.value_usd) || 0 })
    setShowForm(false)
    setForm({ project_id: '', reference: '', material: '', supplier: '', origin_location: '', destination_island: 'BRB', value_usd: '', eta_date: '', status: 'ordered', notes: '' })
    load()
  }

  const counts = { in_transit: 0, customs_hold: 0, delayed: 0, delivered: 0 }
  shipments.forEach(s => { if (counts[s.status as keyof typeof counts] !== undefined) counts[s.status as keyof typeof counts]++ })

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '20px' }} className="stat-grid-responsive">
        <div className="stat-card"><div className="text-label">Active Shipments</div><div className="stat-value text-accent" style={{ marginTop: '6px' }}>{shipments.filter(s => s.status !== 'delivered').length}</div></div>
        <div className="stat-card"><div className="text-label">In Transit</div><div className="stat-value" style={{ marginTop: '6px' }}>{counts.in_transit}</div></div>
        <div className="stat-card"><div className="text-label">Customs Hold</div><div className="stat-value text-amber" style={{ marginTop: '6px' }}>{counts.customs_hold}</div></div>
        <div className="stat-card"><div className="text-label">Delayed</div><div className="stat-value" style={{ color: 'var(--red)', marginTop: '6px' }}>{counts.delayed}</div></div>
      </div>

      {showForm && (
        <div className="panel" style={{ marginBottom: '16px' }}>
          <div className="panel-header"><div className="panel-title">LOG SHIPMENT</div></div>
          <div className="panel-body">
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><label className="form-label">Project</label>
                  <select className="form-select" value={form.project_id} onChange={e => setForm(f => ({...f, project_id: e.target.value}))} required>
                    <option value="">Select project...</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div><label className="form-label">Reference *</label><input className="form-input" value={form.reference} onChange={e => setForm(f => ({...f, reference: e.target.value}))} placeholder="SHP-0041" required /></div>
                <div><label className="form-label">Material *</label><input className="form-input" value={form.material} onChange={e => setForm(f => ({...f, material: e.target.value}))} placeholder="Structural Steel" required /></div>
                <div><label className="form-label">Supplier *</label><input className="form-input" value={form.supplier} onChange={e => setForm(f => ({...f, supplier: e.target.value}))} placeholder="US Steel Corp" required /></div>
                <div><label className="form-label">Origin</label><input className="form-input" value={form.origin_location} onChange={e => setForm(f => ({...f, origin_location: e.target.value}))} placeholder="Miami, FL" /></div>
                <div><label className="form-label">Destination Island</label>
                  <select className="form-select" value={form.destination_island} onChange={e => setForm(f => ({...f, destination_island: e.target.value}))}>
                    <option value="BRB">Barbados</option><option value="JAM">Jamaica</option><option value="KYD">Cayman Islands</option><option value="TTD">Trinidad & Tobago</option>
                  </select>
                </div>
                <div><label className="form-label">Value (USD)</label><input className="form-input" type="number" value={form.value_usd} onChange={e => setForm(f => ({...f, value_usd: e.target.value}))} placeholder="184000" /></div>
                <div><label className="form-label">ETA Date</label><input className="form-input" type="date" value={form.eta_date} onChange={e => setForm(f => ({...f, eta_date: e.target.value}))} /></div>
                <div><label className="form-label">Status</label>
                  <select className="form-select" value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))}>
                    <option value="ordered">Ordered</option><option value="in_transit">In Transit</option><option value="customs_hold">Customs Hold</option><option value="delivered">Delivered</option><option value="delayed">Delayed</option>
                  </select>
                </div>
                <div><label className="form-label">Notes</label><input className="form-input" value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} placeholder="Optional notes" /></div>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                <button type="submit" className="btn btn-primary">Save Shipment</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="panel">
        <div className="panel-header">
          <div><div className="panel-title">MULTI-ISLAND IMPORT TRACKER</div><div className="panel-sub">All procurement · Live shipment status</div></div>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Log Shipment</button>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead><tr><th>Ref</th><th>Material</th><th>Supplier</th><th>Origin</th><th>Destination</th><th>Project</th><th>Value</th><th>ETA</th><th>Status</th><th>Update</th></tr></thead>
            <tbody>
              {loading && <tr><td colSpan={9} style={{ textAlign: 'center', padding: '20px', color: 'var(--muted)' }}>Loading...</td></tr>}
              {!loading && shipments.map(s => {
                const v = getStatusVariant(s.status)
                return (
                  <tr key={s.id}>
                    <td style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px', color: 'var(--accent)' }}>{s.reference}</td>
                    <td className="strong">{s.material}</td>
                    <td style={{ color: 'var(--muted-2)' }}>{s.supplier}</td>
                    <td style={{ color: 'var(--muted-2)' }}>{s.origin_location}</td>
                    <td><span className="badge badge-blue">{s.destination_island}</span></td>
                    <td style={{ color: 'var(--muted-2)' }}>{(s as any).project?.name ?? '—'}</td>
                    <td style={{ fontFamily: 'var(--font-space-mono)', fontSize: '11px' }}>{formatCurrency(s.value_usd)}</td>
                    <td style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px' }}>{formatShortDate(s.eta_date)}</td>
                    <td><span className={`badge badge-${v}`}>{SHIPMENT_STATUS_LABELS[s.status as ShipmentStatus] ?? s.status}</span></td>
                    <td>
                      <select style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--muted-2)', fontSize: '9px', padding: '3px 6px', fontFamily: 'var(--font-space-mono)', cursor: 'pointer' }}
                        value={s.status} onChange={e => updateStatus(s.id, e.target.value)}>
                        <option value="ordered">Ordered</option>
                        <option value="in_transit">In Transit</option>
                        <option value="customs_hold">Customs Hold</option>
                        <option value="delayed">Delayed</option>
                        <option value="delivered">Delivered</option>
                      </select>
                    </td>
                  </tr>
                )
              })}
              {!loading && !shipments.length && <tr><td colSpan={9} style={{ textAlign: 'center', padding: '20px', color: 'var(--muted)' }}>No shipments logged</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      <style>{`@media(max-width:900px){.stat-grid-responsive{grid-template-columns:1fr 1fr!important;}}`}</style>
    </div>
  )
}
