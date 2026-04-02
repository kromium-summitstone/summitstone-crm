'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const SEQUENCES: Record<string, { label: string; tier: string; days: number; steps: string[] }> = {
  hot_7day: {
    label: 'Hot Lead — 7 Day Fast Track', tier: 'hot', days: 7,
    steps: [
      'Hour 0: SMS + WhatsApp with personalised message',
      'Hour 1: Phone call attempt #1',
      'Hour 4: Phone call attempt #2 if no answer',
      'Day 1: Email — Project planning guide + portfolio',
      'Day 2: WhatsApp — "Quick question about your project"',
      'Day 3: Email — Relevant case study with costs',
      'Day 3: Phone call attempt #3',
      'Day 5: Email — Limited-time offer (free permit review)',
      'Day 7: Final email — Ready to move forward?',
    ],
  },
  warm_14day: {
    label: 'Warm Lead — 14 Day Nurture', tier: 'warm', days: 14,
    steps: [
      'Day 0: Welcome email + company overview',
      'Day 2: SMS — Project planning checklist',
      'Day 4: Email — Permits guide for their island',
      'Day 7: Case study email with budget breakdown',
      'Day 10: Phone call from project manager',
      'Day 14: Email — Ready to get started?',
    ],
  },
  cold_monthly: {
    label: 'Cold Lead — Monthly Newsletter', tier: 'cold', days: 90,
    steps: [
      'Month 1: Caribbean construction cost guide PDF',
      'Month 2: Hurricane-proofing upgrade options video',
      'Month 3: Success story with timeline + costs',
      'Month 6: Re-engagement email',
      'Quarterly: Newsletter with new projects & tips',
    ],
  },
}

const TIER_COLORS: Record<string, string> = {
  hot: 'badge-red', warm: 'badge-amber', cold: 'badge-grey',
}

export default function NurturePage() {
  const [sequences, setSequences] = useState<any[]>([])
  const [enquiries, setEnquiries] = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  const [showForm, setShowForm]   = useState(false)
  const [saving, setSaving]       = useState(false)
  const [filterStatus, setFilterStatus] = useState('active')
  const [form, setForm] = useState({ enquiry_id: '', sequence_name: 'hot_7day' })
  const supabase = createClient()

  async function load() {
    setLoading(true)
    const [{ data: s }, { data: e }] = await Promise.all([
      supabase.from('nurture_sequences')
        .select('*, enquiry:website_enquiries(name, email, lead_tier, lead_score, project_type)')
        .order('enrolled_at', { ascending: false }),
      supabase.from('website_enquiries')
        .select('id, name, email, lead_tier, lead_score')
        .in('lead_tier', ['hot','warm','cold'])
        .not('status', 'in', '("won","lost")')
        .order('lead_score', { ascending: false }),
    ])
    setSequences(s ?? [])
    setEnquiries(e ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function enrol(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const seq = SEQUENCES[form.sequence_name]
    await supabase.from('nurture_sequences').insert({
      enquiry_id:    form.enquiry_id,
      sequence_name: form.sequence_name,
      lead_tier:     seq.tier,
      status:        'active',
      enrolled_at:   new Date().toISOString(),
      current_day:   0,
      next_touch_at: new Date().toISOString(),
    })
    setSaving(false)
    setShowForm(false)
    load()
  }

  async function logTouch(id: string, currentDay: number, touchType: string) {
    await supabase.from('nurture_sequences').update({
      current_day:    currentDay + 1,
      last_touch_at:  new Date().toISOString(),
      last_touch_type: touchType,
      next_touch_at:  new Date(Date.now() + 86400000).toISOString(),
    }).eq('id', id)
    load()
  }

  async function updateStatus(id: string, status: string, exitReason?: string) {
    await supabase.from('nurture_sequences').update({ status, exit_reason: exitReason ?? null }).eq('id', id)
    load()
  }

  const filtered = sequences.filter(s => filterStatus === 'all' || s.status === filterStatus)
  const active   = sequences.filter(s => s.status === 'active').length
  const hotActive = sequences.filter(s => s.status === 'active' && s.lead_tier === 'hot').length
  const completed = sequences.filter(s => s.status === 'completed').length

  return (
    <div>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '20px' }} className="stat-grid-responsive">
        <div className="stat-card">
          <div className="text-label">Active Sequences</div>
          <div className="stat-value text-accent" style={{ marginTop: '6px' }}>{active}</div>
        </div>
        <div className="stat-card" style={{ borderColor: 'var(--red)' }}>
          <div className="text-label">Hot In Sequence</div>
          <div className="stat-value" style={{ marginTop: '6px', color: 'var(--red)' }}>{hotActive}</div>
          <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '4px' }}>7-day fast track</div>
        </div>
        <div className="stat-card">
          <div className="text-label">Completed</div>
          <div className="stat-value text-green" style={{ marginTop: '6px' }}>{completed}</div>
        </div>
        <div className="stat-card">
          <div className="text-label">Sequences Available</div>
          <div className="stat-value" style={{ marginTop: '6px' }}>{Object.keys(SEQUENCES).length}</div>
        </div>
      </div>

      {/* Sequence templates */}
      <div className="panel" style={{ marginBottom: '16px' }}>
        <div className="panel-header">
          <div className="panel-title">AVAILABLE SEQUENCES</div>
          <button className="btn btn-primary" style={{ height: '28px', padding: '0 14px', fontSize: '10px' }}
            onClick={() => setShowForm(!showForm)}>+ Enrol Lead</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1px', background: 'var(--border)' }}>
          {Object.entries(SEQUENCES).map(([key, seq]) => (
            <div key={key} style={{ background: 'var(--surface)', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span className={`badge ${TIER_COLORS[seq.tier]}`}>{seq.tier}</span>
                <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '8px', color: 'var(--muted)' }}>{seq.days} days · {seq.steps.length} touchpoints</span>
              </div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--cream)', marginBottom: '10px' }}>{seq.label}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {seq.steps.slice(0, 4).map((step, i) => (
                  <div key={i} style={{ fontSize: '10px', color: 'var(--muted-2)', display: 'flex', gap: '6px' }}>
                    <span style={{ color: 'var(--accent)', flexShrink: 0 }}>{i + 1}.</span>
                    <span>{step}</span>
                  </div>
                ))}
                {seq.steps.length > 4 && (
                  <div style={{ fontSize: '10px', color: 'var(--muted)', fontStyle: 'italic' }}>+{seq.steps.length - 4} more steps…</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Enrol form */}
      {showForm && (
        <div className="panel" style={{ marginBottom: '16px' }}>
          <div className="panel-header"><div className="panel-title">ENROL IN SEQUENCE</div></div>
          <div className="panel-body">
            <form onSubmit={enrol}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label">Lead / Enquiry *</label>
                  <select className="form-select" value={form.enquiry_id} onChange={e => setForm(f => ({ ...f, enquiry_id: e.target.value }))} required>
                    <option value="">Select lead</option>
                    {enquiries.map(e => <option key={e.id} value={e.id}>{e.name} · Score {e.lead_score} · {e.lead_tier}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Sequence *</label>
                  <select className="form-select" value={form.sequence_name} onChange={e => setForm(f => ({ ...f, sequence_name: e.target.value }))}>
                    {Object.entries(SEQUENCES).map(([key, seq]) => <option key={key} value={key}>{seq.label}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Enrolling...' : 'Enrol Lead'}</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Status filter */}
      <div style={{ display: 'flex', gap: 0, marginBottom: '12px', borderBottom: '1px solid var(--border)' }}>
        {(['active','paused','completed','exited','all'] as const).map(f => (
          <button key={f} onClick={() => setFilterStatus(f)} style={{
            padding: '7px 14px', fontFamily: 'var(--font-space-mono)', fontSize: '9px',
            letterSpacing: '0.12em', textTransform: 'uppercase', background: 'none', border: 'none',
            borderBottom: filterStatus === f ? '2px solid var(--accent)' : '2px solid transparent',
            color: filterStatus === f ? 'var(--accent)' : 'var(--muted)', cursor: 'pointer', marginBottom: '-1px',
          }}>{f}</button>
        ))}
      </div>

      {/* Enrolled sequences */}
      {filtered.length === 0 && !loading ? (
        <div className="panel">
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>
            No sequences in this view — enrol a lead above
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filtered.map(seq => {
            const def     = SEQUENCES[seq.sequence_name]
            const totalDays = def?.days ?? 14
            const progress  = Math.min((seq.current_day / totalDays) * 100, 100)
            const currentStep = def?.steps[Math.min(seq.current_day, (def?.steps?.length ?? 1) - 1)] ?? ''

            return (
              <div key={seq.id} className="panel" style={{
                borderLeft: `3px solid ${seq.lead_tier === 'hot' ? 'var(--red)' : seq.lead_tier === 'warm' ? 'var(--amber)' : 'var(--border)'}`,
              }}>
                <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Lead + tier */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--cream)' }}>{seq.enquiry?.name ?? '—'}</span>
                      <span className={`badge ${TIER_COLORS[seq.lead_tier] ?? 'badge-grey'}`}>{seq.lead_tier}</span>
                      <span className={`badge ${seq.status === 'active' ? 'badge-green' : seq.status === 'paused' ? 'badge-amber' : 'badge-grey'}`}>{seq.status}</span>
                      <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px', color: 'var(--muted)' }}>{def?.label ?? seq.sequence_name}</span>
                    </div>

                    {/* Current step */}
                    {currentStep && (
                      <div style={{ fontSize: '11px', color: 'var(--muted-2)', marginBottom: '8px', display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                        <span style={{ color: 'var(--accent)', flexShrink: 0 }}>▶</span>
                        <span>{currentStep}</span>
                      </div>
                    )}

                    {/* Progress bar */}
                    <div style={{ marginBottom: '5px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '8px', color: 'var(--muted)' }}>Day {seq.current_day} of {totalDays}</span>
                        <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '8px', color: 'var(--muted)' }}>{Math.round(progress)}%</span>
                      </div>
                      <div style={{ height: '2px', background: 'var(--surface-3)', borderRadius: '1px' }}>
                        <div style={{ height: '2px', width: `${progress}%`, background: seq.lead_tier === 'hot' ? 'var(--red)' : 'var(--accent)', borderRadius: '1px', transition: 'width 0.5s' }} />
                      </div>
                    </div>

                    {/* Meta */}
                    <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '8px', color: 'var(--muted)' }}>
                        Enrolled {new Date(seq.enrolled_at).toLocaleDateString()}
                      </span>
                      {seq.last_touch_at && (
                        <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '8px', color: 'var(--muted)' }}>
                          Last touch: {new Date(seq.last_touch_at).toLocaleDateString()} via {seq.last_touch_type ?? '—'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flexShrink: 0 }}>
                    {seq.status === 'active' && (
                      <>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {['email','sms','call','whatsapp'].map(t => (
                            <button key={t} className="btn btn-secondary"
                              style={{ height: '24px', padding: '0 7px', fontSize: '9px', fontFamily: 'var(--font-space-mono)', letterSpacing: '0.08em' }}
                              onClick={() => logTouch(seq.id, seq.current_day, t)}>
                              {t}
                            </button>
                          ))}
                        </div>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button className="btn btn-secondary" style={{ flex: 1, height: '24px', fontSize: '9px' }}
                            onClick={() => updateStatus(seq.id, 'paused')}>Pause</button>
                          <button className="btn btn-secondary" style={{ flex: 1, height: '24px', fontSize: '9px', color: 'var(--green)' }}
                            onClick={() => updateStatus(seq.id, 'completed', 'converted')}>Complete</button>
                        </div>
                      </>
                    )}
                    {seq.status === 'paused' && (
                      <button className="btn btn-primary" style={{ height: '28px', fontSize: '10px' }}
                        onClick={() => updateStatus(seq.id, 'active')}>Resume</button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <style>{`@media(max-width:900px){.stat-grid-responsive{grid-template-columns:1fr 1fr!important;}}`}</style>
    </div>
  )
}
