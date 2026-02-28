import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatCurrency, STAGE_LABELS } from '@/lib/utils'
import type { ProjectStage } from '@/types'

export const revalidate = 60

const STAGES: ProjectStage[] = ['lead','proposal','pre_construction','in_construction','handover','completed']

export default async function PipelinePage() {
  const supabase = createClient()
  const { data: projects } = await supabase
    .from('projects')
    .select('*, client:clients(name)')
    .order('created_at', { ascending: false })

  const byStage = STAGES.reduce((acc, s) => {
    acc[s] = (projects ?? []).filter(p => p.stage === s)
    return acc
  }, {} as Record<ProjectStage, typeof projects>)

  const stageBadge: Record<ProjectStage, string> = {
    lead: 'badge-grey', proposal: 'badge-blue', pre_construction: 'badge-amber',
    in_construction: 'badge-green', handover: 'badge-blue', completed: 'badge-grey'
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <select className="form-select" style={{ width: 'auto', padding: '6px 10px' }}>
            <option>All Islands</option>
            <option>Barbados</option>
            <option>Cayman Islands</option>
            <option>Jamaica</option>
            <option>Trinidad & Tobago</option>
          </select>
        </div>
        <Link href="/dashboard/pipeline/new" className="btn btn-primary">+ New Project</Link>
      </div>

      <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '8px' }}>
        {STAGES.map(stage => (
          <div key={stage} className="kanban-col" style={{ minWidth: '200px' }}>
            <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '8px', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--muted-2)' }}>
                {STAGE_LABELS[stage]}
              </span>
              <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px', color: 'var(--muted)', background: 'var(--surface-3)', padding: '1px 5px' }}>
                {byStage[stage]?.length ?? 0}
              </span>
            </div>
            <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px', minHeight: '120px' }}>
              {(byStage[stage] ?? []).map(p => (
                <Link key={p.id} href={`/dashboard/pipeline/${p.id}`} style={{ textDecoration: 'none' }}>
                  <div className="k-card">
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--cream)', marginBottom: '4px' }}>{p.name}</div>
                    <div style={{ fontFamily: 'var(--font-space-mono)', fontSize: '8px', color: 'var(--muted)', letterSpacing: '0.1em' }}>
                      {p.island} · {p.type.replace('_',' ')} · {formatCurrency(p.budget_usd)}
                    </div>
                    {p.completion_pct > 0 && (
                      <div style={{ marginTop: '6px' }}>
                        <div className="progress-wrap">
                          <div className="progress-fill progress-accent" style={{ width: `${p.completion_pct}%` }} />
                        </div>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                      <span className={`badge ${stageBadge[stage]}`}>{p.completion_pct > 0 ? `${p.completion_pct}%` : STAGE_LABELS[stage]}</span>
                      {p.client && <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '8px', color: 'var(--muted)' }}>{(p.client as any).name?.split(' ')[0]}</span>}
                    </div>
                  </div>
                </Link>
              ))}
              {(byStage[stage]?.length ?? 0) === 0 && (
                <div style={{ fontFamily: 'var(--font-space-mono)', fontSize: '8px', color: 'var(--muted)', textAlign: 'center', padding: '20px 0', letterSpacing: '0.1em' }}>
                  EMPTY
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
