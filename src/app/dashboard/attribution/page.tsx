'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const PLATFORM_COLORS: Record<string, string> = {
  google: '#4285f4', meta: '#1877f2', instagram: 'var(--amber)',
  linkedin: '#0077b5', email: 'var(--accent)', referral: 'var(--green)',
  organic: 'var(--muted-2)', other: 'var(--muted)',
}

const fmt = (n: number) =>
  n >= 1000000 ? `$${(n / 1000000).toFixed(1)}M`
  : n >= 1000   ? `$${(n / 1000).toFixed(0)}K`
  : `$${n.toFixed(0)}`

const pct = (n: number, d: number) => d ? `${((n / d) * 100).toFixed(1)}%` : '0%'

export default function AttributionPage() {
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [enquiries, setEnquiries] = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  const [tab, setTab] = useState<'overview' | 'campaigns' | 'funnel'>('overview')
  const [showForm, setShowForm]   = useState(false)
  const [saving, setSaving]       = useState(false)
  const [form, setForm] = useState({
    name: '', platform: 'google', status: 'active', objective: '',
    target_island: '', target_audience: '', daily_budget_usd: '',
    total_spend_usd: '', start_date: '',
    leads_total: '', leads_qualified: '', appointments_booked: '',
    quotes_sent: '', projects_won: '', revenue_usd: '',
  })
  const supabase = createClient()

  async function load() {
    setLoading(true)
    const [{ data: c }, { data: e }] = await Promise.all([
      supabase.from('ad_campaigns').select('*').order('total_spend_usd', { ascending: false }),
      supabase.from('website_enquiries').select('utm_source, utm_campaign, lead_tier, status, lead_score, budget_max').order('created_at', { ascending: false }).limit(500),
    ])
    setCampaigns(c ?? [])
    setEnquiries(e ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function saveCampaign(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await supabase.from('ad_campaigns').insert({
      name:               form.name,
      platform:           form.platform,
      status:             form.status,
      objective:          form.objective || null,
      target_island:      form.target_island || null,
      target_audience:    form.target_audience || null,
      daily_budget_usd:   Number(form.daily_budget_usd) || 0,
      total_spend_usd:    Number(form.total_spend_usd) || 0,
      start_date:         form.start_date || null,
      leads_total:        Number(form.leads_total) || 0,
      leads_qualified:    Number(form.leads_qualified) || 0,
      appointments_booked:Number(form.appointments_booked) || 0,
      quotes_sent:        Number(form.quotes_sent) || 0,
      projects_won:       Number(form.projects_won) || 0,
      revenue_usd:        Number(form.revenue_usd) || 0,
    })
    setSaving(false)
    setShowForm(false)
    load()
  }

  // Totals
  const totals = campaigns.reduce((acc, c) => ({
    spend:        acc.spend        + (c.total_spend_usd    ?? 0),
    leads:        acc.leads        + (c.leads_total        ?? 0),
    qualified:    acc.qualified    + (c.leads_qualified    ?? 0),
    appointments: acc.appointments + (c.appointments_booked ?? 0),
    won:          acc.won          + (c.projects_won       ?? 0),
    revenue:      acc.revenue      + (c.revenue_usd        ?? 0),
  }), { spend: 0, leads: 0, qualified: 0, appointments: 0, won: 0, revenue: 0 })

  const overallROI = totals.spend > 0
    ? Math.round(((totals.revenue - totals.spend) / totals.spend) * 100)
    : 0

  const avgScore = enquiries.length
    ? Math.round(enquiries.reduce((s, e) => s + (e.lead_score ?? 0), 0) / enquiries.length)
    : 0

  // Funnel steps
  const funnel = [
    { label: 'Total Leads',        value: totals.leads,        drop: null },
    { label: 'Qualified (65+)',    value: totals.qualified,    drop: pct(totals.leads - totals.qualified, totals.leads) },
    { label: 'Appointments',       value: totals.appointments, drop: pct(totals.qualified - totals.appointments, totals.qualified) },
    { label: 'Quotes Sent',        value: campaigns.reduce((s, c) => s + (c.quotes_sent ?? 0), 0), drop: null },
    { label: 'Projects Won',       value: totals.won,          drop: null },
  ]

  const TABS = ['overview', 'campaigns', 'funnel'] as const

  return (
    <div>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '12px', marginBottom: '20px' }} className="stat-grid-responsive">
        <div className="stat-card">
          <div className="text-label">Ad Spend</div>
          <div className="stat-value" style={{ marginTop: '6px', fontSize: '20px' }}>{fmt(totals.spend)}</div>
        </div>
        <div className="stat-card">
          <div className="text-label">Total Leads</div>
          <div className="stat-value text-accent" style={{ marginTop: '6px' }}>{totals.leads}</div>
          <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '4px' }}>Avg score {avgScore}</div>
        </div>
        <div className="stat-card">
          <div className="text-label">Revenue Attributed</div>
          <div className="stat-value text-green" style={{ marginTop: '6px', fontSize: '20px' }}>{fmt(totals.revenue)}</div>
        </div>
        <div className="stat-card">
          <div className="text-label">Projects Won</div>
          <div className="stat-value text-accent" style={{ marginTop: '6px' }}>{totals.won}</div>
        </div>
        <div className="stat-card" style={{ borderColor: overallROI > 1000 ? 'var(--green)' : 'var(--border)' }}>
          <div className="text-label">Overall ROI</div>
          <div className="stat-value" style={{ marginTop: '6px', color: overallROI > 1000 ? 'var(--green)' : 'var(--amber)' }}>{overallROI.toLocaleString()}%</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: '16px', borderBottom: '1px solid var(--border)' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 20px',
            fontFamily: 'var(--font-space-mono)', fontSize: '9px',
            letterSpacing: '0.15em', textTransform: 'uppercase',
            background: 'none', border: 'none',
            borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
            color: tab === t ? 'var(--accent)' : 'var(--muted)',
            cursor: 'pointer', marginBottom: '-1px',
          }}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
        {tab === 'campaigns' && (
          <button className="btn btn-primary" style={{ marginLeft: 'auto', height: '30px', padding: '0 14px', fontSize: '10px' }}
            onClick={() => setShowForm(!showForm)}>+ Add Campaign</button>
        )}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }} className="grid-responsive">
          {/* By platform */}
          <div className="panel">
            <div className="panel-header"><div className="panel-title">LEADS BY PLATFORM</div></div>
            <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {Object.entries(
                campaigns.reduce((acc: any, c) => {
                  if (!acc[c.platform]) acc[c.platform] = { leads: 0, revenue: 0, spend: 0 }
                  acc[c.platform].leads   += c.leads_total ?? 0
                  acc[c.platform].revenue += c.revenue_usd ?? 0
                  acc[c.platform].spend   += c.total_spend_usd ?? 0
                  return acc
                }, {})
              ).sort(([, a]: any, [, b]: any) => b.leads - a.leads).map(([platform, d]: any) => {
                const color = PLATFORM_COLORS[platform] ?? 'var(--muted)'
                const maxLeads = Math.max(...campaigns.map(c => c.leads_total ?? 0)) || 1
                return (
                  <div key={platform}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--cream)', fontWeight: 500, textTransform: 'capitalize' }}>{platform}</span>
                      <div style={{ display: 'flex', gap: '14px' }}>
                        <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px', color: 'var(--muted)' }}>{d.leads} leads</span>
                        <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px', color: 'var(--green)' }}>{fmt(d.revenue)}</span>
                      </div>
                    </div>
                    <div style={{ height: '3px', background: 'var(--surface-3)', borderRadius: '2px' }}>
                      <div style={{ height: '3px', width: `${(d.leads / maxLeads) * 100}%`, background: color, borderRadius: '2px', transition: 'width 0.5s' }} />
                    </div>
                  </div>
                )
              })}
              {campaigns.length === 0 && <div style={{ color: 'var(--muted)', fontSize: '11px' }}>No campaigns yet</div>}
            </div>
          </div>

          {/* Key metrics grid */}
          <div className="panel">
            <div className="panel-header"><div className="panel-title">KEY METRICS</div></div>
            <div className="panel-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: 'var(--border)' }}>
                {[
                  { label: 'Cost Per Lead',      value: totals.leads > 0   ? fmt(totals.spend / totals.leads)        : '—' },
                  { label: 'Cost Per Qualified',  value: totals.qualified > 0 ? fmt(totals.spend / totals.qualified)  : '—' },
                  { label: 'Cost Per Win',        value: totals.won > 0    ? fmt(totals.spend / totals.won)           : '—' },
                  { label: 'Avg Revenue / Win',   value: totals.won > 0    ? fmt(totals.revenue / totals.won)         : '—' },
                  { label: 'Qualification Rate',  value: pct(totals.qualified, totals.leads) },
                  { label: 'Appt Booking Rate',   value: pct(totals.appointments, totals.qualified) },
                  { label: 'Close Rate',          value: pct(totals.won, totals.appointments) },
                  { label: 'Overall Conversion',  value: pct(totals.won, totals.leads) },
                ].map(({ label, value }) => (
                  <div key={label} style={{ background: 'var(--surface)', padding: '14px 16px' }}>
                    <div className="text-label">{label}</div>
                    <div style={{ fontFamily: 'var(--font-bebas)', fontSize: '22px', color: 'var(--cream)', marginTop: '4px', letterSpacing: '0.05em' }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CAMPAIGNS ── */}
      {tab === 'campaigns' && (
        <>
          {showForm && (
            <div className="panel" style={{ marginBottom: '16px' }}>
              <div className="panel-header"><div className="panel-title">ADD CAMPAIGN</div></div>
              <div className="panel-body">
                <form onSubmit={saveCampaign}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label className="form-label">Campaign Name *</label>
                      <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="Barbados Luxury — Google" />
                    </div>
                    <div>
                      <label className="form-label">Platform</label>
                      <select className="form-select" value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value }))}>
                        {['google','meta','instagram','linkedin','email','referral','organic','other'].map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="form-label">Status</label>
                      <select className="form-select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                        {['active','paused','completed','draft'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="form-label">Total Spend (USD)</label>
                      <input className="form-input" type="number" value={form.total_spend_usd} onChange={e => setForm(f => ({ ...f, total_spend_usd: e.target.value }))} placeholder="7200" />
                    </div>
                    <div>
                      <label className="form-label">Start Date</label>
                      <input className="form-input" type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
                    </div>
                    {[['leads_total','Total Leads'],['leads_qualified','Qualified'],['appointments_booked','Appointments'],['quotes_sent','Quotes'],['projects_won','Won'],['revenue_usd','Revenue (USD)']].map(([key, label]) => (
                      <div key={key}>
                        <label className="form-label">{label}</label>
                        <input className="form-input" type="number" value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder="0" />
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Add Campaign'}</button>
                    <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          )}
          <div className="panel">
            <div className="panel-header"><div className="panel-title">ALL CAMPAIGNS</div><div className="panel-sub">{campaigns.length} campaigns tracked</div></div>
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Campaign</th><th>Platform</th><th>Spend</th><th>Leads</th>
                    <th>Qual.</th><th>Appts</th><th>Won</th><th>Revenue</th><th>ROI</th><th>CPL</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && <tr><td colSpan={11} style={{ textAlign: 'center', padding: '20px', color: 'var(--muted)' }}>Loading...</td></tr>}
                  {campaigns.map(c => {
                    const roi = c.total_spend_usd > 0 ? Math.round(((c.revenue_usd - c.total_spend_usd) / c.total_spend_usd) * 100) : null
                    const cpl = c.leads_total > 0 ? fmt(c.total_spend_usd / c.leads_total) : '—'
                    const color = PLATFORM_COLORS[c.platform] ?? 'var(--muted)'
                    return (
                      <tr key={c.id}>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: '12px', color: 'var(--cream)' }}>{c.name}</div>
                          {c.target_island && <div style={{ fontSize: '9px', color: 'var(--muted)' }}>{c.target_island}</div>}
                        </td>
                        <td><span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px', color, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{c.platform}</span></td>
                        <td style={{ fontFamily: 'var(--font-space-mono)', fontSize: '10px' }}>{fmt(c.total_spend_usd ?? 0)}</td>
                        <td style={{ fontFamily: 'var(--font-space-mono)', fontSize: '11px', color: 'var(--accent)', fontWeight: 700 }}>{c.leads_total ?? 0}</td>
                        <td style={{ fontFamily: 'var(--font-space-mono)', fontSize: '10px', color: 'var(--muted-2)' }}>{c.leads_qualified ?? 0}</td>
                        <td style={{ fontFamily: 'var(--font-space-mono)', fontSize: '10px', color: 'var(--muted-2)' }}>{c.appointments_booked ?? 0}</td>
                        <td style={{ fontFamily: 'var(--font-space-mono)', fontSize: '11px', color: 'var(--green)', fontWeight: 700 }}>{c.projects_won ?? 0}</td>
                        <td style={{ fontFamily: 'var(--font-space-mono)', fontSize: '10px', color: 'var(--green)' }}>{c.revenue_usd > 0 ? fmt(c.revenue_usd) : '—'}</td>
                        <td style={{ fontFamily: 'var(--font-space-mono)', fontSize: '10px', color: roi && roi > 1000 ? 'var(--green)' : 'var(--amber)', fontWeight: 700 }}>
                          {roi !== null ? `${roi.toLocaleString()}%` : '—'}
                        </td>
                        <td style={{ fontFamily: 'var(--font-space-mono)', fontSize: '10px', color: 'var(--muted-2)' }}>{cpl}</td>
                        <td>
                          <span className={`badge ${c.status === 'active' ? 'badge-green' : c.status === 'paused' ? 'badge-amber' : 'badge-grey'}`}>{c.status}</span>
                        </td>
                      </tr>
                    )
                  })}
                  {!loading && campaigns.length === 0 && <tr><td colSpan={11} style={{ textAlign: 'center', padding: '24px', color: 'var(--muted)' }}>No campaigns yet — add your first campaign above</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── FUNNEL ── */}
      {tab === 'funnel' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }} className="grid-responsive">
          <div className="panel">
            <div className="panel-header"><div className="panel-title">CONVERSION FUNNEL</div><div className="panel-sub">All campaigns combined</div></div>
            <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {funnel.map((step, i) => {
                const width = 100 - i * 12
                const opacity = 0.9 - i * 0.15
                return (
                  <div key={step.label} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        width: `${width}%`,
                        background: `rgba(74,158,255,${opacity})`,
                        padding: '10px 16px',
                        display: 'flex', justifyContent: 'space-between',
                        margin: '0 auto',
                      }}>
                        <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px', color: '#0a0a0a', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{step.label}</span>
                        <span style={{ fontFamily: 'var(--font-bebas)', fontSize: '18px', color: '#0a0a0a', lineHeight: 1 }}>{step.value.toLocaleString()}</span>
                      </div>
                    </div>
                    {step.drop && (
                      <div style={{ fontFamily: 'var(--font-space-mono)', fontSize: '8px', color: 'var(--red)', minWidth: '36px' }}>-{step.drop}</div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
          <div className="panel">
            <div className="panel-header"><div className="panel-title">STAGE CONVERSION RATES</div></div>
            <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { label: 'Lead → Qualified',     actual: pct(totals.qualified, totals.leads),      target: '65%', val: totals.qualified / (totals.leads || 1) },
                { label: 'Qualified → Appt',      actual: pct(totals.appointments, totals.qualified), target: '35%', val: totals.appointments / (totals.qualified || 1) },
                { label: 'Appt → Won',            actual: pct(totals.won, totals.appointments),     target: '25%', val: totals.won / (totals.appointments || 1) },
                { label: 'Lead → Won (overall)',  actual: pct(totals.won, totals.leads),            target: '8%',  val: totals.won / (totals.leads || 1) },
              ].map(({ label, actual, target, val }) => (
                <div key={label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--cream)' }}>{label}</span>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '10px', color: 'var(--accent)', fontWeight: 700 }}>{actual}</span>
                      <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '10px', color: 'var(--muted)' }}>tgt {target}</span>
                    </div>
                  </div>
                  <div style={{ height: '3px', background: 'var(--surface-3)', borderRadius: '2px' }}>
                    <div style={{ height: '3px', width: `${Math.min(val * 100, 100)}%`, background: 'var(--accent)', borderRadius: '2px' }} />
                  </div>
                </div>
              ))}
              <div style={{ padding: '12px', background: 'var(--accent-dim)', border: '1px solid var(--accent-line)', marginTop: '8px' }}>
                <div className="text-label" style={{ marginBottom: '6px' }}>ROI Summary</div>
                <div style={{ fontFamily: 'var(--font-bebas)', fontSize: '32px', color: overallROI > 0 ? 'var(--green)' : 'var(--red)', letterSpacing: '0.05em' }}>{overallROI.toLocaleString()}%</div>
                <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '2px' }}>
                  {fmt(totals.spend)} spent → {fmt(totals.revenue)} attributed
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media(max-width:900px){
          .stat-grid-responsive{grid-template-columns:1fr 1fr!important;}
          .grid-responsive{grid-template-columns:1fr!important;}
        }
      `}</style>
    </div>
  )
}
