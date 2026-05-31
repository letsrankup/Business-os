import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Single client instance
export function createClient() {
  return createSupabaseClient(supabaseUrl, supabaseKey);
}

export const supabase = createSupabaseClient(supabaseUrl, supabaseKey);
