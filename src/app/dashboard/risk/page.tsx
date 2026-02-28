'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Risk } from '@/types'

export default function RiskPage() {
  const [risks, setRisks] = useState<Risk[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ project_id: '', title: '', description: '', category: 'financial', likelihood: '2', impact: '2', mitigation: '' })
  const supabase = createClient()

  async function load() {
    const [{ data: r }, { data: p }] = await Promise.all([
      supabase.from('risks').select('*, project:projects(name)').eq('is_resolved', false).order('risk_score', { ascending: false }),
      supabase.from('projects').select('id, name'),
    ])
    setRisks(r ?? [])
    setProjects(p ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await supabase.from('risks').insert({
      ...form,
      project_id: form.project_id || null,
      likelihood: parseInt(form.likelihood),
      impact: parseInt(form.impact),
    })
    setShowForm(false)
    load()
  }

  async function resolveRisk(id: string) {
    await supabase.from('risks').update({ is_resolved: true, resolved_at: new Date().toISOString() }).eq('id', id)
    load()
  }

  // Build 5x5 heatmap
  const heatmap: { count: number; risks: Risk[] }[][] = Array(5).fill(null).map(() =>
    Array(5).fill(null).map(() => ({ count: 0, risks: [] }))
  )
  risks.forEach(r => {
    const row = 5 - r.likelihood // invert so high likelihood is at top
    const col = r.impact - 1
    if (row >= 0 && row < 5 && col >= 0 && col < 5) {
      heatmap[row][col].count++
      heatmap[row][col].risks.push(r)
    }
  })

  function getCellColor(likelihood: number, impact: number): string {
    const score = likelihood * impact
    if (score >= 15) return 'rgba(255,77,77,0.6)'
    if (score >= 9) return 'rgba(255,77,77,0.3)'
    if (score >= 5) return 'rgba(245,166,35,0.35)'
    if (score >= 3) return 'rgba(245,166,35,0.2)'
    return 'rgba(46,204,138,0.15)'
  }

  const categoryColors: Record<string, string> = {
    financial: 'badge-red', schedule: 'badge-amber', procurement: 'badge-amber',
    regulatory: 'badge-red', safety: 'badge-red', environmental: 'badge-blue', general: 'badge-grey'
  }

  return (
    <div>
      {showForm && (
        <div className="panel" style={{ marginBottom: '16px' }}>
          <div className="panel-header"><div className="panel-title">LOG RISK</div></div>
          <div className="panel-body">
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><label className="form-label">Project (optional)</label>
                  <select className="form-select" value={form.project_id} onChange={e => setForm(f => ({...f, project_id: e.target.value}))}>
                    <option value="">Portfolio-level risk</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div><label className="form-label">Category</label>
                  <select className="form-select" value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))}>
                    <option value="financial">Financial</option><option value="schedule">Schedule</option><option value="procurement">Procurement</option><option value="regulatory">Regulatory</option><option value="safety">Safety</option><option value="environmental">Environmental</option><option value="general">General</option>
                  </select>
                </div>
                <div style={{ gridColumn: 'span 2' }}><label className="form-label">Risk Title *</label><input className="form-input" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} required /></div>
                <div><label className="form-label">Likelihood (1-5)</label>
                  <select className="form-select" value={form.likelihood} onChange={e => setForm(f => ({...f, likelihood: e.target.value}))}>
                    <option value="1">1 — Rare</option><option value="2">2 — Unlikely</option><option value="3">3 — Possible</option><option value="4">4 — Likely</option><option value="5">5 — Almost Certain</option>
                  </select>
                </div>
                <div><label className="form-label">Impact (1-5)</label>
                  <select className="form-select" value={form.impact} onChange={e => setForm(f => ({...f, impact: e.target.value}))}>
                    <option value="1">1 — Negligible</option><option value="2">2 — Minor</option><option value="3">3 — Moderate</option><option value="4">4 — Major</option><option value="5">5 — Critical</option>
                  </select>
                </div>
                <div style={{ gridColumn: 'span 2' }}><label className="form-label">Description</label><textarea className="form-textarea" value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} /></div>
                <div style={{ gridColumn: 'span 2' }}><label className="form-label">Mitigation Plan</label><textarea className="form-textarea" value={form.mitigation} onChange={e => setForm(f => ({...f, mitigation: e.target.value}))} placeholder="Describe mitigation actions..." /></div>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
                <button type="submit" className="btn btn-primary">Log Risk</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '12px' }} className="grid-responsive">
        {/* Heatmap */}
        <div className="panel">
          <div className="panel-header">
            <div><div className="panel-title">RISK HEATMAP</div><div className="panel-sub">Likelihood vs Impact · Active risks only</div></div>
            <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>+ Log Risk</button>
          </div>
          <div className="panel-body">
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontFamily: 'var(--font-space-mono)', fontSize: '8px', color: 'var(--muted)', letterSpacing: '0.15em', textTransform: 'uppercase', paddingBottom: '4px' }}>LIKELIHOOD →</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '3px', marginBottom: '6px' }}>
                  {[5,4,3,2,1].map(likelihood =>
                    [1,2,3,4,5].map(impact => {
                      const row = 5 - likelihood
                      const col = impact - 1
                      const cell = heatmap[row][col]
                      return (
                        <div key={`${likelihood}-${impact}`} title={`L${likelihood}×I${impact}: ${cell.risks.map(r=>r.title).join(', ') || 'No risks'}`} style={{
                          aspectRatio: '1', background: getCellColor(likelihood, impact),
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: 'var(--font-space-mono)', fontSize: '10px', fontWeight: 700,
                          color: cell.count > 0 ? '#fff' : 'transparent',
                          border: cell.count > 0 ? '1px solid rgba(255,255,255,0.3)' : '1px solid transparent',
                          cursor: cell.count > 0 ? 'pointer' : 'default',
                          transition: 'opacity 0.15s',
                        }}>
                          {cell.count > 0 ? cell.count : ''}
                        </div>
                      )
                    })
                  )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '7px', color: 'var(--muted)' }}>LOW IMPACT</span>
                  <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '7px', color: 'var(--muted)' }}>IMPACT →</span>
                  <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '7px', color: 'var(--muted)' }}>CRITICAL</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Risk register */}
        <div className="panel">
          <div className="panel-header"><div><div className="panel-title">ACTIVE RISKS</div><div className="panel-sub">Ordered by score</div></div></div>
          <div style={{ padding: '0 12px 12px' }}>
            {loading && <div style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)' }}>Loading...</div>}
            {risks.map(r => (
              <div key={r.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '4px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--cream)', flex: 1 }}>{r.title}</div>
                  <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                    <span style={{
                      fontFamily: 'var(--font-space-mono)', fontSize: '11px', fontWeight: 700,
                      color: r.risk_score >= 12 ? 'var(--red)' : r.risk_score >= 6 ? 'var(--amber)' : 'var(--green)',
                      background: r.risk_score >= 12 ? 'var(--red-dim)' : r.risk_score >= 6 ? 'var(--amber-dim)' : 'var(--green-dim)',
                      padding: '2px 6px',
                    }}>
                      {r.risk_score}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '4px' }}>
                  <span className={`badge ${categoryColors[r.category] ?? 'badge-grey'}`}>{r.category}</span>
                  <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '8px', color: 'var(--muted)' }}>L{r.likelihood}×I{r.impact}</span>
                  {(r as any).project?.name && <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '8px', color: 'var(--accent)' }}>{(r as any).project.name}</span>}
                </div>
                {r.mitigation && <div style={{ fontSize: '10px', color: 'var(--muted-2)', marginBottom: '6px' }}><strong style={{ color: 'var(--muted)' }}>Mitigation: </strong>{r.mitigation}</div>}
                <button className="btn btn-secondary" style={{ height: '22px', padding: '0 8px', fontSize: '9px' }} onClick={() => resolveRisk(r.id)}>
                  Mark Resolved
                </button>
              </div>
            ))}
            {!loading && !risks.length && (
              <div className="alert-item alert-green" style={{ marginTop: '12px' }}>
                <div style={{ fontSize: '11px', color: 'var(--cream)' }}>No active risks logged</div>
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`@media(max-width:900px){.grid-responsive{grid-template-columns:1fr!important;}}`}</style>
    </div>
  )
}
