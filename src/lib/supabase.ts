import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type StorageEntry = {
  id: string;
  name: string;
  content: string;
  sender_id: string;
  created_at: string;
  updated_at: string;
};
