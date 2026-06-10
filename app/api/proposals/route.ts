// app/api/proposals/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { callOpenRouter } from "@/lib/openrouter";
import { checkRateLimit, getClientId, getRateLimitHeaders } from "@/lib/rateLimit";

// GET - Fetch proposals
export async function GET(req: NextRequest) {
  const clientId = getClientId(req.headers);
  const rateLimit = checkRateLimit(`proposals-get:${clientId}`, { max: 30 });
  if (!rateLimit.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const supabase = createClient();
    if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);

    let query = supabase
      .from("proposals")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status) query = query.eq("status", status);

    const { data, count, error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, data, total: count });
  } catch (error) {
    console.error("Proposals GET error:", error);
    return NextResponse.json({ error: "Failed to fetch proposals" }, { status: 500 });
  }
}

// POST - Create or AI-generate proposal
export async function POST(req: NextRequest) {
  const clientId = getClientId(req.headers);
  const rateLimit = checkRateLimit(`proposals-post:${clientId}`, { max: 10, windowMs: 60_000 });
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: getRateLimitHeaders(rateLimit) }
    );
  }

  try {
    const supabase = createClient();
    if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { action, ...proposalData } = body;

    // AI Generate Proposal
    if (action === "generate") {
      const { clientName, projectType, budget, description, currency = "USD" } = body;

      if (!clientName || !projectType) {
        return NextResponse.json(
          { error: "clientName and projectType are required" },
          { status: 400 }
        );
      }

      const aiResult = await callOpenRouter(
        [
          {
            role: "user",
            content: `Create a professional business proposal with the following details:
Client: ${clientName}
Project Type: ${projectType}
Budget: ${budget ? `${currency} ${budget}` : "To be discussed"}
Description: ${description || "Not provided"}

Return ONLY valid JSON (no markdown):
{
  "title": "<proposal title>",
  "executive_summary": "<2-3 paragraph executive summary>",
  "scope_of_work": ["<deliverable 1>", "<deliverable 2>", ...],
  "timeline": [
    {"phase": "<phase name>", "duration": "<duration>", "deliverables": ["<item>"]}
  ],
  "pricing": [
    {"item": "<service/item>", "description": "<details>", "quantity": <number>, "unit_price": <number>}
  ],
  "total_amount": <total number>,
  "terms": "<payment and project terms>",
  "next_steps": "<call to action>"
}`,
          },
        ],
        {
          system: "You are a professional business proposal writer. Create compelling, detailed proposals. Return valid JSON only.",
          temperature: 0.6,
          max_tokens: 2500,
        }
      );

      let content: Record<string, unknown> = {};
      let totalAmount = 0;
      try {
        const cleaned = aiResult.content.replace(/```json|```/g, "").trim();
        content = JSON.parse(cleaned);
        totalAmount = Number(content.total_amount) || 0;
      } catch {
        content = { raw: aiResult.content };
      }

      const { data, error } = await supabase
        .from("proposals")
        .insert({
          user_id: user.id,
          title: (content.title as string) || `Proposal for ${clientName}`,
          client_name: clientName,
          status: "draft",
          content,
          total_amount: totalAmount,
          currency,
          ai_generated: true,
        })
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({
        success: true,
        data,
        model: aiResult.model,
      }, { status: 201 });
    }

    // Manual create
    const { title, client_name } = proposalData;
    if (!title || !client_name) {
      return NextResponse.json({ error: "title and client_name are required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("proposals")
      .insert({ ...proposalData, user_id: user.id })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error("Proposals POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create proposal" },
      { status: 500 }
    );
  }
}

// PATCH - Update proposal
export async function PATCH(req: NextRequest) {
  try {
    const supabase = createClient();
    if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: "Proposal ID required" }, { status: 400 });

    const { data, error } = await supabase
      .from("proposals")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Proposals PATCH error:", error);
    return NextResponse.json({ error: "Failed to update proposal" }, { status: 500 });
  }
}

// DELETE
export async function DELETE(req: NextRequest) {
  try {
    const supabase = createClient();
    if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Proposal ID required" }, { status: 400 });

    const { error } = await supabase
      .from("proposals")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;
    return NextResponse.json({ success: true, message: "Proposal deleted" });
  } catch (error) {
    console.error("Proposals DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete proposal" }, { status: 500 });
  }
                                            }
