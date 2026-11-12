-- =====================================================================
-- HumidiSense — Supabase setup
-- Run this whole file in Supabase > SQL Editor. Safe to re-run.
-- Your tables stay exactly as they are (plain "password" column, no hashing).
-- =====================================================================

-- 1. Tables (skipped if they already exist)
CREATE TABLE IF NOT EXISTS public.admin_accounts (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE TABLE IF NOT EXISTS public.sensor_readings (
  id SERIAL PRIMARY KEY,
  rain_percent INTEGER NOT NULL,
  temperature NUMERIC NOT NULL,
  humidity NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Faster "latest readings" queries for the dashboard
CREATE INDEX IF NOT EXISTS sensor_readings_created_at_idx
  ON public.sensor_readings (created_at DESC);

-- 2. Default admin account (change the password!)
INSERT INTO public.admin_accounts (username, password)
VALUES ('admin', 'admin123')
ON CONFLICT (username) DO NOTHING;

-- 3. Row Level Security
ALTER TABLE public.admin_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sensor_readings ENABLE ROW LEVEL SECURITY;

-- admin_accounts: NOT readable from the browser (so passwords can't be listed).
-- The website logs in through admin_login() below instead.
DROP POLICY IF EXISTS "Allow public read admin accounts" ON public.admin_accounts;

-- sensor_readings: dashboard can read
DROP POLICY IF EXISTS "Allow public read sensor readings" ON public.sensor_readings;
CREATE POLICY "Allow public read sensor readings"
  ON public.sensor_readings
  FOR SELECT
  USING (true);

-- sensor_readings: ESP32 inserts with the ANON key
DROP POLICY IF EXISTS "Allow service role inserts" ON public.sensor_readings;
DROP POLICY IF EXISTS "Allow device inserts" ON public.sensor_readings;
CREATE POLICY "Allow device inserts"
  ON public.sensor_readings
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (rain_percent BETWEEN 0 AND 100);

GRANT SELECT, INSERT ON public.sensor_readings TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.sensor_readings_id_seq TO anon, authenticated;

-- 4. Login function — checks username + password on the server
DROP FUNCTION IF EXISTS public.admin_login(TEXT, TEXT);
CREATE FUNCTION public.admin_login(p_username TEXT, p_password TEXT)
RETURNS TABLE (id INTEGER, username TEXT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.id, a.username
  FROM public.admin_accounts a
  WHERE a.username = p_username
    AND a.password = p_password;
$$;

REVOKE ALL ON FUNCTION public.admin_login(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_login(TEXT, TEXT) TO anon, authenticated;

-- =====================================================================
-- Useful snippets
-- =====================================================================
-- Change a password:
--   UPDATE public.admin_accounts SET password = 'NEW_PASSWORD' WHERE username = 'admin';
--
-- Add another admin:
--   INSERT INTO public.admin_accounts (username, password) VALUES ('staff1', 'their_password');
