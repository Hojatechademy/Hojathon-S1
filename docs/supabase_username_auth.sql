-- ====================================================================
-- ENTE WARD — EMERGENCY USERNAME + PASSWORD AUTHENTICATION MIGRATION
-- ====================================================================

-- 1. ADD USERNAME COLUMN TO PROFILES
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;

-- 2. CASE-INSENSITIVE UNIQUE INDEX
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_lower_username ON public.profiles (LOWER(username));

-- 3. ENSURE EMAIL COLUMN EXISTS IN PROFILES FOR INTERNAL IDENTITY MAPPING
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- 4. ASSOCIATE EXISTING ADMIN ACCOUNT WITH USERNAME 'admin'
UPDATE public.profiles
SET username = 'admin', role = 'admin'
WHERE email = 'mshibin042@gmail.com' 
   OR role = 'admin'
   OR id IN (SELECT id FROM auth.users WHERE email = 'mshibin042@gmail.com');

-- 5. RLS POLICIES ALLOWING USERNAMES TO BE RESOLVED SAFELY
CREATE POLICY IF NOT EXISTS "Allow public username lookup for authentication"
ON public.profiles FOR SELECT
TO anon, authenticated
USING (true);
