// File: app/api/dashboard/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;

    // Parallel fetch all stats
    const [audits, leads, proposals, clients, revenue, recentActivity] = await Promise.all([
      supabase.from("seo_audits").select("id", { count: "exact" }).eq("user_id", userId),
      supabase.from("leads").select("id", { count: "exact" }).eq("user_id", userId),
      supabase.from("proposals").select("id", { count: "exact" }).eq("user_id", userId),
      supabase.from("clients").select("id", { count: "exact" }).eq("user_id", userId).eq("status", "active"),
      supabase.from("invoices").select("amount").eq("user_id", userId).eq("status", "paid"),
      supabase
        .from("activity_logs")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    const totalRevenue = (revenue.data ?? []).reduce((sum, inv) => sum + (inv.amount ?? 0), 0);

    return NextResponse.json({
      stats: {
        seoAuditsRun: audits.count ?? 0,
        leadsDiscovered: leads.count ?? 0,
        proposalsSent: proposals.count ?? 0,
        activeClients: clients.count ?? 0,
        estimatedRevenue: totalRevenue,
        contentGenerated: 0, // extend with content table if needed
      },
      recentActivity: recentActivity.data ?? [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
        }
