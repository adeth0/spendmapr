import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create Supabase client with fallback for demo mode
export const supabase = createClient(
  supabaseUrl || 'https://demo.supabase.co',
  supabaseAnonKey || 'demo-anon-key'
);

export function isDemoMode() {
  return !supabaseUrl || !supabaseAnonKey || 
         supabaseUrl.includes('your-') || 
         supabaseAnonKey.includes('your-') ||
         supabaseUrl === 'https://demo.supabase.co';
}
