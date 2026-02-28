-- =============================================================
-- SUMMITSTONE CRM — RLS FIX & PERMISSIVE POLICIES
-- Run this in Supabase SQL Editor to fix permission issues
-- =============================================================

-- Step 1: Make your user an admin
-- This updates YOUR profile (the logged-in user) to admin role
-- so you can create projects, contractors, etc.

UPDATE profiles
SET role = 'admin'
WHERE id = auth.uid();

-- Step 2: Drop restrictive "staff can manage" policies and replace
-- with permissive ones that allow all authenticated users to write

-- PROJECTS
DROP POLICY IF EXISTS "Staff can manage projects" ON projects;
CREATE POLICY "Authenticated users can manage projects" ON projects
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- CLIENTS
DROP POLICY IF EXISTS "Staff can manage clients" ON clients;
CREATE POLICY "Authenticated users can manage clients" ON clients
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- CONTRACTORS
DROP POLICY IF EXISTS "Staff can manage contractors" ON contractors;
CREATE POLICY "Authenticated users can manage contractors" ON contractors
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- MILESTONES
DROP POLICY IF EXISTS "Staff can manage milestones" ON milestones;
CREATE POLICY "Authenticated users can manage milestones" ON milestones
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- CHANGE ORDERS
DROP POLICY IF EXISTS "Staff can manage change orders" ON change_orders;
CREATE POLICY "Authenticated users can manage change orders" ON change_orders
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- PAYMENTS
DROP POLICY IF EXISTS "Staff can manage payments" ON payments;
CREATE POLICY "Authenticated users can manage payments" ON payments
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- SHIPMENTS
DROP POLICY IF EXISTS "Staff can manage shipments" ON shipments;
CREATE POLICY "Authenticated users can manage shipments" ON shipments
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- PERMITS
DROP POLICY IF EXISTS "Staff can manage permits" ON permits;
CREATE POLICY "Authenticated users can manage permits" ON permits
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- SITE LOGS
DROP POLICY IF EXISTS "Staff can manage site logs" ON site_logs;
CREATE POLICY "Authenticated users can manage site logs" ON site_logs
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- RISKS
DROP POLICY IF EXISTS "Staff can manage risks" ON risks;
CREATE POLICY "Authenticated users can manage risks" ON risks
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- DOCUMENTS
DROP POLICY IF EXISTS "Staff can manage documents" ON documents;
CREATE POLICY "Authenticated users can manage documents" ON documents
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ACTIVITY LOG
DROP POLICY IF EXISTS "Staff can log activity" ON activity_log;
CREATE POLICY "Authenticated users can log activity" ON activity_log
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Done! All authenticated users can now create, read, update, delete records.
SELECT 'RLS policies updated successfully' as status;
