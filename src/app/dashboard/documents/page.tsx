'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import type { Document as CrmDocument } from '@/types'

export default function DocumentsPage() {
  const [docs, setDocs] = useState<CrmDocument[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [showForm, setShowForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [form, setForm] = useState({ project_id: '', title: '', type: 'blueprint', access_level: 'all_staff', description: '', version: '1.0' })
  const supabase = createClient()

  async function load() {
    const [{ data: d }, { data: p }] = await Promise.all([
      supabase.from('documents').select('*, project:projects(name)').order('created_at', { ascending: false }),
      supabase.from('projects').select('id, name'),
    ])
    setDocs(d ?? [])
    setProjects(p ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    setUploading(true)
    let fileUrl = null
    let fileSizeKb = null

    if (file) {
      const path = `${Date.now()}-${file.name}`
      const { data: uploadData, error: uploadError } = await supabase.storage.from('documents').upload(path, file)
      if (!uploadError && uploadData) {
        const { data: urlData } = supabase.storage.from('documents').getPublicUrl(path)
        fileUrl = urlData.publicUrl
        fileSizeKb = Math.round(file.size / 1024)
      }
    }

    await supabase.from('documents').insert({
      ...form,
      project_id: form.project_id || null,
      file_url: fileUrl,
      file_size_kb: fileSizeKb,
    })
    setShowForm(false)
    setFile(null)
    setForm({ project_id: '', title: '', type: 'blueprint', access_level: 'all_staff', description: '', version: '1.0' })
    setUploading(false)
    load()
  }

  const filtered = filter === 'all' ? docs : docs.filter(d => d.type === filter)

  const typeClass: Record<string, string> = { blueprint: 'badge-blue', contract: 'badge-grey', permit: 'badge-green', report: 'badge-grey', survey: 'badge-grey', photo: 'badge-grey', other: 'badge-grey' }
  const accessClass: Record<string, string> = { all_staff: 'badge-green', engineers: 'badge-amber', directors: 'badge-red', investors: 'badge-blue' }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '12px' }} className="grid-responsive">
      {/* Folder sidebar */}
      <div className="panel" style={{ alignSelf: 'start' }}>
        <div className="panel-header"><div className="panel-title">FOLDERS</div></div>
        <div style={{ padding: '8px' }}>
          {[
            { id: 'all', label: 'All Documents' },
            { id: 'blueprint', label: 'Blueprints' },
            { id: 'contract', label: 'Contracts' },
            { id: 'permit', label: 'Permits' },
            { id: 'report', label: 'Reports' },
            { id: 'survey', label: 'Surveys' },
          ].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)} style={{
              display: 'block', width: '100%', textAlign: 'left',
              padding: '8px 10px', background: filter === f.id ? 'var(--accent-dim)' : 'transparent',
              border: 'none', borderLeft: `2px solid ${filter === f.id ? 'var(--accent)' : 'transparent'}`,
              color: filter === f.id ? 'var(--cream)' : 'var(--muted-2)',
              fontSize: '12px', cursor: 'pointer', fontFamily: 'var(--font-space-grotesk)',
            }}>
              {f.label}
              <span style={{ float: 'right', fontFamily: 'var(--font-space-mono)', fontSize: '9px', color: 'var(--muted)' }}>
                {f.id === 'all' ? docs.length : docs.filter(d => d.type === f.id).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Document list */}
      <div>
        {showForm && (
          <div className="panel" style={{ marginBottom: '12px' }}>
            <div className="panel-header"><div className="panel-title">UPLOAD DOCUMENT</div></div>
            <div className="panel-body">
              <form onSubmit={handleUpload}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ gridColumn: 'span 2' }}><label className="form-label">Document Title *</label><input className="form-input" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} required /></div>
                  <div><label className="form-label">Project</label>
                    <select className="form-select" value={form.project_id} onChange={e => setForm(f => ({...f, project_id: e.target.value}))}>
                      <option value="">Portfolio-level</option>
                      {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div><label className="form-label">Type</label>
                    <select className="form-select" value={form.type} onChange={e => setForm(f => ({...f, type: e.target.value}))}>
                      <option value="blueprint">Blueprint</option><option value="contract">Contract</option><option value="permit">Permit</option><option value="report">Report</option><option value="survey">Survey</option><option value="photo">Photo</option><option value="other">Other</option>
                    </select>
                  </div>
                  <div><label className="form-label">Access Level</label>
                    <select className="form-select" value={form.access_level} onChange={e => setForm(f => ({...f, access_level: e.target.value}))}>
                      <option value="all_staff">All Staff</option><option value="engineers">Engineers+</option><option value="directors">Directors Only</option><option value="investors">Investors</option>
                    </select>
                  </div>
                  <div><label className="form-label">Version</label><input className="form-input" value={form.version} onChange={e => setForm(f => ({...f, version: e.target.value}))} /></div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">File Upload</label>
                    <input type="file" onChange={e => setFile(e.target.files?.[0] ?? null)} style={{ width: '100%', padding: '8px', background: 'var(--surface-2)', border: '1px solid var(--border-mid)', color: 'var(--cream)', fontSize: '12px' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
                  <button type="submit" className="btn btn-primary" disabled={uploading}>{uploading ? 'Uploading...' : 'Upload Document'}</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="panel-title">{filter === 'all' ? 'ALL DOCUMENTS' : filter.toUpperCase() + 'S'}</div>
              <div className="panel-sub">Role-based access control</div>
            </div>
            <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>+ Upload</button>
          </div>
          <div className="table-scroll">
            <table className="data-table">
              <thead><tr><th>Document</th><th>Project</th><th>Type</th><th>Version</th><th>Uploaded</th><th>Access</th><th></th></tr></thead>
              <tbody>
                {loading && <tr><td colSpan={7} style={{ textAlign: 'center', padding: '20px', color: 'var(--muted)' }}>Loading...</td></tr>}
                {filtered.map(doc => (
                  <tr key={doc.id}>
                    <td className="strong">{doc.title}</td>
                    <td style={{ color: 'var(--muted-2)' }}>{(doc as any).project?.name ?? 'Portfolio'}</td>
                    <td><span className={`badge ${typeClass[doc.type] ?? 'badge-grey'}`}>{doc.type}</span></td>
                    <td style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px', color: 'var(--muted)' }}>v{doc.version}</td>
                    <td style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px' }}>{formatDate(doc.created_at)}</td>
                    <td><span className={`badge ${accessClass[doc.access_level] ?? 'badge-grey'}`}>{doc.access_level.replace('_',' ')}</span></td>
                    <td>
                      {doc.file_url ? (
                        <a href={doc.file_url} target="_blank" rel="noreferrer" className="panel-action">View →</a>
                      ) : (
                        <span className="panel-action" style={{ opacity: 0.4 }}>No file</span>
                      )}
                    </td>
                  </tr>
                ))}
                {!loading && !filtered.length && <tr><td colSpan={7} style={{ textAlign: 'center', padding: '20px', color: 'var(--muted)' }}>No documents in this category</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <style>{`@media(max-width:900px){.grid-responsive{grid-template-columns:1fr!important;}}`}</style>
    </div>
  )
}
