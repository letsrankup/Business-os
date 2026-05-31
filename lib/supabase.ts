import { createClient as createSupabaseInstance } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// ─── Browser Client Instance ──────────────────────────────────
export const supabase = createSupabaseInstance(supabaseUrl, supabaseKey);

// ─── Sign Up Function ─────────────────────────────────────────
export async function signUp(email: string, password: string, fullName: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
  if (error) throw new Error(error.message);
  return data;
}

// ─── Sign In Function ─────────────────────────────────────────
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw new Error(error.message);
  return data;
}

// ─── Google Login Function ────────────────────────────────────
export async function signInWithGoogle() {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/dashboard` },
  });
  if (error) throw new Error(error.message);
  return data;
}

// ─── Sign Out Function ────────────────────────────────────────
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

// ─── Get Current User Function ────────────────────────────────
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// ─── Reset Password Function ──────────────────────────────────
export async function resetPassword(email: string) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/reset-password`,
  });
  if (error) throw new Error(error.message);
}

// ─── Dynamic Client Helper (Important Fallback) ───────────────
export function createClient() {
  return createSupabaseInstance(supabaseUrl, supabaseKey);
    }
