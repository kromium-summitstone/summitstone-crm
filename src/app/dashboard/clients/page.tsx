'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ISLAND_LABELS } from '@/lib/utils'
import type { Client, Island } from '@/types'

const ISLANDS: Island[] = ['BRB', 'KYD', 'JAM', 'TTD']
const CLIENT_TYPES = ['developer', 'investor', 'private', 'corporate', 'government']

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [form, setForm] = useState({ name: '', type: 'developer', email: '', phone: '', island: 'BRB', address: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  async function load() {
    const [{ data: c }, { data: p }] = await Promise.all([
      supabase.from('clients').select('*').order('name'),
      supabase.from('projects').select('id, name, client_id, stage, budget_usd').not('stage', 'eq', 'completed'),
    ])
    setClients(c ?? [])
    setProjects(p ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const { error: err } = await supabase.from('clients').insert({
      name: form.name,
      type: form.type,
      email: form.email || null,
      phone: form.phone || null,
      island: form.island || null,
      address: form.address || null,
      notes: form.notes || null,
    })
    setSaving(false)
    if (err) { setError(err.message); return }
    setShowForm(false)
    setForm({ name: '', type: 'developer', email: '', phone: '', island: 'BRB', address: '', notes: '' })
    load()
  }

  const typeColors: Record<string, string> = {
    developer: 'badge-blue', investor: 'badge-green', private: 'badge-grey',
    corporate: 'badge-amber', government: 'badge-red'
  }

  const clientProjects = (clientId: string) => projects.filter(p => p.client_id === clientId)
  const totalBudget = (clientId: string) => clientProjects(clientId).reduce((s, p) => s + (p.budget_usd ?? 0), 0)

  const formatCurrency = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)

  return (
    <div>
      {/* Header actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px' }} className="stat-grid-responsive">
          <div className="stat-card">
            <div className="text-label">Total Clients</div>
            <div className="stat-value text-accent" style={{ marginTop: '6px' }}>{clients.length}</div>
          </div>
          <div className="stat-card">
            <div className="text-label">Active Projects</div>
            <div className="stat-value" style={{ marginTop: '6px' }}>{projects.length}</div>
          </div>
          <div className="stat-card">
            <div className="text-label">Portfolio Value</div>
            <div className="stat-value" style={{ marginTop: '6px', fontSize: '22px' }}>{formatCurrency(projects.reduce((s, p) => s + (p.budget_usd ?? 0), 0))}</div>
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); setSelectedClient(null) }}>+ Add Client</button>
      </div>

      {/* Add client form */}
      {showForm && (
        <div className="panel" style={{ marginBottom: '16px' }}>
          <div className="panel-header"><div className="panel-title">NEW CLIENT</div></div>
          <div className="panel-body">
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Client Name *</label>
                  <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Reef Point Developments" required />
                </div>
                <div>
                  <label className="form-label">Client Type</label>
                  <select className="form-select" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                    {CLIENT_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Primary Island</label>
                  <select className="form-select" value={form.island} onChange={e => setForm(f => ({ ...f, island: e.target.value }))}>
                    {ISLANDS.map(i => <option key={i} value={i}>{ISLAND_LABELS[i]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="contact@company.com" />
                </div>
                <div>
                  <label className="form-label">Phone</label>
                  <input className="form-input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+1 246 555 0000" />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Address</label>
                  <input className="form-input" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Business address" />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Notes</label>
                  <textarea className="form-textarea" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Relationship notes, preferences..." />
                </div>
              </div>
              {error && <div style={{ padding: '10px 12px', background: 'var(--red-dim)', border: '1px solid var(--red)', color: 'var(--red)', fontSize: '11px', marginTop: '12px' }}>{error}</div>}
              <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Add Client'}</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Client detail drawer */}
      {selectedClient && (
        <div className="panel" style={{ marginBottom: '16px', borderColor: 'var(--accent-line)' }}>
          <div className="panel-header">
            <div>
              <div className="panel-title">{selectedClient.name}</div>
              <div className="panel-sub">{selectedClient.type} · {selectedClient.island ? ISLAND_LABELS[selectedClient.island] : '—'}</div>
            </div>
            <button className="btn btn-secondary" onClick={() => setSelectedClient(null)}>✕ Close</button>
          </div>
          <div className="panel-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <div className="text-label" style={{ marginBottom: '8px' }}>Contact Information</div>
                <div style={{ fontSize: '12px', color: 'var(--cream)', marginBottom: '4px' }}>{selectedClient.email || '—'}</div>
                <div style={{ fontSize: '12px', color: 'var(--muted-2)' }}>{selectedClient.phone || '—'}</div>
                {selectedClient.address && <div style={{ fontSize: '11px', color: 'var(--muted-2)', marginTop: '8px' }}>{selectedClient.address}</div>}
                {selectedClient.notes && (
                  <div style={{ marginTop: '12px', padding: '10px', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                    <div className="text-label" style={{ marginBottom: '4px' }}>Notes</div>
                    <div style={{ fontSize: '11px', color: 'var(--muted-2)', lineHeight: 1.6 }}>{selectedClient.notes}</div>
                  </div>
                )}
              </div>
              <div>
                <div className="text-label" style={{ marginBottom: '8px' }}>Active Projects ({clientProjects(selectedClient.id).length})</div>
                {clientProjects(selectedClient.id).length === 0
                  ? <div style={{ fontSize: '11px', color: 'var(--muted)' }}>No active projects</div>
                  : clientProjects(selectedClient.id).map(p => (
                    <div key={p.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                      <div style={{ fontSize: '12px', color: 'var(--cream)' }}>{p.name}</div>
                      <div style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px', color: 'var(--accent)' }}>{formatCurrency(p.budget_usd)}</div>
                    </div>
                  ))
                }
                {clientProjects(selectedClient.id).length > 0 && (
                  <div style={{ marginTop: '8px', fontFamily: 'var(--font-space-mono)', fontSize: '9px', color: 'var(--muted)' }}>
                    Total: {formatCurrency(totalBudget(selectedClient.id))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clients table */}
      <div className="panel">
        <div className="panel-header">
          <div><div className="panel-title">CLIENT DIRECTORY</div><div className="panel-sub">All relationships · Caribbean portfolio</div></div>
          <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px', color: 'var(--muted)' }}>{clients.length} clients</span>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Type</th>
                <th>Island</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Projects</th>
                <th>Portfolio</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={8} style={{ textAlign: 'center', padding: '20px', color: 'var(--muted)' }}>Loading...</td></tr>}
              {clients.map(client => (
                <tr key={client.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedClient(selectedClient?.id === client.id ? null : client)}>
                  <td className="strong">{client.name}</td>
                  <td><span className={`badge ${typeColors[client.type] ?? 'badge-grey'}`}>{client.type}</span></td>
                  <td>{client.island ? <span className="badge badge-blue">{ISLAND_LABELS[client.island as Island] ?? client.island}</span> : '—'}</td>
                  <td style={{ color: 'var(--muted-2)', fontSize: '11px' }}>{client.email || '—'}</td>
                  <td style={{ fontFamily: 'var(--font-space-mono)', fontSize: '10px', color: 'var(--muted-2)' }}>{client.phone || '—'}</td>
                  <td style={{ fontFamily: 'var(--font-space-mono)', fontSize: '11px', color: 'var(--accent)' }}>{clientProjects(client.id).length}</td>
                  <td style={{ fontFamily: 'var(--font-space-mono)', fontSize: '11px' }}>{totalBudget(client.id) > 0 ? formatCurrency(totalBudget(client.id)) : '—'}</td>
                  <td>
                    <button className="btn btn-secondary" style={{ height: '24px', padding: '0 8px', fontSize: '10px' }} onClick={() => setSelectedClient(selectedClient?.id === client.id ? null : client)}>
                      {selectedClient?.id === client.id ? 'Close' : 'View'}
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && clients.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: 'var(--muted)' }}>No clients yet — add your first client above</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`@media(max-width:900px){.stat-grid-responsive{grid-template-columns:1fr!important;}}`}</style>
    </div>
  )
}
