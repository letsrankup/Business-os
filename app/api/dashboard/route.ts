// app/api/dashboard/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { checkRateLimit, getClientId, getRateLimitHeaders } from "@/lib/rateLimit";

export async function GET(req: NextRequest) {
  // Rate limit
  const clientId = getClientId(req.headers);
  const rateLimit = checkRateLimit(`dashboard:${clientId}`, { max: 30 });
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: getRateLimitHeaders(rateLimit) }
    );
  }

  try {
    const supabase = createClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;

    // Parallel queries for performance
    const [
      leadsResult,
      proposalsResult,
      invoicesResult,
      recentLeadsResult,
    ] = await Promise.all([
      // Lead stats
      supabase
        .from("leads")
        .select("status, score", { count: "exact" })
        .eq("user_id", userId),

      // Proposal stats
      supabase
        .from("proposals")
        .select("status, total_amount", { count: "exact" })
        .eq("user_id", userId),

      // Invoice stats
      supabase
        .from("invoices")
        .select("status, total_amount")
        .eq("user_id", userId),

      // Recent leads
      supabase
        .from("leads")
        .select("id, name, company, status, score, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    // Process leads stats
    const leads = leadsResult.data || [];
    const leadsStats = {
      total: leads.length,
      new: leads.filter((l) => l.status === "new").length,
      qualified: leads.filter((l) => l.status === "qualified").length,
      won: leads.filter((l) => l.status === "won").length,
      avgScore: leads.length
        ? Math.round(leads.reduce((sum, l) => sum + (l.score || 0), 0) / leads.length)
        : 0,
    };

    // Process proposals stats
    const proposals = proposalsResult.data || [];
    const proposalsStats = {
      total: proposals.length,
      draft: proposals.filter((p) => p.status === "draft").length,
      sent: proposals.filter((p) => p.status === "sent").length,
      accepted: proposals.filter((p) => p.status === "accepted").length,
      totalValue: proposals.reduce((sum, p) => sum + (Number(p.total_amount) || 0), 0),
    };

    // Process invoice stats
    const invoices = invoicesResult.data || [];
    const invoicesStats = {
      total: invoices.length,
      paid: invoices.filter((i) => i.status === "paid").length,
      pending: invoices.filter((i) => i.status === "sent").length,
      overdue: invoices.filter((i) => i.status === "overdue").length,
      totalRevenue: invoices
        .filter((i) => i.status === "paid")
        .reduce((sum, i) => sum + (Number(i.total_amount) || 0), 0),
      pendingRevenue: invoices
        .filter((i) => i.status !== "paid" && i.status !== "cancelled")
        .reduce((sum, i) => sum + (Number(i.total_amount) || 0), 0),
    };

    return NextResponse.json(
      {
        success: true,
        data: {
          leads: leadsStats,
          proposals: proposalsStats,
          invoices: invoicesStats,
          recentLeads: recentLeadsResult.data || [],
        },
      },
      { headers: getRateLimitHeaders(rateLimit) }
    );
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
      }
