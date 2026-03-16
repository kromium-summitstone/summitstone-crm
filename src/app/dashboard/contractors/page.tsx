'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ISLAND_LABELS } from '@/lib/utils'
import type { Island } from '@/types'

const ISLANDS: Island[] = ['BRB', 'JAM', 'KYD', 'TTD']

function ScoreRing({ value, color }: { value: number; color: string }) {
  const r = 22, circ = 2 * Math.PI * r
  const dash = (value / 100) * circ
  return (
    <svg width="56" height="56" viewBox="0 0 56 56">
      <circle cx="28" cy="28" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="4" />
      <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="4"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 28 28)" style={{ transition: 'stroke-dasharray 0.5s' }} />
      <text x="28" y="33" textAnchor="middle" fill={color}
        style={{ fontFamily: 'var(--font-bebas)', fontSize: '15px', letterSpacing: '0.04em' }}>{value}</text>
    </svg>
  )
}

export default function ContractorsPage() {
  const [contractors, setContractors] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState<any>(null)
  const [tab, setTab] = useState<'directory' | 'performance' | 'comparison'>('directory')
  const [form, setForm] = useState({
    name: '', specialty: '', islands: [] as string[], email: '', phone: '',
    status: 'active', on_time_pct: '85', quality_score: '80', notes: '',
    hourly_rate_usd: '', established_year: '',
  })
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  async function load() {
    const [{ data: c }, { data: p }] = await Promise.all([
      supabase.from('contractors').select('*').order('overall_score', { ascending: false }),
      supabase.from('projects').select('id, name, island, stage'),
    ])
    setContractors(c ?? [])
    setProjects(p ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await supabase.from('contractors').insert({
      name: form.name, specialty: form.specialty, islands: form.islands,
      email: form.email || null, phone: form.phone || null,
      status: form.status, on_time_pct: parseInt(form.on_time_pct),
      quality_score: parseInt(form.quality_score),
      notes: form.notes || null,
      hourly_rate_usd: form.hourly_rate_usd ? parseFloat(form.hourly_rate_usd) : null,
      established_year: form.established_year ? parseInt(form.established_year) : null,
    })
    setSaving(false)
    setShowForm(false)
    setForm({ name: '', specialty: '', islands: [], email: '', phone: '', status: 'active', on_time_pct: '85', quality_score: '80', notes: '', hourly_rate_usd: '', established_year: '' })
    load()
  }

  const toggleIsland = (island: string) =>
    setForm(f => ({ ...f, islands: f.islands.includes(island) ? f.islands.filter(i => i !== island) : [...f.islands, island] }))

  const statusColors: Record<string, string> = {
    preferred: 'badge-green', active: 'badge-blue', review: 'badge-amber', inactive: 'badge-grey'
  }

  const scoreColor = (s: number) => s >= 88 ? 'var(--green)' : s >= 75 ? 'var(--amber)' : 'var(--red)'
  const scoreLabel = (s: number) => s >= 90 ? 'Excellent' : s >= 80 ? 'Good' : s >= 70 ? 'Satisfactory' : 'Needs Review'

  // Performance tier breakdown for comparison tab
  const tierGroups = {
    preferred: contractors.filter(c => c.status === 'preferred'),
    active: contractors.filter(c => c.status === 'active'),
    review: contractors.filter(c => c.status === 'review'),
  }

  // Island coverage matrix
  const islandCoverage = ISLANDS.map(island => ({
    island,
    contractors: contractors.filter(c => Array.isArray(c.islands) && c.islands.includes(island)),
  }))

  return (
    <div>
      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '20px' }} className="stat-grid-responsive">
        <div className="stat-card">
          <div className="text-label">Total Contractors</div>
          <div className="stat-value text-accent" style={{ marginTop: '6px' }}>{contractors.length}</div>
          <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '4px' }}>{contractors.filter(c => c.status === 'preferred').length} preferred partners</div>
        </div>
        <div className="stat-card">
          <div className="text-label">Avg Quality Score</div>
          <div className="stat-value" style={{ marginTop: '6px', color: 'var(--green)' }}>
            {contractors.length > 0 ? Math.round(contractors.reduce((s, c) => s + (c.quality_score ?? 0), 0) / contractors.length) : '—'}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '4px' }}>Portfolio average</div>
        </div>
        <div className="stat-card">
          <div className="text-label">Avg On-Time Rate</div>
          <div className="stat-value" style={{ marginTop: '6px', color: 'var(--amber)' }}>
            {contractors.length > 0 ? Math.round(contractors.reduce((s, c) => s + (c.on_time_pct ?? 0), 0) / contractors.length) : '—'}%
          </div>
          <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '4px' }}>Milestone delivery</div>
        </div>
        <div className="stat-card">
          <div className="text-label">Under Review</div>
          <div className="stat-value" style={{ marginTop: '6px', color: contractors.filter(c => c.status === 'review').length > 0 ? 'var(--red)' : 'var(--green)' }}>
            {contractors.filter(c => c.status === 'review').length}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '4px' }}>Flagged for review</div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '2px', borderBottom: '1px solid var(--border)' }}>
          {(['directory', 'performance', 'comparison'] as const).map(t => (
            <button key={t} onClick={() => { setTab(t); setSelected(null) }} style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: '8px 18px',
              fontFamily: 'var(--font-space-mono)', fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase',
              color: tab === t ? 'var(--cream)' : 'var(--muted)',
              borderBottom: `2px solid ${tab === t ? 'var(--accent)' : 'transparent'}`,
            }}>
              {t === 'directory' ? 'Directory' : t === 'performance' ? 'Performance Intelligence' : 'Comparison Matrix'}
            </button>
          ))}
        </div>
        <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); setSelected(null) }}>+ Add Contractor</button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="panel" style={{ marginBottom: '16px' }}>
          <div className="panel-header"><div className="panel-title">REGISTER CONTRACTOR</div></div>
          <div className="panel-body">
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><label className="form-label">Company Name *</label><input className="form-input" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} required /></div>
                <div><label className="form-label">Trade / Specialty *</label><input className="form-input" value={form.specialty} onChange={e => setForm(f => ({...f, specialty: e.target.value}))} placeholder="Structural, MEP, Civil..." required /></div>
                <div><label className="form-label">Email</label><input className="form-input" type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} /></div>
                <div><label className="form-label">Phone</label><input className="form-input" value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} /></div>
                <div><label className="form-label">Est. Hourly Rate (USD)</label><input className="form-input" type="number" value={form.hourly_rate_usd} onChange={e => setForm(f => ({...f, hourly_rate_usd: e.target.value}))} /></div>
                <div><label className="form-label">Year Established</label><input className="form-input" type="number" value={form.established_year} onChange={e => setForm(f => ({...f, established_year: e.target.value}))} placeholder="e.g. 2008" /></div>
                <div>
                  <label className="form-label">Islands Operated</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                    {ISLANDS.map(island => (
                      <button type="button" key={island} onClick={() => toggleIsland(island)}
                        className={`badge ${form.islands.includes(island) ? 'badge-blue' : 'badge-grey'}`}
                        style={{ cursor: 'pointer', border: 'none', padding: '5px 10px' }}>
                        {island}
                      </button>
                    ))}
                  </div>
                </div>
                <div><label className="form-label">Status</label>
                  <select className="form-select" value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))}>
                    <option value="preferred">Preferred Partner</option>
                    <option value="active">Active</option>
                    <option value="review">Under Review</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div><label className="form-label">On-Time Delivery % (0–100)</label><input className="form-input" type="number" min="0" max="100" value={form.on_time_pct} onChange={e => setForm(f => ({...f, on_time_pct: e.target.value}))} /></div>
                <div><label className="form-label">Quality Score (0–100)</label><input className="form-input" type="number" min="0" max="100" value={form.quality_score} onChange={e => setForm(f => ({...f, quality_score: e.target.value}))} /></div>
                <div style={{ gridColumn: 'span 2' }}><label className="form-label">Notes</label><textarea className="form-textarea" value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} /></div>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Register Contractor'}</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contractor Detail Drawer */}
      {selected && (
        <div className="panel" style={{ marginBottom: '16px', borderColor: 'var(--accent-line)' }}>
          <div className="panel-header">
            <div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                <span className={`badge ${statusColors[selected.status]}`}>{selected.status}</span>
                <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px', color: 'var(--muted)' }}>{selected.specialty}</span>
                {(selected.islands ?? []).map((i: string) => <span key={i} className="badge badge-grey" style={{ fontSize: '9px' }}>{i}</span>)}
              </div>
              <div className="panel-title">{selected.name}</div>
            </div>
            <button className="btn btn-secondary" onClick={() => setSelected(null)}>✕</button>
          </div>
          <div className="panel-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr', gap: '24px', alignItems: 'start' }}>
              {/* Score rings */}
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <ScoreRing value={selected.on_time_pct ?? 0} color={scoreColor(selected.on_time_pct ?? 0)} />
                  <div style={{ fontFamily: 'var(--font-space-mono)', fontSize: '7px', color: 'var(--muted)', marginTop: '3px', textTransform: 'uppercase' }}>On-Time</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <ScoreRing value={selected.quality_score ?? 0} color={scoreColor(selected.quality_score ?? 0)} />
                  <div style={{ fontFamily: 'var(--font-space-mono)', fontSize: '7px', color: 'var(--muted)', marginTop: '3px', textTransform: 'uppercase' }}>Quality</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <ScoreRing value={selected.overall_score ?? 0} color={scoreColor(selected.overall_score ?? 0)} />
                  <div style={{ fontFamily: 'var(--font-space-mono)', fontSize: '7px', color: 'var(--muted)', marginTop: '3px', textTransform: 'uppercase' }}>Overall</div>
                </div>
              </div>
              {/* Contact & details */}
              <table style={{ width: '100%' }}>
                <tbody>
                  {[
                    ['Rating', scoreLabel(selected.overall_score ?? 0)],
                    ['Email', selected.email || '—'],
                    ['Phone', selected.phone || '—'],
                    ['Hourly Rate', selected.hourly_rate_usd ? `$${selected.hourly_rate_usd}/hr` : '—'],
                    ['Est.', selected.established_year ? `${selected.established_year} (${new Date().getFullYear() - selected.established_year}yrs)` : '—'],
                  ].map(([label, value]) => (
                    <tr key={label} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px', color: 'var(--muted)', padding: '6px 0', textTransform: 'uppercase', width: '90px' }}>{label}</td>
                      <td style={{ fontSize: '11px', color: 'var(--cream)', padding: '6px 0' }}>{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Notes */}
              <div>
                {selected.notes && (
                  <div style={{ fontSize: '11px', color: 'var(--muted-2)', lineHeight: 1.7, padding: '10px', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                    {selected.notes}
                  </div>
                )}
                {/* Score bar breakdown */}
                <div style={{ marginTop: selected.notes ? '12px' : 0 }}>
                  {[
                    ['On-Time Delivery', selected.on_time_pct ?? 0, scoreColor(selected.on_time_pct ?? 0)],
                    ['Quality of Work', selected.quality_score ?? 0, scoreColor(selected.quality_score ?? 0)],
                    ['Overall Score', selected.overall_score ?? 0, scoreColor(selected.overall_score ?? 0)],
                  ].map(([label, val, color]) => (
                    <div key={label as string} style={{ marginBottom: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                        <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '8px', color: 'var(--muted)', textTransform: 'uppercase' }}>{label}</span>
                        <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px', color: color as string }}>{val}%</span>
                      </div>
                      <div className="progress-wrap">
                        <div style={{ width: `${val}%`, height: '100%', background: color as string, transition: 'width 0.4s' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Directory Tab ── */}
      {tab === 'directory' && (
        <div className="panel">
          <div className="panel-header">
            <div><div className="panel-title">CONTRACTOR DIRECTORY</div><div className="panel-sub">Regional network · Click row for details</div></div>
            <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px', color: 'var(--muted)' }}>{contractors.length} firms</span>
          </div>
          <div className="table-scroll">
            <table className="data-table">
              <thead><tr><th>Company</th><th>Specialty</th><th>Islands</th><th>Status</th><th>On-Time</th><th>Quality</th><th>Overall</th><th>Est.</th></tr></thead>
              <tbody>
                {loading && <tr><td colSpan={8} style={{ textAlign: 'center', padding: '20px', color: 'var(--muted)' }}>Loading...</td></tr>}
                {contractors.map(c => (
                  <tr key={c.id} onClick={() => setSelected(selected?.id === c.id ? null : c)}
                    style={{ cursor: 'pointer', background: selected?.id === c.id ? 'var(--accent-dim)' : undefined }}>
                    <td className="strong">{c.name}</td>
                    <td style={{ color: 'var(--muted-2)', fontSize: '11px' }}>{c.specialty}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {(c.islands ?? []).map((i: string) => <span key={i} className="badge badge-grey" style={{ fontSize: '8px', padding: '2px 5px' }}>{i}</span>)}
                      </div>
                    </td>
                    <td><span className={`badge ${statusColors[c.status] ?? 'badge-grey'}`}>{c.status}</span></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '40px' }}>
                          <div className="progress-wrap">
                            <div style={{ width: `${c.on_time_pct}%`, height: '100%', background: scoreColor(c.on_time_pct ?? 0) }} />
                          </div>
                        </div>
                        <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px', color: scoreColor(c.on_time_pct ?? 0) }}>{c.on_time_pct}%</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '40px' }}>
                          <div className="progress-wrap">
                            <div style={{ width: `${c.quality_score}%`, height: '100%', background: scoreColor(c.quality_score ?? 0) }} />
                          </div>
                        </div>
                        <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px', color: scoreColor(c.quality_score ?? 0) }}>{c.quality_score}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-bebas)', fontSize: '20px', color: scoreColor(c.overall_score ?? 0), letterSpacing: '0.04em' }}>{c.overall_score}</span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px', color: 'var(--muted)' }}>{c.established_year ?? '—'}</td>
                  </tr>
                ))}
                {!loading && !contractors.length && <tr><td colSpan={8} style={{ textAlign: 'center', padding: '20px', color: 'var(--muted)' }}>No contractors registered</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Performance Intelligence Tab ── */}
      {tab === 'performance' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }} className="grid-responsive">
          {/* Leaderboard */}
          <div className="panel">
            <div className="panel-header"><div className="panel-title">PERFORMANCE LEADERBOARD</div><div className="panel-sub">Ranked by overall score</div></div>
            <div style={{ padding: '8px 14px' }}>
              {contractors.slice(0, 10).map((c, i) => (
                <div key={c.id} onClick={() => setSelected(selected?.id === c.id ? null : c)}
                  style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}>
                  <div style={{
                    width: '26px', height: '26px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-bebas)', fontSize: '18px', color: i === 0 ? 'var(--amber)' : i === 1 ? 'var(--muted-2)' : i === 2 ? '#cd7f32' : 'var(--muted)',
                  }}>{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--cream)' }}>{c.name}</div>
                    <div style={{ fontFamily: 'var(--font-space-mono)', fontSize: '8px', color: 'var(--muted)', marginTop: '2px' }}>{c.specialty}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: 'var(--font-space-mono)', fontSize: '7px', color: 'var(--muted)', textTransform: 'uppercase' }}>Time</div>
                      <div style={{ fontFamily: 'var(--font-space-mono)', fontSize: '10px', color: scoreColor(c.on_time_pct ?? 0) }}>{c.on_time_pct}%</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: 'var(--font-space-mono)', fontSize: '7px', color: 'var(--muted)', textTransform: 'uppercase' }}>Quality</div>
                      <div style={{ fontFamily: 'var(--font-space-mono)', fontSize: '10px', color: scoreColor(c.quality_score ?? 0) }}>{c.quality_score}</div>
                    </div>
                    <div style={{ fontFamily: 'var(--font-bebas)', fontSize: '24px', color: scoreColor(c.overall_score ?? 0), letterSpacing: '0.04em', minWidth: '36px', textAlign: 'right' }}>
                      {c.overall_score}
                    </div>
                    <span className={`badge ${statusColors[c.status]}`} style={{ fontSize: '8px' }}>{c.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trade breakdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="panel">
              <div className="panel-header"><div className="panel-title">SCORE DISTRIBUTION</div><div className="panel-sub">All contractors · On-time vs quality</div></div>
              <div className="panel-body">
                {contractors.map(c => (
                  <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '130px 1fr 1fr auto', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--muted-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name.split(' ')[0]}</span>
                    <div>
                      <div style={{ fontFamily: 'var(--font-space-mono)', fontSize: '7px', color: 'var(--muted)', marginBottom: '2px' }}>ON-TIME</div>
                      <div style={{ height: '6px', background: 'var(--surface-3)', borderRadius: '1px', overflow: 'hidden' }}>
                        <div style={{ width: `${c.on_time_pct}%`, height: '100%', background: scoreColor(c.on_time_pct ?? 0), transition: 'width 0.4s' }} />
                      </div>
                    </div>
                    <div>
                      <div style={{ fontFamily: 'var(--font-space-mono)', fontSize: '7px', color: 'var(--muted)', marginBottom: '2px' }}>QUALITY</div>
                      <div style={{ height: '6px', background: 'var(--surface-3)', borderRadius: '1px', overflow: 'hidden' }}>
                        <div style={{ width: `${c.quality_score}%`, height: '100%', background: scoreColor(c.quality_score ?? 0), transition: 'width 0.4s' }} />
                      </div>
                    </div>
                    <span style={{ fontFamily: 'var(--font-bebas)', fontSize: '18px', color: scoreColor(c.overall_score ?? 0) }}>{c.overall_score}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Island coverage */}
            <div className="panel">
              <div className="panel-header"><div className="panel-title">ISLAND COVERAGE MAP</div><div className="panel-sub">Contractor availability by market</div></div>
              <div className="panel-body">
                {islandCoverage.map(({ island, contractors: cs }) => (
                  <div key={island} style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ fontFamily: 'var(--font-bebas)', fontSize: '18px', color: 'var(--accent)' }}>{island}</span>
                        <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px', color: 'var(--muted)' }}>{ISLAND_LABELS[island as Island]}</span>
                      </div>
                      <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px', color: 'var(--muted)' }}>{cs.length} contractors</span>
                    </div>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {cs.map(c => (
                        <span key={c.id} className={`badge ${statusColors[c.status]}`} style={{ fontSize: '9px' }}>{c.name.split(' ')[0]}</span>
                      ))}
                      {cs.length === 0 && <span style={{ fontSize: '11px', color: 'var(--red)' }}>⚠ No contractors registered for this market</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Comparison Matrix Tab ── */}
      {tab === 'comparison' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }} className="grid-responsive-3">
          {(['preferred', 'active', 'review'] as const).map(tier => (
            <div key={tier} className="panel" style={{ borderColor: tier === 'preferred' ? 'rgba(46,204,138,0.3)' : tier === 'review' ? 'rgba(255,77,77,0.2)' : undefined }}>
              <div className="panel-header">
                <div>
                  <span className={`badge ${statusColors[tier]}`} style={{ marginBottom: '4px', display: 'inline-block' }}>{tier}</span>
                  <div className="panel-title">{tier === 'preferred' ? 'PREFERRED PARTNERS' : tier === 'active' ? 'ACTIVE CONTRACTORS' : 'UNDER REVIEW'}</div>
                </div>
                <span style={{ fontFamily: 'var(--font-bebas)', fontSize: '28px', color: 'var(--muted)', lineHeight: 1 }}>{tierGroups[tier].length}</span>
              </div>
              <div style={{ padding: '8px 14px' }}>
                {tierGroups[tier].length === 0 && (
                  <div style={{ color: 'var(--muted)', textAlign: 'center', padding: '20px', fontSize: '12px' }}>None in this tier</div>
                )}
                {tierGroups[tier].map(c => (
                  <div key={c.id} onClick={() => setSelected(selected?.id === c.id ? null : c)}
                    style={{ padding: '10px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--cream)' }}>{c.name}</span>
                      <span style={{ fontFamily: 'var(--font-bebas)', fontSize: '22px', color: scoreColor(c.overall_score ?? 0) }}>{c.overall_score}</span>
                    </div>
                    <div style={{ fontFamily: 'var(--font-space-mono)', fontSize: '8px', color: 'var(--muted)', marginBottom: '6px' }}>{c.specialty}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                      {[['On-Time', c.on_time_pct + '%'], ['Quality', c.quality_score]].map(([label, val]) => (
                        <div key={label as string} style={{ padding: '4px 6px', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                          <div style={{ fontFamily: 'var(--font-space-mono)', fontSize: '7px', color: 'var(--muted)', textTransform: 'uppercase' }}>{label}</div>
                          <div style={{ fontFamily: 'var(--font-space-mono)', fontSize: '10px', color: 'var(--cream)' }}>{val}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: '6px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {(c.islands ?? []).map((i: string) => <span key={i} className="badge badge-grey" style={{ fontSize: '8px', padding: '2px 5px' }}>{i}</span>)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @media(max-width:900px){.stat-grid-responsive{grid-template-columns:1fr 1fr!important;}.grid-responsive{grid-template-columns:1fr!important;}.grid-responsive-3{grid-template-columns:1fr!important;}}
        @media(max-width:1200px){.grid-responsive-3{grid-template-columns:1fr 1fr!important;}}
      `}</style>
    </div>
  )
}
