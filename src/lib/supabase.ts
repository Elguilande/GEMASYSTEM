import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qmipfevipigfrztjkqdf.supabase.co';
const supabaseAnonKey = 'sb_publishable_Q83UbI-yq-pF6RSbxP-nkw_--wZeiVZ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type StorageEntry = {
  id: string;
  name: string;
  content: string;
  sender_id: string;
  created_at: string;
  updated_at: string;
};

export type User = {
  id: string;
  email: string;
  user_metadata?: {
    email?: string;
  };
};
