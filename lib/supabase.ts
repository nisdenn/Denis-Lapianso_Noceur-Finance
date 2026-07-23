import { createClient } from '@supabase/supabase-js';

// We fall back to empty strings during build time to avoid Next.js errors,
// but the actual client needs valid URLs at runtime.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-key';

if (process.env.NODE_ENV !== 'production' && (!supabaseUrl || !supabaseKey)) {
  console.warn('Supabase URL or Key is missing. Check your environment variables.');
}

// Since we are doing server-side operations and managing users manually right now,
// using the service role key is preferred if available.
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});
