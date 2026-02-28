export type Island = 'BRB' | 'JAM' | 'KYD' | 'TTD'
export type ProjectStage = 'lead' | 'proposal' | 'pre_construction' | 'in_construction' | 'handover' | 'completed'
export type ProjectType = 'residential' | 'commercial' | 'hospitality' | 'mixed_use' | 'design_build'
export type ContractType = 'fixed' | 'cost_plus' | 'management_fee' | 'joint_venture'
export type ShipmentStatus = 'ordered' | 'in_transit' | 'customs_hold' | 'delivered' | 'delayed'
export type PermitStatus = 'not_started' | 'submitted' | 'under_review' | 'approved' | 'overdue' | 'expired'
export type ChangeOrderStatus = 'pending' | 'approved' | 'rejected' | 'disputed'
export type PaymentStatus = 'scheduled' | 'upcoming' | 'paid' | 'overdue' | 'pending_permit'
export type ContractorStatus = 'preferred' | 'active' | 'review' | 'inactive'
export type SafetyStatus = 'clear' | 'minor' | 'incident' | 'critical'
export type WeatherCondition = 'clear' | 'partly_cloudy' | 'overcast' | 'rain' | 'storm' | 'hurricane_warning'
export type UserRole = 'admin' | 'director' | 'project_manager' | 'engineer' | 'investor' | 'viewer'
export type DocumentAccess = 'all_staff' | 'engineers' | 'directors' | 'investors'
export type DocumentType = 'blueprint' | 'contract' | 'permit' | 'report' | 'survey' | 'photo' | 'other'

export interface Profile {
  id: string
  full_name: string
  role: UserRole
  avatar_initials: string | null
  island: Island | null
  created_at: string
}

export interface Client {
  id: string
  name: string
  type: string
  email: string | null
  phone: string | null
  island: Island | null
  address: string | null
  notes: string | null
  created_at: string
}

export interface Project {
  id: string
  name: string
  code: string | null
  client_id: string | null
  stage: ProjectStage
  type: ProjectType
  island: Island
  contract_type: ContractType
  budget_usd: number
  spent_usd: number
  completion_pct: number
  start_date: string | null
  target_end_date: string | null
  actual_end_date: string | null
  address: string | null
  description: string | null
  project_manager_id: string | null
  created_at: string
  updated_at: string
  // Joined
  client?: Client
  project_manager?: Profile
}

export interface Contractor {
  id: string
  name: string
  specialty: string
  islands: Island[]
  email: string | null
  phone: string | null
  status: ContractorStatus
  on_time_pct: number
  quality_score: number
  overall_score: number
  notes: string | null
  created_at: string
}

export interface Milestone {
  id: string
  project_id: string
  contractor_id: string | null
  title: string
  description: string | null
  sequence_order: number
  target_date: string | null
  completed_date: string | null
  is_completed: boolean
  is_active: boolean
  created_at: string
  contractor?: Contractor
}

export interface ChangeOrder {
  id: string
  project_id: string
  contractor_id: string | null
  co_number: string
  title: string
  description: string | null
  raised_by: string
  value_usd: number
  schedule_impact_days: number
  status: ChangeOrderStatus
  approved_by: string | null
  approved_at: string | null
  created_at: string
  project?: Project
  contractor?: Contractor
}

export interface Payment {
  id: string
  project_id: string
  milestone_id: string | null
  title: string
  amount_usd: number
  due_date: string
  paid_date: string | null
  status: PaymentStatus
  notes: string | null
  created_at: string
  project?: Project
}

export interface Shipment {
  id: string
  project_id: string
  reference: string
  material: string
  supplier: string
  origin_location: string
  destination_island: Island
  value_usd: number
  eta_date: string | null
  delivered_date: string | null
  status: ShipmentStatus
  tracking_number: string | null
  customs_notes: string | null
  notes: string | null
  created_at: string
  project?: Project
}

export interface Permit {
  id: string
  project_id: string
  island: Island
  title: string
  authority: string
  submitted_date: string | null
  approved_date: string | null
  expiry_date: string | null
  status: PermitStatus
  notes: string | null
  sequence_order: number
  created_at: string
  project?: Project
}

export interface SiteLog {
  id: string
  project_id: string
  log_date: string
  day_number: number | null
  workers_on_site: number
  weather: WeatherCondition
  temperature_c: number | null
  work_performed: string
  materials_used: string | null
  equipment_used: string | null
  safety_status: SafetyStatus
  safety_notes: string | null
  delays_description: string | null
  delay_hours: number
  submitted_by: string | null
  created_at: string
  project?: Project
  submitter?: Profile
}

export interface Risk {
  id: string
  project_id: string | null
  title: string
  description: string | null
  category: string
  likelihood: number
  impact: number
  risk_score: number
  mitigation: string | null
  owner_id: string | null
  is_resolved: boolean
  resolved_at: string | null
  created_at: string
  project?: Project
}

export interface Document {
  id: string
  project_id: string | null
  title: string
  type: DocumentType
  access_level: DocumentAccess
  file_url: string | null
  file_size_kb: number | null
  description: string | null
  version: string | null
  created_at: string
  project?: Project
}

export interface ActivityLog {
  id: string
  project_id: string | null
  user_id: string | null
  action: string
  entity_type: string
  entity_id: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  project?: Project
  user?: Profile
}

// Dashboard stats
export interface DashboardStats {
  activeProjects: number
  totalBudgetUsd: number
  onScheduleCount: number
  totalProjects: number
  pendingPermits: number
  overduePermits: number
  pendingChangeOrders: number
  overduePayments: number
}
