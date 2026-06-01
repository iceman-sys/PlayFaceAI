import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseKey) {
  console.warn('[SWAARM] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.local');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export { supabase };