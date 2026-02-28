'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDate, SAFETY_STATUS_LABELS } from '@/lib/utils'
import type { SiteLog, SafetyStatus } from '@/types'

export default function SiteLogsPage() {
  const [logs, setLogs] = useState<SiteLog[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ project_id: '', log_date: new Date().toISOString().slice(0,10), workers_on_site: '', weather: 'clear', work_performed: '', safety_status: 'clear', safety_notes: '', delays_description: '', delay_hours: '0' })
  const supabase = createClient()

  async function load() {
    const [{ data: l }, { data: p }] = await Promise.all([
      supabase.from('site_logs').select('*, project:projects(name)').order('log_date', { ascending: false }).limit(20),
      supabase.from('projects').select('id, name').in('stage', ['in_construction','pre_construction']),
    ])
    setLogs(l ?? [])
    setProjects(p ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await supabase.from('site_logs').insert({
      ...form,
      workers_on_site: parseInt(form.workers_on_site) || 0,
      delay_hours: parseFloat(form.delay_hours) || 0,
    })
    setForm(f => ({ ...f, work_performed: '', safety_notes: '', delays_description: '' }))
    load()
  }

  const safetyColors: Record<string, string> = { clear: 'badge-green', minor: 'badge-amber', incident: 'badge-red', critical: 'badge-red' }
  const weatherIcons: Record<string, string> = { clear: '☀', partly_cloudy: '⛅', overcast: '☁', rain: '🌧', storm: '⛈', hurricane_warning: '🌀' }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.8fr', gap: '12px' }} className="grid-responsive">
      {/* Form */}
      <div className="panel" style={{ alignSelf: 'start' }}>
        <div className="panel-header"><div className="panel-title">SUBMIT SITE LOG</div></div>
        <div className="panel-body">
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div><label className="form-label">Project *</label>
                <select className="form-select" value={form.project_id} onChange={e => setForm(f => ({...f, project_id: e.target.value}))} required>
                  <option value="">Select project...</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div><label className="form-label">Date</label><input className="form-input" type="date" value={form.log_date} onChange={e => setForm(f => ({...f, log_date: e.target.value}))} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div><label className="form-label">Workers On Site</label><input className="form-input" type="number" value={form.workers_on_site} onChange={e => setForm(f => ({...f, workers_on_site: e.target.value}))} placeholder="24" /></div>
                <div><label className="form-label">Weather</label>
                  <select className="form-select" value={form.weather} onChange={e => setForm(f => ({...f, weather: e.target.value}))}>
                    <option value="clear">Clear</option><option value="partly_cloudy">Partly Cloudy</option><option value="overcast">Overcast</option><option value="rain">Rain</option><option value="storm">Storm</option><option value="hurricane_warning">Hurricane Warning</option>
                  </select>
                </div>
              </div>
              <div><label className="form-label">Work Performed *</label><textarea className="form-textarea" value={form.work_performed} onChange={e => setForm(f => ({...f, work_performed: e.target.value}))} placeholder="Describe work activities..." required /></div>
              <div><label className="form-label">Safety Status</label>
                <select className="form-select" value={form.safety_status} onChange={e => setForm(f => ({...f, safety_status: e.target.value}))}>
                  <option value="clear">Clear</option><option value="minor">Minor Issue</option><option value="incident">Incident</option><option value="critical">Critical</option>
                </select>
              </div>
              {form.safety_status !== 'clear' && (
                <div><label className="form-label">Safety Notes</label><textarea className="form-textarea" value={form.safety_notes} onChange={e => setForm(f => ({...f, safety_notes: e.target.value}))} placeholder="Describe the safety issue..." style={{ minHeight: '60px' }} /></div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div><label className="form-label">Delay Hours</label><input className="form-input" type="number" step="0.5" value={form.delay_hours} onChange={e => setForm(f => ({...f, delay_hours: e.target.value}))} /></div>
                <div><label className="form-label">Delay Reason</label><input className="form-input" value={form.delays_description} onChange={e => setForm(f => ({...f, delays_description: e.target.value}))} placeholder="Weather, material..." /></div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Submit Log</button>
            </div>
          </form>
        </div>
      </div>

      {/* Log history */}
      <div className="panel">
        <div className="panel-header"><div><div className="panel-title">SITE LOG HISTORY</div><div className="panel-sub">All projects · Latest entries</div></div></div>
        <div className="table-scroll">
          <table className="data-table">
            <thead><tr><th>Date</th><th>Project</th><th>Workers</th><th>Weather</th><th>Work Summary</th><th>Safety</th></tr></thead>
            <tbody>
              {loading && <tr><td colSpan={6} style={{ textAlign: 'center', padding: '20px', color: 'var(--muted)' }}>Loading...</td></tr>}
              {logs.map(log => (
                <tr key={log.id}>
                  <td style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px', whiteSpace: 'nowrap' }}>{formatDate(log.log_date)}</td>
                  <td className="strong">{(log as any).project?.name}</td>
                  <td style={{ fontFamily: 'var(--font-space-mono)', fontSize: '10px', textAlign: 'center' }}>{log.workers_on_site}</td>
                  <td style={{ textAlign: 'center', fontSize: '14px' }}>{weatherIcons[log.weather] ?? '—'}</td>
                  <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.work_performed}</td>
                  <td><span className={`badge ${safetyColors[log.safety_status as string] ?? 'badge-grey'}`}>{SAFETY_STATUS_LABELS[log.safety_status as SafetyStatus] ?? log.safety_status}</span></td>
                </tr>
              ))}
              {!loading && !logs.length && <tr><td colSpan={6} style={{ textAlign: 'center', padding: '20px', color: 'var(--muted)' }}>No site logs yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      <style>{`@media(max-width:900px){.grid-responsive{grid-template-columns:1fr!important;}}`}</style>
    </div>
  )
}
