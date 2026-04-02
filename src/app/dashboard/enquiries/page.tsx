'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const TIER_COLORS: Record<string, string> = {
  hot:         'badge-red',
  warm:        'badge-amber',
  cold:        'badge-grey',
  unqualified: 'badge-grey',
}

const STATUS_COLORS: Record<string, string> = {
  new:                'badge-blue',
  contacted:          'badge-amber',
  appointment_booked: 'badge-green',
  quote_sent:         'badge-blue',
  won:                'badge-green',
  lost:               'badge-grey',
  nurturing:          'badge-grey',
}

const URGENCY_COLORS: Record<string, string> = {
  emergency: 'badge-red',
  high:      'badge-amber',
  medium:    'badge-blue',
  low:       'badge-grey',
}

const fmt = (n: number) =>
  n >= 1000000 ? `$${(n / 1000000).toFixed(1)}M`
  : n >= 1000   ? `$${(n / 1000).toFixed(0)}K`
  : `$${n}`

const timeAgo = (ts: string) => {
  const mins = Math.floor((Date.now() - new Date(ts).getTime()) / 60000)
  if (mins < 60)   return `${mins}m ago`
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`
  return `${Math.floor(mins / 1440)}d ago`
}

export default function EnquiriesPage() {
  const [enquiries, setEnquiries] = useState<any[]>([])
  const [profiles, setProfiles]   = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  const [selected, setSelected]   = useState<any>(null)
  const [tierFilter, setTierFilter]   = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  async function load() {
    setLoading(true)
    const [{ data: e }, { data: p }] = await Promise.all([
      supabase.from('website_enquiries')
        .select('*, assigned:profiles!assigned_to(full_name)')
        .order('created_at', { ascending: false })
        .limit(200),
      supabase.from('profiles').select('id, full_name').order('full_name'),
    ])
    setEnquiries(e ?? [])
    setProfiles(p ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const filtered = enquiries.filter(e => {
    if (tierFilter   !== 'all' && e.lead_tier !== tierFilter)     return false
    if (statusFilter !== 'all' && e.status    !== statusFilter)   return false
    return true
  })

  // KPIs
  const hot       = enquiries.filter(e => e.lead_tier === 'hot').length
  const warm      = enquiries.filter(e => e.lead_tier === 'warm').length
  const newToday  = enquiries.filter(e => {
    const d = new Date(e.created_at)
    const now = new Date()
    return d.getFullYear() === now.getFullYear() &&
           d.getMonth()    === now.getMonth()    &&
           d.getDate()     === now.getDate()
  }).length
  const avgScore  = enquiries.length
    ? Math.round(enquiries.reduce((s, e) => s + (e.lead_score ?? 0), 0) / enquiries.length)
    : 0

  async function updateStatus(id: string, status: string) {
    setSaving(true)
    const update: any = { status }
    if (status === 'contacted' && !selected?.first_contacted_at) {
      const now = new Date().toISOString()
      const created = new Date(selected.created_at).getTime()
      update.first_contacted_at = now
      update.response_time_mins = Math.round((Date.now() - created) / 60000)
    }
    await supabase.from('website_enquiries').update(update).eq('id', id)
    setSaving(false)
    load()
    if (selected?.id === id) setSelected({ ...selected, ...update })
  }

  async function assignTo(id: string, profileId: string) {
    await supabase.from('website_enquiries').update({ assigned_to: profileId || null }).eq('id', id)
    load()
  }

  async function saveNotes(id: string, notes: string) {
    await supabase.from('website_enquiries').update({ notes }).eq('id', id)
  }

  return (
    <div>
      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '20px' }} className="stat-grid-responsive">
        <div className="stat-card">
          <div className="text-label">Total Enquiries</div>
          <div className="stat-value text-accent" style={{ marginTop: '6px' }}>{enquiries.length}</div>
          <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '4px' }}>{newToday} today</div>
        </div>
        <div className="stat-card" style={{ borderColor: 'var(--red)' }}>
          <div className="text-label">Hot Leads</div>
          <div className="stat-value" style={{ marginTop: '6px', color: 'var(--red)' }}>{hot}</div>
          <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '4px' }}>Score 85–100 · Call now</div>
        </div>
        <div className="stat-card">
          <div className="text-label">Warm Leads</div>
          <div className="stat-value text-amber" style={{ marginTop: '6px' }}>{warm}</div>
          <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '4px' }}>Score 65–84 · 2hr target</div>
        </div>
        <div className="stat-card">
          <div className="text-label">Avg Lead Score</div>
          <div className="stat-value text-green" style={{ marginTop: '6px' }}>{avgScore}</div>
          <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '4px' }}>/ 100 qualification score</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap: '12px' }}>
        {/* Left: table */}
        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="panel-title">WEBSITE ENQUIRIES</div>
              <div className="panel-sub">Inbound leads from summitstone.bb · {filtered.length} shown</div>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {/* Tier filter */}
              <select className="form-select" style={{ height: '28px', fontSize: '10px', padding: '0 8px' }}
                value={tierFilter} onChange={e => setTierFilter(e.target.value)}>
                <option value="all">All Tiers</option>
                <option value="hot">Hot</option>
                <option value="warm">Warm</option>
                <option value="cold">Cold</option>
                <option value="unqualified">Unqualified</option>
              </select>
              {/* Status filter */}
              <select className="form-select" style={{ height: '28px', fontSize: '10px', padding: '0 8px' }}
                value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="all">All Statuses</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="appointment_booked">Appt Booked</option>
                <option value="quote_sent">Quote Sent</option>
                <option value="won">Won</option>
                <option value="nurturing">Nurturing</option>
                <option value="lost">Lost</option>
              </select>
            </div>
          </div>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Lead</th>
                  <th>Score</th>
                  <th>Tier</th>
                  <th>Project</th>
                  <th>Budget</th>
                  <th>Urgency</th>
                  <th>Status</th>
                  <th>Assigned</th>
                  <th>Received</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: '24px', color: 'var(--muted)' }}>Loading...</td></tr>
                )}
                {filtered.map(e => {
                  const isHot = e.lead_tier === 'hot'
                  return (
                    <tr key={e.id}
                      style={{ cursor: 'pointer', background: selected?.id === e.id ? 'var(--accent-dim)' : isHot ? 'rgba(255,77,77,0.04)' : 'transparent' }}
                      onClick={() => setSelected(selected?.id === e.id ? null : e)}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--cream)', fontSize: '12px' }}>{e.name}</div>
                        <div style={{ fontSize: '10px', color: 'var(--muted)' }}>{e.email}</div>
                        {e.phone && <div style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px', color: 'var(--muted)' }}>{e.phone}</div>}
                      </td>
                      <td>
                        <div style={{
                          fontFamily: 'var(--font-bebas)', fontSize: '20px', lineHeight: 1,
                          color: e.lead_score >= 85 ? 'var(--red)' : e.lead_score >= 65 ? 'var(--amber)' : 'var(--muted-2)',
                        }}>{e.lead_score ?? 0}</div>
                      </td>
                      <td><span className={`badge ${TIER_COLORS[e.lead_tier] ?? 'badge-grey'}`}>{e.lead_tier ?? '—'}</span></td>
                      <td>
                        <div style={{ fontSize: '11px', color: 'var(--cream)' }}>{(e.project_type ?? '').replace(/_/g, ' ')}</div>
                        <div style={{ fontSize: '10px', color: 'var(--muted)' }}>{e.island_market ?? '—'}</div>
                      </td>
                      <td style={{ fontFamily: 'var(--font-space-mono)', fontSize: '10px', color: 'var(--accent)' }}>
                        {e.budget_label ?? (e.budget_min ? fmt(e.budget_min) : '—')}
                      </td>
                      <td>
                        {e.urgency
                          ? <span className={`badge ${URGENCY_COLORS[e.urgency] ?? 'badge-grey'}`}>{e.urgency}</span>
                          : <span style={{ color: 'var(--muted)', fontSize: '11px' }}>—</span>}
                      </td>
                      <td><span className={`badge ${STATUS_COLORS[e.status] ?? 'badge-grey'}`}>{e.status?.replace(/_/g, ' ') ?? 'new'}</span></td>
                      <td style={{ fontSize: '11px', color: 'var(--muted-2)' }}>
                        {e.assigned?.full_name ?? <span style={{ color: 'var(--muted)' }}>Unassigned</span>}
                      </td>
                      <td style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                        {timeAgo(e.created_at)}
                      </td>
                    </tr>
                  )
                })}
                {!loading && filtered.length === 0 && (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: '30px', color: 'var(--muted)' }}>No enquiries match the current filters</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: detail panel */}
        {selected && (
          <div className="panel" style={{ borderColor: selected.lead_tier === 'hot' ? 'var(--red)' : selected.lead_tier === 'warm' ? 'var(--amber)' : 'var(--border)', height: 'fit-content' }}>
            <div className="panel-header">
              <div>
                <div className="panel-title">{selected.name}</div>
                <div className="panel-sub">
                  <span className={`badge ${TIER_COLORS[selected.lead_tier] ?? 'badge-grey'}`}>{selected.lead_tier}</span>
                  {' · '}Score {selected.lead_score ?? 0}
                </div>
              </div>
              <button className="btn btn-secondary" style={{ height: '24px', padding: '0 8px', fontSize: '10px' }}
                onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

              {/* Hot lead alert */}
              {selected.lead_tier === 'hot' && (
                <div style={{ background: 'rgba(255,77,77,0.1)', border: '1px solid var(--red)', padding: '10px 12px' }}>
                  <div style={{ fontFamily: 'var(--font-space-mono)', fontSize: '8px', letterSpacing: '0.15em', color: 'var(--red)', marginBottom: '4px' }}>🔴 HOT LEAD — RESPOND NOW</div>
                  <div style={{ fontSize: '11px', color: 'var(--cream)' }}>Target response: within 15 minutes. First to respond wins 78% of the time.</div>
                </div>
              )}

              {/* Contact */}
              <div>
                <div className="text-label" style={{ marginBottom: '6px' }}>Contact</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <a href={`mailto:${selected.email}`} style={{ fontSize: '12px', color: 'var(--accent)', textDecoration: 'none' }}>{selected.email}</a>
                  {selected.phone && <a href={`tel:${selected.phone}`} style={{ fontFamily: 'var(--font-space-mono)', fontSize: '10px', color: 'var(--cream)', textDecoration: 'none' }}>{selected.phone}</a>}
                  {selected.whatsapp_opted_in && selected.phone && (
                    <a href={`https://wa.me/${selected.phone.replace(/\D/g,'')}`} target="_blank" rel="noopener"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '10px', color: '#25d366', fontFamily: 'var(--font-space-mono)', textDecoration: 'none' }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="#25d366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.527 5.855L.057 23.927a.5.5 0 0 0 .611.61l6.123-1.47A11.95 11.95 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.948 9.948 0 0 1-5.073-1.385l-.364-.216-3.766.904.92-3.681-.236-.376A9.955 9.955 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                      WhatsApp opted in
                    </a>
                  )}
                </div>
              </div>

              {/* Project details */}
              <div>
                <div className="text-label" style={{ marginBottom: '6px' }}>Project</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {[
                    ['Type',       (selected.project_type ?? '—').replace(/_/g, ' ')],
                    ['Island',     selected.island_market ?? '—'],
                    ['Budget',     selected.budget_label  ?? '—'],
                    ['Timeline',   (selected.timeline ?? '—').replace(/_/g, ' ')],
                    ['Urgency',    selected.urgency       ?? '—'],
                    ['Financing',  (selected.financing_status ?? '—').replace(/_/g, ' ')],
                    ['Decision maker', selected.decision_maker ? 'Yes' : 'No'],
                  ].map(([label, val]) => (
                    <div key={label}>
                      <div style={{ fontFamily: 'var(--font-space-mono)', fontSize: '8px', color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '2px' }}>{label}</div>
                      <div style={{ fontSize: '11px', color: 'var(--cream)', textTransform: 'capitalize' }}>{val}</div>
                    </div>
                  ))}
                </div>
                {selected.message && (
                  <div style={{ marginTop: '10px', padding: '10px', background: 'var(--surface-2)', border: '1px solid var(--border)', fontSize: '11px', color: 'var(--muted-2)', lineHeight: 1.6 }}>
                    {selected.message}
                  </div>
                )}
              </div>

              {/* Attribution */}
              {selected.utm_source && (
                <div>
                  <div className="text-label" style={{ marginBottom: '6px' }}>Source</div>
                  <div style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px', color: 'var(--accent)' }}>
                    {selected.utm_source}{selected.utm_campaign ? ` · ${selected.utm_campaign}` : ''}
                  </div>
                  {selected.response_time_mins && (
                    <div style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px', color: selected.response_time_mins <= 15 ? 'var(--green)' : selected.response_time_mins <= 120 ? 'var(--amber)' : 'var(--red)', marginTop: '4px' }}>
                      Response time: {selected.response_time_mins < 60
                        ? `${selected.response_time_mins}m`
                        : `${Math.floor(selected.response_time_mins / 60)}h ${selected.response_time_mins % 60}m`}
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div>
                <div className="text-label" style={{ marginBottom: '8px' }}>Actions</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {/* Status */}
                  <select className="form-select" style={{ fontSize: '11px' }}
                    value={selected.status ?? 'new'}
                    onChange={e => updateStatus(selected.id, e.target.value)}>
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="appointment_booked">Appointment Booked</option>
                    <option value="quote_sent">Quote Sent</option>
                    <option value="won">Won — Project Created</option>
                    <option value="nurturing">Nurturing</option>
                    <option value="lost">Lost</option>
                  </select>
                  {/* Assign */}
                  <select className="form-select" style={{ fontSize: '11px' }}
                    value={selected.assigned_to ?? ''}
                    onChange={e => assignTo(selected.id, e.target.value)}>
                    <option value="">Unassigned</option>
                    {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                  </select>
                  {/* Notes */}
                  <textarea className="form-textarea" style={{ fontSize: '11px', minHeight: '70px' }}
                    placeholder="Internal notes..."
                    defaultValue={selected.notes ?? ''}
                    onBlur={e => saveNotes(selected.id, e.target.value)}
                  />
                  {/* Quick contact buttons */}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <a href={`mailto:${selected.email}?subject=Re: Your ${(selected.project_type ?? 'construction').replace(/_/g,' ')} enquiry&body=Hi ${selected.name.split(' ')[0]},%0A%0AThank you for reaching out to SummitStone.`}
                       className="btn btn-primary" style={{ flex: 1, textAlign: 'center', fontSize: '10px', padding: '6px' }}>
                      Email Lead
                    </a>
                    {selected.phone && (
                      <a href={`tel:${selected.phone}`} className="btn btn-secondary" style={{ flex: 1, textAlign: 'center', fontSize: '10px', padding: '6px' }}>
                        Call
                      </a>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px', color: 'var(--muted)', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                Received {new Date(selected.created_at).toLocaleString()}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media(max-width:900px){.stat-grid-responsive{grid-template-columns:1fr 1fr!important;}}
      `}</style>
    </div>
  )
}
