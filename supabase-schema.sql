-- ============================================================
-- SUMMITSTONE CRM — SUPABASE SCHEMA
-- Safe to re-run: drops everything first then rebuilds cleanly
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- TEARDOWN (drop in dependency order)
-- ────────────────────────────────────────────────────────────
drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists projects_updated_at on projects;
drop function if exists public.handle_new_user() cascade;
drop function if exists update_updated_at() cascade;

drop table if exists activity_log cascade;
drop table if exists documents cascade;
drop table if exists risks cascade;
drop table if exists site_logs cascade;
drop table if exists permits cascade;
drop table if exists shipments cascade;
drop table if exists payments cascade;
drop table if exists change_orders cascade;
drop table if exists milestones cascade;
drop table if exists contractors cascade;
drop table if exists projects cascade;
drop table if exists clients cascade;
drop table if exists profiles cascade;

drop type if exists project_stage cascade;
drop type if exists project_type cascade;
drop type if exists island cascade;
drop type if exists contract_type cascade;
drop type if exists shipment_status cascade;
drop type if exists permit_status cascade;
drop type if exists change_order_status cascade;
drop type if exists payment_status cascade;
drop type if exists contractor_status cascade;
drop type if exists weather_condition cascade;
drop type if exists safety_status cascade;
drop type if exists risk_level cascade;
drop type if exists document_access cascade;
drop type if exists document_type cascade;
drop type if exists user_role cascade;

-- Storage bucket cleanup (skip if already exists — Storage API doesn't allow direct deletes)
-- If you need to reset the bucket, delete it manually via Supabase Dashboard > Storage

-- ────────────────────────────────────────────────────────────
-- EXTENSIONS
-- ────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ────────────────────────────────────────────────────────────
-- ENUMS
-- ────────────────────────────────────────────────────────────
create type project_stage as enum (
  'lead', 'proposal', 'pre_construction', 'in_construction', 'handover', 'completed'
);
create type project_type as enum (
  'residential', 'commercial', 'hospitality', 'mixed_use', 'design_build'
);
create type island as enum ('BRB', 'JAM', 'KYD', 'TTD');
create type contract_type as enum ('fixed', 'cost_plus', 'management_fee', 'joint_venture');
create type shipment_status as enum ('ordered', 'in_transit', 'customs_hold', 'delivered', 'delayed');
create type permit_status as enum ('not_started', 'submitted', 'under_review', 'approved', 'overdue', 'expired');
create type change_order_status as enum ('pending', 'approved', 'rejected', 'disputed');
create type payment_status as enum ('scheduled', 'upcoming', 'paid', 'overdue', 'pending_permit');
create type contractor_status as enum ('preferred', 'active', 'review', 'inactive');
create type weather_condition as enum ('clear', 'partly_cloudy', 'overcast', 'rain', 'storm', 'hurricane_warning');
create type safety_status as enum ('clear', 'minor', 'incident', 'critical');
create type risk_level as enum ('low', 'medium', 'high', 'critical');
create type document_access as enum ('all_staff', 'engineers', 'directors', 'investors');
create type document_type as enum ('blueprint', 'contract', 'permit', 'report', 'survey', 'photo', 'other');
create type user_role as enum ('admin', 'director', 'project_manager', 'engineer', 'investor', 'viewer');

-- ────────────────────────────────────────────────────────────
-- USER PROFILES (extends Supabase auth.users)
-- ────────────────────────────────────────────────────────────
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  role user_role not null default 'viewer',
  avatar_initials text,
  island island,
  created_at timestamptz default now()
);

alter table profiles enable row level security;
create policy "Users can view all profiles" on profiles for select using (auth.role() = 'authenticated');
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Admins can update any profile" on profiles for update using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role, avatar_initials)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'viewer'),
    upper(
      left(coalesce(new.raw_user_meta_data->>'full_name', new.email), 1) ||
      left(coalesce(split_part(new.raw_user_meta_data->>'full_name', ' ', 2), ''), 1)
    )
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ────────────────────────────────────────────────────────────
-- CLIENTS
-- ────────────────────────────────────────────────────────────
create table clients (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  type text not null default 'private', -- private, developer, resort_operator, investor, institutional
  email text,
  phone text,
  island island,
  address text,
  notes text,
  created_at timestamptz default now(),
  created_by uuid references profiles(id)
);

alter table clients enable row level security;
create policy "Authenticated users can view clients" on clients for select using (auth.role() = 'authenticated');
create policy "Staff can manage clients" on clients for all using (
  exists (select 1 from profiles where id = auth.uid() and role in ('admin','director','project_manager'))
);

-- ────────────────────────────────────────────────────────────
-- PROJECTS
-- ────────────────────────────────────────────────────────────
create table projects (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  code text unique, -- e.g. "CRE-001"
  client_id uuid references clients(id),
  stage project_stage not null default 'lead',
  type project_type not null,
  island island not null,
  contract_type contract_type not null default 'fixed',
  budget_usd numeric(15,2) not null default 0,
  spent_usd numeric(15,2) not null default 0,
  completion_pct integer not null default 0 check (completion_pct between 0 and 100),
  start_date date,
  target_end_date date,
  actual_end_date date,
  address text,
  description text,
  project_manager_id uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by uuid references profiles(id)
);

alter table projects enable row level security;
create policy "Authenticated users can view projects" on projects for select using (auth.role() = 'authenticated');
create policy "Staff can manage projects" on projects for all using (
  exists (select 1 from profiles where id = auth.uid() and role in ('admin','director','project_manager'))
);

-- Updated_at trigger
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger projects_updated_at before update on projects
  for each row execute procedure update_updated_at();

-- ────────────────────────────────────────────────────────────
-- CONTRACTORS
-- ────────────────────────────────────────────────────────────
create table contractors (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  specialty text not null,
  islands island[] not null default '{}',
  email text,
  phone text,
  status contractor_status not null default 'active',
  on_time_pct integer default 0 check (on_time_pct between 0 and 100),
  quality_score integer default 0 check (quality_score between 0 and 100),
  overall_score integer generated always as (
    round((on_time_pct * 0.5 + quality_score * 0.5))
  ) stored,
  notes text,
  created_at timestamptz default now(),
  created_by uuid references profiles(id)
);

alter table contractors enable row level security;
create policy "Authenticated users can view contractors" on contractors for select using (auth.role() = 'authenticated');
create policy "Staff can manage contractors" on contractors for all using (
  exists (select 1 from profiles where id = auth.uid() and role in ('admin','director','project_manager'))
);

-- ────────────────────────────────────────────────────────────
-- PROJECT MILESTONES
-- ────────────────────────────────────────────────────────────
create table milestones (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  contractor_id uuid references contractors(id),
  title text not null,
  description text,
  sequence_order integer not null default 1,
  target_date date,
  completed_date date,
  is_completed boolean not null default false,
  is_active boolean not null default false,
  created_at timestamptz default now()
);

alter table milestones enable row level security;
create policy "Authenticated users can view milestones" on milestones for select using (auth.role() = 'authenticated');
create policy "Staff can manage milestones" on milestones for all using (
  exists (select 1 from profiles where id = auth.uid() and role in ('admin','director','project_manager','engineer'))
);

-- ────────────────────────────────────────────────────────────
-- CHANGE ORDERS
-- ────────────────────────────────────────────────────────────
create table change_orders (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  contractor_id uuid references contractors(id),
  co_number text not null, -- e.g. "CO-007"
  title text not null,
  description text,
  raised_by text not null, -- name or org
  value_usd numeric(12,2) not null default 0,
  schedule_impact_days integer not null default 0,
  status change_order_status not null default 'pending',
  approved_by uuid references profiles(id),
  approved_at timestamptz,
  created_at timestamptz default now(),
  created_by uuid references profiles(id)
);

alter table change_orders enable row level security;
create policy "Authenticated users can view change orders" on change_orders for select using (auth.role() = 'authenticated');
create policy "Staff can manage change orders" on change_orders for all using (
  exists (select 1 from profiles where id = auth.uid() and role in ('admin','director','project_manager'))
);

-- ────────────────────────────────────────────────────────────
-- PAYMENTS
-- ────────────────────────────────────────────────────────────
create table payments (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  milestone_id uuid references milestones(id),
  title text not null,
  amount_usd numeric(12,2) not null,
  due_date date not null,
  paid_date date,
  status payment_status not null default 'scheduled',
  notes text,
  created_at timestamptz default now(),
  created_by uuid references profiles(id)
);

alter table payments enable row level security;
create policy "Authenticated users can view payments" on payments for select using (auth.role() = 'authenticated');
create policy "Staff and investors can view payments" on payments for select using (auth.role() = 'authenticated');
create policy "Directors can manage payments" on payments for all using (
  exists (select 1 from profiles where id = auth.uid() and role in ('admin','director'))
);

-- ────────────────────────────────────────────────────────────
-- PROCUREMENT / SHIPMENTS
-- ────────────────────────────────────────────────────────────
create table shipments (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  reference text not null, -- e.g. "SHP-0041"
  material text not null,
  supplier text not null,
  origin_location text not null,
  destination_island island not null,
  value_usd numeric(12,2) not null default 0,
  eta_date date,
  delivered_date date,
  status shipment_status not null default 'ordered',
  tracking_number text,
  customs_notes text,
  notes text,
  created_at timestamptz default now(),
  created_by uuid references profiles(id)
);

alter table shipments enable row level security;
create policy "Authenticated users can view shipments" on shipments for select using (auth.role() = 'authenticated');
create policy "Staff can manage shipments" on shipments for all using (
  exists (select 1 from profiles where id = auth.uid() and role in ('admin','director','project_manager','engineer'))
);

-- ────────────────────────────────────────────────────────────
-- PERMITS
-- ────────────────────────────────────────────────────────────
create table permits (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  island island not null,
  title text not null,
  authority text not null, -- e.g. "Town & Country Planning Dept"
  submitted_date date,
  approved_date date,
  expiry_date date,
  status permit_status not null default 'not_started',
  notes text,
  sequence_order integer not null default 1,
  created_at timestamptz default now(),
  created_by uuid references profiles(id)
);

alter table permits enable row level security;
create policy "Authenticated users can view permits" on permits for select using (auth.role() = 'authenticated');
create policy "Staff can manage permits" on permits for all using (
  exists (select 1 from profiles where id = auth.uid() and role in ('admin','director','project_manager'))
);

-- ────────────────────────────────────────────────────────────
-- SITE LOGS
-- ────────────────────────────────────────────────────────────
create table site_logs (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  log_date date not null,
  day_number integer,
  workers_on_site integer not null default 0,
  weather weather_condition not null default 'clear',
  temperature_c integer,
  work_performed text not null,
  materials_used text,
  equipment_used text,
  safety_status safety_status not null default 'clear',
  safety_notes text,
  delays_description text,
  delay_hours numeric(4,1) default 0,
  photos text[], -- array of storage URLs
  submitted_by uuid references profiles(id),
  created_at timestamptz default now()
);

alter table site_logs enable row level security;
create policy "Authenticated users can view site logs" on site_logs for select using (auth.role() = 'authenticated');
create policy "Engineers and above can manage site logs" on site_logs for all using (
  exists (select 1 from profiles where id = auth.uid() and role in ('admin','director','project_manager','engineer'))
);

-- ────────────────────────────────────────────────────────────
-- RISK REGISTER
-- ────────────────────────────────────────────────────────────
create table risks (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references projects(id) on delete cascade,
  title text not null,
  description text,
  category text not null default 'general', -- financial, schedule, procurement, regulatory, safety, environmental
  likelihood integer not null default 1 check (likelihood between 1 and 5),
  impact integer not null default 1 check (impact between 1 and 5),
  risk_score integer generated always as (likelihood * impact) stored,
  mitigation text,
  owner_id uuid references profiles(id),
  is_resolved boolean not null default false,
  resolved_at timestamptz,
  created_at timestamptz default now(),
  created_by uuid references profiles(id)
);

alter table risks enable row level security;
create policy "Authenticated users can view risks" on risks for select using (auth.role() = 'authenticated');
create policy "Staff can manage risks" on risks for all using (
  exists (select 1 from profiles where id = auth.uid() and role in ('admin','director','project_manager'))
);

-- ────────────────────────────────────────────────────────────
-- DOCUMENTS
-- ────────────────────────────────────────────────────────────
create table documents (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references projects(id) on delete cascade,
  title text not null,
  type document_type not null default 'other',
  access_level document_access not null default 'all_staff',
  file_url text, -- Supabase Storage URL
  file_size_kb integer,
  description text,
  version text default '1.0',
  created_at timestamptz default now(),
  uploaded_by uuid references profiles(id)
);

alter table documents enable row level security;
create policy "View documents by access level" on documents for select using (
  auth.role() = 'authenticated' and (
    access_level = 'all_staff'
    or (access_level = 'engineers' and exists (
      select 1 from profiles where id = auth.uid() and role in ('admin','director','project_manager','engineer')
    ))
    or (access_level = 'directors' and exists (
      select 1 from profiles where id = auth.uid() and role in ('admin','director')
    ))
    or (access_level = 'investors' and exists (
      select 1 from profiles where id = auth.uid() and role in ('admin','director','investor')
    ))
  )
);
create policy "Staff can upload documents" on documents for insert with check (
  exists (select 1 from profiles where id = auth.uid() and role in ('admin','director','project_manager','engineer'))
);
create policy "Directors can delete documents" on documents for delete using (
  exists (select 1 from profiles where id = auth.uid() and role in ('admin','director'))
);

-- ────────────────────────────────────────────────────────────
-- ACTIVITY LOG (auto-populated via triggers)
-- ────────────────────────────────────────────────────────────
create table activity_log (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references projects(id) on delete cascade,
  user_id uuid references profiles(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz default now()
);

alter table activity_log enable row level security;
create policy "Authenticated users can view activity" on activity_log for select using (auth.role() = 'authenticated');
create policy "System can insert activity" on activity_log for insert with check (auth.role() = 'authenticated');

-- ────────────────────────────────────────────────────────────
-- SAMPLE DATA
-- ────────────────────────────────────────────────────────────

-- Clients
insert into clients (id, name, type, email, island) values
  ('a1000000-0000-0000-0000-000000000001', 'Richardson Private Holdings', 'private', 'j.richardson@email.com', 'BRB'),
  ('a1000000-0000-0000-0000-000000000002', 'Clarke Resort Group', 'resort_operator', 'm.clarke@clarkeresorts.com', 'KYD'),
  ('a1000000-0000-0000-0000-000000000003', 'Caribbean Capital Partners', 'developer', 'info@ccpartners.tt', 'TTD'),
  ('a1000000-0000-0000-0000-000000000004', 'Holetown Development Co.', 'developer', 'dev@holetown.bb', 'BRB'),
  ('a1000000-0000-0000-0000-000000000005', 'Montego Bay Investments Ltd', 'investor', 'invest@mbi.jm', 'JAM');

-- Projects
insert into projects (id, name, code, client_id, stage, type, island, contract_type, budget_usd, spent_usd, completion_pct, start_date, target_end_date) values
  ('b1000000-0000-0000-0000-000000000001', 'Coral Ridge Estate', 'CRE-001', 'a1000000-0000-0000-0000-000000000001', 'in_construction', 'residential', 'BRB', 'fixed', 4200000, 3444000, 82, '2024-01-15', '2024-11-30'),
  ('b1000000-0000-0000-0000-000000000002', 'Cayman Blue Resort', 'CBR-001', 'a1000000-0000-0000-0000-000000000002', 'in_construction', 'hospitality', 'KYD', 'cost_plus', 9800000, 5978000, 61, '2024-02-01', '2025-03-31'),
  ('b1000000-0000-0000-0000-000000000003', 'Montego Bay Villas', 'MBV-001', 'a1000000-0000-0000-0000-000000000005', 'in_construction', 'residential', 'JAM', 'fixed', 3100000, 1364000, 44, '2024-03-10', '2024-12-15'),
  ('b1000000-0000-0000-0000-000000000004', 'Port of Spain HQ', 'POS-001', 'a1000000-0000-0000-0000-000000000003', 'pre_construction', 'commercial', 'TTD', 'cost_plus', 6400000, 1152000, 18, '2024-05-20', '2025-06-30'),
  ('b1000000-0000-0000-0000-000000000005', 'Holetown Mixed-Use', 'HMU-001', 'a1000000-0000-0000-0000-000000000004', 'pre_construction', 'mixed_use', 'BRB', 'fixed', 5100000, 408000, 8, '2024-06-01', '2025-08-31'),
  ('b1000000-0000-0000-0000-000000000006', 'Speightstown Villas', 'SPV-001', 'a1000000-0000-0000-0000-000000000001', 'lead', 'residential', 'BRB', 'fixed', 2800000, 0, 0, null, null),
  ('b1000000-0000-0000-0000-000000000007', 'Tobago Eco Lodge', 'TEL-001', 'a1000000-0000-0000-0000-000000000003', 'proposal', 'hospitality', 'TTD', 'cost_plus', 5500000, 0, 0, null, null);

-- Contractors
insert into contractors (id, name, specialty, islands, status, on_time_pct, quality_score) values
  ('c1000000-0000-0000-0000-000000000001', 'Meridian Builders Ltd', 'Structural', '{"BRB","JAM"}', 'preferred', 94, 88),
  ('c1000000-0000-0000-0000-000000000002', 'Caribbean Civil Works', 'Civil / Foundations', '{"BRB","TTD","JAM"}', 'active', 88, 80),
  ('c1000000-0000-0000-0000-000000000003', 'Island MEP Solutions', 'Mechanical / Electrical', '{"KYD","BRB"}', 'active', 91, 83),
  ('c1000000-0000-0000-0000-000000000004', 'TTD Concrete Co.', 'Concrete Works', '{"TTD"}', 'review', 72, 64),
  ('c1000000-0000-0000-0000-000000000005', 'Fineline Interiors', 'Fit-Out / Finishes', '{"BRB","KYD","JAM"}', 'preferred', 96, 92);

-- Milestones for Coral Ridge Estate
insert into milestones (project_id, contractor_id, title, sequence_order, target_date, completed_date, is_completed, is_active) values
  ('b1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'Site Preparation & Excavation', 1, '2024-02-28', '2024-02-26', true, false),
  ('b1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000002', 'Foundation & Substructure', 2, '2024-04-15', '2024-04-12', true, false),
  ('b1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'Structural Frame', 3, '2024-06-30', '2024-07-05', true, false),
  ('b1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'Roofing & Envelope', 4, '2024-09-15', null, false, true),
  ('b1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000003', 'MEP Rough-In', 5, '2024-10-01', null, false, false),
  ('b1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000005', 'Finishes & Fit-Out', 6, '2024-11-15', null, false, false);

-- Change Orders
insert into change_orders (project_id, contractor_id, co_number, title, description, raised_by, value_usd, schedule_impact_days, status) values
  ('b1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001', 'CO-007', 'Pool infinity edge redesign', 'Client requested enhanced infinity edge spec for main pool', 'Clarke Resort Group', 84000, 7, 'pending'),
  ('b1000000-0000-0000-0000-000000000002', null, 'CO-008', 'Additional landscaping scope', 'North terrace landscaping expansion', 'Meridian Builders Ltd', 32000, 3, 'pending'),
  ('b1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000002', 'CO-004', 'Structural upgrade floor 3', 'Column spec upgrade required after structural review', 'Caribbean Civil Works', 156000, 14, 'disputed'),
  ('b1000000-0000-0000-0000-000000000003', null, 'CO-006', 'Villa 4 master bath upgrade', 'Premium bathroom fixtures and marble upgrade', 'Montego Bay Investments Ltd', 28000, 0, 'approved'),
  ('b1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000002', 'CO-005', 'Unforeseen rock excavation', 'Additional blasting required for foundation', 'Site Team', 44000, 5, 'approved');

-- Payments
insert into payments (project_id, title, amount_usd, due_date, paid_date, status) values
  ('b1000000-0000-0000-0000-000000000001', 'Structural Frame Complete', 420000, '2024-08-01', '2024-08-04', 'paid'),
  ('b1000000-0000-0000-0000-000000000002', 'Foundation Complete', 800000, '2024-08-10', '2024-08-12', 'paid'),
  ('b1000000-0000-0000-0000-000000000001', 'Roofing Complete', 420000, '2024-09-15', null, 'upcoming'),
  ('b1000000-0000-0000-0000-000000000002', 'Structural Mid-Point', 980000, '2024-09-30', null, 'upcoming'),
  ('b1000000-0000-0000-0000-000000000001', 'MEP Rough-In', 360000, '2024-10-20', null, 'scheduled'),
  ('b1000000-0000-0000-0000-000000000004', 'Monthly Draw #3', 280000, '2024-08-15', null, 'overdue'),
  ('b1000000-0000-0000-0000-000000000005', 'Groundbreaking', 255000, '2024-10-01', null, 'pending_permit');

-- Shipments
insert into shipments (project_id, reference, material, supplier, origin_location, destination_island, value_usd, eta_date, status) values
  ('b1000000-0000-0000-0000-000000000001', 'SHP-0041', 'Structural Steel', 'US Steel Corp', 'Miami, FL', 'BRB', 184000, '2024-08-30', 'in_transit'),
  ('b1000000-0000-0000-0000-000000000002', 'SHP-0040', 'Glazing Units', 'Vitro Mexico', 'Monterrey', 'KYD', 92000, '2024-09-04', 'in_transit'),
  ('b1000000-0000-0000-0000-000000000003', 'SHP-0039', 'Roofing System', 'GAF Materials', 'New Jersey', 'JAM', 48000, '2024-08-28', 'customs_hold'),
  ('b1000000-0000-0000-0000-000000000004', 'SHP-0038', 'HVAC Units x12', 'Daikin Gulf', 'Dubai', 'TTD', 220000, '2024-09-14', 'in_transit'),
  ('b1000000-0000-0000-0000-000000000005', 'SHP-0037', 'Rebar Bundle', 'ArcelorMittal', 'Trinidad', 'BRB', 36000, '2024-08-26', 'delivered'),
  ('b1000000-0000-0000-0000-000000000001', 'SHP-0036', 'Marble Flooring', 'Carrara Stone', 'Italy', 'BRB', 310000, '2024-09-20', 'delayed');

-- Permits
insert into permits (project_id, island, title, authority, submitted_date, approved_date, expiry_date, status, sequence_order) values
  ('b1000000-0000-0000-0000-000000000001', 'BRB', 'Planning Application', 'Town & Country Planning Dept', '2023-12-01', '2024-01-14', '2025-01-14', 'approved', 1),
  ('b1000000-0000-0000-0000-000000000001', 'BRB', 'Building Permit', 'Barbados Standards Institution', '2024-01-20', '2024-02-03', '2025-02-03', 'approved', 2),
  ('b1000000-0000-0000-0000-000000000001', 'BRB', 'Occupancy Certificate', 'Barbados Standards Institution', '2024-08-10', null, null, 'under_review', 3),
  ('b1000000-0000-0000-0000-000000000005', 'BRB', 'Planning Application — Holetown', 'Town & Country Planning Dept', '2024-07-22', null, null, 'under_review', 1),
  ('b1000000-0000-0000-0000-000000000004', 'TTD', 'EMA Environmental Clearance', 'Environmental Management Authority', '2023-12-15', '2024-03-05', '2025-03-05', 'approved', 1),
  ('b1000000-0000-0000-0000-000000000004', 'TTD', 'Building Permit Renewal', 'TCPD', '2024-07-01', null, null, 'overdue', 2),
  ('b1000000-0000-0000-0000-000000000002', 'KYD', 'Class A Planning Permission', 'Planning Department', '2023-10-15', '2023-12-02', '2025-12-02', 'approved', 1),
  ('b1000000-0000-0000-0000-000000000002', 'KYD', 'DOE Coastal Impact Assessment', 'Department of Environment', '2023-11-01', '2024-01-18', '2025-01-18', 'approved', 2),
  ('b1000000-0000-0000-0000-000000000002', 'KYD', 'Building Permit — Cayman Blue', 'Planning Department', '2024-01-25', '2024-02-28', '2025-12-31', 'approved', 3),
  ('b1000000-0000-0000-0000-000000000003', 'JAM', 'NEPA Environmental Permit', 'National Environment & Planning Agency', '2024-01-10', '2024-02-14', '2025-02-14', 'approved', 1),
  ('b1000000-0000-0000-0000-000000000003', 'JAM', 'Building Permit', 'St James Parish Council', '2024-02-20', '2024-03-15', '2025-03-15', 'approved', 2),
  ('b1000000-0000-0000-0000-000000000003', 'JAM', 'Subdivision Approval', 'NEPA', '2024-07-30', null, null, 'submitted', 3);

-- Risks
insert into risks (project_id, title, description, category, likelihood, impact, mitigation, is_resolved) values
  ('b1000000-0000-0000-0000-000000000002', 'Cost Overrun — Cayman Blue', 'Change orders + import delays tracking $500K over budget', 'financial', 4, 4, 'Scope review meeting scheduled. Freeze discretionary scope pending client approval.', false),
  ('b1000000-0000-0000-0000-000000000004', 'TTD Permit Overdue', 'Port of Spain building permit renewal 14 days late. Construction may halt.', 'regulatory', 3, 4, 'Legal team engaged. Expedited processing requested with TCPD.', false),
  ('b1000000-0000-0000-0000-000000000001', 'Import Delay — Marble Flooring', 'SHP-0036 delayed from Italy. Could affect handover by 2-3 weeks.', 'procurement', 3, 3, 'Identify local alternative supplier. Client informed of potential delay.', false),
  (null, 'Hurricane Season Preparedness', 'JAM and TTD sites rated high exposure. Peak season Aug-Oct.', 'environmental', 2, 5, 'All sites to submit storm prep plans by Aug 30. Critical equipment secured.', false);

-- Site Logs
insert into site_logs (project_id, log_date, day_number, workers_on_site, weather, work_performed, safety_status) values
  ('b1000000-0000-0000-0000-000000000001', '2024-08-22', 214, 24, 'clear', 'Roof truss installation — bays 4–6 complete. Flashings started on east elevation.', 'clear'),
  ('b1000000-0000-0000-0000-000000000001', '2024-08-21', 213, 22, 'partly_cloudy', 'Structural steel delivery received and unloaded. Roof truss bays 1–3 complete.', 'clear'),
  ('b1000000-0000-0000-0000-000000000002', '2024-08-20', 180, 31, 'clear', 'Pool shell concrete pour completed. Mechanical room framing 60% complete.', 'minor'),
  ('b1000000-0000-0000-0000-000000000003', '2024-08-19', 162, 18, 'rain', 'Interior framing villas 3–6 progressed. Delayed 2hrs due to rain in morning.', 'clear'),
  ('b1000000-0000-0000-0000-000000000001', '2024-08-18', 212, 24, 'clear', 'Roof decking substrate complete. Building inspector visit — structural sign-off passed.', 'clear'),
  ('b1000000-0000-0000-0000-000000000004', '2024-08-16', 88, 14, 'clear', 'Piling works day 8. Substructure grid approximately 40% complete.', 'incident');

-- Documents
insert into documents (project_id, title, type, access_level, version) values
  ('b1000000-0000-0000-0000-000000000001', 'Structural Drawings Rev.4', 'blueprint', 'engineers', '4.0'),
  ('b1000000-0000-0000-0000-000000000002', 'Architectural Set — Final', 'blueprint', 'engineers', '3.2'),
  ('b1000000-0000-0000-0000-000000000002', 'Main Contract — Cayman Blue Resort', 'contract', 'directors', '1.0'),
  ('b1000000-0000-0000-0000-000000000001', 'TCP Planning Approval', 'permit', 'all_staff', '1.0'),
  (null, 'Q2 Investor Report 2024', 'report', 'investors', '1.0'),
  ('b1000000-0000-0000-0000-000000000003', 'Building Permit — Montego Bay', 'permit', 'all_staff', '1.0'),
  ('b1000000-0000-0000-0000-000000000004', 'Soil Survey — Port of Spain', 'survey', 'engineers', '1.0'),
  ('b1000000-0000-0000-0000-000000000001', 'Subcontractor Agreement — MEP', 'contract', 'directors', '1.0');

-- Activity log entries
insert into activity_log (project_id, action, entity_type, metadata) values
  ('b1000000-0000-0000-0000-000000000001', 'Site log submitted — Day 214', 'site_log', '{"safety":"clear","workers":24}'),
  ('b1000000-0000-0000-0000-000000000002', 'Change order raised — CO-008 · $32,000', 'change_order', '{"co_number":"CO-008","value":32000}'),
  ('b1000000-0000-0000-0000-000000000001', 'Shipment ETA updated — SHP-0041 arriving Aug 30', 'shipment', '{"reference":"SHP-0041"}'),
  ('b1000000-0000-0000-0000-000000000001', 'Contractor scored — Meridian Builders 91/100', 'contractor', '{"score":91}'),
  ('b1000000-0000-0000-0000-000000000004', 'Safety incident logged — minor', 'site_log', '{"safety":"incident"}');

-- ────────────────────────────────────────────────────────────
-- STORAGE BUCKET FOR DOCUMENTS
-- ────────────────────────────────────────────────────────────
-- Create bucket only if it doesn't already exist
insert into storage.buckets (id, name, public)
  select 'documents', 'documents', false
  where not exists (select 1 from storage.buckets where id = 'documents');

-- Drop storage policies before recreating (ignore errors if they don't exist)
drop policy if exists "Authenticated users can upload documents" on storage.objects;
drop policy if exists "Authenticated users can view documents" on storage.objects;
drop policy if exists "Uploaders can delete their documents" on storage.objects;

create policy "Authenticated users can upload documents"
  on storage.objects for insert
  with check (bucket_id = 'documents' and auth.role() = 'authenticated');

create policy "Authenticated users can view documents"
  on storage.objects for select
  using (bucket_id = 'documents' and auth.role() = 'authenticated');

create policy "Uploaders can delete their documents"
  on storage.objects for delete
  using (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);
