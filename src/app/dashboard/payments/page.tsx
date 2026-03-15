'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils'

const STATUS_OPTIONS = ['scheduled', 'upcoming', 'paid', 'overdue', 'pending_permit']

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState('all')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    project_id: '', title: '', amount_usd: '', due_date: '',
    paid_date: '', status: 'scheduled', notes: '',
  })
  const supabase = createClient()

  async function load() {
    const [{ data: p }, { data: proj }] = await Promise.all([
      supabase.from('payments').select('*, project:projects(name)').order('due_date'),
      supabase.from('projects').select('id, name').not('stage', 'eq', 'completed'),
    ])
    setPayments(p ?? [])
    setProjects(proj ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await supabase.from('payments').insert({
      project_id: form.project_id || null,
      title: form.title,
      amount_usd: parseFloat(form.amount_usd) || 0,
      due_date: form.due_date || null,
      paid_date: form.paid_date || null,
      status: form.status,
    })
    setSaving(false)
    setShowForm(false)
    setForm({ project_id: '', title: '', amount_usd: '', due_date: '', paid_date: '', status: 'scheduled', notes: '' })
    load()
  }

  async function markPaid(id: string) {
    await supabase.from('payments').update({ status: 'paid', paid_date: new Date().toISOString().slice(0, 10) }).eq('id', id)
    load()
  }

  const filtered = filter === 'all' ? payments : payments.filter(p => p.status === filter)

  const received = payments.filter(p => p.status === 'paid').reduce((s, p) => s + (p.amount_usd ?? 0), 0)
  const upcoming = payments.filter(p => p.status === 'upcoming').reduce((s, p) => s + (p.amount_usd ?? 0), 0)
  const overdue = payments.filter(p => p.status === 'overdue').reduce((s, p) => s + (p.amount_usd ?? 0), 0)
  const outstanding = payments.filter(p => p.status !== 'paid').reduce((s, p) => s + (p.amount_usd ?? 0), 0)

  const statusClass: Record<string, string> = {
    paid: 'badge-green', upcoming: 'badge-amber', scheduled: 'badge-grey',
    overdue: 'badge-red', pending_permit: 'badge-grey',
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '20px' }} className="stat-grid-responsive">
        <div className="stat-card"><div className="text-label">Received This Period</div><div className="stat-value text-green" style={{ marginTop: '6px', fontSize: '26px' }}>{formatCurrency(received)}</div></div>
        <div className="stat-card"><div className="text-label">Due Next 30 Days</div><div className="stat-value text-accent" style={{ marginTop: '6px', fontSize: '26px' }}>{formatCurrency(upcoming)}</div></div>
        <div className="stat-card"><div className="text-label">Overdue</div><div className="stat-value text-amber" style={{ marginTop: '6px', fontSize: '26px' }}>{formatCurrency(overdue)}<div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '4px' }}>{payments.filter(p => p.status === 'overdue').length} payment{payments.filter(p => p.status === 'overdue').length !== 1 ? 's' : ''}</div></div></div>
        <div className="stat-card"><div className="text-label">Total Outstanding</div><div className="stat-value" style={{ marginTop: '6px', fontSize: '26px' }}>{formatCurrency(outstanding)}</div></div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '4px' }}>
          {['all', ...STATUS_OPTIONS].map(s => (
            <button key={s} onClick={() => setFilter(s)} style={{
              padding: '5px 12px', background: filter === s ? 'var(--accent)' : 'var(--surface-2)',
              border: `1px solid ${filter === s ? 'var(--accent)' : 'var(--border)'}`,
              color: filter === s ? '#fff' : 'var(--muted-2)',
              fontFamily: 'var(--font-space-mono)', fontSize: '8px', letterSpacing: '0.1em',
              textTransform: 'uppercase', cursor: 'pointer',
            }}>{s === 'all' ? 'All' : s.replace('_', ' ')}</button>
          ))}
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>+ Add Payment</button>
      </div>

      {showForm && (
        <div className="panel" style={{ marginBottom: '16px' }}>
          <div className="panel-header"><div className="panel-title">ADD PAYMENT MILESTONE</div></div>
          <div className="panel-body">
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label">Project</label>
                  <select className="form-select" value={form.project_id} onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))}>
                    <option value="">Portfolio / General</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Milestone Title *</label>
                  <input className="form-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Structural Frame Complete" required />
                </div>
                <div>
                  <label className="form-label">Amount (USD) *</label>
                  <input className="form-input" type="number" value={form.amount_usd} onChange={e => setForm(f => ({ ...f, amount_usd: e.target.value }))} required />
                </div>
                <div>
                  <label className="form-label">Status</label>
                  <select className="form-select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Due Date</label>
                  <input className="form-input" type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Paid Date</label>
                  <input className="form-input" type="date" value={form.paid_date} onChange={e => setForm(f => ({ ...f, paid_date: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Add Payment'}</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="panel">
        <div className="panel-header">
          <div><div className="panel-title">PAYMENT SCHEDULE MONITOR</div><div className="panel-sub">Milestone-based disbursements · All contracts</div></div>
          <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px', color: 'var(--muted)' }}>{filtered.length} records</span>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead><tr><th>Milestone</th><th>Project</th><th>Amount</th><th>Due Date</th><th>Paid Date</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {loading && <tr><td colSpan={7} style={{ textAlign: 'center', padding: '20px', color: 'var(--muted)' }}>Loading...</td></tr>}
              {filtered.map(p => (
                <tr key={p.id}>
                  <td className="strong">{p.title}</td>
                  <td style={{ color: 'var(--muted-2)', fontSize: '11px' }}>{p.project?.name ?? '—'}</td>
                  <td style={{ fontFamily: 'var(--font-space-mono)', fontSize: '11px' }}>{formatCurrency(p.amount_usd)}</td>
                  <td style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px', color: p.status === 'overdue' ? 'var(--red)' : 'var(--muted-2)' }}>{formatDate(p.due_date)}</td>
                  <td style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px', color: p.paid_date ? 'var(--green)' : 'var(--muted)' }}>{formatDate(p.paid_date)}</td>
                  <td><span className={`badge ${statusClass[p.status as string] ?? 'badge-grey'}`}>{p.status?.replace('_', ' ')}</span></td>
                  <td>
                    {p.status !== 'paid' && (
                      <button className="panel-action" style={{ cursor: 'pointer', background: 'none', border: 'none' }}
                        onClick={() => markPaid(p.id)}>Mark Paid →</button>
                    )}
                  </td>
                </tr>
              ))}
              {!loading && !filtered.length && <tr><td colSpan={7} style={{ textAlign: 'center', padding: '20px', color: 'var(--muted)' }}>No payments in this category</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      <style>{`@media(max-width:900px){.stat-grid-responsive{grid-template-columns:1fr 1fr!important;}}`}</style>
    </div>
  )
}
