import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import {
  EXPO_PUBLIC_SUPABASE_ANON_KEY,
  EXPO_PUBLIC_SUPABASE_URL,
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
} from '@env';

const supabaseUrl = SUPABASE_URL || EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = SUPABASE_ANON_KEY || EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase env config. Set SUPABASE_URL and SUPABASE_ANON_KEY in .env.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    detectSessionInUrl: false,
    persistSession: true,
    storage: AsyncStorage,
  },
});
