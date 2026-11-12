import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL || 'https://wkcofzeivrmarwhskvjr.supabase.co'
const anon =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrY29memVpdnJtYXJ3aHNrdmpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ0NjAwNzgsImV4cCI6MjExMDAzNjA3OH0.CjAVTfwizremCRPVnjZ2wa6CvPcHOV27JkOVzoPM070'

export const supabase = createClient(url, anon, {
  auth: { persistSession: false },
})

export const READINGS_TABLE = 'sensor_readings'

/** Turn Supabase errors into a clear message, especially when the SQL setup was not run yet. */
export function friendlyError(error: { message?: string; code?: string } | null): string {
  if (!error) return ''
  const msg = error.message ?? 'Request failed'
  if (error.code === 'PGRST202' || /admin_login/.test(msg))
    return 'Database is not set up yet. Run supabase/schema.sql in the Supabase SQL Editor.'
  if (error.code === '42501' || /permission denied/i.test(msg))
    return 'No permission to read the data. Run supabase/schema.sql in the Supabase SQL Editor.'
  if (error.code === '42P01' || /does not exist/i.test(msg))
    return 'The sensor_readings table was not found. Run supabase/schema.sql in the Supabase SQL Editor.'
  if (/Failed to fetch|NetworkError/i.test(msg))
    return 'Cannot reach Supabase. Check your internet connection and the URL in .env.'
  return msg
}
