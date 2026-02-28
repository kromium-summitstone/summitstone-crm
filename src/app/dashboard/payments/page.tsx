import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate, PAYMENT_STATUS_LABELS } from '@/lib/utils'
import type { PaymentStatus } from '@/types'

export const revalidate = 60

export default async function PaymentsPage() {
  const supabase = createClient()
  const { data: payments } = await supabase
    .from('payments')
    .select('*, project:projects(name)')
    .order('due_date')

  const received = (payments ?? []).filter(p => p.status === 'paid').reduce((s, p) => s + p.amount_usd, 0)
  const upcoming = (payments ?? []).filter(p => p.status === 'upcoming').reduce((s, p) => s + p.amount_usd, 0)
  const overdue = (payments ?? []).filter(p => p.status === 'overdue').reduce((s, p) => s + p.amount_usd, 0)
  const outstanding = (payments ?? []).filter(p => p.status !== 'paid').reduce((s, p) => s + p.amount_usd, 0)

  const statusClass: Record<string, string> = {
    paid: 'badge-green', upcoming: 'badge-amber', scheduled: 'badge-grey',
    overdue: 'badge-red', pending_permit: 'badge-grey'
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '20px' }} className="stat-grid-responsive">
        <div className="stat-card"><div className="text-label">Received This Period</div><div className="stat-value text-green" style={{ marginTop: '6px', fontSize: '26px' }}>{formatCurrency(received)}</div></div>
        <div className="stat-card"><div className="text-label">Due Next 30 Days</div><div className="stat-value text-accent" style={{ marginTop: '6px', fontSize: '26px' }}>{formatCurrency(upcoming)}</div></div>
        <div className="stat-card"><div className="text-label">Overdue</div><div className="stat-value text-amber" style={{ marginTop: '6px', fontSize: '26px' }}>{formatCurrency(overdue)}</div></div>
        <div className="stat-card"><div className="text-label">Total Outstanding</div><div className="stat-value" style={{ marginTop: '6px', fontSize: '26px' }}>{formatCurrency(outstanding)}</div></div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div><div className="panel-title">PAYMENT SCHEDULE MONITOR</div><div className="panel-sub">Milestone-based disbursements · All contracts</div></div>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead><tr><th>Milestone</th><th>Project</th><th>Amount</th><th>Due Date</th><th>Paid Date</th><th>Status</th></tr></thead>
            <tbody>
              {(payments ?? []).map(p => (
                <tr key={p.id}>
                  <td className="strong">{p.title}</td>
                  <td style={{ color: 'var(--muted-2)' }}>{(p as any).project?.name}</td>
                  <td style={{ fontFamily: 'var(--font-space-mono)', fontSize: '11px' }}>{formatCurrency(p.amount_usd)}</td>
                  <td style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px' }}>{formatDate(p.due_date)}</td>
                  <td style={{ fontFamily: 'var(--font-space-mono)', fontSize: '9px', color: p.paid_date ? 'var(--green)' : 'var(--muted)' }}>
                    {formatDate(p.paid_date)}
                  </td>
                  <td><span className={`badge ${statusClass[p.status as string] ?? 'badge-grey'}`}>{PAYMENT_STATUS_LABELS[p.status as PaymentStatus] ?? p.status}</span></td>
                </tr>
              ))}
              {!payments?.length && <tr><td colSpan={6} style={{ textAlign: 'center', padding: '20px', color: 'var(--muted)' }}>No payments logged</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      <style>{`@media(max-width:900px){.stat-grid-responsive{grid-template-columns:1fr 1fr!important;}}`}</style>
    </div>
  )
}
