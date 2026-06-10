// File: lib/rateLimit.ts
// Per-user AI usage limits stored in Supabase
// Plans: free | pro | enterprise

import { SupabaseClient } from "@supabase/supabase-js";

export type FeatureKey =
  | "seo_audit"
  | "content_ai"
  | "proposal"
  | "competitor_ai"
  | "ai_chat"
  | "leads_ai"
  | "invoice_ai";

// ─── Plan limits ───────────────────────────────────────────────────────────────
// daily = max calls per day | monthly = max calls per month | null = unlimited
export const PLAN_LIMITS: Record<
  string,
  Record<FeatureKey, { daily: number | null; monthly: number | null }>
> = {
  free: {
    seo_audit:     { daily: 3,    monthly: 20 },
    content_ai:    { daily: 5,    monthly: 30 },
    proposal:      { daily: 3,    monthly: 15 },
    competitor_ai: { daily: 2,    monthly: 10 },
    ai_chat:       { daily: 20,   monthly: 200 },
    leads_ai:      { daily: 5,    monthly: 30 },
    invoice_ai:    { daily: 5,    monthly: 30 },
  },
  pro: {
    seo_audit:     { daily: 20,   monthly: 200 },
    content_ai:    { daily: 50,   monthly: 500 },
    proposal:      { daily: 20,   monthly: 200 },
    competitor_ai: { daily: 15,   monthly: 150 },
    ai_chat:       { daily: 200,  monthly: 2000 },
    leads_ai:      { daily: 50,   monthly: 500 },
    invoice_ai:    { daily: 50,   monthly: 500 },
  },
  enterprise: {
    seo_audit:     { daily: null, monthly: null },
    content_ai:    { daily: null, monthly: null },
    proposal:      { daily: null, monthly: null },
    competitor_ai: { daily: null, monthly: null },
    ai_chat:       { daily: null, monthly: null },
    leads_ai:      { daily: null, monthly: null },
    invoice_ai:    { daily: null, monthly: null },
  },
};

// ─── Check + increment usage ───────────────────────────────────────────────────
export async function checkAndIncrementUsage(
  supabase: SupabaseClient,
  userId: string,
  feature: FeatureKey
): Promise<{ allowed: boolean; reason?: string; remaining?: { daily: number | null; monthly: number | null } }> {
  // 1. Get user plan
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("plan")
    .eq("id", userId)
    .single();

  const plan = (profile?.plan ?? "free") as string;
  const limits = PLAN_LIMITS[plan]?.[feature] ?? PLAN_LIMITS.free[feature];

  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const thisMonth = today.substring(0, 7); // YYYY-MM

  // 2. Get current usage
  const { data: usage } = await supabase
    .from("ai_usage")
    .select("*")
    .eq("user_id", userId)
    .eq("feature", feature)
    .single();

  const currentDaily = usage?.daily_count ?? 0;
  const currentMonthly = usage?.monthly_count ?? 0;
  const lastDay = usage?.last_day ?? "";
  const lastMonth = usage?.last_month ?? "";

  // Reset daily if new day
  const resetDaily = lastDay !== today;
  // Reset monthly if new month
  const resetMonthly = lastMonth !== thisMonth;

  const effectiveDaily = resetDaily ? 0 : currentDaily;
  const effectiveMonthly = resetMonthly ? 0 : currentMonthly;

  // 3. Check limits
  if (limits.daily !== null && effectiveDaily >= limits.daily) {
    return {
      allowed: false,
      reason: `Daily limit reached (${limits.daily} calls/day). Upgrade to Pro for more.`,
      remaining: { daily: 0, monthly: limits.monthly ? limits.monthly - effectiveMonthly : null },
    };
  }

  if (limits.monthly !== null && effectiveMonthly >= limits.monthly) {
    return {
      allowed: false,
      reason: `Monthly limit reached (${limits.monthly} calls/month). Upgrade to Pro for more.`,
      remaining: { daily: 0, monthly: 0 },
    };
  }

  // 4. Upsert incremented usage
  await supabase.from("ai_usage").upsert(
    {
      user_id: userId,
      feature,
      daily_count: effectiveDaily + 1,
      monthly_count: effectiveMonthly + 1,
      last_day: today,
      last_month: thisMonth,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,feature" }
  );

  const remainingDaily = limits.daily !== null ? limits.daily - (effectiveDaily + 1) : null;
  const remainingMonthly = limits.monthly !== null ? limits.monthly - (effectiveMonthly + 1) : null;

  return { allowed: true, remaining: { daily: remainingDaily, monthly: remainingMonthly } };
}

// ─── Get usage stats (for settings/dashboard) ─────────────────────────────────
export async function getUserUsageStats(supabase: SupabaseClient, userId: string) {
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("plan")
    .eq("id", userId)
    .single();

  const plan = (profile?.plan ?? "free") as string;

  const { data: usageRows } = await supabase
    .from("ai_usage")
    .select("*")
    .eq("user_id", userId);

  const today = new Date().toISOString().split("T")[0];
  const thisMonth = today.substring(0, 7);

  const stats: Record<string, any> = {};
  const features = Object.keys(PLAN_LIMITS.free) as FeatureKey[];

  for (const feature of features) {
    const row = usageRows?.find((r) => r.feature === feature);
    const limits = PLAN_LIMITS[plan]?.[feature] ?? PLAN_LIMITS.free[feature];

    const daily = row?.last_day === today ? (row?.daily_count ?? 0) : 0;
    const monthly = row?.last_month === thisMonth ? (row?.monthly_count ?? 0) : 0;

    stats[feature] = {
      daily: { used: daily, limit: limits.daily },
      monthly: { used: monthly, limit: limits.monthly },
    };
  }

  return { plan, stats };
                    }
