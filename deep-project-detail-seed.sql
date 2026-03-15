-- ============================================================
-- SUMMITSTONE — DEEP PROJECT DETAIL SEED DATA
-- Full milestones, site logs, permits, risks, change orders,
-- documents for all 19 projects (12 completed + 7 active)
-- Run AFTER comprehensive-seed-data.sql
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- MILESTONES — Historical completed projects
-- All is_completed = true, all have completed_dates
-- ────────────────────────────────────────────────────────────
insert into milestones (project_id, contractor_id, title, sequence_order, target_date, completed_date, is_completed, is_active) values
  -- Sandy Lane Villa (2013-2014)
  ('b2000000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000002','Site Preparation & Excavation',1,'2013-04-30','2013-04-28',true,false),
  ('b2000000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000002','Foundation & Substructure',2,'2013-07-15','2013-07-10',true,false),
  ('b2000000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000001','Structural Frame & Roof',3,'2013-11-30','2013-12-05',true,false),
  ('b2000000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000003','MEP Rough-In & Services',4,'2014-03-15','2014-03-18',true,false),
  ('b2000000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000005','Finishes, Fit-Out & Landscaping',5,'2014-06-15','2014-06-20',true,false),
  -- West Bay Residence Cayman (2014-2015)
  ('b2000000-0000-0000-0000-000000000002','c1000000-0000-0000-0000-000000000007','Site & Enabling Works',1,'2014-03-31','2014-03-28',true,false),
  ('b2000000-0000-0000-0000-000000000002','c1000000-0000-0000-0000-000000000007','Foundations & Substructure',2,'2014-07-31','2014-07-25',true,false),
  ('b2000000-0000-0000-0000-000000000002','c1000000-0000-0000-0000-000000000007','Structural Frame & Envelope',3,'2014-12-15','2014-12-18',true,false),
  ('b2000000-0000-0000-0000-000000000002','c1000000-0000-0000-0000-000000000003','MEP & Smart Systems',4,'2015-03-15','2015-03-20',true,false),
  ('b2000000-0000-0000-0000-000000000002','c1000000-0000-0000-0000-000000000005','Interiors & Handover',5,'2015-04-30','2015-04-25',true,false),
  -- Holetown Heritage Estate (2015-2016)
  ('b2000000-0000-0000-0000-000000000003','c1000000-0000-0000-0000-000000000002','Demolition & Site Preparation',1,'2015-04-30','2015-04-25',true,false),
  ('b2000000-0000-0000-0000-000000000003','c1000000-0000-0000-0000-000000000002','Foundations & Basement',2,'2015-08-31','2015-08-28',true,false),
  ('b2000000-0000-0000-0000-000000000003','c1000000-0000-0000-0000-000000000001','Structural Frame — 2 Storeys',3,'2016-02-28','2016-03-05',true,false),
  ('b2000000-0000-0000-0000-000000000003','c1000000-0000-0000-0000-000000000006','Roofing & Waterproofing',4,'2016-05-31','2016-05-28',true,false),
  ('b2000000-0000-0000-0000-000000000003','c1000000-0000-0000-0000-000000000003','MEP & Pool Systems',5,'2016-08-31','2016-09-02',true,false),
  ('b2000000-0000-0000-0000-000000000003','c1000000-0000-0000-0000-000000000005','Premium Finishes & Handover',6,'2016-11-30','2016-11-25',true,false),
  -- Blue Mountain Eco Lodge Phase 1 (2015-2016)
  ('b2000000-0000-0000-0000-000000000004','c1000000-0000-0000-0000-000000000008','Earthworks & Access Road',1,'2015-09-30','2015-09-25',true,false),
  ('b2000000-0000-0000-0000-000000000004','c1000000-0000-0000-0000-000000000002','Foundation Works',2,'2015-12-31','2015-12-28',true,false),
  ('b2000000-0000-0000-0000-000000000004','c1000000-0000-0000-0000-000000000012','Timber Frame Lodge Structures',3,'2016-05-31','2016-06-05',true,false),
  ('b2000000-0000-0000-0000-000000000004','c1000000-0000-0000-0000-000000000003','Off-Grid MEP & Solar Systems',4,'2016-08-31','2016-08-28',true,false),
  ('b2000000-0000-0000-0000-000000000004','c1000000-0000-0000-0000-000000000011','Landscaping & Eco Features',5,'2016-10-31','2016-10-28',true,false),
  -- Pelican Bay Commercial (2016-2018)
  ('b2000000-0000-0000-0000-000000000005','c1000000-0000-0000-0000-000000000010','Site & Piling Works',1,'2016-06-30','2016-06-25',true,false),
  ('b2000000-0000-0000-0000-000000000005','c1000000-0000-0000-0000-000000000010','Ground Floor Slab & Core',2,'2016-10-31','2016-10-28',true,false),
  ('b2000000-0000-0000-0000-000000000005','c1000000-0000-0000-0000-000000000010','Structural Frame — Floors 1–4',3,'2017-05-31','2017-06-02',true,false),
  ('b2000000-0000-0000-0000-000000000005','c1000000-0000-0000-0000-000000000009','Facade & Glazing',4,'2017-10-31','2017-11-05',true,false),
  ('b2000000-0000-0000-0000-000000000005','c1000000-0000-0000-0000-000000000003','MEP & Commissioning',5,'2018-01-31','2018-01-28',true,false),
  ('b2000000-0000-0000-0000-000000000005','c1000000-0000-0000-0000-000000000005','Fit-Out & Handover',6,'2018-02-28','2018-02-22',true,false),
  -- Seven Mile Beach Villas (2017-2019)
  ('b2000000-0000-0000-0000-000000000006','c1000000-0000-0000-0000-000000000007','Site Preparation & Seawall',1,'2017-04-30','2017-04-25',true,false),
  ('b2000000-0000-0000-0000-000000000006','c1000000-0000-0000-0000-000000000007','Foundations — All 6 Villas',2,'2017-10-31','2017-10-28',true,false),
  ('b2000000-0000-0000-0000-000000000006','c1000000-0000-0000-0000-000000000007','Structural Frames',3,'2018-06-30','2018-07-05',true,false),
  ('b2000000-0000-0000-0000-000000000006','c1000000-0000-0000-0000-000000000009','Hurricane Glazing & Facades',4,'2018-11-30','2018-11-25',true,false),
  ('b2000000-0000-0000-0000-000000000006','c1000000-0000-0000-0000-000000000003','MEP & Smart Home Systems',5,'2019-01-31','2019-01-28',true,false),
  ('b2000000-0000-0000-0000-000000000006','c1000000-0000-0000-0000-000000000005','Luxury Finishes, Pools & Landscaping',6,'2019-03-31','2019-03-28',true,false),
  -- Paynes Bay Private Estate (2018-2019)
  ('b2000000-0000-0000-0000-000000000007','c1000000-0000-0000-0000-000000000002','Site Enabling & Pool Excavation',1,'2018-07-31','2018-07-25',true,false),
  ('b2000000-0000-0000-0000-000000000007','c1000000-0000-0000-0000-000000000002','Foundations & Substructure',2,'2018-10-31','2018-10-28',true,false),
  ('b2000000-0000-0000-0000-000000000007','c1000000-0000-0000-0000-000000000001','Structural Frame',3,'2019-03-31','2019-04-02',true,false),
  ('b2000000-0000-0000-0000-000000000007','c1000000-0000-0000-0000-000000000006','Roofing & Hurricane Envelope',4,'2019-07-31','2019-07-28',true,false),
  ('b2000000-0000-0000-0000-000000000007','c1000000-0000-0000-0000-000000000005','Premium Interiors & Handover',5,'2019-12-31','2019-12-20',true,false),
  -- Sunset Isle Boutique Resort (2018-2021)
  ('b2000000-0000-0000-0000-000000000008','c1000000-0000-0000-0000-000000000007','Marine Survey & Site Prep',1,'2018-12-31','2018-12-28',true,false),
  ('b2000000-0000-0000-0000-000000000008','c1000000-0000-0000-0000-000000000007','Foundations & Seawall Works',2,'2019-06-30','2019-06-25',true,false),
  ('b2000000-0000-0000-0000-000000000008','c1000000-0000-0000-0000-000000000007','Structural Frame — Main Building',3,'2019-12-31','2020-01-05',true,false),
  ('b2000000-0000-0000-0000-000000000008','c1000000-0000-0000-0000-000000000003','MEP — Full Resort Systems',4,'2020-07-31','2020-08-05',true,false),
  ('b2000000-0000-0000-0000-000000000008','c1000000-0000-0000-0000-000000000005','Resort Interiors & FF&E',5,'2020-12-31','2021-01-10',true,false),
  ('b2000000-0000-0000-0000-000000000008','c1000000-0000-0000-0000-000000000011','Landscaping, Pools & Beach Area',6,'2021-03-31','2021-03-25',true,false),
  -- Naparima Tower (2022-2024)
  ('b2000000-0000-0000-0000-000000000012','c1000000-0000-0000-0000-000000000010','Piling & Deep Foundations',1,'2022-08-31','2022-08-25',true,false),
  ('b2000000-0000-0000-0000-000000000012','c1000000-0000-0000-0000-000000000010','Ground Slab & Core Walls',2,'2022-12-31','2022-12-28',true,false),
  ('b2000000-0000-0000-0000-000000000012','c1000000-0000-0000-0000-000000000010','Structural Frame Floors 1–8',3,'2023-07-31','2023-07-25',true,false),
  ('b2000000-0000-0000-0000-000000000012','c1000000-0000-0000-0000-000000000009','Facade & Curtain Wall',4,'2023-10-31','2023-10-28',true,false),
  ('b2000000-0000-0000-0000-000000000012','c1000000-0000-0000-0000-000000000003','MEP & Data Infrastructure',5,'2023-12-31','2024-01-05',true,false),
  ('b2000000-0000-0000-0000-000000000012','c1000000-0000-0000-0000-000000000005','Office Fit-Out & Commissioning',6,'2024-01-31','2024-01-25',true,false)
on conflict do nothing;

-- ────────────────────────────────────────────────────────────
-- PERMITS — Historical projects
-- ────────────────────────────────────────────────────────────
insert into permits (project_id, island, title, authority, submitted_date, approved_date, expiry_date, status, sequence_order) values
  -- Sandy Lane Villa
  ('b2000000-0000-0000-0000-000000000001','BRB','Planning Application','Town & Country Planning Dept','2012-11-01','2013-02-15','2015-02-15','approved',1),
  ('b2000000-0000-0000-0000-000000000001','BRB','Building Permit','Barbados Standards Institution','2013-02-20','2013-03-01','2015-03-01','approved',2),
  ('b2000000-0000-0000-0000-000000000001','BRB','Occupancy Certificate','Barbados Standards Institution','2014-06-25','2014-07-02',null,'approved',3),
  -- West Bay Residence
  ('b2000000-0000-0000-0000-000000000002','KYD','Class A Planning Permission','Planning Department','2013-08-01','2013-11-15','2016-11-15','approved',1),
  ('b2000000-0000-0000-0000-000000000002','KYD','Building Permit','Planning Department','2014-01-10','2014-02-01','2016-02-01','approved',2),
  ('b2000000-0000-0000-0000-000000000002','KYD','Certificate of Occupancy','Planning Department','2015-04-20','2015-05-01',null,'approved',3),
  -- Holetown Heritage Estate
  ('b2000000-0000-0000-0000-000000000003','BRB','Planning Application','Town & Country Planning Dept','2014-10-01','2015-01-20','2018-01-20','approved',1),
  ('b2000000-0000-0000-0000-000000000003','BRB','CZMU Coastal Approval','Coastal Zone Management Unit','2014-11-01','2015-01-30','2018-01-30','approved',2),
  ('b2000000-0000-0000-0000-000000000003','BRB','Building Permit','Barbados Standards Institution','2015-02-01','2015-02-15','2018-02-15','approved',3),
  -- Seven Mile Beach Villas
  ('b2000000-0000-0000-0000-000000000006','KYD','Class A Planning — 6 Villas','Planning Department','2016-07-01','2016-10-15','2020-10-15','approved',1),
  ('b2000000-0000-0000-0000-000000000006','KYD','DOE Coastal Zone Licence','Department of Environment','2016-08-01','2016-11-01','2020-11-01','approved',2),
  ('b2000000-0000-0000-0000-000000000006','KYD','Building Permit — All Villas','Planning Department','2016-12-01','2017-01-15','2021-01-15','approved',3),
  -- Sunset Isle Resort
  ('b2000000-0000-0000-0000-000000000008','KYD','Class A Planning — Resort','Planning Department','2018-01-15','2018-05-20','2023-05-20','approved',1),
  ('b2000000-0000-0000-0000-000000000008','KYD','DOE Environmental Permit','Department of Environment','2018-02-01','2018-06-01','2023-06-01','approved',2),
  ('b2000000-0000-0000-0000-000000000008','KYD','Building Permit — Main Resort','Planning Department','2018-07-01','2018-09-01','2023-09-01','approved',3),
  -- Naparima Tower
  ('b2000000-0000-0000-0000-000000000012','TTD','EMA CEC — Commercial High-Rise','Environmental Management Authority','2022-01-15','2022-04-01','2027-04-01','approved',1),
  ('b2000000-0000-0000-0000-000000000012','TTD','TCPD Development Approval','Town & Country Planning Div.','2022-02-01','2022-04-10','2027-04-10','approved',2),
  ('b2000000-0000-0000-0000-000000000012','TTD','Building Permit','TCPD','2022-04-15','2022-05-01','2027-05-01','approved',3),
  ('b2000000-0000-0000-0000-000000000012','TTD','Certificate of Occupancy','TCPD','2024-01-15','2024-02-01',null,'approved',4)
on conflict do nothing;

-- ────────────────────────────────────────────────────────────
-- CHANGE ORDERS — Historical projects
-- ────────────────────────────────────────────────────────────
insert into change_orders (project_id, contractor_id, co_number, title, description, raised_by, value_usd, schedule_impact_days, status) values
  -- Sandy Lane Villa
  ('b2000000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000001','CO-001-SLV','Pool pavilion addition','Owner requested addition of poolside pavilion with outdoor kitchen post-contract.','Richardson Private Holdings',42000,12,'approved'),
  -- Holetown Heritage Estate
  ('b2000000-0000-0000-0000-000000000003','c1000000-0000-0000-0000-000000000002','CO-001-HHE','Unforeseen basement rock excavation','Rock stratum encountered at 2.5m requiring blasting. Unforeseeable site condition.','Site Engineer',68000,10,'approved'),
  ('b2000000-0000-0000-0000-000000000003','c1000000-0000-0000-0000-000000000005','CO-002-HHE','Home cinema room upgrade','Basement cinema room upgraded to full Dolby Atmos spec per owner request.','Bajan Heritage Holdings',95000,5,'approved'),
  -- Seven Mile Beach Villas
  ('b2000000-0000-0000-0000-000000000006','c1000000-0000-0000-0000-000000000007','CO-001-SMB','Infinity pools — all 6 villas','Client upgraded all villas from standard pool to infinity edge specification.','Cayman Luxury Estates Ltd',340000,21,'approved'),
  ('b2000000-0000-0000-0000-000000000006','c1000000-0000-0000-0000-000000000009','CO-002-SMB','Hurricane shutter upgrade','Post-Hurricane Irma specification upgrade to PGT WinGuard throughout.','Project Manager',128000,7,'approved'),
  -- Sunset Isle Resort
  ('b2000000-0000-0000-0000-000000000008','c1000000-0000-0000-0000-000000000007','CO-001-SIR','Overwater bungalow addition','Client added 4 overwater bungalow suites to original scope.','Sunset Isle Resorts',920000,45,'approved'),
  ('b2000000-0000-0000-0000-000000000008','c1000000-0000-0000-0000-000000000003','CO-002-SIR','Solar microgrid & desalination plant','Full off-grid capability added per DOE coastal sustainability requirement.','Sunset Isle Resorts',380000,20,'approved'),
  -- Naparima Tower
  ('b2000000-0000-0000-0000-000000000012','c1000000-0000-0000-0000-000000000010','CO-001-NTP','Floor plate extension — Level 5','Tenant pre-let requirement increased floor 5 plate by 400sqm.','Naparima Group',280000,14,'approved'),
  ('b2000000-0000-0000-0000-000000000012','c1000000-0000-0000-0000-000000000003','CO-002-NTP','Data centre floor fitout — Level 7','Full data centre fitout including raised flooring, precision cooling, UPS.','Naparima Group',620000,0,'approved')
on conflict do nothing;

-- ────────────────────────────────────────────────────────────
-- SITE LOGS — Historical projects (sample entries)
-- ────────────────────────────────────────────────────────────
insert into site_logs (project_id, log_date, day_number, workers_on_site, weather, work_performed, safety_status) values
  -- Sandy Lane Villa key log entries
  ('b2000000-0000-0000-0000-000000000001','2013-07-10',72,18,'clear','Foundation concrete pour completed. Substructure to DPC level. Inspector sign-off obtained.','clear'),
  ('b2000000-0000-0000-0000-000000000001','2013-12-05',214,22,'partly_cloudy','Structural frame complete. Ridge beam lifted and connected. Roof plate complete. Client inspection.','clear'),
  ('b2000000-0000-0000-0000-000000000001','2014-06-20',450,14,'clear','Final snagging complete. Occupancy certificate received. Keys handed to client. Project closed.','clear'),
  -- Seven Mile Beach Villas key entries
  ('b2000000-0000-0000-0000-000000000006','2017-10-28',294,38,'clear','All 6 villa foundations complete. Structural engineer sign-off obtained. Quality audit passed.','clear'),
  ('b2000000-0000-0000-0000-000000000006','2018-07-05',537,48,'clear','Structural frames for all 6 villas complete. Client and structural engineer inspection — both approved.','clear'),
  ('b2000000-0000-0000-0000-000000000006','2019-03-28',797,28,'clear','Final punchlist complete. All 6 villas handed over. Client extremely satisfied. Strongest review ever received.','clear'),
  -- Sunset Isle Resort key entries
  ('b2000000-0000-0000-0000-000000000008','2019-01-05',488,52,'clear','Main building structural frame complete. Photo documentation archived. Client site visit — positive feedback.','clear'),
  ('b2000000-0000-0000-0000-000000000008','2020-08-05',730,68,'overcast','MEP commissioning complete for main resort building. All systems tested and certified. HVAC balancing done.','minor'),
  ('b2000000-0000-0000-0000-000000000008','2021-03-25',929,32,'clear','Soft opening preparation complete. Final inspection passed. Resort handed to operator. Project closed with 3% overrun.','clear'),
  -- Naparima Tower key entries
  ('b2000000-0000-0000-0000-000000000012','2022-08-25',141,42,'clear','Piling complete — all 84 piles to design depth. Load tests passed. Structural sign-off obtained.','clear'),
  ('b2000000-0000-0000-0000-000000000012','2023-07-25',476,88,'clear','Full structural frame complete — 8 floors. Client inspection with Naparima Group board members. Milestone celebrated.','clear'),
  ('b2000000-0000-0000-0000-000000000012','2024-01-25',639,45,'clear','Final commissioning and handover. Certificate of Occupancy received. Tower officially open. Project complete.','clear')
on conflict do nothing;

-- ────────────────────────────────────────────────────────────
-- RISKS — Historical projects (resolved)
-- Shows risk management history in project detail
-- ────────────────────────────────────────────────────────────
insert into risks (project_id, title, description, category, likelihood, impact, mitigation, is_resolved, resolved_at) values
  ('b2000000-0000-0000-0000-000000000003','Hurricane Ivan — Schedule Risk','Active hurricane season during roofing phase. Risk to envelope timeline Aug-Oct 2016.','environmental',3,4,'All roofing work accelerated and completed by July 31. Site secured protocol activated.',true,'2016-08-01'),
  ('b2000000-0000-0000-0000-000000000006','Cayman labour shortage — Peak 2018','Unprecedented demand for skilled trades in 2018 Cayman construction boom. Risk to frame schedule.','contractor',3,3,'Premium rates agreed with Cayman Structural Engineering. Additional crew mobilised from BRB.',true,'2018-09-01'),
  ('b2000000-0000-0000-0000-000000000008','COVID-19 construction stoppage','Government-mandated construction halt March-June 2020. Impact to 90 working days on resort.','regulatory',5,5,'Government extension to permit granted. Programme rebaselined. No cost impact to client (force majeure).',true,'2020-07-01'),
  ('b2000000-0000-0000-0000-000000000012','TTD import duty escalation 2023','Government increased import duty on construction materials from 15% to 25% mid-project.','financial',4,3,'Accelerated procurement of remaining materials before duty increase effective date. Saved ~$180K.',true,'2023-08-01')
on conflict do nothing;

-- ────────────────────────────────────────────────────────────
-- DOCUMENTS — Historical projects (investor-visible)
-- ────────────────────────────────────────────────────────────
insert into documents (project_id, title, type, access_level, version, description) values
  ('b2000000-0000-0000-0000-000000000001','Sandy Lane Villa — Completion Certificate','permit','investors','1.0','Certificate of occupancy issued July 2014. Final building compliance confirmed.'),
  ('b2000000-0000-0000-0000-000000000003','Holetown Heritage Estate — Project Completion Report','report','investors','1.0','Final project summary. On budget, 5 days early. Client satisfaction score 9.4/10.'),
  ('b2000000-0000-0000-0000-000000000006','Seven Mile Beach Villas — Handover Package','report','investors','1.0','Full handover documentation. All 6 villas completed and occupied March 2019.'),
  ('b2000000-0000-0000-0000-000000000008','Sunset Isle Resort — Completion Summary','report','investors','1.0','Resort completed March 2021. 3% budget overrun due to overwater bungalow additions (client-initiated COs).'),
  ('b2000000-0000-0000-0000-000000000012','Naparima Tower — Project Closeout Report','report','investors','1.0','18-floor commercial tower. Delivered January 2024. $280K final overrun (client-initiated scope additions).'),
  -- Active project investor-visible documents
  ('b1000000-0000-0000-0000-000000000001','Coral Ridge Estate — Q3 2024 Progress Report','report','investors','1.0','82% complete. On schedule for November 2024 handover. Budget tracking well.'),
  ('b1000000-0000-0000-0000-000000000002','Cayman Blue Resort — Q3 2024 Progress Report','report','investors','1.0','61% complete. Programme on track. Pool and glazing phases in progress.'),
  ('b1000000-0000-0000-0000-000000000003','Montego Bay Villas — Q3 2024 Progress Report','report','investors','1.0','44% complete. Structural frame progressing. 8-villa development on schedule.'),
  ('b1000000-0000-0000-0000-000000000004','Port of Spain HQ — Q3 2024 Progress Report','report','investors','1.0','18% complete. Piling works progressing. Some permit delays being managed.'),
  ('b1000000-0000-0000-0000-000000000005','Holetown Mixed-Use — Q3 2024 Progress Report','report','investors','1.0','8% complete. Enabling works done. EIA under CZMU review — main permit pending.')
on conflict do nothing;

-- ────────────────────────────────────────────────────────────
-- PAYMENTS — Remaining historical projects
-- ────────────────────────────────────────────────────────────
insert into payments (project_id, title, amount_usd, due_date, paid_date, status) values
  -- Holetown Heritage Estate
  ('b2000000-0000-0000-0000-000000000003','Mobilisation',480000,'2015-02-15','2015-02-18','paid'),
  ('b2000000-0000-0000-0000-000000000003','Foundation Complete',960000,'2015-09-01','2015-08-30','paid'),
  ('b2000000-0000-0000-0000-000000000003','Structural Frame',1200000,'2016-04-01','2016-04-05','paid'),
  ('b2000000-0000-0000-0000-000000000003','MEP & Services',1440000,'2016-09-01','2016-09-05','paid'),
  ('b2000000-0000-0000-0000-000000000003','Practical Completion',720000,'2016-11-30','2016-11-26','paid'),
  -- Blue Mountain Eco Lodge 1
  ('b2000000-0000-0000-0000-000000000004','Mobilisation',280000,'2015-06-15','2015-06-18','paid'),
  ('b2000000-0000-0000-0000-000000000004','Structures Complete',840000,'2016-07-01','2016-07-05','paid'),
  ('b2000000-0000-0000-0000-000000000004','Practical Completion',1680000,'2016-10-31','2016-10-28','paid'),
  -- Paynes Bay Private Estate
  ('b2000000-0000-0000-0000-000000000007','Mobilisation',620000,'2018-04-15','2018-04-18','paid'),
  ('b2000000-0000-0000-0000-000000000007','Foundation Complete',1240000,'2018-11-01','2018-10-30','paid'),
  ('b2000000-0000-0000-0000-000000000007','Structural Frame',1860000,'2019-04-15','2019-04-18','paid'),
  ('b2000000-0000-0000-0000-000000000007','Practical Completion',2480000,'2019-12-31','2019-12-22','paid'),
  -- Port Royal Waterfront Offices
  ('b2000000-0000-0000-0000-000000000010','Mobilisation',560000,'2021-03-15','2021-03-18','paid'),
  ('b2000000-0000-0000-0000-000000000010','Structural Complete',1680000,'2022-01-01','2022-01-05','paid'),
  ('b2000000-0000-0000-0000-000000000010','Practical Completion',3360000,'2022-10-31','2022-11-02','paid'),
  -- St James Mixed-Use
  ('b2000000-0000-0000-0000-000000000011','Mobilisation',880000,'2022-01-15','2022-01-18','paid'),
  ('b2000000-0000-0000-0000-000000000011','Shell & Core Complete',2640000,'2022-12-01','2022-12-05','paid'),
  ('b2000000-0000-0000-0000-000000000011','Practical Completion',5280000,'2023-06-30','2023-07-03','paid'),
  -- Blue Mountain Phase 2
  ('b2000000-0000-0000-0000-000000000009','Mobilisation',410000,'2020-02-15','2020-02-18','paid'),
  ('b2000000-0000-0000-0000-000000000009','Lodge Structures Complete',1640000,'2020-12-01','2020-12-05','paid'),
  ('b2000000-0000-0000-0000-000000000009','Practical Completion',2050000,'2021-11-30','2021-11-25','paid')
on conflict do nothing;

-- Done. Every project now has full milestone, payment, permit, CO, site log, and document data.
-- The investor portal project detail page (/investor/[id]) will display all of this richly.
