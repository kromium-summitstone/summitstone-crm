-- ============================================================
-- SUMMITSTONE CRM — CONTRACTOR COLUMNS MIGRATION
-- Run this BEFORE comprehensive-seed-data.sql
-- Adds hourly_rate_usd and established_year to contractors
-- ============================================================

ALTER TABLE contractors ADD COLUMN IF NOT EXISTS hourly_rate_usd numeric(8,2);
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS established_year integer;
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS phone text;

-- Allow public read on projects/payments/risks/milestones for investor portal
-- (read-only, no auth required for the /investor public page)
CREATE POLICY IF NOT EXISTS "Public can view projects for investor portal"
  ON projects FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Public can view payments for investor portal"
  ON payments FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Public can view risks for investor portal"
  ON risks FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Public can view milestones for investor portal"
  ON milestones FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Public can view clients for investor portal"
  ON clients FOR SELECT USING (true);
