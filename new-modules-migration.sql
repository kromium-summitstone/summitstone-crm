-- ============================================================
-- SUMMITSTONE CRM — NEW MODULE MIGRATIONS
-- Run this in Supabase SQL Editor AFTER the main schema
-- Adds: RFIs, Submittals, Safety Incidents tables
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- RFIS (Requests for Information)
-- ────────────────────────────────────────────────────────────
create table if not exists rfis (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references projects(id) on delete cascade,
  rfi_number text not null,
  subject text not null,
  discipline text not null default 'architectural',
  priority text not null default 'medium',
  question text,
  raised_by text,
  assigned_to text,
  due_date date,
  drawing_ref text,
  response text,
  status text not null default 'open',
  responded_at timestamptz,
  created_at timestamptz default now()
);

alter table rfis enable row level security;
create policy "Authenticated can read rfis" on rfis for select using (auth.role() = 'authenticated');
create policy "Authenticated can insert rfis" on rfis for insert with check (auth.role() = 'authenticated');
create policy "Authenticated can update rfis" on rfis for update using (auth.role() = 'authenticated');
create policy "Authenticated can delete rfis" on rfis for delete using (auth.role() = 'authenticated');

-- ────────────────────────────────────────────────────────────
-- SUBMITTALS (Shop drawings, product data, samples)
-- ────────────────────────────────────────────────────────────
create table if not exists submittals (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references projects(id) on delete cascade,
  submittal_number text not null,
  title text not null,
  discipline text not null default 'architectural',
  spec_section text,
  revision integer default 0,
  submitted_by text,
  reviewer text,
  submitted_date date,
  required_date date,
  reviewed_date date,
  notes text,
  status text not null default 'submitted',
  created_at timestamptz default now()
);

alter table submittals enable row level security;
create policy "Authenticated can read submittals" on submittals for select using (auth.role() = 'authenticated');
create policy "Authenticated can insert submittals" on submittals for insert with check (auth.role() = 'authenticated');
create policy "Authenticated can update submittals" on submittals for update using (auth.role() = 'authenticated');
create policy "Authenticated can delete submittals" on submittals for delete using (auth.role() = 'authenticated');

-- ────────────────────────────────────────────────────────────
-- SAFETY INCIDENTS
-- ────────────────────────────────────────────────────────────
create table if not exists safety_incidents (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references projects(id) on delete cascade,
  incident_date date not null,
  type text not null default 'near_miss',
  severity text not null default 'minor',
  title text not null,
  description text,
  injured_party text,
  body_part text,
  lost_days integer default 0,
  immediate_action text,
  corrective_action text,
  reported_by text,
  witnesses text,
  is_notifiable boolean default false,
  status text not null default 'open',
  closed_at timestamptz,
  created_at timestamptz default now()
);

alter table safety_incidents enable row level security;
create policy "Authenticated can read safety_incidents" on safety_incidents for select using (auth.role() = 'authenticated');
create policy "Authenticated can insert safety_incidents" on safety_incidents for insert with check (auth.role() = 'authenticated');
create policy "Authenticated can update safety_incidents" on safety_incidents for update using (auth.role() = 'authenticated');
create policy "Authenticated can delete safety_incidents" on safety_incidents for delete using (auth.role() = 'authenticated');

-- ────────────────────────────────────────────────────────────
-- SAMPLE DATA — RFIs
-- ────────────────────────────────────────────────────────────
insert into rfis (project_id, rfi_number, subject, discipline, priority, question, raised_by, assigned_to, due_date, drawing_ref, status, response)
select
  p.id,
  rfi.rfi_number, rfi.subject, rfi.discipline, rfi.priority, rfi.question, rfi.raised_by, rfi.assigned_to, rfi.due_date::date, rfi.drawing_ref, rfi.status, rfi.response
from (values
  ('Coral Ridge Estate', 'RFI-0041', 'Anchor bolt specification — grid B/3 column base', 'structural', 'high',
   'Structural drawings show 4×M24 bolts at column B/3 but the detail sheet references M20. Which specification governs? Fabricator is on hold pending clarification.',
   'Site Engineer', 'Lead Structural Engineer', '2024-09-05', 'DWG-S-004 vs DETAIL-S-012', 'open', null),
  ('Coral Ridge Estate', 'RFI-0040', 'Window sill waterproofing membrane product substitution', 'architectural', 'medium',
   'Specified product (Sika 2C NS) is unavailable in Barbados with 6-week lead time. Request approval to substitute with locally available BASF Masterflex 474.',
   'Fineline Interiors', 'Architect of Record', '2024-09-10', 'SPEC 07 92 00, DWG-A-110', 'responded',
   'Approved. BASF Masterflex 474 is acceptable substitution. Contractor to submit product data sheet for record. No schedule impact.'),
  ('Cayman Blue Resort', 'RFI-0038', 'Pool shell reinforcement conflict with MEP sleeves', 'structural', 'urgent',
   'Main pool shell reinforcement (DWG-S-211) clashes with MEP drainage sleeves shown on plumbing drawings. Sleeve positions must be coordinated before concrete pour scheduled for 25 Aug.',
   'Caribbean Civil Works', 'Project Manager', '2024-08-23', 'DWG-S-211, DWG-P-042', 'closed',
   'MEP sleeves to be repositioned 300mm east per coordination meeting 20 Aug. Revised drawings issued as RFI-0038-R1.'),
  ('Port of Spain HQ', 'RFI-0035', 'Ground floor slab specification — grade of concrete', 'structural', 'medium',
   'Specification calls for C30 concrete but structural engineer note references C35. TTD cement suppliers quote differently for each. Please confirm design grade.',
   'Caribbean Civil Works', 'Structural Engineer', '2024-09-01', 'SPEC 03 30 00, DWG-S-101', 'pending_response', null)
) as rfi(proj_name, rfi_number, subject, discipline, priority, question, raised_by, assigned_to, due_date, drawing_ref, status, response)
join projects p on p.name = rfi.proj_name
on conflict do nothing;

-- ────────────────────────────────────────────────────────────
-- SAMPLE DATA — Submittals
-- ────────────────────────────────────────────────────────────
insert into submittals (project_id, submittal_number, title, discipline, spec_section, revision, submitted_by, reviewer, submitted_date, required_date, reviewed_date, status, notes)
select
  p.id,
  s.submittal_number, s.title, s.discipline, s.spec_section, s.revision::int,
  s.submitted_by, s.reviewer, s.submitted_date::date, s.required_date::date,
  s.reviewed_date::date, s.status, s.notes
from (values
  ('Coral Ridge Estate', 'SUB-0018', 'Structural Steel Shop Drawings — Roof Frame', 'structural', '05 12 00', '1',
   'Meridian Builders Ltd', 'Lead Structural Engineer', '2024-08-10', '2024-08-24', '2024-08-22',
   'approved', 'All connections per spec. Weld schedule matches DWG-S-080.'),
  ('Coral Ridge Estate', 'SUB-0019', 'Roofing Membrane Product Data — GAF EverGuard TPO', 'architectural', '07 54 00', '0',
   'Meridian Builders Ltd', 'Architect of Record', '2024-08-20', '2024-08-30', null,
   'under_review', 'Includes manufacturer installation guidelines and warranty docs.'),
  ('Cayman Blue Resort', 'SUB-0014', 'Infinity Pool Filtration System — Myrtha Pools', 'mechanical', '13 11 00', '2',
   'Island MEP Solutions', 'MEP Engineer', '2024-07-15', '2024-07-30', '2024-08-01',
   'approved_as_noted', 'Approved with note: pump isolation valves to be stainless 316L not 304.'),
  ('Cayman Blue Resort', 'SUB-0015', 'Curtain Wall Shop Drawings — West Elevation', 'architectural', '08 44 13', '0',
   'Fineline Interiors', 'Architect of Record', '2024-08-18', '2024-09-01', '2024-08-28',
   'rejected', 'Thermal break detail does not meet DOE coastal glazing requirements. Resubmit with compliance documentation.'),
  ('Port of Spain HQ', 'SUB-0009', 'HVAC Equipment Submittals — Daikin VRV System', 'mechanical', '23 81 43', '1',
   'Island MEP Solutions', 'MEP Engineer', '2024-08-05', '2024-08-20', '2024-08-19',
   'approved', 'VRV system capacity and efficiency verified. Commissioning schedule to be submitted separately.')
) as s(proj_name, submittal_number, title, discipline, spec_section, revision, submitted_by, reviewer, submitted_date, required_date, reviewed_date, status, notes)
join projects p on p.name = s.proj_name
on conflict do nothing;

-- ────────────────────────────────────────────────────────────
-- SAMPLE DATA — Safety Incidents
-- ────────────────────────────────────────────────────────────
insert into safety_incidents (project_id, incident_date, type, severity, title, description, injured_party, body_part, lost_days, immediate_action, corrective_action, reported_by, witnesses, is_notifiable, status)
select
  p.id,
  si.incident_date::date, si.type, si.severity, si.title, si.description,
  si.injured_party, si.body_part, si.lost_days::int, si.immediate_action, si.corrective_action,
  si.reported_by, si.witnesses, si.is_notifiable::boolean, si.status
from (values
  ('Port of Spain HQ', '2024-08-16', 'first_aid', 'minor',
   'Laceration — formwork carpenter, left hand',
   'Carpenter cutting formwork plywood lost control of circular saw when blade caught knot. Sustained 3cm laceration to left palm. No tendons involved.',
   'T. Ramkissoon', 'Left palm', '0',
   'Wound cleaned and dressed by site first aider. Worker continued light duties same day.',
   'All circular saw operators to use push sticks and blade guards. Tool-box talk conducted on blade safety Aug 17.',
   'Site Supervisor D. Charles', 'J. Mohammed, P. Singh', 'false', 'closed'),
  ('Cayman Blue Resort', '2024-08-20', 'near_miss', 'moderate',
   'Near miss — unsecured scaffold board, Level 3',
   'A 4m scaffold board shifted when a worker stood on it. Board was not properly clipped to scaffold tube. Worker grabbed handrail and was not injured. Board fell 6m to exclusion zone below — no one beneath.',
   null, null, '0',
   'Area below isolated. All Level 3 scaffold boards inspected and re-clipped within 2 hours.',
   'Scaffold tagged out pending full inspection by certified scaffolder. Mandatory scaffold inspection checklist to be completed daily by Foreman. Documented near-miss shared with all sites.',
   'Project Manager R. Clarke', 'J. McLean, B. Scott', 'false', 'closed'),
  ('Coral Ridge Estate', '2024-07-05', 'property_damage', 'minor',
   'Delivery vehicle struck gate pillar — site entrance',
   'Concrete delivery truck reversing into site misjudged clearance and struck the left masonry gate pillar. Pillar cracked at base. No personal injury. Estimated repair: BBD 2,400.',
   null, 'Gate pillar (masonry)', '0',
   'Area cordoned off. Delivery completed via alternate entry. Client and insurance notified same day.',
   'Banksman to be stationed at site entrance for all large vehicle movements. Clearance markers installed on both pillars.',
   'Site Manager P. Brathwaite', 'K. Alleyne', 'false', 'closed')
) as si(proj_name, incident_date, type, severity, title, description, injured_party, body_part, lost_days, immediate_action, corrective_action, reported_by, witnesses, is_notifiable, status)
join projects p on p.name = si.proj_name
on conflict do nothing;

-- Done!
-- After running this script your new modules will have sample data to explore.
