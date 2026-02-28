import { type ClassValue, clsx } from 'clsx'
import type { Island, ProjectStage, ShipmentStatus, PermitStatus, ChangeOrderStatus, PaymentStatus, ContractorStatus, SafetyStatus } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatShortDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export const ISLAND_LABELS: Record<Island, string> = {
  BRB: 'Barbados',
  JAM: 'Jamaica',
  KYD: 'Cayman Islands',
  TTD: 'Trinidad & Tobago',
}

export const STAGE_LABELS: Record<ProjectStage, string> = {
  lead: 'Lead',
  proposal: 'Proposal',
  pre_construction: 'Pre-Construction',
  in_construction: 'In Construction',
  handover: 'Handover',
  completed: 'Completed',
}

export const STAGE_COLORS: Record<ProjectStage, string> = {
  lead: 'badge-grey',
  proposal: 'badge-blue',
  pre_construction: 'badge-amber',
  in_construction: 'badge-green',
  handover: 'badge-blue',
  completed: 'badge-grey',
}

export const SHIPMENT_STATUS_LABELS: Record<ShipmentStatus, string> = {
  ordered: 'Ordered',
  in_transit: 'In Transit',
  customs_hold: 'Customs Hold',
  delivered: 'Delivered',
  delayed: 'Delayed',
}

export const PERMIT_STATUS_LABELS: Record<PermitStatus, string> = {
  not_started: 'Not Started',
  submitted: 'Submitted',
  under_review: 'Under Review',
  approved: 'Approved',
  overdue: 'Overdue',
  expired: 'Expired',
}

export const CO_STATUS_LABELS: Record<ChangeOrderStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  disputed: 'Disputed',
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  scheduled: 'Scheduled',
  upcoming: 'Upcoming',
  paid: 'Paid',
  overdue: 'Overdue',
  pending_permit: 'Pending Permit',
}

export const CONTRACTOR_STATUS_LABELS: Record<ContractorStatus, string> = {
  preferred: 'Preferred',
  active: 'Active',
  review: 'Under Review',
  inactive: 'Inactive',
}

export const SAFETY_STATUS_LABELS: Record<SafetyStatus, string> = {
  clear: 'Clear',
  minor: 'Minor',
  incident: 'Incident',
  critical: 'Critical',
}

// Currency conversion rates (USD base)
export const CURRENCY_RATES: Record<string, { code: string; name: string; rate: number }> = {
  USD: { code: 'USD', name: 'US Dollar', rate: 1.0 },
  KYD: { code: 'KYD', name: 'Cayman Dollar', rate: 0.82 },
  BBD: { code: 'BBD', name: 'Barbados Dollar', rate: 2.02 },
  TTD: { code: 'TTD', name: 'TT Dollar', rate: 6.75 },
  JMD: { code: 'JMD', name: 'Jamaican Dollar', rate: 156.4 },
}

export function convertCurrency(amountUSD: number, targetCurrency: string): number {
  const rate = CURRENCY_RATES[targetCurrency]?.rate ?? 1
  return amountUSD * rate
}

export function getStatusVariant(status: string): 'green' | 'amber' | 'red' | 'blue' | 'grey' {
  const greenStatuses = ['approved', 'delivered', 'paid', 'clear', 'preferred', 'on_track', 'completed']
  const amberStatuses = ['pending', 'upcoming', 'under_review', 'customs_hold', 'in_transit', 'review', 'submitted', 'minor', 'pre_construction']
  const redStatuses = ['overdue', 'delayed', 'disputed', 'rejected', 'incident', 'critical', 'expired']
  const blueStatuses = ['active', 'in_construction', 'proposal', 'ordered', 'handover']

  if (greenStatuses.includes(status)) return 'green'
  if (amberStatuses.includes(status)) return 'amber'
  if (redStatuses.includes(status)) return 'red'
  if (blueStatuses.includes(status)) return 'blue'
  return 'grey'
}
