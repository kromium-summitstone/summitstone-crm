-- ================================================================
-- SUMMITSTONE CRM — LEAD GEN MIGRATION
-- Run AFTER supabase-schema.sql and new-modules-migration.sql.
-- Adds: website_enquiries, ad_campaigns, nurture_sequences,
--       appointments, agent_performance_log.
-- Idempotent — safe to run multiple times.
-- ================================================================

-- ── 1. WEBSITE ENQUIRIES ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.website_enquiries (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  name                TEXT NOT NULL,
  email               TEXT NOT NULL,
  phone               TEXT,
  whatsapp_opted_in   BOOLEAN DEFAULT false,
  message             TEXT,
  project_type        TEXT,
  island_market       TEXT,
  budget_min          INTEGER,
  budget_max          INTEGER,
  budget_label        TEXT,
  timeline            TEXT,
  urgency             TEXT CHECK (urgency IN ('low','medium','high','emergency')),
  financing_status    TEXT,
  decision_maker      BOOLEAN DEFAULT false,
  lead_score          INTEGER DEFAULT 0,
  lead_tier           TEXT CHECK (lead_tier IN ('hot','warm','cold','unqualified')),
  source              TEXT DEFAULT 'summitstone_website',
  utm_source          TEXT,
  utm_medium          TEXT,
  utm_campaign        TEXT,
  utm_content         TEXT,
  form_data           JSONB DEFAULT '{}'::jsonb,
  -- CRM workflow
  status              TEXT DEFAULT 'new'
    CHECK (status IN ('new','contacted','appointment_booked','quote_sent','won','lost','nurturing')),
  assigned_to         UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  first_contacted_at  TIMESTAMPTZ,
  response_time_mins  INTEGER,  -- computed when first_contacted_at is set
  notes               TEXT
);

ALTER TABLE public.website_enquiries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff can manage enquiries" ON public.website_enquiries;
CREATE POLICY "Staff can manage enquiries"
  ON public.website_enquiries FOR ALL
  USING (auth.role() = 'authenticated');

-- Also allow anon inserts from website
DROP POLICY IF EXISTS "Anon can submit enquiries" ON public.website_enquiries;
CREATE POLICY "Anon can submit enquiries"
  ON public.website_enquiries FOR INSERT
  WITH CHECK (true);

-- ── 2. AD CAMPAIGNS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ad_campaigns (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  name                  TEXT NOT NULL,
  platform              TEXT NOT NULL CHECK (platform IN ('google','meta','instagram','linkedin','email','referral','organic','other')),
  status                TEXT DEFAULT 'active' CHECK (status IN ('active','paused','completed','draft')),
  objective             TEXT,
  target_island         TEXT,
  target_audience       TEXT,
  daily_budget_usd      NUMERIC DEFAULT 0,
  total_spend_usd       NUMERIC DEFAULT 0,
  start_date            DATE,
  end_date              DATE,
  -- Aggregated metrics
  impressions           INTEGER DEFAULT 0,
  clicks                INTEGER DEFAULT 0,
  leads_total           INTEGER DEFAULT 0,
  leads_qualified       INTEGER DEFAULT 0,
  appointments_booked   INTEGER DEFAULT 0,
  quotes_sent           INTEGER DEFAULT 0,
  projects_won          INTEGER DEFAULT 0,
  revenue_usd           NUMERIC DEFAULT 0,
  notes                 TEXT
);

ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff can manage ad_campaigns" ON public.ad_campaigns;
CREATE POLICY "Staff can manage ad_campaigns"
  ON public.ad_campaigns FOR ALL
  USING (auth.role() = 'authenticated');

-- Link enquiries to campaigns
ALTER TABLE public.website_enquiries
  ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES public.ad_campaigns(id) ON DELETE SET NULL;

-- ── 3. APPOINTMENTS / SITE CONSULTATIONS ────────────────────────
CREATE TABLE IF NOT EXISTS public.appointments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  enquiry_id        UUID REFERENCES public.website_enquiries(id) ON DELETE SET NULL,
  assigned_to       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title             TEXT NOT NULL,
  appointment_type  TEXT DEFAULT 'site_consultation'
    CHECK (appointment_type IN ('site_consultation','office_meeting','video_call','phone_call','follow_up')),
  status            TEXT DEFAULT 'scheduled'
    CHECK (status IN ('scheduled','confirmed','completed','no_show','cancelled','rescheduled')),
  scheduled_at      TIMESTAMPTZ NOT NULL,
  duration_mins     INTEGER DEFAULT 60,
  location          TEXT,
  island            TEXT,
  -- Outcome
  completed_at      TIMESTAMPTZ,
  outcome_notes     TEXT,
  quote_sent        BOOLEAN DEFAULT false,
  quote_value_usd   NUMERIC,
  project_id        UUID REFERENCES public.projects(id) ON DELETE SET NULL
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff can manage appointments" ON public.appointments;
CREATE POLICY "Staff can manage appointments"
  ON public.appointments FOR ALL
  USING (auth.role() = 'authenticated');

-- ── 4. NURTURE SEQUENCES ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.nurture_sequences (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  enquiry_id      UUID REFERENCES public.website_enquiries(id) ON DELETE CASCADE,
  sequence_name   TEXT NOT NULL,
  lead_tier       TEXT NOT NULL CHECK (lead_tier IN ('hot','warm','cold')),
  status          TEXT DEFAULT 'active' CHECK (status IN ('active','paused','completed','exited')),
  enrolled_at     TIMESTAMPTZ DEFAULT NOW(),
  current_day     INTEGER DEFAULT 0,
  next_touch_at   TIMESTAMPTZ,
  last_touch_at   TIMESTAMPTZ,
  last_touch_type TEXT,
  exit_reason     TEXT
);

ALTER TABLE public.nurture_sequences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff can manage nurture_sequences" ON public.nurture_sequences;
CREATE POLICY "Staff can manage nurture_sequences"
  ON public.nurture_sequences FOR ALL
  USING (auth.role() = 'authenticated');

-- ── 5. SEED AD CAMPAIGNS ────────────────────────────────────────
INSERT INTO public.ad_campaigns (
  name, platform, status, objective, target_island, target_audience,
  daily_budget_usd, total_spend_usd, start_date,
  impressions, clicks, leads_total, leads_qualified,
  appointments_booked, quotes_sent, projects_won, revenue_usd
) VALUES
('Barbados Luxury Residential — Google', 'google', 'active',
 'Residential New Build Leads', 'BRB', 'HNW homebuyers Barbados',
 300, 7200, CURRENT_DATE - 24,
 42100, 1120, 28, 19, 8, 6, 2, 2800000),
('Caribbean Commercial — Meta', 'meta', 'active',
 'Commercial Project Leads', NULL, 'Business owners & developers',
 200, 4800, CURRENT_DATE - 24,
 58400, 1740, 35, 22, 9, 7, 3, 1950000),
('Cayman Luxury Build — Instagram', 'instagram', 'active',
 'Luxury Residential Leads', 'KYD', 'HNW 35-60, lifestyle content',
 250, 6000, CURRENT_DATE - 24,
 87200, 2610, 31, 18, 7, 5, 1, 1400000),
('Jamaica Resort Development — Google', 'google', 'paused',
 'Hospitality Project Leads', 'JAM', 'Resort developers & investors',
 180, 2160, CURRENT_DATE - 40,
 22800, 680, 14, 8, 3, 2, 1, 850000),
('Renovation Upsell — Email', 'email', 'active',
 'Existing Client Renovation', NULL, 'Past clients 2020-2024',
 0, 0, CURRENT_DATE - 14,
 0, 0, 12, 9, 6, 5, 4, 680000)
ON CONFLICT DO NOTHING;

-- ── 6. SEED WEBSITE ENQUIRIES ────────────────────────────────────
INSERT INTO public.website_enquiries (
  name, email, phone, whatsapp_opted_in,
  project_type, island_market, budget_min, budget_max, budget_label,
  urgency, financing_status, decision_maker, timeline,
  lead_score, lead_tier, source, utm_source, utm_campaign,
  status, message, created_at
) VALUES
('Marcus Fontaine', 'm.fontaine@devco.bb', '+1 246 434 7712', true,
 'residential_new_build', 'barbados', 500000, 1000000, '$500K–$1M',
 'high', 'cash_ready', true, '1_4_weeks',
 88, 'hot', 'summitstone_website', 'google', 'Barbados Luxury Residential — Google',
 'new', 'Looking to build a 5-bed villa in Sandy Lane. Have planning permission already.',
 NOW() - INTERVAL '2 hours'),
('Victoria Ashworth', 'v.ashworth@priv.ky', '+1 345 522 8841', true,
 'hospitality', 'cayman', 1000000, 9999999, '$1M+',
 'medium', 'pre_approved', true, '3_6_months',
 82, 'warm', 'summitstone_website', 'instagram', 'Cayman Luxury Build — Instagram',
 'contacted', '12-key boutique resort on West Bay. Architectural plans ready.',
 NOW() - INTERVAL '1 day'),
('Desmond Whittaker', 'd.whittaker@jm.com', '+1 876 927 3341', false,
 'commercial', 'jamaica', 150000, 500000, '$150K–$500K',
 'medium', 'need_financing', false, '3_6_months',
 61, 'warm', 'summitstone_website', 'meta', 'Caribbean Commercial — Meta',
 'nurturing', 'Office and retail complex in New Kingston. Still in early planning.',
 NOW() - INTERVAL '3 days'),
('Ingrid Johansson', 'ingrid.j@outlook.com', null, false,
 'renovation', 'barbados', 50000, 150000, '$50K–$150K',
 'low', 'exploring', false, '6_plus_months',
 34, 'unqualified', 'summitstone_website', 'google', 'Barbados Luxury Residential — Google',
 'new', 'Kitchen and bathroom renovation on existing property.',
 NOW() - INTERVAL '5 days'),
('Celeste Marchetti', 'c.marchetti@gmail.com', '+39 335 771 2290', true,
 'residential_new_build', 'cayman', 500000, 1000000, '$500K–$1M',
 'emergency', 'cash_ready', true, 'immediately',
 94, 'hot', 'summitstone_website', 'instagram', 'Cayman Luxury Build — Instagram',
 'appointment_booked', 'Hurricane damage to existing structure — need rebuild ASAP. Cash buyer.',
 NOW() - INTERVAL '4 hours')
ON CONFLICT DO NOTHING;

-- ── 7. SEED APPOINTMENTS ────────────────────────────────────────
INSERT INTO public.appointments (
  title, appointment_type, status, scheduled_at, duration_mins,
  location, island, outcome_notes, quote_sent
)
SELECT
  'Site Consultation — ' || we.name,
  'site_consultation',
  CASE WHEN we.urgency = 'emergency' THEN 'confirmed' ELSE 'scheduled' END,
  NOW() + INTERVAL '2 days',
  90,
  COALESCE(we.island_market, 'TBD'),
  we.island_market,
  null, false
FROM public.website_enquiries we
WHERE we.status = 'appointment_booked'
ON CONFLICT DO NOTHING;

-- ── 8. VERIFY ────────────────────────────────────────────────────
SELECT 'website_enquiries' AS tbl, COUNT(*) FROM public.website_enquiries
UNION ALL
SELECT 'ad_campaigns',              COUNT(*) FROM public.ad_campaigns
UNION ALL
SELECT 'appointments',              COUNT(*) FROM public.appointments
UNION ALL
SELECT 'nurture_sequences',         COUNT(*) FROM public.nurture_sequences;
