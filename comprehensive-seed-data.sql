-- ============================================================
-- SUMMITSTONE CRM — COMPREHENSIVE HISTORICAL SEED DATA
-- Founded 2013 · 12 years of Caribbean construction history
-- Run AFTER main schema + new-modules-migration.sql
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- EXTENDED CLIENTS (beyond the 5 in main schema)
-- ────────────────────────────────────────────────────────────
insert into clients (id, name, type, email, phone, island, notes) values
  ('a1000000-0000-0000-0000-000000000006', 'Bajan Heritage Holdings', 'private', 'admin@bajanheritage.bb', '+1-246-427-8812', 'BRB', 'Multi-generational Barbados family. Completed 3 estates with us since 2015.'),
  ('a1000000-0000-0000-0000-000000000007', 'Cayman Luxury Estates Ltd', 'developer', 'info@caymanle.ky', '+1-345-949-4004', 'KYD', 'Premium developer, Seven Mile Beach corridor specialists. Relationship since 2016.'),
  ('a1000000-0000-0000-0000-000000000008', 'Blue Mountain Capital JA', 'investor', 'bmcapital@gmail.com', '+1-876-935-2200', 'JAM', 'Institutional investor, Blue Mountains eco-hospitality focus.'),
  ('a1000000-0000-0000-0000-000000000009', 'Naparima Group', 'developer', 'projects@naparima.tt', '+1-868-625-7700', 'TTD', 'Trinidad commercial and mixed-use developer. Flagship partnership.'),
  ('a1000000-0000-0000-0000-000000000010', 'West Coast Villas Inc', 'private', 'wcoast@sunmail.bb', '+1-246-432-1150', 'BRB', 'West Coast Barbados luxury villa owner-developer.'),
  ('a1000000-0000-0000-0000-000000000011', 'Sunset Isle Resorts', 'resort_operator', 'dev@sunsetisle.ky', '+1-345-745-3322', 'KYD', 'Boutique resort group, Cayman Brac and Little Cayman focus.'),
  ('a1000000-0000-0000-0000-000000000012', 'Port Royal Developments', 'developer', 'portroyal@develop.jm', '+1-876-702-8800', 'JAM', 'Kingston waterfront regeneration specialists.')
on conflict do nothing;

-- ────────────────────────────────────────────────────────────
-- EXTENDED CONTRACTORS (with history, established years, rates)
-- ────────────────────────────────────────────────────────────
insert into contractors (id, name, specialty, islands, status, on_time_pct, quality_score, email, phone, notes, hourly_rate_usd, established_year) values
  -- Original 5 with extended fields
  ('c1000000-0000-0000-0000-000000000001', 'Meridian Builders Ltd', 'Structural', '{"BRB","JAM"}', 'preferred', 94, 88, 'contracts@meridianbuilders.bb', '+1-246-430-2200', 'SummitStone anchor partner since 2014. Exceptional structural quality on all high-end residential. 12 completed projects together.', 85, 2008),
  ('c1000000-0000-0000-0000-000000000002', 'Caribbean Civil Works', 'Civil / Foundations', '{"BRB","TTD","JAM"}', 'active', 88, 80, 'ops@ccworks.tt', '+1-868-638-1100', 'Strong civil and earthworks capability across 3 islands. Occasional schedule slippage on larger scopes.', 75, 2005),
  ('c1000000-0000-0000-0000-000000000003', 'Island MEP Solutions', 'Mechanical / Electrical / Plumbing', '{"KYD","BRB"}', 'active', 91, 83, 'info@islandmep.ky', '+1-345-946-0088', 'Best MEP capability in Cayman. Reliable on complex systems. Limited capacity — book early.', 95, 2011),
  ('c1000000-0000-0000-0000-000000000004', 'TTD Concrete Co.', 'Concrete Works', '{"TTD"}', 'review', 72, 64, 'concrete@ttdcc.tt', '+1-868-657-4400', 'Under review following delays and quality issues on Port of Spain HQ foundation pours Q3 2024. Probation period.', 60, 2009),
  ('c1000000-0000-0000-0000-000000000005', 'Fineline Interiors', 'Fit-Out / Finishes', '{"BRB","KYD","JAM"}', 'preferred', 96, 92, 'projects@finelineinteriors.bb', '+1-246-435-7700', 'Premium finishing and FF&E across all three markets. Client satisfaction scores consistently excellent. Luxury benchmark partner.', 110, 2013),
  -- New contractors from history
  ('c1000000-0000-0000-0000-000000000006', 'Platinum Roofing & Waterproofing', 'Roofing / Waterproofing', '{"BRB","TTD"}', 'preferred', 97, 91, 'admin@platinumroofing.bb', '+1-246-429-5500', 'Hurricane-rated roofing specialists. Certified for wind load compliance in both BRB and TTD. Relationship since 2015.', 78, 2010),
  ('c1000000-0000-0000-0000-000000000007', 'Cayman Structural Engineering', 'Structural', '{"KYD"}', 'preferred', 93, 90, 'eng@caymanstruct.ky', '+1-345-949-8877', 'Cayman Islands premier structural firm. Licensed for coastal and high-value residential.', 120, 2003),
  ('c1000000-0000-0000-0000-000000000008', 'Jamaica Groundworks Ltd', 'Civil / Earthworks', '{"JAM"}', 'active', 84, 78, 'jgl@groundworks.jm', '+1-876-960-4455', 'Experienced in challenging Jamaican terrain — Blue Mountains and coastal sites.', 65, 2007),
  ('c1000000-0000-0000-0000-000000000009', 'Caribbean Glass & Glazing', 'Glazing / Facades', '{"BRB","KYD","JAM"}', 'active', 89, 85, 'quotes@caribglass.bb', '+1-246-431-0060', 'Impact-rated glazing and curtain wall specialists. DOE Cayman approved. Hurricane impact certified.', 88, 2012),
  ('c1000000-0000-0000-0000-000000000010', 'Naparima Build Corp', 'General Contractor', '{"TTD"}', 'active', 86, 82, 'build@naparimacorp.tt', '+1-868-625-3344', 'Full general contracting capability in Trinidad. Strong government and commercial relationships.', 70, 2001),
  ('c1000000-0000-0000-0000-000000000011', 'Island Landscape Studio', 'Landscaping', '{"BRB","KYD"}', 'preferred', 95, 94, 'studio@islandlandscape.bb', '+1-246-432-8800', 'Award-winning tropical landscape design and installation. Consistently exceeds client expectations on luxury estates.', 72, 2014),
  ('c1000000-0000-0000-0000-000000000012', 'Blue Mountain Builders', 'Hospitality Construction', '{"JAM"}', 'active', 82, 80, 'ops@bluemtbuilders.jm', '+1-876-944-3300', 'Eco-hospitality and hill-site construction specialists in Jamaica.', 68, 2009)
on conflict (id) do update set
  email = excluded.email, phone = excluded.phone, notes = excluded.notes,
  hourly_rate_usd = excluded.hourly_rate_usd, established_year = excluded.established_year;

-- ────────────────────────────────────────────────────────────
-- COMPLETED HISTORICAL PROJECTS (2013–2022)
-- Demonstrates 12 years of portfolio depth
-- ────────────────────────────────────────────────────────────
insert into projects (id, name, code, client_id, stage, type, island, contract_type, budget_usd, spent_usd, completion_pct, start_date, target_end_date) values
  -- 2013-2015 early builds
  ('b2000000-0000-0000-0000-000000000001', 'Sandy Lane Villa — Barbados', 'SLV-2013', 'a1000000-0000-0000-0000-000000000006', 'completed', 'residential', 'BRB', 'fixed', 2100000, 2143000, 100, '2013-03-01', '2014-06-30'),
  ('b2000000-0000-0000-0000-000000000002', 'West Bay Residence — Cayman', 'WBR-2014', 'a1000000-0000-0000-0000-000000000007', 'completed', 'residential', 'KYD', 'cost_plus', 3400000, 3295000, 100, '2014-01-15', '2015-04-30'),
  -- 2015-2017 growth phase
  ('b2000000-0000-0000-0000-000000000003', 'Holetown Heritage Estate', 'HHE-2015', 'a1000000-0000-0000-0000-000000000006', 'completed', 'residential', 'BRB', 'fixed', 4800000, 4750000, 100, '2015-02-01', '2016-11-30'),
  ('b2000000-0000-0000-0000-000000000004', 'Blue Mountain Eco Lodge Phase 1', 'BME-2015', 'a1000000-0000-0000-0000-000000000008', 'completed', 'hospitality', 'JAM', 'cost_plus', 2800000, 2920000, 100, '2015-06-01', '2016-10-31'),
  ('b2000000-0000-0000-0000-000000000005', 'Pelican Bay Commercial Centre', 'PBC-2016', 'a1000000-0000-0000-0000-000000000009', 'completed', 'commercial', 'TTD', 'management_fee', 7200000, 7140000, 100, '2016-03-01', '2018-02-28'),
  -- 2017-2019 scale-up
  ('b2000000-0000-0000-0000-000000000006', 'Seven Mile Beach Villas — Phase 1', 'SMB-2017', 'a1000000-0000-0000-0000-000000000007', 'completed', 'residential', 'KYD', 'fixed', 9400000, 9680000, 100, '2017-01-10', '2019-03-31'),
  ('b2000000-0000-0000-0000-000000000007', 'Paynes Bay Private Estate', 'PBP-2018', 'a1000000-0000-0000-0000-000000000010', 'completed', 'residential', 'BRB', 'fixed', 6200000, 6050000, 100, '2018-04-01', '2019-12-31'),
  ('b2000000-0000-0000-0000-000000000008', 'Sunset Isle Boutique Resort', 'SIR-2018', 'a1000000-0000-0000-0000-000000000011', 'completed', 'hospitality', 'KYD', 'cost_plus', 12400000, 12780000, 100, '2018-09-01', '2021-03-31'),
  -- 2020-2022 maturity
  ('b2000000-0000-0000-0000-000000000009', 'Blue Mountain Eco Lodge Phase 2', 'BME-2020', 'a1000000-0000-0000-0000-000000000008', 'completed', 'hospitality', 'JAM', 'cost_plus', 4100000, 4050000, 100, '2020-02-01', '2021-11-30'),
  ('b2000000-0000-0000-0000-000000000010', 'Port Royal Waterfront Offices', 'PRW-2021', 'a1000000-0000-0000-0000-000000000012', 'completed', 'commercial', 'JAM', 'fixed', 5600000, 5720000, 100, '2021-03-01', '2022-10-31'),
  ('b2000000-0000-0000-0000-000000000011', 'St James Parish Mixed-Use', 'SJM-2022', 'a1000000-0000-0000-0000-000000000008', 'completed', 'mixed_use', 'JAM', 'fixed', 8800000, 8640000, 100, '2022-01-01', '2023-06-30'),
  ('b2000000-0000-0000-0000-000000000012', 'Naparima Tower Phase 1', 'NTP-2022', 'a1000000-0000-0000-0000-000000000009', 'completed', 'commercial', 'TTD', 'management_fee', 14200000, 14480000, 100, '2022-04-01', '2024-01-31')
on conflict do nothing;

-- ────────────────────────────────────────────────────────────
-- HISTORICAL PAYMENTS (completed projects)
-- ────────────────────────────────────────────────────────────
insert into payments (project_id, title, amount_usd, due_date, paid_date, status) values
  -- Sandy Lane Villa
  ('b2000000-0000-0000-0000-000000000001', 'Mobilisation', 210000, '2013-03-15', '2013-03-18', 'paid'),
  ('b2000000-0000-0000-0000-000000000001', 'Foundation Complete', 420000, '2013-07-01', '2013-07-05', 'paid'),
  ('b2000000-0000-0000-0000-000000000001', 'Structural Frame', 420000, '2013-11-15', '2013-11-20', 'paid'),
  ('b2000000-0000-0000-0000-000000000001', 'Roofing & Envelope', 630000, '2014-03-01', '2014-03-06', 'paid'),
  ('b2000000-0000-0000-0000-000000000001', 'Handover', 420000, '2014-06-30', '2014-07-02', 'paid'),
  -- Seven Mile Beach (largest historical)
  ('b2000000-0000-0000-0000-000000000006', 'Mobilisation & Site Works', 940000, '2017-01-30', '2017-02-01', 'paid'),
  ('b2000000-0000-0000-0000-000000000006', 'Foundations & Substructure', 1880000, '2017-08-15', '2017-08-18', 'paid'),
  ('b2000000-0000-0000-0000-000000000006', 'Structural Frame Complete', 2350000, '2018-04-01', '2018-04-05', 'paid'),
  ('b2000000-0000-0000-0000-000000000006', 'MEP & Fitout', 2820000, '2018-12-15', '2018-12-20', 'paid'),
  ('b2000000-0000-0000-0000-000000000006', 'Practical Completion', 1410000, '2019-03-31', '2019-04-04', 'paid'),
  -- Sunset Isle Resort
  ('b2000000-0000-0000-0000-000000000008', 'Phase 1 Mobilisation', 1240000, '2018-09-15', '2018-09-18', 'paid'),
  ('b2000000-0000-0000-0000-000000000008', 'Phase 2 Structure', 2480000, '2019-06-01', '2019-06-08', 'paid'),
  ('b2000000-0000-0000-0000-000000000008', 'Phase 3 MEP & Finishes', 3720000, '2020-08-01', '2020-08-10', 'paid'),
  ('b2000000-0000-0000-0000-000000000008', 'Final Handover', 4960000, '2021-03-31', '2021-04-06', 'paid'),
  -- Naparima Tower
  ('b2000000-0000-0000-0000-000000000012', 'Groundbreaking', 1420000, '2022-04-15', '2022-04-20', 'paid'),
  ('b2000000-0000-0000-0000-000000000012', 'Core & Shell', 4260000, '2023-03-01', '2023-03-08', 'paid'),
  ('b2000000-0000-0000-0000-000000000012', 'Fitout & Commissioning', 5680000, '2023-11-01', '2023-11-07', 'paid'),
  ('b2000000-0000-0000-0000-000000000012', 'Final Certificate', 2840000, '2024-01-31', '2024-02-05', 'paid')
on conflict do nothing;

-- ────────────────────────────────────────────────────────────
-- ADDITIONAL MILESTONES (active projects, richer coverage)
-- ────────────────────────────────────────────────────────────
insert into milestones (project_id, contractor_id, title, sequence_order, target_date, completed_date, is_completed, is_active) values
  -- Cayman Blue Resort additional milestones
  ('b1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000007', 'Site Preparation & Excavation', 1, '2024-03-15', '2024-03-12', true, false),
  ('b1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000002', 'Foundation & Substructure', 2, '2024-05-01', '2024-04-28', true, false),
  ('b1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000007', 'Structural Frame', 3, '2024-07-31', '2024-08-05', true, false),
  ('b1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000009', 'Glazing & Envelope', 4, '2024-09-30', null, false, true),
  ('b1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000003', 'MEP Installation', 5, '2024-11-30', null, false, false),
  ('b1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000005', 'Interior Fitout & FF&E', 6, '2025-02-28', null, false, false),
  ('b1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000011', 'Landscaping & Pool Area', 7, '2025-03-15', null, false, false),
  -- Montego Bay Villas
  ('b1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000008', 'Earthworks & Drainage', 1, '2024-04-15', '2024-04-10', true, false),
  ('b1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000002', 'Foundations — Villas 1–8', 2, '2024-06-01', '2024-06-04', true, false),
  ('b1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000001', 'Structural Frames — Villas 1–4', 3, '2024-08-15', null, false, true),
  ('b1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000001', 'Structural Frames — Villas 5–8', 4, '2024-10-01', null, false, false),
  ('b1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000005', 'Interior Fitout', 5, '2024-11-30', null, false, false),
  -- Port of Spain HQ
  ('b1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000010', 'Site Preparation', 1, '2024-06-30', '2024-06-25', true, false),
  ('b1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000004', 'Piling & Deep Foundations', 2, '2024-09-30', null, false, true),
  ('b1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000010', 'Substructure & Ground Floor Slab', 3, '2024-12-15', null, false, false),
  ('b1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000010', 'Structural Core — Floors 1–5', 4, '2025-04-30', null, false, false),
  ('b1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000003', 'MEP Risers & Plant Rooms', 5, '2025-07-31', null, false, false),
  -- Holetown Mixed-Use
  ('b1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000002', 'Site Clearance & Enabling Works', 1, '2024-08-01', '2024-07-28', true, false),
  ('b1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000002', 'Foundations & Substructure', 2, '2024-11-01', null, false, true),
  ('b1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000001', 'Structural Steel Frame', 3, '2025-03-31', null, false, false)
on conflict do nothing;

-- ────────────────────────────────────────────────────────────
-- ADDITIONAL CHANGE ORDERS (historical depth)
-- ────────────────────────────────────────────────────────────
insert into change_orders (project_id, contractor_id, co_number, title, description, raised_by, value_usd, schedule_impact_days, status) values
  ('b1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000009', 'CO-009', 'Upgraded impact glazing — hurricane spec', 'Client requested upgrade to PGT WinGuard impact-rated glazing throughout. Caribbean resilience standard.', 'Clarke Resort Group', 68000, 4, 'approved'),
  ('b1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000005', 'CO-010', 'Infinity pool addition — Villa 2', 'Client added infinity-edge plunge pool to Villa 2 specification post-contract.', 'Montego Bay Investments Ltd', 42000, 8, 'pending'),
  ('b1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000002', 'CO-011', 'Soil contamination remediation', 'Environmental assessment revealed historical fuel contamination on northwest corner. Remediation required before foundations.', 'Site Investigation Report', 95000, 21, 'approved'),
  ('b1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000003', 'CO-012', 'Generator room upgrade — 500kVA to 1000kVA', 'Tenant pre-leasing requirement for data centre floor. Generator plant doubled.', 'Naparima Group', 185000, 0, 'approved'),
  ('b1000000-0000-0000-0000-000000000001', null, 'CO-013', 'Smart home automation system', 'Owner upgrade request — KNX full automation system for all AV, HVAC, and security.', 'Richardson Private Holdings', 38000, 3, 'pending')
on conflict do nothing;

-- ────────────────────────────────────────────────────────────
-- ADDITIONAL SHIPMENTS (active procurement pipeline)
-- ────────────────────────────────────────────────────────────
insert into shipments (project_id, reference, material, supplier, origin_location, destination_island, value_usd, eta_date, status, notes) values
  ('b1000000-0000-0000-0000-000000000002', 'SHP-0042', 'Pool Filtration System — Myrtha Pools', 'Myrtha Pools Italy', 'Verona, Italy', 'KYD', 148000, '2024-09-18', 'in_transit', 'Commercial filtration for main resort pool. 6-week lead from Italy.'),
  ('b1000000-0000-0000-0000-000000000002', 'SHP-0043', 'PGT WinGuard Impact Windows', 'PGT Innovations', 'Venice, FL', 'KYD', 312000, '2024-09-28', 'ordered', 'Hurricane-impact certified. CO-009 upgrade. Custom sizes — allow 10 weeks.'),
  ('b1000000-0000-0000-0000-000000000004', 'SHP-0044', 'Daikin VRV X-Series HVAC — 48 units', 'Daikin Gulf', 'Dubai, UAE', 'TTD', 380000, '2024-10-05', 'in_transit', 'Commercial VRV system for POS HQ floors 1-8. In transit via Singapore.'),
  ('b1000000-0000-0000-0000-000000000005', 'SHP-0045', 'Rebar & Structural Steel', 'ArcelorMittal', 'Trinidad', 'BRB', 62000, '2024-09-12', 'delivered', 'Short-haul Caribbean delivery. Arrived and checked.'),
  ('b1000000-0000-0000-0000-000000000003', 'SHP-0046', 'Porcelain Floor Tiles — Villa 1–4', 'Cerimonia Spain', 'Valencia, Spain', 'JAM', 88000, '2024-09-22', 'customs_hold', 'Held at Kingston customs — import permit pending. Expediting.'),
  ('b1000000-0000-0000-0000-000000000001', 'SHP-0047', 'KNX Smart Home Controllers', 'Schneider Electric', 'Frankfurt, Germany', 'BRB', 44000, '2024-10-08', 'ordered', 'CO-013 smart home upgrade. Custom configuration required.')
on conflict do nothing;

-- ────────────────────────────────────────────────────────────
-- ADDITIONAL PERMITS
-- ────────────────────────────────────────────────────────────
insert into permits (project_id, island, title, authority, submitted_date, approved_date, expiry_date, status, sequence_order, notes) values
  ('b1000000-0000-0000-0000-000000000002', 'KYD', 'DOE Coastal Zone Development Licence', 'Department of Environment', '2024-02-01', '2024-04-15', '2026-04-15', 'approved', 4, 'Required for beach access construction works. Critical path item.'),
  ('b1000000-0000-0000-0000-000000000005', 'BRB', 'Environmental Impact Assessment — Holetown', 'Coastal Zone Management Unit', '2024-08-01', null, null, 'under_review', 2, 'CZMU review period 12-16 weeks typical. Expeditor engaged.'),
  ('b1000000-0000-0000-0000-000000000005', 'BRB', 'Building Permit — Holetown Mixed-Use', 'Barbados Standards Institution', null, null, null, 'not_started', 3, 'Cannot submit until EIA approved. Dependency tracked.'),
  ('b1000000-0000-0000-0000-000000000003', 'JAM', 'Road Widening Consent — Ironshore Road', 'National Works Agency', '2024-06-15', '2024-08-10', '2025-08-10', 'approved', 4, 'Required for construction vehicle access. Approved.'),
  ('b1000000-0000-0000-0000-000000000004', 'TTD', 'EMA Certificate of Environmental Clearance', 'Environmental Management Authority', '2023-11-01', '2024-02-20', '2026-02-20', 'approved', 3, 'Full CEC for high-rise commercial development. Critical.'),
  ('b1000000-0000-0000-0000-000000000004', 'TTD', 'WASA Water Connection Permit', 'Water & Sewerage Authority', '2024-05-01', null, null, 'overdue', 4, 'WASA permit 18 weeks overdue. Legal escalation in progress.')
on conflict do nothing;

-- ────────────────────────────────────────────────────────────
-- ADDITIONAL RISKS
-- ────────────────────────────────────────────────────────────
insert into risks (project_id, title, description, category, likelihood, impact, mitigation, is_resolved) values
  ('b1000000-0000-0000-0000-000000000003', 'Customs delay — Spanish tiles, SHP-0046', 'Floor tile shipment held at Kingston customs. 2-3 week delay likely. Could push Villa 1-4 handover.', 'procurement', 4, 3, 'Customs broker engaged. Import permit being expedited. Alternate tile source on standby.', false),
  ('b1000000-0000-0000-0000-000000000005', 'EIA approval timeline — Holetown', 'Environmental Impact Assessment still under CZMU review. 3-month delay would push main permit and construction start.', 'regulatory', 3, 5, 'CZMU meeting scheduled for Sept 30. Architect briefed to address any outstanding concerns pre-meeting.', false),
  ('b1000000-0000-0000-0000-000000000004', 'TTD Concrete Co. performance risk', 'Contractor under review after quality issues. Two of three active pour milestones assigned to them. Risk to structural integrity assessment.', 'contractor', 3, 4, 'Increased QA inspection frequency. Meridian Builders Ltd on standby to takeover piling if quality issues recur.', false),
  (null, 'Atlantic Hurricane Season 2024 — all sites', 'Sites in JAM and TTD at elevated risk Aug-Oct. BRB also active season. All active sites require formal storm prep plan.', 'environmental', 3, 5, 'All sites to submit storm prep plans by Sept 1. Critical equipment to be secured or removed. BRB and TTD have hurricane-rated hoarding.', false),
  ('b1000000-0000-0000-0000-000000000001', 'Smart home system schedule risk', 'KNX installation requires specialist commissioning engineer. Only 2 Caribbean-based certified engineers available. Booking window tight.', 'procurement', 2, 2, 'KNX specialist booked provisionally for Nov 15. Backup engineer identified in Miami if needed.', false)
on conflict do nothing;

-- ────────────────────────────────────────────────────────────
-- ADDITIONAL SITE LOGS (richer daily field history)
-- ────────────────────────────────────────────────────────────
insert into site_logs (project_id, log_date, day_number, workers_on_site, weather, work_performed, safety_status, delays_description) values
  ('b1000000-0000-0000-0000-000000000002', '2024-08-23', 183, 34, 'clear', 'Glazing installation commenced — bays 1-4, ground floor west elevation. Curtain wall sub-frame complete.', 'clear', null),
  ('b1000000-0000-0000-0000-000000000002', '2024-08-24', 184, 30, 'partly_cloudy', 'Glazing bays 5-8 installed. Temporary protection applied. Mechanical room frame 80% complete.', 'clear', null),
  ('b1000000-0000-0000-0000-000000000003', '2024-08-22', 165, 20, 'clear', 'Villa 3-4 structural frame progressing. Second floor columns complete. Beam casting scheduled tomorrow.', 'clear', null),
  ('b1000000-0000-0000-0000-000000000003', '2024-08-21', 164, 18, 'partly_cloudy', 'Rebar fixing for Villa 3-4 second floor slabs. Concrete pour delayed by 1 day — pump unavailable.', 'clear', 'Concrete pump breakdown. Rescheduled for Aug 22.'),
  ('b1000000-0000-0000-0000-000000000004', '2024-08-22', 97, 16, 'clear', 'Piling rig mobilised to grid lines C-F. First 6 piles bored to 18m depth. Concrete delivery confirmed for tomorrow.', 'minor', null),
  ('b1000000-0000-0000-0000-000000000004', '2024-08-19', 94, 14, 'rain', 'Rain stopped piling works by 10am. Welfare facilities maintained. Rig serviced during downtime.', 'clear', 'Heavy rain 10am-3pm. 5hrs lost production.'),
  ('b1000000-0000-0000-0000-000000000005', '2024-08-20', 56, 10, 'clear', 'Enabling works ongoing. Temporary site hoarding complete on 3 sides. Foundation trenches staked out by site engineer.', 'clear', null),
  ('b1000000-0000-0000-0000-000000000001', '2024-08-23', 215, 22, 'clear', 'Roof flashings complete on all elevations. Drainage outlets connected. Waterproofing membrane applied — north slope.', 'clear', null)
on conflict do nothing;

-- ────────────────────────────────────────────────────────────
-- ADDITIONAL DOCUMENTS
-- ────────────────────────────────────────────────────────────
insert into documents (project_id, title, type, access_level, version, description) values
  ('b1000000-0000-0000-0000-000000000002', 'Cayman Blue — Structural Drawings Rev.3', 'blueprint', 'engineers', '3.0', 'Issued for construction. Includes pool shell and mechanical room revisions.'),
  ('b1000000-0000-0000-0000-000000000002', 'MEP Coordination Drawings — CBR', 'blueprint', 'engineers', '2.1', 'Coordinated MEP set, all disciplines. BIM clash detection complete.'),
  ('b1000000-0000-0000-0000-000000000004', 'POS HQ — Foundation Engineering Report', 'survey', 'engineers', '1.0', 'Geotechnical investigation and pile design recommendation.'),
  ('b1000000-0000-0000-0000-000000000005', 'Holetown EIA — Draft Submission', 'report', 'directors', '1.0', 'Draft Environmental Impact Assessment submitted to CZMU.'),
  (null, 'Q3 2024 Investor Report', 'report', 'investors', '1.0', 'Portfolio performance report for investor distribution. August 2024.'),
  (null, 'SummitStone — Insurance Certificate 2024', 'contract', 'directors', '1.0', 'Professional indemnity and public liability — expires Dec 2024.'),
  ('b1000000-0000-0000-0000-000000000003', 'Montego Bay Villas — Sales Brochure Plans', 'blueprint', 'all_staff', '1.0', 'Architectural floor plans for marketing purposes.'),
  ('b1000000-0000-0000-0000-000000000001', 'Coral Ridge — Smart Home Specification', 'contract', 'engineers', '1.0', 'KNX system specification and programming brief.')
on conflict do nothing;

-- ────────────────────────────────────────────────────────────
-- ADDITIONAL RFIS (from new-modules tables)
-- ────────────────────────────────────────────────────────────
insert into rfis (project_id, rfi_number, subject, discipline, priority, question, raised_by, assigned_to, due_date, drawing_ref, status, response)
select
  p.id, d.rfi_number, d.subject, d.discipline, d.priority, d.question,
  d.raised_by, d.assigned_to, d.due_date::date, d.drawing_ref, d.status, d.response
from (values
  ('Cayman Blue Resort', 'RFI-0039', 'Infinity pool overflow channel depth — confirm dimension', 'structural', 'high',
   'Pool structural drawing DWG-S-211 shows overflow channel depth as 450mm but pool design spec says 600mm. Formwork for pool shell is next week. Urgent clarification needed.',
   'Island MEP Solutions', 'Pool Design Engineer', '2024-08-27', 'DWG-S-211, Pool Spec Section 4.3', 'responded',
   'Confirmed 600mm per pool spec. DWG-S-211 Rev.4 issued with correction. Proceed with 600mm.'),
  ('Holetown Mixed-Use', 'RFI-0036', 'Retaining wall design — east boundary slope', 'civil', 'medium',
   'Site survey shows east boundary slope steeper than assumed in structural calcs — 1:8 vs 1:12. Does this affect retaining wall design? Foundation drawings may need revision.',
   'Caribbean Civil Works', 'Structural Engineer', '2024-09-15', 'SURVEY-001, DWG-C-002', 'open', null),
  ('Port of Spain HQ', 'RFI-0037', 'Fire compartmentation — floor 4 plant room', 'mechanical', 'medium',
   'M&E drawings show fire dampers at structural penetrations but do not specify UL rating. TTD building code requires 2-hour fire compartmentation at plant room boundaries. Confirm specification.',
   'Naparima Build Corp', 'MEP Engineer', '2024-09-10', 'DWG-M-044', 'pending_response', null)
) as d(proj_name, rfi_number, subject, discipline, priority, question, raised_by, assigned_to, due_date, drawing_ref, status, response)
join projects p on p.name = d.proj_name
on conflict do nothing;

-- ────────────────────────────────────────────────────────────
-- ADDITIONAL SUBMITTALS
-- ────────────────────────────────────────────────────────────
insert into submittals (project_id, submittal_number, title, discipline, spec_section, revision, submitted_by, reviewer, submitted_date, required_date, reviewed_date, status, notes)
select
  p.id, s.sub_number, s.title, s.discipline, s.spec_section, s.revision::int,
  s.submitted_by, s.reviewer, s.submitted_date::date, s.required_date::date, s.reviewed_date, s.status, s.notes
from (values
  ('Cayman Blue Resort', 'SUB-0016', 'MEP Coordination BIM Model — Level 1 & 2', 'mechanical', '01 31 19', '0',
   'Island MEP Solutions', 'Lead Engineer', '2024-08-15', '2024-08-29', null, 'under_review',
   'Full MEP BIM model with clash detection report. First submission.'),
  ('Coral Ridge Estate', 'SUB-0020', 'KNX Smart Home — System Architecture Drawing', 'electrical', '25 00 00', '0',
   'Fineline Interiors', 'Electrical Engineer', '2024-08-22', '2024-09-05', null, 'submitted',
   'CO-013 scope. Programming brief to follow separately.'),
  ('Montego Bay Villas', 'SUB-0017', 'Villa Roof Tile Product Data — Villa 1-4', 'architectural', '07 30 00', '1',
   'Meridian Builders Ltd', 'Architect of Record', '2024-08-01', '2024-08-15', '2024-08-14',
   'approved_as_noted', 'Approved. Note: ensure all installed tiles match approved colour sample S-14-A.'),
  ('Port of Spain HQ', 'SUB-0010', 'Pile Installation Method Statement', 'civil', '31 63 00', '0',
   'TTD Concrete Co.', 'Structural Engineer', '2024-07-20', '2024-08-05', '2024-08-10',
   'resubmit', 'Rejected: method statement does not address groundwater management during boring. Resubmit with dewatering plan.')
) as s(proj_name, sub_number, title, discipline, spec_section, revision, submitted_by, reviewer, submitted_date, required_date, reviewed_date, status, notes)
join projects p on p.name = s.proj_name
on conflict do nothing;

-- ────────────────────────────────────────────────────────────
-- ADDITIONAL SAFETY INCIDENTS (historical record)
-- ────────────────────────────────────────────────────────────
insert into safety_incidents (project_id, incident_date, type, severity, title, description, injured_party, body_part, lost_days, immediate_action, corrective_action, reported_by, witnesses, is_notifiable, status)
select
  p.id, si.incident_date::date, si.type, si.severity, si.title, si.description,
  si.injured_party, si.body_part, si.lost_days::int, si.immediate_action,
  si.corrective_action, si.reported_by, si.witnesses, si.is_notifiable::boolean, si.status
from (values
  ('Cayman Blue Resort', '2024-07-18', 'near_miss', 'moderate',
   'Near miss — crane lift, unsecured load swing',
   'During structural steel lift on grid C/5, load began to swing due to wind gust. Banksmen cleared area in time. No contact with personnel or structure. Load safely landed.',
   null, null, '0',
   'Lift suspended immediately. All personnel cleared from lift zone. Load secured.',
   'Revised lift plan with anemometer monitoring required above 15mph winds. All future lifts require dedicated lift supervisor sign-off.',
   'Project Manager', 'P. Kelly, A. Watson, M. Francis', 'false', 'closed'),
  ('Montego Bay Villas', '2024-06-05', 'first_aid', 'minor',
   'Eye irritant — concrete dust, Villa 3 formwork stripping',
   'Worker stripping formwork from Villa 3 ground floor slab received concrete dust particles in left eye. Rinsed at site eye wash station. No lasting injury. Continued work next day.',
   'B. Williams', 'Left eye', '0',
   'Eye wash station used immediately. Worker assessed by first aider. Cleared for light duties same day.',
   'Safety goggles mandatory during all formwork stripping operations. Toolbox talk conducted site-wide.',
   'Site Foreman R. Brown', 'T. Grant', 'false', 'closed'),
  ('Port of Spain HQ', '2024-05-12', 'property_damage', 'moderate',
   'Piling rig hydraulic failure — ground contamination',
   'Hydraulic hose on piling rig failed catastrophically, releasing approximately 80L of hydraulic fluid. Contaminated bored pile area and adjacent ground. No personal injury. Environmental risk.',
   null, 'Site ground / borehole area', '0',
   'Area cordoned off. EMA notified same day. Absorbent material deployed. Contaminated soil excavated and removed.',
   'All hydraulic hoses on site plant inspected and replaced over 3yrs old. Pre-start checks to include hose condition.',
   'Site Manager D. Charles', 'J. Mohammed, contractor supervisor', 'true', 'closed')
) as si(proj_name, incident_date, type, severity, title, description, injured_party, body_part, lost_days, immediate_action, corrective_action, reported_by, witnesses, is_notifiable, status)
join projects p on p.name = si.proj_name
on conflict do nothing;

-- ────────────────────────────────────────────────────────────
-- ACTIVITY LOG enrichment
-- ────────────────────────────────────────────────────────────
insert into activity_log (project_id, action, entity_type, metadata) values
  ('b1000000-0000-0000-0000-000000000002', 'RFI responded — RFI-0039 · Pool overflow channel confirmed 600mm', 'rfi', '{"rfi_number":"RFI-0039","discipline":"structural"}'),
  ('b1000000-0000-0000-0000-000000000004', 'Safety incident logged — hydraulic fluid release, EMA notified', 'safety_incident', '{"type":"property_damage","notifiable":true}'),
  ('b1000000-0000-0000-0000-000000000003', 'Shipment SHP-0046 — customs hold, Kingston', 'shipment', '{"reference":"SHP-0046","status":"customs_hold"}'),
  ('b1000000-0000-0000-0000-000000000002', 'Change order approved — CO-009 impact glazing upgrade $68K', 'change_order', '{"co_number":"CO-009","value":68000,"status":"approved"}'),
  (null, 'New contractor registered — Blue Mountain Builders JA', 'contractor', '{"name":"Blue Mountain Builders","island":"JAM"}'),
  ('b1000000-0000-0000-0000-000000000005', 'Submittal resubmit required — SUB-0010 piling method statement', 'submittal', '{"submittal_number":"SUB-0010","status":"resubmit"}')
on conflict do nothing;

-- ── SUMMARY ──────────────────────────────────────────────────
-- Total projects in system: 19 (7 active + 12 completed 2013–2023)
-- Completed portfolio value: ~$83M USD across 12 years
-- Total contractors: 12 firms, 4 islands
-- Clients: 12 firms across BRB/KYD/JAM/TTD
-- RFIs: 7 | Submittals: 9 | Safety Incidents: 6
-- Full procurement, permits, milestones, risks, site logs populated
-- ─────────────────────────────────────────────────────────────
