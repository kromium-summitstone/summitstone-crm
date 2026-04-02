'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const STATUS_COLORS: Record<string, string> = {
  scheduled:   'badge-blue',
  confirmed:   'badge-green',
  completed:   'badge-green',
  no_show:     'badge-red',
  cancelled:   'badge-grey',
  rescheduled: 'badge-amber',
}

const TYPE_LABELS: Record<string, string> = {
  site_consultation: 'Site Visit',
  office_meeting:    'Office',
  video_call:        'Video Call',
  phone_call:        'Phone',
  follow_up:         'Follow-up',
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([])
  const [enquiries, setEnquiries]       = useState<any[]>([])
  const [profiles, setProfiles]         = useState<any[]>([])
  const [loading, setLoading]           = useState(true)
  const [showForm, setShowForm]         = useState(false)
  const [selected, setSelected]         = useState<any>(null)
  const [saving, setSaving]             = useState(false)
  const [filter, setFilter]             = useState('upcoming')
  const [form, setForm] = useState({
    enquiry_id: '', assigned_to: '', title: '',
    appointment_type: 'site_consultation', status: 'scheduled',
    scheduled_at: '', duration_mins: '60', location: '', island: '',
  })
  const supabase = createClient()

  async function load() {
    setLoading(true)
    const [{ data: a }, { data: e }, { data: p }] = await Promise.all([
      supabase.from('appointments')
        .select('*, enquiry:website_enquiries(name,email,phone,project_type,lead_tier,lead_score), assignee:profiles!assigned_to(full_name)')
        .order('scheduled_at'),
      supabase.from('website_enquiries').select('id, name, email, lead_tier, lead_score').in('status', ['new','contacted','appointment_booked']).order('lead_score', { ascending: false }),
      supabase.from('profiles').select('id, full_name').order('full_name'),
    ])
    setAppointments(a ?? [])
    setEnquiries(e ?? [])
    setProfiles(p ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function saveAppointment(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await supabase.from('appointments').insert({
      ...form,
      enquiry_id:   form.enquiry_id   || null,
      assigned_to:  form.assigned_to  || null,
      duration_mins: Number(form.duration_mins) || 60,
    })
    // Update enquiry status if linked
    if (form.enquiry_id) {
      await supabase.from('website_enquiries').update({ status: 'appointment_booked' }).eq('id', form.enquiry_id)
    }
    setSaving(false)
    setShowForm(false)
    load()
  }

  async function markCompleted(id: string, outcomeNotes: string, quoteSent: boolean, quoteValue: string) {
    await supabase.from('appointments').update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      outcome_notes: outcomeNotes || null,
      quote_sent: quoteSent,
      quote_value_usd: quoteValue ? Number(quoteValue) : null,
    }).eq('id', id)
    load()
    setSelected(null)
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('appointments').update({ status }).eq('id', id)
    load()
  }

  const now = new Date()
  const filtered = appointments.filter(a => {
    const d = new Date(a.scheduled_at)
    if (filter === 'upcoming') return d >= now && !['completed','cancelled'].includes(a.status)
    if (filter === 'today') {
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
    }
    if (filter === 'completed') return a.status === 'completed'
    return true
  })

  const upcoming  = appointments.filter(a => new Date(a.scheduled_at) >= now && !['completed','cancelled'].includes(a.status)).length
  const today     = appointments.filter(a => { const d = new Date(a.scheduled_at); return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate() }).length
  const completed = appointments.filter(a => a.status === 'completed').length
  const noShow    = appointments.filter(a => a.status === 'no_show').length
  const showRate  = (completed + noShow) > 0 ? Math.round((completed / (completed + noShow)) * 100) : 0

  // Outcome form state for selected appt
  const [outcomeNotes, setOutcomeNotes] = useState('')
  const [quoteSent, setQuoteSent]       = useState(false)
  const [quoteValue, setQuoteValue]     = useState('')

  return (
    <div>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '20px' }} className="stat-grid-responsive">
        <div className="stat-card">
          <div className="text-label">Upcoming</div>
          <div className="stat-value text-accent" style={{ marginTop: '6px' }}>{upcoming}</div>
          <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '4px' }}>{today} today</div>
        </div>
        <div className="stat-card">
          <div className="text-label">Completed</div>
          <div className="stat-value text-green" style={{ marginTop: '6px' }}>{completed}</div>
        </div>
        <div className="stat-card">
          <div className="text-label">No-Shows</div>
          <div className="stat-value text-amber" style={{ marginTop: '6px' }}>{noShow}</div>
        </div>
        <div className="stat-card">
          <div className="text-label">Show Rate</div>
          <div className="stat-value" style={{ marginTop: '6px', color: showRate >= 80 ? 'var(--green)' : 'var(--amber)' }}>{showRate}%</div>
          <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '4px' }}>Target 80%+</div>
        </div>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)' }}>
          {(['upcoming', 'today', 'completed', 'all'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '7px 16px', fontFamily: 'var(--font-space-mono)', fontSize: '9px',
              letterSpacing: '0.12em', textTransform: 'uppercase', background: 'none', border: 'none',
              borderBottom: filter === f ? '2px solid var(--accent)' : '2px solid transparent',
              color: filter === f ? 'var(--accent)' : 'var(--muted)', cursor: 'pointer', marginBottom: '-1px',
            }}>{f}</button>
          ))}
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>+ Book Appointment</button>
      </div>

      {showForm && (
        <div className="panel" style={{ marginBottom: '16px' }}>
          <div className="panel-header"><div className="panel-title">BOOK APPOINTMENT</div></div>
          <div className="panel-body">
            <form onSubmit={saveAppointment}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Title *</label>
                  <input className="form-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required placeholder="Site Consultation — Sandy Lane Villa" />
                </div>
                <div>
                  <label className="form-label">Linked Enquiry</label>
                  <select className="form-select" value={form.enquiry_id} onChange={e => setForm(f => ({ ...f, enquiry_id: e.target.value }))}>
                    <option value="">None</option>
                    {enquiries.map(e => <option key={e.id} value={e.id}>{e.name} · Score {e.lead_score}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Assigned To</label>
                  <select className="form-select" value={form.assigned_to} onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))}>
                    <option value="">Unassigned</option>
                    {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Type</label>
                  <select className="form-select" value={form.appointment_type} onChange={e => setForm(f => ({ ...f, appointment_type: e.target.value }))}>
                    {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Island</label>
                  <select className="form-select" value={form.island} onChange={e => setForm(f => ({ ...f, island: e.target.value }))}>
                    <option value="">— Select —</option>
                    {[['BRB','Barbados'],['KYD','Cayman Islands'],['JAM','Jamaica'],['TTD','Trinidad & Tobago']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Date & Time *</label>
                  <input className="form-input" type="datetime-local" value={form.scheduled_at} onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))} required />
                </div>
                <div>
                  <label className="form-label">Duration (minutes)</label>
                  <input className="form-input" type="number" value={form.duration_mins} onChange={e => setForm(f => ({ ...f, duration_mins: e.target.value }))} />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Location / Address</label>
                  <input className="form-input" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Plot 14, Sandy Lane, St. James, Barbados" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Book Appointment'}</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 340px' : '1fr', gap: '12px' }}>
        {/* Table */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">APPOINTMENTS</div>
            <div className="panel-sub">{filtered.length} shown</div>
          </div>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr><th>Title</th><th>Type</th><th>Scheduled</th><th>Lead</th><th>Score</th><th>Assigned</th><th>Status</th><th>Quote</th></tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={8} style={{ textAlign: 'center', padding: '20px', color: 'var(--muted)' }}>Loading...</td></tr>}
                {filtered.map(a => (
                  <tr key={a.id} style={{ cursor: 'pointer', background: selected?.id === a.id ? 'var(--accent-dim)' : 'transparent' }}
                    onClick={() => { setSelected(selected?.id === a.id ? null : a); setOutcomeNotes(a.outcome_notes ?? ''); setQuoteSent(a.quote_sent ?? false); setQuoteValue(a.quote_value_usd ?? '') }}>
                    <td className="strong">{a.title}</td>
                    <td><span className="badge badge-blue">{TYPE_LABELS[a.appointment_type] ?? a.appointment_type}</span></td>
                    <td style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px', color: 'var(--muted-2)', whiteSpace: 'nowrap' }}>
                      {new Date(a.scheduled_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ fontSize: '11px', color: 'var(--muted-2)' }}>{a.enquiry?.name ?? '—'}</td>
                    <td style={{ fontFamily: 'var(--font-bebas)', fontSize: '18px', color: a.enquiry?.lead_score >= 85 ? 'var(--red)' : 'var(--muted-2)' }}>
                      {a.enquiry?.lead_score ?? '—'}
                    </td>
                    <td style={{ fontSize: '11px', color: 'var(--muted-2)' }}>{a.assignee?.full_name ?? '—'}</td>
                    <td><span className={`badge ${STATUS_COLORS[a.status] ?? 'badge-grey'}`}>{a.status}</span></td>
                    <td>
                      {a.quote_sent
                        ? <span className="badge badge-green">{a.quote_value_usd ? `$${Number(a.quote_value_usd).toLocaleString()}` : 'Sent'}</span>
                        : <span style={{ color: 'var(--muted)', fontSize: '11px' }}>—</span>}
                    </td>
                  </tr>
                ))}
                {!loading && filtered.length === 0 && (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: 'var(--muted)' }}>No appointments in this view</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail */}
        {selected && (
          <div className="panel" style={{ height: 'fit-content' }}>
            <div className="panel-header">
              <div className="panel-title" style={{ fontSize: '12px' }}>{selected.title}</div>
              <button className="btn btn-secondary" style={{ height: '24px', padding: '0 8px', fontSize: '10px' }} onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                ['Scheduled', new Date(selected.scheduled_at).toLocaleString()],
                ['Duration', `${selected.duration_mins} min`],
                ['Type', TYPE_LABELS[selected.appointment_type] ?? selected.appointment_type],
                ['Location', selected.location ?? '—'],
                ['Lead', selected.enquiry?.name ?? '—'],
                ['Lead Score', selected.enquiry?.lead_score ?? '—'],
                ['Assigned', selected.assignee?.full_name ?? '—'],
              ].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-label">{l}</span>
                  <span style={{ fontSize: '11px', color: 'var(--cream)', textAlign: 'right', maxWidth: '180px' }}>{v}</span>
                </div>
              ))}

              {/* Status update */}
              <div>
                <label className="form-label">Status</label>
                <select className="form-select" value={selected.status} onChange={e => { updateStatus(selected.id, e.target.value); setSelected({ ...selected, status: e.target.value }) }}>
                  {['scheduled','confirmed','completed','no_show','cancelled','rescheduled'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Outcome logging */}
              {['scheduled','confirmed','completed'].includes(selected.status) && (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                  <div className="text-label" style={{ marginBottom: '8px' }}>Log Outcome</div>
                  <textarea className="form-textarea" style={{ minHeight: '60px', fontSize: '11px', marginBottom: '8px' }}
                    placeholder="Notes from the consultation..."
                    value={outcomeNotes}
                    onChange={e => setOutcomeNotes(e.target.value)} />
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--cream)', marginBottom: '8px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={quoteSent} onChange={e => setQuoteSent(e.target.checked)} style={{ accentColor: 'var(--accent)' }} />
                    Quote sent to client
                  </label>
                  {quoteSent && (
                    <input className="form-input" type="number" placeholder="Quote value (USD)" value={quoteValue}
                      onChange={e => setQuoteValue(e.target.value)} style={{ marginBottom: '8px', fontSize: '11px' }} />
                  )}
                  <button className="btn btn-primary" style={{ width: '100%', fontSize: '11px' }}
                    onClick={() => markCompleted(selected.id, outcomeNotes, quoteSent, quoteValue)}>
                    Mark Completed
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`@media(max-width:900px){.stat-grid-responsive{grid-template-columns:1fr 1fr!important;}}`}</style>
    </div>
  )
}
