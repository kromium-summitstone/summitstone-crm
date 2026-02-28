'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewProjectPage() {
  const [clients, setClients] = useState<any[]>([])
  const [form, setForm] = useState({
    name: '', code: '', island: 'BRB', type: 'residential',
    stage: 'lead', contract_type: 'fixed',
    budget_usd: '', start_date: '', target_end_date: '',
    description: '', address: '', client_id: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.from('clients').select('id, name').order('name').then(({ data }) => setClients(data ?? []))
  }, [])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { data: { user } } = await supabase.auth.getUser()
    const { error: err } = await supabase.from('projects').insert({
      name: form.name,
      code: form.code || null,
      island: form.island,
      type: form.type,
      stage: form.stage,
      contract_type: form.contract_type,
      budget_usd: parseFloat(form.budget_usd) || 0,
      start_date: form.start_date || null,
      target_end_date: form.target_end_date || null,
      description: form.description || null,
      address: form.address || null,
      client_id: form.client_id || null,
    })
    if (err) { setError(err.message); setLoading(false) }
    else router.push('/dashboard/pipeline')
  }

  return (
    <div style={{ maxWidth: '680px' }}>
      <div style={{ marginBottom: '16px' }}>
        <Link href="/dashboard/pipeline" style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px', color: 'var(--muted)', letterSpacing: '0.12em', textDecoration: 'none', textTransform: 'uppercase' }}>
          ← Pipeline
        </Link>
      </div>
      <div className="panel">
        <div className="panel-header">
          <div><div className="panel-title">NEW PROJECT</div><div className="panel-sub">Add to pipeline</div></div>
        </div>
        <div className="panel-body">
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Project Name *</label>
                <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Coral Ridge Estate" required />
              </div>
              <div>
                <label className="form-label">Project Code</label>
                <input className="form-input" value={form.code} onChange={e => set('code', e.target.value)} placeholder="CRE-001" />
              </div>
              <div>
                <label className="form-label">Client</label>
                <select className="form-select" value={form.client_id} onChange={e => set('client_id', e.target.value)}>
                  <option value="">No client linked</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Island *</label>
                <select className="form-select" value={form.island} onChange={e => set('island', e.target.value)}>
                  <option value="BRB">Barbados</option>
                  <option value="JAM">Jamaica</option>
                  <option value="KYD">Cayman Islands</option>
                  <option value="TTD">Trinidad &amp; Tobago</option>
                </select>
              </div>
              <div>
                <label className="form-label">Project Type *</label>
                <select className="form-select" value={form.type} onChange={e => set('type', e.target.value)}>
                  <option value="residential">Residential</option>
                  <option value="commercial">Commercial</option>
                  <option value="hospitality">Hospitality</option>
                  <option value="mixed_use">Mixed-Use</option>
                  <option value="design_build">Design-Build</option>
                </select>
              </div>
              <div>
                <label className="form-label">Pipeline Stage</label>
                <select className="form-select" value={form.stage} onChange={e => set('stage', e.target.value)}>
                  <option value="lead">Lead</option>
                  <option value="proposal">Proposal</option>
                  <option value="pre_construction">Pre-Construction</option>
                  <option value="in_construction">In Construction</option>
                  <option value="handover">Handover</option>
                </select>
              </div>
              <div>
                <label className="form-label">Contract Type</label>
                <select className="form-select" value={form.contract_type} onChange={e => set('contract_type', e.target.value)}>
                  <option value="fixed">Fixed Price</option>
                  <option value="cost_plus">Cost Plus</option>
                  <option value="management_fee">Management Fee</option>
                  <option value="joint_venture">Joint Venture</option>
                </select>
              </div>
              <div>
                <label className="form-label">Budget (USD) *</label>
                <input className="form-input" type="number" value={form.budget_usd} onChange={e => set('budget_usd', e.target.value)} placeholder="4200000" required />
              </div>
              <div>
                <label className="form-label">Start Date</label>
                <input className="form-input" type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} />
              </div>
              <div>
                <label className="form-label">Target End Date</label>
                <input className="form-input" type="date" value={form.target_end_date} onChange={e => set('target_end_date', e.target.value)} />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Address</label>
                <input className="form-input" value={form.address} onChange={e => set('address', e.target.value)} placeholder="St. James Parish, Barbados" />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Description</label>
                <textarea className="form-textarea" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Project overview..." />
              </div>
            </div>

            {error && (
              <div style={{ background: 'var(--red-dim)', border: '1px solid rgba(255,77,77,0.3)', padding: '10px 12px', marginTop: '14px', fontSize: '11px', color: 'var(--red)', lineHeight: 1.5 }}>
                <strong>Error:</strong> {error}
                {error.includes('row-level security') && (
                  <div style={{ marginTop: '6px', color: 'var(--muted-2)' }}>
                    Your user profile needs a staff role. Run the RLS fix SQL in your Supabase dashboard.
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Creating...' : 'Create Project'}</button>
              <button type="button" className="btn btn-secondary" onClick={() => router.back()}>Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
