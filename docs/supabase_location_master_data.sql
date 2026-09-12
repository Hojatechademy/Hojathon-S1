-- =====================================================================
-- Ente Ward (എന്റെ വാർഡ്) - Prototype Kerala Location Dataset
-- Authoritative State -> District -> Grama Panchayat -> Ward Hierarchy
-- =====================================================================

-- 1. DISTRICTS TABLE
CREATE TABLE IF NOT EXISTS public.districts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_ml TEXT,
  code TEXT UNIQUE NOT NULL,
  state TEXT NOT NULL DEFAULT 'Kerala',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. GRAMA PANCHAYATS TABLE
CREATE TABLE IF NOT EXISTS public.gram_panchayats (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_ml TEXT,
  code TEXT,
  district_id TEXT NOT NULL REFERENCES public.districts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. WARDS TABLE
CREATE TABLE IF NOT EXISTS public.wards (
  id TEXT PRIMARY KEY,
  ward_number INTEGER NOT NULL,
  name TEXT,
  local_body_name TEXT,
  gram_panchayat_id TEXT REFERENCES public.gram_panchayats(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gram_panchayats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access for districts" ON public.districts;
CREATE POLICY "Public read access for districts" ON public.districts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read access for gram_panchayats" ON public.gram_panchayats;
CREATE POLICY "Public read access for gram_panchayats" ON public.gram_panchayats FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read access for wards" ON public.wards;
CREATE POLICY "Public read access for wards" ON public.wards FOR SELECT USING (true);

-- 5. SEED: PROTOTYPE KERALA DISTRICTS
INSERT INTO public.districts (id, name, name_ml, code, state) VALUES
  ('dist-pkd', 'Palakkad', 'പാലക്കാട്', 'PKD', 'Kerala'),
  ('dist-ekm', 'Ernakulam', 'എറണാകുളം', 'EKM', 'Kerala')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  name_ml = EXCLUDED.name_ml;

-- 6. SEED: PROTOTYPE GRAMA PANCHAYATS
INSERT INTO public.gram_panchayats (id, name, name_ml, code, district_id) VALUES
  -- Palakkad District
  ('gp-kulukkallur', 'Kulukkallur', 'കുലുക്കല്ലൂർ', 'G09001', 'dist-pkd'),
  ('gp-ongallur', 'Ongallur', 'ഓങ്ങല്ലൂർ', 'G09002', 'dist-pkd'),
  ('gp-koppam', 'Koppam', 'കൊപ്പാം', 'G09003', 'dist-pkd'),
  ('gp-alathur', 'Alathur', 'ആലത്തൂർ', 'G09004', 'dist-pkd'),

  -- Ernakulam District
  ('gp-kuttampuzha', 'Kuttampuzha', 'കുട്ടമ്പുഴ', 'G07001', 'dist-ekm')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  name_ml = EXCLUDED.name_ml;

-- 7. SEED: PROTOTYPE DELIMITATION WARDS (No invented names; ward names NULL)
-- Kulukkallur: Wards 1–19
INSERT INTO public.wards (id, ward_number, name, local_body_name, gram_panchayat_id)
SELECT 
  'ward-kulukkallur-' || LPAD(s.i::text, 2, '0'),
  s.i,
  NULL,
  'കുലുക്കല്ലൂർ ഗ്രാമപഞ്ചായത്ത് (Kulukkallur GP)',
  'gp-kulukkallur'
FROM generate_series(1, 19) AS s(i)
ON CONFLICT (id) DO NOTHING;

-- Ongallur: Wards 1–24
INSERT INTO public.wards (id, ward_number, name, local_body_name, gram_panchayat_id)
SELECT 
  'ward-ongallur-' || LPAD(s.i::text, 2, '0'),
  s.i,
  NULL,
  'ഓങ്ങല്ലൂർ ഗ്രാമപഞ്ചായത്ത് (Ongallur GP)',
  'gp-ongallur'
FROM generate_series(1, 24) AS s(i)
ON CONFLICT (id) DO NOTHING;

-- Koppam: Wards 1–20
INSERT INTO public.wards (id, ward_number, name, local_body_name, gram_panchayat_id)
SELECT 
  'ward-koppam-' || LPAD(s.i::text, 2, '0'),
  s.i,
  NULL,
  'കൊപ്പാം ഗ്രാമപഞ്ചായത്ത് (Koppam GP)',
  'gp-koppam'
FROM generate_series(1, 20) AS s(i)
ON CONFLICT (id) DO NOTHING;

-- Alathur: Wards 1–18
INSERT INTO public.wards (id, ward_number, name, local_body_name, gram_panchayat_id)
SELECT 
  'ward-alathur-' || LPAD(s.i::text, 2, '0'),
  s.i,
  NULL,
  'ആലത്തൂർ ഗ്രാമപഞ്ചായത്ത് (Alathur GP)',
  'gp-alathur'
FROM generate_series(1, 18) AS s(i)
ON CONFLICT (id) DO NOTHING;

-- Kuttampuzha: Wards 1–17
INSERT INTO public.wards (id, ward_number, name, local_body_name, gram_panchayat_id)
SELECT 
  'ward-kuttampuzha-' || LPAD(s.i::text, 2, '0'),
  s.i,
  NULL,
  'കുട്ടമ്പുഴ ഗ്രാമപഞ്ചായത്ത് (Kuttampuzha GP)',
  'gp-kuttampuzha'
FROM generate_series(1, 17) AS s(i)
ON CONFLICT (id) DO NOTHING;
