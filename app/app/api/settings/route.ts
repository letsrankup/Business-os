// File: app/api/settings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { getUserUsageStats } from "@/lib/rateLimit";

// GET: Fetch user profile + usage stats
export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError && profileError.code !== "PGRST116") throw profileError;

    // Get AI usage stats
    const usageStats = await getUserUsageStats(supabase, user.id);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: profile?.full_name ?? null,
        company: profile?.company ?? null,
        website: profile?.website ?? null,
        plan: profile?.plan ?? "free",
        avatar: profile?.avatar_url ?? null,
        createdAt: user.created_at,
      },
      usage: usageStats,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH: Update user profile
export async function PATCH(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { fullName, company, website, avatarUrl } = body;

    const { data, error: upsertError } = await supabase
      .from("user_profiles")
      .upsert({
        id: user.id,
        full_name: fullName ?? null,
        company: company ?? null,
        website: website ?? null,
        avatar_url: avatarUrl ?? null,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (upsertError) throw upsertError;

    return NextResponse.json({ profile: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
        }
