import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const isTest = process.env.NODE_ENV === "test";

const supabaseUrl = isTest
  ? process.env.SUPABASE_URL!
  : process.env.EXPO_PUBLIC_SUPABASE_URL!;

const supabaseKey = isTest
  ? process.env.SUPABASE_ANON_KEY!
  : process.env.EXPO_PUBLIC_SUPABASE_KEY!;

export const supabase = createClient(
  supabaseUrl,
  supabaseKey,
  {
    auth: {
      storage: isTest ? undefined : AsyncStorage,
      autoRefreshToken: !isTest,
      persistSession: !isTest,
      detectSessionInUrl: false,
    },
  }
);