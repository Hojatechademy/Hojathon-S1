-- =====================================================================
-- Ente Ward (എന്റെ വാർഡ്) - Ward Contacts & Government Contact Directory
-- =====================================================================

-- 1. WARD CONTACTS TABLE (Ward-specific, managed by representative, visible only to ward residents)
CREATE TABLE IF NOT EXISTS public.ward_contacts (
  id TEXT PRIMARY KEY,
  ward_id TEXT NOT NULL REFERENCES public.wards(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  designation TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  description TEXT,
  created_by TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup by ward_id
CREATE INDEX IF NOT EXISTS idx_ward_contacts_ward ON public.ward_contacts(ward_id);

-- 2. GOVERNMENT CONTACTS TABLE (Common global Kerala directory, readable by all authenticated users)
CREATE TABLE IF NOT EXISTS public.government_contacts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  designation TEXT NOT NULL,
  department TEXT,
  level TEXT NOT NULL, -- 'minister', 'district_collector', 'senior_official', 'secretariat'
  district TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  description TEXT,
  source_name TEXT DEFAULT 'Kerala Government — Official Contact Directory',
  source_url TEXT,
  last_verified TEXT DEFAULT '2026-09-12',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for filtering by level and district
CREATE INDEX IF NOT EXISTS idx_gov_contacts_level ON public.government_contacts(level);
CREATE INDEX IF NOT EXISTS idx_gov_contacts_district ON public.government_contacts(district);

-- 3. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.ward_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.government_contacts ENABLE ROW LEVEL SECURITY;

-- Government Contacts: Read-only for all authenticated users; write restricted to admin
DROP POLICY IF EXISTS "Authenticated users can read government contacts" ON public.government_contacts;
CREATE POLICY "Authenticated users can read government contacts" 
  ON public.government_contacts FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Admins can manage government contacts" ON public.government_contacts;
CREATE POLICY "Admins can manage government contacts" 
  ON public.government_contacts FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Ward Contacts: 
-- 1) Residents & Representatives can only read contacts for their assigned ward
DROP POLICY IF EXISTS "Users can view contacts of their own ward" ON public.ward_contacts;
CREATE POLICY "Users can view contacts of their own ward" 
  ON public.ward_contacts FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.ward_memberships 
      WHERE ward_memberships.user_id = auth.uid() 
      AND ward_memberships.ward_id = ward_contacts.ward_id
    )
  );

-- 2) Representatives can create contacts ONLY for their assigned ward
DROP POLICY IF EXISTS "Representatives can insert contacts for their own ward" ON public.ward_contacts;
CREATE POLICY "Representatives can insert contacts for their own ward" 
  ON public.ward_contacts FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ward_memberships 
      JOIN public.profiles ON profiles.id = auth.uid()
      WHERE ward_memberships.user_id = auth.uid() 
      AND ward_memberships.ward_id = ward_contacts.ward_id
      AND profiles.role = 'representative'
    )
  );

-- 3) Representatives can update/delete their own ward contacts
DROP POLICY IF EXISTS "Representatives can update contacts of their own ward" ON public.ward_contacts;
CREATE POLICY "Representatives can update contacts of their own ward" 
  ON public.ward_contacts FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.ward_memberships 
      JOIN public.profiles ON profiles.id = auth.uid()
      WHERE ward_memberships.user_id = auth.uid() 
      AND ward_memberships.ward_id = ward_contacts.ward_id
      AND profiles.role = 'representative'
    )
  );

DROP POLICY IF EXISTS "Representatives can delete contacts of their own ward" ON public.ward_contacts;
CREATE POLICY "Representatives can delete contacts of their own ward" 
  ON public.ward_contacts FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.ward_memberships 
      JOIN public.profiles ON profiles.id = auth.uid()
      WHERE ward_memberships.user_id = auth.uid() 
      AND ward_memberships.ward_id = ward_contacts.ward_id
      AND profiles.role = 'representative'
    )
  );

-- =====================================================================
-- 4. SEED: KERALA GOVERNMENT OFFICIAL CONTACT DIRECTORY (From Official PDF)
-- Total records: 46 (21 Ministers, 14 Collectors, 8 Senior Officials, 3 Secretariat)
-- =====================================================================

INSERT INTO public.government_contacts 
(id, name, designation, department, level, district, phone, email, description, source_name, last_verified)
VALUES
-- SECTION 1: COUNCIL OF MINISTERS — 2026 (21 Ministers)
('gov-min-01', 'V. D. Satheesan', 'Chief Minister', 'Finance; Planning & Economic Affairs; General Administration; Law; Information & Public Relations; etc.', 'minister', NULL, NULL, NULL, 'Chief Minister of Kerala', 'Kerala Government — Official Contact Directory', '2026-09-12'),
('gov-min-02', 'P. K. Kunhalikutty', 'Minister', 'Industries & Commerce; IT; AI; Startups; Mining & Geology; Handlooms & Textiles', 'minister', NULL, '9947020200', NULL, 'Minister for Industries & Commerce, IT', 'Kerala Government — Official Contact Directory', '2026-09-12'),
('gov-min-03', 'Ramesh Chennithala', 'Minister', 'Home; Vigilance; Fire & Rescue; Prisons; Coir', 'minister', NULL, '9447777100', NULL, 'Minister for Home & Vigilance', 'Kerala Government — Official Contact Directory', '2026-09-12'),
('gov-min-04', 'Sunny Joseph', 'Minister', 'Electricity; Environment; Parliamentary Affairs; ANERT', 'minister', NULL, '9447046694', NULL, 'Minister for Electricity & Environment', 'Kerala Government — Official Contact Directory', '2026-09-12'),
('gov-min-05', 'K. Muraleedharan', 'Minister', 'Health; Medical Education; Medical University; AYUSH; Food Safety; Devaswoms', 'minister', NULL, '9495305555', NULL, 'Minister for Health & Devaswoms', 'Kerala Government — Official Contact Directory', '2026-09-12'),
('gov-min-06', 'Mons Joseph', 'Minister', 'Irrigation; CADA; Ground Water; Water Supply & Sanitation; Housing', 'minister', NULL, '9447306270', NULL, 'Minister for Irrigation & Water Supply', 'Kerala Government — Official Contact Directory', '2026-09-12'),
('gov-min-07', 'Shibu Baby John', 'Minister', 'Forests & Wildlife; Skill Development; KASE', 'minister', NULL, '9539393333', NULL, 'Minister for Forests, Wildlife & Skills', 'Kerala Government — Official Contact Directory', '2026-09-12'),
('gov-min-08', 'Anoop Jacob', 'Minister', 'Food & Civil Supplies; Consumer Affairs; Legal Metrology', 'minister', NULL, '9847069671', NULL, 'Minister for Food & Civil Supplies', 'Kerala Government — Official Contact Directory', '2026-09-12'),
('gov-min-09', 'C. P. John', 'Minister', 'Road Transport; Motor Vehicles; Water Transport', 'minister', NULL, '9447303653', NULL, 'Minister for Transport', 'Kerala Government — Official Contact Directory', '2026-09-12'),
('gov-min-10', 'A. P. Anilkumar', 'Minister', 'Land Revenue; Survey & Land Records; Land Reforms', 'minister', NULL, NULL, NULL, 'Minister for Revenue', 'Kerala Government — Official Contact Directory', '2026-09-12'),
('gov-min-11', 'N. Samsudheen', 'Minister', 'General Education; Literacy; Wakf & Hajj; Minority Welfare', 'minister', NULL, NULL, NULL, 'Minister for General Education & Minority Welfare', 'Kerala Government — Official Contact Directory', '2026-09-12'),
('gov-min-12', 'P. C. Vishnunadh', 'Minister', 'Tourism; Culture; KSFDC; Chalachithra Academy; Cultural Activist Welfare', 'minister', NULL, NULL, NULL, 'Minister for Tourism & Culture', 'Kerala Government — Official Contact Directory', '2026-09-12'),
('gov-min-13', 'Roji M. John', 'Minister', 'Collegiate & Technical Education; Universities; Entrance Examination; NCC; ASAP Kerala', 'minister', NULL, '9971392134', NULL, 'Minister for Higher Education', 'Kerala Government — Official Contact Directory', '2026-09-12'),
('gov-min-14', 'Bindhu Krishna', 'Minister', 'Labour; Animal Husbandry; Dairy Development; Women & Child Development; Factories & Boilers; etc.', 'minister', NULL, '9447191515', NULL, 'Minister for Labour & Women and Child Development', 'Kerala Government — Official Contact Directory', '2026-09-12'),
('gov-min-15', 'M. Liju', 'Minister', 'Co-operation; Excise', 'minister', NULL, '9446344957', NULL, 'Minister for Co-operation & Excise', 'Kerala Government — Official Contact Directory', '2026-09-12'),
('gov-min-16', 'K. M. Shaji', 'Minister', 'Panchayat; Municipality; Corporation; Town Planning; Rural Development; KILA', 'minister', NULL, NULL, NULL, 'Minister for LSGD & Local Self Government', 'Kerala Government — Official Contact Directory', '2026-09-12'),
('gov-min-17', 'P. K. Basheer', 'Minister', 'Public Works Department', 'minister', NULL, NULL, NULL, 'Minister for Public Works (PWD)', 'Kerala Government — Official Contact Directory', '2026-09-12'),
('gov-min-18', 'V. E. Abdul Gafoor', 'Minister', 'Fisheries; Harbour Engineering; Social Justice', 'minister', NULL, NULL, NULL, 'Minister for Fisheries & Social Justice', 'Kerala Government — Official Contact Directory', '2026-09-12'),
('gov-min-19', 'T. Siddique', 'Minister', 'Agriculture; Soil Survey & Soil Conservation; Kerala Agricultural University; Warehousing', 'minister', NULL, NULL, NULL, 'Minister for Agriculture', 'Kerala Government — Official Contact Directory', '2026-09-12'),
('gov-min-20', 'K. A. Thulasi', 'Minister', 'Development of SC, ST & Backward Classes', 'minister', NULL, NULL, NULL, 'Minister for SC/ST Development', 'Kerala Government — Official Contact Directory', '2026-09-12'),
('gov-min-21', 'O. J. Janeesh', 'Minister', 'Sports; Youth Affairs; Zoos; Museums; Registration; Archaeology; Archives', 'minister', NULL, NULL, NULL, 'Minister for Sports, Registration & Archives', 'Kerala Government — Official Contact Directory', '2026-09-12'),

-- SECTION 2: DISTRICT COLLECTORS — ALL 14 DISTRICTS (14 Collectors)
('gov-col-01', 'Anu Kumari IAS', 'District Collector', 'District Administration', 'district_collector', 'Thiruvananthapuram', '0471-2731177 / 0471-2731166 (F)', NULL, 'Office of the District Collector, Thiruvananthapuram', 'Kerala Government — Official Contact Directory', '2026-09-12'),
('gov-col-02', 'Anie Jula Thomas IAS', 'District Collector', 'District Administration', 'district_collector', 'Kollam', '0474-2794900', NULL, 'Office of the District Collector, Kollam', 'Kerala Government — Official Contact Directory', '2026-09-12'),
('gov-col-03', 'Shaji V Nair IAS', 'District Collector', 'District Administration', 'district_collector', 'Alappuzha', '0477-2251720', NULL, 'Office of the District Collector, Alappuzha', 'Kerala Government — Official Contact Directory', '2026-09-12'),
('gov-col-04', 'Nizamudeen A IAS', 'District Collector', 'District Administration', 'district_collector', 'Pathanamthitta', '0468-2222505', NULL, 'Office of the District Collector, Pathanamthitta', 'Kerala Government — Official Contact Directory', '2026-09-12'),
('gov-col-05', 'Chetan Kumar Meena IAS', 'District Collector', 'District Administration', 'district_collector', 'Kottayam', '0481-2562001', NULL, 'Office of the District Collector, Kottayam', 'Kerala Government — Official Contact Directory', '2026-09-12'),
('gov-col-06', 'Priyanka G IAS', 'District Collector', 'District Administration', 'district_collector', 'Ernakulam', '0484-2423001', NULL, 'Office of the District Collector, Ernakulam', 'Kerala Government — Official Contact Directory', '2026-09-12'),
('gov-col-07', 'Dinesan Cheruvat IAS', 'District Collector', 'District Administration', 'district_collector', 'Idukki', '0486-2233103', NULL, 'Office of the District Collector, Idukki', 'Kerala Government — Official Contact Directory', '2026-09-12'),
('gov-col-08', 'Sikha Surendran IAS', 'District Collector', 'District Administration', 'district_collector', 'Thrissur', '0487-2361020', NULL, 'Office of the District Collector, Thrissur', 'Kerala Government — Official Contact Directory', '2026-09-12'),
('gov-col-09', 'Sudhir K IAS', 'District Collector', 'District Administration', 'district_collector', 'Palakkad', '0491-2505266', NULL, 'Office of the District Collector, Palakkad', 'Kerala Government — Official Contact Directory', '2026-09-12'),
('gov-col-10', 'Vinay Goyal IAS', 'District Collector', 'District Administration', 'district_collector', 'Malappuram', '0483-2734355', NULL, 'Office of the District Collector, Malappuram', 'Kerala Government — Official Contact Directory', '2026-09-12'),
('gov-col-11', 'Madhavikutty M.S', 'District Collector', 'District Administration', 'district_collector', 'Kozhikode', '0495-2371400', NULL, 'Office of the District Collector, Kozhikode', 'Kerala Government — Official Contact Directory', '2026-09-12'),
('gov-col-12', 'Meghashree D R IAS', 'District Collector', 'District Administration', 'district_collector', 'Wayanad', '0493-6202230', NULL, 'Office of the District Collector, Wayanad', 'Kerala Government — Official Contact Directory', '2026-09-12'),
('gov-col-13', 'Vishnuraj P IAS', 'District Collector', 'District Administration', 'district_collector', 'Kannur', '0497-2700243', NULL, 'Office of the District Collector, Kannur', 'Kerala Government — Official Contact Directory', '2026-09-12'),
('gov-col-14', 'Arjun Pandian IAS', 'District Collector', 'District Administration', 'district_collector', 'Kasaragod', '0499-4256400', NULL, 'Office of the District Collector, Kasaragod', 'Kerala Government — Official Contact Directory', '2026-09-12'),

-- SECTION 3: SENIOR GOVERNMENT OFFICIALS (8 Officials)
('gov-off-01', 'Bishwanath Sinha IAS', 'Chief Secretary', 'General Administration', 'senior_official', NULL, '0471-2333147 / 0471-2518181', 'chiefsecy@kerala.gov.in', 'Chief Secretary to Government of Kerala', 'Kerala Government — Official Contact Directory', '2026-09-12'),
('gov-off-02', 'Biju K IAS', 'Secretary, General Administration Department', 'General Administration Department', 'senior_official', NULL, '0471-2320311 / 0471-2518010', 'secy.gad@kerala.gov.in', 'Secretary, GAD', 'Kerala Government — Official Contact Directory', '2026-09-12'),
('gov-off-03', 'Rajesh G R', 'Additional Secretary, All India Services', 'General Administration Department', 'senior_official', NULL, '0471-2518269', NULL, 'Additional Secretary, AIS', 'Kerala Government — Official Contact Directory', '2026-09-12'),
('gov-off-04', 'Anil Johney', 'Additional Secretary, Coordination/Attendance Monitoring', 'General Administration Department', 'senior_official', NULL, '0471-2517023', NULL, 'Additional Secretary, Coordination', 'Kerala Government — Official Contact Directory', '2026-09-12'),
('gov-off-05', 'Santhosh Kumar R', 'Additional Secretary, Accounts Division/Cash', 'General Administration Department', 'senior_official', NULL, '0471-2518766', NULL, 'Additional Secretary, Accounts', 'Kerala Government — Official Contact Directory', '2026-09-12'),
('gov-off-06', 'Seena A N', 'Additional Secretary, House Keeping Cell', 'General Administration Department', 'senior_official', NULL, '0471-2333276 / 0471-2518759', NULL, 'Additional Secretary, House Keeping', 'Kerala Government — Official Contact Directory', '2026-09-12'),
('gov-off-07', 'Geetha S', 'Additional Secretary & Joint Chief Protocol Officer', 'General Administration Department', 'senior_official', NULL, '0471-2518203', NULL, 'Additional Secretary & Joint Chief Protocol Officer', 'Kerala Government — Official Contact Directory', '2026-09-12'),
('gov-off-08', 'Latheesh S Dharan', 'Deputy Secretary, Services A/D/E/H', 'General Administration Department', 'senior_official', NULL, '0471-2518735', NULL, 'Deputy Secretary, Services', 'Kerala Government — Official Contact Directory', '2026-09-12'),

-- SECTION 4: KEY SECRETARIAT CONTACT (3 Contacts)
('gov-sec-01', 'Kerala Government Secretariat Exchange / PABX', 'Central Secretariat Exchange', 'General Administration', 'secretariat', NULL, '0471-2336576', NULL, 'Government Secretariat Central Telephone Exchange', 'Kerala Government — Official Contact Directory', '2026-09-12'),
('gov-sec-02', 'General Administration Department', 'Department Secretariat Office', 'General Administration Department', 'secretariat', NULL, '0471-2320311 / 0471-2518010', NULL, 'Official Office of General Administration Department', 'Kerala Government — Official Contact Directory', '2026-09-12'),
('gov-sec-03', 'Information & Public Relations Department', 'Official Public Relations', 'Information & Public Relations Department', 'secretariat', NULL, '0471-2327782 / 0471-2518443', NULL, 'Official Public Relations Department (I&PRD)', 'Kerala Government — Official Contact Directory', '2026-09-12')

ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  designation = EXCLUDED.designation,
  department = EXCLUDED.department,
  phone = EXCLUDED.phone,
  email = EXCLUDED.email,
  description = EXCLUDED.description,
  last_verified = EXCLUDED.last_verified;
