
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Derived from: postgresql://postgres:[YOUR-PASSWORD]@db.mwtcpvucvqwqbsdlbrcn.supabase.co:5432/postgres
const DEFAULT_URL = 'https://mwtcpvucvqwqbsdlbrcn.supabase.co';

const supabaseUrl = (process.env as any).SUPABASE_URL || DEFAULT_URL;
const supabaseAnonKey = (process.env as any).SUPABASE_ANON_KEY;

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

/**
 * Initialize Supabase client.
 * Note: An Anon Key is still required via environment variables for successful connection.
 */
export const supabase: SupabaseClient = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null as any;

export const PROJECT_ID = 'mwtcpvucvqwqbsdlbrcn';
