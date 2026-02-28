'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CONTRACTOR_STATUS_LABELS, ISLAND_LABELS } from '@/lib/utils'
import type { Contractor, ContractorStatus, Island } from '@/types'

export default function ContractorsPage() {
  const [contractors, setContractors] = useState<Contractor[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', specialty: '', islands: [] as string[], email: '', phone: '', status: 'active', on_time_pct: '85', quality_score: '80', notes: '' })
  const supabase = createClient()

  async function load() {
    const { data } = await supabase.from('contractors').select('*').order('overall_score', { ascending: false })
    setContractors(data ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await supabase.from('contractors').insert({
      ...form,
      islands: form.islands,
      on_time_pct: parseInt(form.on_time_pct),
      quality_score: parseInt(form.quality_score),
    })
    setShowForm(false)
    load()
  }

  const toggleIsland = (island: string) => {
    setForm(f => ({
      ...f,
      islands: f.islands.includes(island) ? f.islands.filter(i => i !== island) : [...f.islands, island]
    }))
  }

  const statusColors: Record<string, string> = { preferred: 'badge-green', active: 'badge-blue', review: 'badge-amber', inactive: 'badge-grey' }

  return (
    <div>
      {showForm && (
        <div className="panel" style={{ marginBottom: '16px' }}>
          <div className="panel-header"><div className="panel-title">ADD CONTRACTOR</div></div>
          <div className="panel-body">
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><label className="form-label">Company Name *</label><input className="form-input" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} required /></div>
                <div><label className="form-label">Specialty *</label><input className="form-input" value={form.specialty} onChange={e => setForm(f => ({...f, specialty: e.target.value}))} placeholder="Structural, MEP, etc." required /></div>
                <div><label className="form-label">Email</label><input className="form-input" type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} /></div>
                <div><label className="form-label">Phone</label><input className="form-input" value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} /></div>
                <div><label className="form-label">Islands Operated</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                    {(['BRB','JAM','KYD','TTD'] as Island[]).map(island => (
                      <button type="button" key={island} onClick={() => toggleIsland(island)} className={`badge ${form.islands.includes(island) ? 'badge-blue' : 'badge-grey'}`} style={{ cursor: 'pointer', border: 'none', padding: '5px 10px' }}>
                        {island}
                      </button>
                    ))}
                  </div>
                </div>
                <div><label className="form-label">Status</label>
                  <select className="form-select" value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))}>
                    <option value="preferred">Preferred</option><option value="active">Active</option><option value="review">Under Review</option><option value="inactive">Inactive</option>
                  </select>
                </div>
                <div><label className="form-label">On-Time % (0-100)</label><input className="form-input" type="number" min="0" max="100" value={form.on_time_pct} onChange={e => setForm(f => ({...f, on_time_pct: e.target.value}))} /></div>
                <div><label className="form-label">Quality Score (0-100)</label><input className="form-input" type="number" min="0" max="100" value={form.quality_score} onChange={e => setForm(f => ({...f, quality_score: e.target.value}))} /></div>
                <div style={{ gridColumn: 'span 2' }}><label className="form-label">Notes</label><textarea className="form-textarea" value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} /></div>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                <button type="submit" className="btn btn-primary">Save Contractor</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="panel">
        <div className="panel-header">
          <div><div className="panel-title">CONTRACTOR PERFORMANCE INTELLIGENCE</div><div className="panel-sub">Regional network · Scored & verified</div></div>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>+ Add Contractor</button>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead><tr><th>Contractor</th><th>Specialty</th><th>Islands</th><th>On-Time %</th><th>Quality</th><th>Score</th><th>Status</th></tr></thead>
            <tbody>
              {loading && <tr><td colSpan={7} style={{ textAlign: 'center', padding: '20px', color: 'var(--muted)' }}>Loading...</td></tr>}
              {contractors.map(c => {
                const score = c.overall_score
                const scoreColor = score >= 88 ? 'var(--green)' : score >= 70 ? 'var(--accent)' : 'var(--amber)'
                return (
                  <tr key={c.id}>
                    <td className="strong">{c.name}</td>
                    <td style={{ color: 'var(--muted-2)' }}>{c.specialty}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {(c.islands ?? []).map((island: string) => (
                          <span key={island} className="badge badge-grey">{island}</span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <div>
                        <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '10px', color: 'var(--cream)' }}>{c.on_time_pct}%</span>
                        <div className="progress-wrap" style={{ marginTop: '3px' }}>
                          <div className={`progress-fill ${c.on_time_pct >= 88 ? 'progress-green' : c.on_time_pct >= 70 ? 'progress-accent' : 'progress-amber'}`} style={{ width: `${c.on_time_pct}%` }} />
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '10px', color: 'var(--cream)' }}>{c.quality_score}%</span>
                        <div className="progress-wrap" style={{ marginTop: '3px' }}>
                          <div className={`progress-fill ${c.quality_score >= 88 ? 'progress-green' : 'progress-accent'}`} style={{ width: `${c.quality_score}%` }} />
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '12px', fontWeight: 700, color: scoreColor }}>{score}/100</span>
                    </td>
                    <td><span className={`badge ${statusColors[c.status as string] ?? 'badge-grey'}`}>{CONTRACTOR_STATUS_LABELS[c.status as ContractorStatus] ?? c.status}</span></td>
                  </tr>
                )
              })}
              {!loading && !contractors.length && <tr><td colSpan={7} style={{ textAlign: 'center', padding: '20px', color: 'var(--muted)' }}>No contractors added yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
