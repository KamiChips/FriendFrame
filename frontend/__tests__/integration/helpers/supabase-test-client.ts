import "../../../__tests__/integration/helpers/setup";
import { createClient } from "@supabase/supabase-js";

export const supabaseTest = createClient(
    process.env.EXPO_PUBLIC_SUPABASE_URL!,
    process.env.EXPO_PUBLIC_SUPABASE_KEY!
);

// Cliente admin para limpiar datos
export const supabaseAdmin = createClient(
    process.env.EXPO_PUBLIC_SUPABASE_URL!,
    process.env.EXPO_PUBLIC_SUPABASE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);