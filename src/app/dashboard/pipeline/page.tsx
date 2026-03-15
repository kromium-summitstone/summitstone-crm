'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { formatCurrency, STAGE_LABELS } from '@/lib/utils'
import type { ProjectStage, Island } from '@/types'

const STAGES: ProjectStage[] = ['lead', 'proposal', 'pre_construction', 'in_construction', 'handover', 'completed']
const ISLANDS: { value: string; label: string }[] = [
  { value: 'all', label: 'All Islands' },
  { value: 'BRB', label: 'Barbados' },
  { value: 'KYD', label: 'Cayman Islands' },
  { value: 'JAM', label: 'Jamaica' },
  { value: 'TTD', label: 'Trinidad & Tobago' },
]

export default function PipelinePage() {
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [islandFilter, setIslandFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const supabase = createClient()

  useEffect(() => {
    supabase.from('projects').select('*, client:clients(name)').order('created_at', { ascending: false })
      .then(({ data }) => { setProjects(data ?? []); setLoading(false) })
  }, [])

  const filtered = projects.filter(p => {
    if (islandFilter !== 'all' && p.island !== islandFilter) return false
    if (typeFilter !== 'all' && p.type !== typeFilter) return false
    return true
  })

  const byStage = STAGES.reduce((acc, s) => {
    acc[s] = filtered.filter(p => p.stage === s)
    return acc
  }, {} as Record<ProjectStage, any[]>)

  const totalValue = filtered.reduce((s, p) => s + (p.budget_usd ?? 0), 0)
  const activeCount = filtered.filter(p => ['in_construction', 'pre_construction'].includes(p.stage)).length

  const types = [...new Set(projects.map(p => p.type))].sort()

  return (
    <div>
      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '16px' }} className="stat-grid-responsive">
        <div className="stat-card">
          <div className="text-label">Total Projects</div>
          <div className="stat-value text-accent" style={{ marginTop: '6px' }}>{filtered.length}</div>
          <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '4px' }}>{activeCount} active builds</div>
        </div>
        <div className="stat-card">
          <div className="text-label">Pipeline Value</div>
          <div className="stat-value" style={{ marginTop: '6px', fontSize: '22px' }}>{formatCurrency(totalValue)}</div>
        </div>
        <div className="stat-card">
          <div className="text-label">In Construction</div>
          <div className="stat-value text-green" style={{ marginTop: '6px' }}>{filtered.filter(p => p.stage === 'in_construction').length}</div>
        </div>
        <div className="stat-card">
          <div className="text-label">Pre-Construction</div>
          <div className="stat-value text-amber" style={{ marginTop: '6px' }}>{filtered.filter(p => p.stage === 'pre_construction').length}</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <select className="form-select" style={{ width: 'auto', padding: '6px 10px' }}
            value={islandFilter} onChange={e => setIslandFilter(e.target.value)}>
            {ISLANDS.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
          </select>
          <select className="form-select" style={{ width: 'auto', padding: '6px 10px' }}
            value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="all">All Types</option>
            {types.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
          </select>
          {(islandFilter !== 'all' || typeFilter !== 'all') && (
            <button className="btn btn-secondary" onClick={() => { setIslandFilter('all'); setTypeFilter('all') }}
              style={{ fontSize: '10px', padding: '5px 10px' }}>Clear Filters</button>
          )}
        </div>
        <Link href="/dashboard/pipeline/new" className="btn btn-primary">+ New Project</Link>
      </div>

      {/* Kanban board */}
      <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '8px' }}>
        {STAGES.map(stage => (
          <div key={stage} className="kanban-col" style={{ minWidth: '200px', flex: '0 0 200px' }}>
            <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '8px', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--muted-2)' }}>
                {STAGE_LABELS[stage]}
              </span>
              <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px', color: 'var(--muted)', background: 'var(--surface-3)', padding: '1px 5px' }}>
                {byStage[stage]?.length ?? 0}
              </span>
            </div>
            <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px', minHeight: '120px' }}>
              {loading && stage === 'in_construction' && (
                <div style={{ fontSize: '10px', color: 'var(--muted)', textAlign: 'center', padding: '12px' }}>Loading...</div>
              )}
              {(byStage[stage] ?? []).map(p => (
                <Link key={p.id} href={`/dashboard/pipeline/${p.id}`} style={{ textDecoration: 'none' }}>
                  <div className="k-card">
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--cream)', marginBottom: '4px' }}>{p.name}</div>
                    <div style={{ fontFamily: 'var(--font-space-mono)', fontSize: '8px', color: 'var(--muted)', letterSpacing: '0.06em' }}>
                      {p.island} · {p.type?.replace(/_/g, ' ')}
                    </div>
                    <div style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px', color: 'var(--accent)', marginTop: '4px' }}>
                      {formatCurrency(p.budget_usd)}
                    </div>
                    {p.completion_pct > 0 && (
                      <div style={{ marginTop: '6px' }}>
                        <div className="progress-wrap">
                          <div className="progress-fill progress-green" style={{ width: `${p.completion_pct}%` }} />
                        </div>
                        <div style={{ fontFamily: 'var(--font-space-mono)', fontSize: '7px', color: 'var(--muted)', marginTop: '2px' }}>{p.completion_pct}% complete</div>
                      </div>
                    )}
                    {p.client?.name && (
                      <div style={{ fontFamily: 'var(--font-space-mono)', fontSize: '7px', color: 'var(--muted)', marginTop: '4px', borderTop: '1px solid var(--border)', paddingTop: '4px' }}>
                        {p.client.name}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
              {!loading && (byStage[stage] ?? []).length === 0 && (
                <div style={{ fontSize: '10px', color: 'var(--muted)', textAlign: 'center', padding: '16px 8px', opacity: 0.5 }}>Empty</div>
              )}
            </div>
          </div>
        ))}
      </div>
      <style>{`@media(max-width:900px){.stat-grid-responsive{grid-template-columns:1fr 1fr!important;}}`}</style>
    </div>
  )
}
