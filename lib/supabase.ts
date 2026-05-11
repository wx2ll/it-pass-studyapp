import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!

// Anon key — safe for public reads (SELECT with RLS)
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
export const supabase = createClient(supabaseUrl, anonKey)

// Service role key — bypasses RLS, for server-side writes only
// NEVER use this in client-side code or NEXT_PUBLIC_ variables
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
export const supabaseAdmin = createClient(supabaseUrl, serviceKey)
