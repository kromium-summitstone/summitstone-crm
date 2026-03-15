'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'

const INCIDENT_TYPES = ['near_miss', 'first_aid', 'medical_treatment', 'lost_time', 'property_damage', 'environmental', 'fire', 'other'] as const
const SEVERITY = ['minor', 'moderate', 'serious', 'critical'] as const
const CHECKLIST_ITEMS = [
  { id: 'ppe', label: 'PPE Available & In Use', category: 'daily' },
  { id: 'barriers', label: 'Site Barriers & Hoarding Intact', category: 'daily' },
  { id: 'toolbox', label: 'Toolbox Talk Conducted', category: 'daily' },
  { id: 'scaffolding', label: 'Scaffolding Inspected & Tagged', category: 'weekly' },
  { id: 'fire_ext', label: 'Fire Extinguishers Accessible', category: 'weekly' },
  { id: 'first_aid', label: 'First Aid Kit Stocked', category: 'weekly' },
  { id: 'emergency_contact', label: 'Emergency Contact List Posted', category: 'weekly' },
  { id: 'excavation', label: 'Excavation Shoring Checked', category: 'weekly' },
  { id: 'electrical', label: 'Temporary Electrical Inspected', category: 'monthly' },
  { id: 'crane', label: 'Crane / Lift Equipment Certified', category: 'monthly' },
  { id: 'hurricane_prep', label: 'Hurricane Prep Plan Current', category: 'seasonal' },
  { id: 'insurance', label: 'Liability Insurance Valid', category: 'monthly' },
]

export default function SafetyPage() {
  const [incidents, setIncidents] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'incidents' | 'checklist' | 'stats'>('incidents')
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState<any>(null)
  const [checklist, setChecklist] = useState<Record<string, boolean>>({})
  const [checklistProject, setChecklistProject] = useState('')

  const [form, setForm] = useState({
    project_id: '', incident_date: new Date().toISOString().slice(0, 10),
    type: 'near_miss', severity: 'minor', title: '',
    description: '', injured_party: '', body_part: '',
    lost_days: '0', immediate_action: '', corrective_action: '',
    reported_by: '', witnesses: '', is_notifiable: false,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  async function load() {
    const [{ data: i }, { data: p }] = await Promise.all([
      supabase.from('safety_incidents').select('*, project:projects(name, island)').order('incident_date', { ascending: false }),
      supabase.from('projects').select('id, name').in('stage', ['in_construction', 'pre_construction']),
    ])
    setIncidents(i ?? [])
    setProjects(p ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const { error: err } = await supabase.from('safety_incidents').insert({
      ...form,
      project_id: form.project_id || null,
      lost_days: parseInt(form.lost_days) || 0,
      status: 'open',
    })
    setSaving(false)
    if (err) { setError(err.message); return }
    setShowForm(false)
    setForm({ project_id: '', incident_date: new Date().toISOString().slice(0, 10), type: 'near_miss', severity: 'minor', title: '', description: '', injured_party: '', body_part: '', lost_days: '0', immediate_action: '', corrective_action: '', reported_by: '', witnesses: '', is_notifiable: false })
    load()
  }

  async function closeIncident(id: string) {
    await supabase.from('safety_incidents').update({ status: 'closed', closed_at: new Date().toISOString() }).eq('id', id)
    setSelected(null)
    load()
  }

  const severityColor: Record<string, string> = {
    minor: 'badge-blue', moderate: 'badge-amber', serious: 'badge-red', critical: 'badge-red'
  }
  const typeColor: Record<string, string> = {
    near_miss: 'badge-amber', first_aid: 'badge-blue', medical_treatment: 'badge-amber',
    lost_time: 'badge-red', property_damage: 'badge-amber', environmental: 'badge-blue',
    fire: 'badge-red', other: 'badge-grey',
  }

  // Stats
  const openIncidents = incidents.filter(i => i.status === 'open').length
  const lostDays = incidents.reduce((s: number, i: any) => s + (i.lost_days ?? 0), 0)
  const notifiable = incidents.filter(i => i.is_notifiable).length
  const lastIncidentDays = (() => {
    const lastIncident = incidents.find(i => ['lost_time', 'medical_treatment', 'serious', 'critical'].includes(i.type) || i.severity === 'serious' || i.severity === 'critical')
    if (!lastIncident) return null
    const diff = Math.floor((Date.now() - new Date(lastIncident.incident_date).getTime()) / 86400000)
    return diff
  })()

  const byType = incidents.reduce((acc: Record<string, number>, i) => { acc[i.type] = (acc[i.type] ?? 0) + 1; return acc }, {})
  const bySeverity = incidents.reduce((acc: Record<string, number>, i) => { acc[i.severity] = (acc[i.severity] ?? 0) + 1; return acc }, {})

  const checklistByCategory = {
    daily: CHECKLIST_ITEMS.filter(i => i.category === 'daily'),
    weekly: CHECKLIST_ITEMS.filter(i => i.category === 'weekly'),
    monthly: CHECKLIST_ITEMS.filter(i => i.category === 'monthly'),
    seasonal: CHECKLIST_ITEMS.filter(i => i.category === 'seasonal'),
  }
  const checklistScore = CHECKLIST_ITEMS.length > 0 ? Math.round((Object.values(checklist).filter(Boolean).length / CHECKLIST_ITEMS.length) * 100) : 0

  return (
    <div>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '20px' }} className="stat-grid-responsive">
        <div className="stat-card">
          <div className="text-label">Days Since Last Incident</div>
          <div className="stat-value" style={{ marginTop: '6px', color: lastIncidentDays === null ? 'var(--green)' : lastIncidentDays > 30 ? 'var(--green)' : 'var(--amber)' }}>
            {lastIncidentDays === null ? '∞' : lastIncidentDays}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '4px' }}>
            {lastIncidentDays === null ? 'No serious incidents' : 'days'}
          </div>
        </div>
        <div className="stat-card">
          <div className="text-label">Open Incidents</div>
          <div className="stat-value" style={{ marginTop: '6px', color: openIncidents > 0 ? 'var(--amber)' : 'var(--green)' }}>{openIncidents}</div>
          <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '4px' }}>{incidents.length} total logged</div>
        </div>
        <div className="stat-card">
          <div className="text-label">Total Lost Days</div>
          <div className="stat-value" style={{ marginTop: '6px', color: lostDays > 0 ? 'var(--red)' : 'var(--green)' }}>{lostDays}</div>
          <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '4px' }}>LTI days this period</div>
        </div>
        <div className="stat-card">
          <div className="text-label">Notifiable Incidents</div>
          <div className="stat-value" style={{ marginTop: '6px', color: notifiable > 0 ? 'var(--red)' : 'var(--green)' }}>{notifiable}</div>
          <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '4px' }}>Reportable to authority</div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '2px', borderBottom: '1px solid var(--border)' }}>
          {(['incidents', 'checklist', 'stats'] as const).map(t => (
            <button key={t} onClick={() => { setTab(t); setSelected(null) }} style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: '8px 18px',
              fontFamily: 'var(--font-space-mono)', fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase',
              color: tab === t ? 'var(--cream)' : 'var(--muted)',
              borderBottom: `2px solid ${tab === t ? 'var(--accent)' : 'transparent'}`,
            }}>
              {t === 'incidents' ? `Incident Register (${incidents.length})` : t === 'checklist' ? 'Safety Checklist' : 'Analytics'}
            </button>
          ))}
        </div>
        {tab === 'incidents' && (
          <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); setSelected(null) }}>+ Log Incident</button>
        )}
      </div>

      {/* Incident Form */}
      {showForm && tab === 'incidents' && (
        <div className="panel" style={{ marginBottom: '16px' }}>
          <div className="panel-header"><div className="panel-title">LOG SAFETY INCIDENT</div><div className="panel-sub">All incidents must be logged within 24 hours</div></div>
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
                  <label className="form-label">Incident Date *</label>
                  <input className="form-input" type="date" value={form.incident_date} onChange={e => setForm(f => ({ ...f, incident_date: e.target.value }))} required />
                </div>
                <div>
                  <label className="form-label">Incident Type</label>
                  <select className="form-select" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                    {INCIDENT_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Severity</label>
                  <select className="form-select" value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}>
                    {SEVERITY.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Incident Title *</label>
                  <input className="form-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Brief description of the incident" required />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Full Description *</label>
                  <textarea className="form-textarea" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What happened? Where? How? Include sequence of events..." required style={{ minHeight: '80px' }} />
                </div>
                <div>
                  <label className="form-label">Injured Party (if applicable)</label>
                  <input className="form-input" value={form.injured_party} onChange={e => setForm(f => ({ ...f, injured_party: e.target.value }))} placeholder="Name / Worker ref" />
                </div>
                <div>
                  <label className="form-label">Body Part / Asset Affected</label>
                  <input className="form-input" value={form.body_part} onChange={e => setForm(f => ({ ...f, body_part: e.target.value }))} placeholder="e.g. Left hand, Scaffold, Crane" />
                </div>
                <div>
                  <label className="form-label">Lost Time Days</label>
                  <input className="form-input" type="number" value={form.lost_days} onChange={e => setForm(f => ({ ...f, lost_days: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Reported By</label>
                  <input className="form-input" value={form.reported_by} onChange={e => setForm(f => ({ ...f, reported_by: e.target.value }))} placeholder="Site Supervisor / PM" />
                </div>
                <div>
                  <label className="form-label">Witnesses</label>
                  <input className="form-input" value={form.witnesses} onChange={e => setForm(f => ({ ...f, witnesses: e.target.value }))} placeholder="Names of witnesses" />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px' }}>
                  <input type="checkbox" id="notifiable" checked={form.is_notifiable} onChange={e => setForm(f => ({ ...f, is_notifiable: e.target.checked }))} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                  <label htmlFor="notifiable" style={{ fontFamily: 'var(--font-space-mono)', fontSize: '10px', color: 'var(--amber)', cursor: 'pointer', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    Notifiable to Labour Authority / OSHA equivalent
                  </label>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Immediate Actions Taken</label>
                  <textarea className="form-textarea" value={form.immediate_action} onChange={e => setForm(f => ({ ...f, immediate_action: e.target.value }))} placeholder="First aid, evacuation, containment..." />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Corrective / Preventive Actions Required</label>
                  <textarea className="form-textarea" value={form.corrective_action} onChange={e => setForm(f => ({ ...f, corrective_action: e.target.value }))} placeholder="What must be done to prevent recurrence?" />
                </div>
              </div>
              {error && <div style={{ padding: '10px', background: 'var(--red-dim)', border: '1px solid var(--red)', color: 'var(--red)', fontSize: '11px', marginTop: '12px' }}>{error}</div>}
              <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Logging...' : 'Log Incident'}</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Selected incident detail */}
      {selected && tab === 'incidents' && (
        <div className="panel" style={{ marginBottom: '16px', borderColor: selected.severity === 'critical' ? 'rgba(255,77,77,0.4)' : 'var(--accent-line)' }}>
          <div className="panel-header">
            <div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                <span className={`badge ${typeColor[selected.type] ?? 'badge-grey'}`}>{selected.type.replace(/_/g, ' ')}</span>
                <span className={`badge ${severityColor[selected.severity]}`}>{selected.severity}</span>
                {selected.is_notifiable && <span className="badge badge-red">⚠ Notifiable</span>}
                <span className={`badge ${selected.status === 'open' ? 'badge-amber' : 'badge-grey'}`}>{selected.status}</span>
              </div>
              <div className="panel-title">{selected.title}</div>
              <div className="panel-sub">{selected.project?.name ?? 'Portfolio'} · {formatDate(selected.incident_date)}</div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {selected.status === 'open' && (
                <button className="btn btn-secondary" onClick={() => closeIncident(selected.id)}>Mark Closed</button>
              )}
              <button className="btn btn-secondary" onClick={() => setSelected(null)}>✕</button>
            </div>
          </div>
          <div className="panel-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <div className="text-label" style={{ marginBottom: '8px' }}>Incident Description</div>
                <div style={{ fontSize: '12px', color: 'var(--muted-2)', lineHeight: 1.7, padding: '12px', background: 'var(--surface-2)', border: '1px solid var(--border)', marginBottom: '12px' }}>
                  {selected.description}
                </div>
                {selected.immediate_action && (
                  <>
                    <div className="text-label" style={{ marginBottom: '6px' }}>Immediate Actions</div>
                    <div style={{ fontSize: '11px', color: 'var(--amber)', lineHeight: 1.6, padding: '10px', background: 'var(--amber-dim)', border: '1px solid rgba(245,166,35,0.2)', marginBottom: '10px' }}>
                      {selected.immediate_action}
                    </div>
                  </>
                )}
                {selected.corrective_action && (
                  <>
                    <div className="text-label" style={{ marginBottom: '6px' }}>Corrective Actions Required</div>
                    <div style={{ fontSize: '11px', color: 'var(--muted-2)', lineHeight: 1.6, padding: '10px', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                      {selected.corrective_action}
                    </div>
                  </>
                )}
              </div>
              <div>
                <table style={{ width: '100%' }}>
                  <tbody>
                    {[
                      ['Injured Party', selected.injured_party || '—'],
                      ['Body Part / Asset', selected.body_part || '—'],
                      ['Lost Days', selected.lost_days > 0 ? `${selected.lost_days} days` : '0 (no lost time)'],
                      ['Reported By', selected.reported_by || '—'],
                      ['Witnesses', selected.witnesses || '—'],
                      ['Date', formatDate(selected.incident_date)],
                    ].map(([label, value]) => (
                      <tr key={label} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px', color: 'var(--muted)', padding: '8px 0', textTransform: 'uppercase', width: '120px' }}>{label}</td>
                        <td style={{ fontSize: '11px', color: 'var(--cream)', padding: '8px 0' }}>{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Incident Table */}
      {tab === 'incidents' && (
        <div className="panel">
          <div className="panel-header">
            <div><div className="panel-title">INCIDENT REGISTER</div><div className="panel-sub">All safety events · Click row for full details</div></div>
          </div>
          <div className="table-scroll">
            <table className="data-table">
              <thead><tr><th>Date</th><th>Title</th><th>Project</th><th>Type</th><th>Severity</th><th>Lost Days</th><th>Reported By</th><th>Status</th></tr></thead>
              <tbody>
                {loading && <tr><td colSpan={8} style={{ textAlign: 'center', padding: '20px', color: 'var(--muted)' }}>Loading...</td></tr>}
                {incidents.map(incident => (
                  <tr key={incident.id} onClick={() => setSelected(selected?.id === incident.id ? null : incident)}
                    style={{ cursor: 'pointer', background: selected?.id === incident.id ? 'var(--accent-dim)' : undefined }}>
                    <td style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px' }}>{formatDate(incident.incident_date)}</td>
                    <td className="strong">{incident.title}</td>
                    <td style={{ color: 'var(--muted-2)', fontSize: '11px' }}>{incident.project?.name ?? '—'}</td>
                    <td><span className={`badge ${typeColor[incident.type] ?? 'badge-grey'}`} style={{ fontSize: '9px' }}>{incident.type.replace(/_/g, ' ')}</span></td>
                    <td><span className={`badge ${severityColor[incident.severity]}`}>{incident.severity}</span></td>
                    <td style={{ fontFamily: 'var(--font-space-mono)', fontSize: '10px', color: incident.lost_days > 0 ? 'var(--red)' : 'var(--muted)' }}>
                      {incident.lost_days > 0 ? `${incident.lost_days}d` : '—'}
                    </td>
                    <td style={{ color: 'var(--muted-2)', fontSize: '11px' }}>{incident.reported_by || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <span className={`badge ${incident.status === 'open' ? 'badge-amber' : 'badge-grey'}`}>{incident.status}</span>
                        {incident.is_notifiable && <span style={{ color: 'var(--red)', fontSize: '10px' }}>⚠</span>}
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && incidents.length === 0 && (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: '30px' }}>
                    <div style={{ color: 'var(--green)', fontFamily: 'var(--font-bebas)', fontSize: '22px', letterSpacing: '0.06em' }}>ZERO INCIDENTS RECORDED</div>
                    <div style={{ color: 'var(--muted)', fontSize: '11px', marginTop: '4px' }}>No safety incidents logged — keep it that way.</div>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Safety Checklist */}
      {tab === 'checklist' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '12px' }} className="grid-responsive">
            <div className="panel" style={{ alignSelf: 'start' }}>
              <div className="panel-header"><div className="panel-title">CHECKLIST STATUS</div></div>
              <div className="panel-body">
                <div style={{ textAlign: 'center', marginBottom: '14px' }}>
                  <div style={{ fontFamily: 'var(--font-bebas)', fontSize: '54px', color: checklistScore >= 80 ? 'var(--green)' : checklistScore >= 60 ? 'var(--amber)' : 'var(--red)', lineHeight: 1 }}>
                    {checklistScore}%
                  </div>
                  <div style={{ fontFamily: 'var(--font-space-mono)', fontSize: '8px', color: 'var(--muted)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                    Compliance Score
                  </div>
                </div>
                <div>
                  <label className="form-label">Filter by Project</label>
                  <select className="form-select" value={checklistProject} onChange={e => setChecklistProject(e.target.value)}>
                    <option value="">All Sites</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div style={{ marginTop: '12px' }}>
                  <div className="progress-wrap" style={{ height: '8px' }}>
                    <div className={`progress-fill ${checklistScore >= 80 ? 'progress-green' : checklistScore >= 60 ? 'progress-accent' : 'progress-red'}`}
                      style={{ width: `${checklistScore}%` }} />
                  </div>
                </div>
                <div style={{ marginTop: '12px', fontSize: '11px', color: 'var(--muted-2)' }}>
                  {Object.values(checklist).filter(Boolean).length} of {CHECKLIST_ITEMS.length} items checked
                </div>
                <button className="btn btn-secondary" style={{ marginTop: '10px', width: '100%', justifyContent: 'center' }}
                  onClick={() => setChecklist({})}>
                  Reset Checklist
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {Object.entries(checklistByCategory).map(([category, items]) => (
                <div key={category} className="panel">
                  <div className="panel-header">
                    <div className="panel-title">{category.toUpperCase()} INSPECTION</div>
                    <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px', color: 'var(--muted)' }}>
                      {items.filter(i => checklist[i.id]).length}/{items.length} complete
                    </span>
                  </div>
                  <div style={{ padding: '8px 14px' }}>
                    {items.map(item => (
                      <div key={item.id} onClick={() => setChecklist(c => ({ ...c, [item.id]: !c[item.id] }))}
                        style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}>
                        <div style={{
                          width: '20px', height: '20px', borderRadius: '3px', flexShrink: 0,
                          background: checklist[item.id] ? 'var(--green)' : 'var(--surface-3)',
                          border: `1px solid ${checklist[item.id] ? 'var(--green)' : 'var(--border-mid)'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '12px', color: '#fff', transition: 'all 0.15s',
                        }}>
                          {checklist[item.id] ? '✓' : ''}
                        </div>
                        <span style={{ fontSize: '12px', color: checklist[item.id] ? 'var(--muted)' : 'var(--cream)', textDecoration: checklist[item.id] ? 'line-through' : 'none', flex: 1 }}>
                          {item.label}
                        </span>
                        <span className={`badge ${checklist[item.id] ? 'badge-green' : 'badge-grey'}`} style={{ fontSize: '8px' }}>
                          {checklist[item.id] ? 'OK' : 'Pending'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Analytics */}
      {tab === 'stats' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }} className="grid-responsive">
          <div className="panel">
            <div className="panel-header"><div className="panel-title">INCIDENTS BY TYPE</div></div>
            <div className="panel-body">
              {INCIDENT_TYPES.map(type => {
                const count = byType[type] ?? 0
                const pct = incidents.length > 0 ? (count / incidents.length) * 100 : 0
                return count > 0 ? (
                  <div key={type} style={{ marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px', color: 'var(--muted-2)', textTransform: 'capitalize' }}>{type.replace(/_/g, ' ')}</span>
                      <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px', color: 'var(--accent)' }}>{count}</span>
                    </div>
                    <div className="progress-wrap">
                      <div className={`progress-fill ${typeColor[type]?.replace('badge-', 'progress-') ?? 'progress-accent'}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                ) : null
              })}
              {incidents.length === 0 && <div style={{ color: 'var(--green)', textAlign: 'center', padding: '20px', fontFamily: 'var(--font-bebas)', fontSize: '20px' }}>NO DATA YET</div>}
            </div>
          </div>
          <div className="panel">
            <div className="panel-header"><div className="panel-title">INCIDENTS BY SEVERITY</div></div>
            <div className="panel-body">
              {SEVERITY.map(sev => {
                const count = bySeverity[sev] ?? 0
                const pct = incidents.length > 0 ? (count / incidents.length) * 100 : 0
                const colors = { minor: 'var(--accent)', moderate: 'var(--amber)', serious: 'var(--red)', critical: 'var(--red)' }
                return (
                  <div key={sev} style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '10px', color: colors[sev], textTransform: 'uppercase', letterSpacing: '0.1em' }}>{sev}</span>
                      <span style={{ fontFamily: 'var(--font-bebas)', fontSize: '22px', color: colors[sev], lineHeight: 1 }}>{count}</span>
                    </div>
                    <div className="progress-wrap">
                      <div style={{ width: `${pct}%`, height: '100%', background: colors[sev], transition: 'width 0.4s' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="panel">
            <div className="panel-header"><div className="panel-title">KEY METRICS</div></div>
            <div className="panel-body">
              {[
                ['Total Incidents', incidents.length],
                ['Open / Unresolved', openIncidents],
                ['Total Lost Time Days', lostDays],
                ['Notifiable to Authority', notifiable],
                ['Near Miss Events', byType['near_miss'] ?? 0],
                ['Lost Time Incidents (LTI)', byType['lost_time'] ?? 0],
              ].map(([label, value]) => (
                <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '10px', color: 'var(--muted-2)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</span>
                  <span style={{ fontFamily: 'var(--font-bebas)', fontSize: '22px', color: 'var(--cream)', lineHeight: 1 }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="panel">
            <div className="panel-header"><div className="panel-title">CARIBBEAN COMPLIANCE REMINDERS</div></div>
            <div style={{ padding: '10px 14px' }}>
              {[
                { island: 'BRB', label: 'Barbados', notes: 'BSSI / OSHA Barbados requirements. Notifiable incidents within 24hrs to Chief Labour Officer.' },
                { island: 'KYD', label: 'Cayman Islands', notes: 'HSA (Health & Safety at Work) Law. Fatal/serious injuries to the Labour Commissioner.' },
                { island: 'JAM', label: 'Jamaica', notes: 'OSHA Jamaica. Report to Ministry of Labour within 7 days for lost-time incidents.' },
                { island: 'TTD', label: 'Trinidad & Tobago', notes: 'OSH Act. OSHA TT requires notification within 24hrs for serious injuries.' },
              ].map(item => (
                <div key={item.island} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                    <span className="badge badge-blue">{item.island}</span>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--cream)' }}>{item.label}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--muted-2)', lineHeight: 1.6 }}>{item.notes}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`@media(max-width:900px){.stat-grid-responsive{grid-template-columns:1fr 1fr!important;}.grid-responsive{grid-template-columns:1fr!important;}}`}</style>
    </div>
  )
}
