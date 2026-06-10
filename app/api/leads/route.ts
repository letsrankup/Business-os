// app/api/leads/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { callOpenRouter } from "@/lib/openrouter";
import { checkRateLimit, getClientId, getRateLimitHeaders } from "@/lib/rateLimit";

// GET - Fetch all leads
export async function GET(req: NextRequest) {
  const clientId = getClientId(req.headers);
  const rateLimit = checkRateLimit(`leads-get:${clientId}`, { max: 30 });
  if (!rateLimit.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const supabase = createClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const page = parseInt(searchParams.get("page") || "1");
    const offset = (page - 1) * limit;

    let query = supabase
      .from("leads")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq("status", status);

    const { data, count, error } = await query;
    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      pagination: { total: count || 0, page, limit, pages: Math.ceil((count || 0) / limit) },
    });
  } catch (error) {
    console.error("Leads GET error:", error);
    return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 });
  }
}

// POST - Create lead or AI discover leads
export async function POST(req: NextRequest) {
  const clientId = getClientId(req.headers);
  const rateLimit = checkRateLimit(`leads-post:${clientId}`, { max: 15 });
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

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, ...leadData } = body;

    // AI Lead Discovery
    if (action === "discover") {
      const { industry, location, keywords, count = 10 } = body;

      if (!industry) {
        return NextResponse.json({ error: "Industry is required for lead discovery" }, { status: 400 });
      }

      const aiResult = await callOpenRouter(
        [
          {
            role: "user",
            content: `Generate ${Math.min(count, 15)} realistic potential business leads for:
Industry: ${industry}
Location: ${location || "Any"}
Keywords: ${keywords || "general"}

Return ONLY a JSON array (no markdown) with this structure:
[
  {
    "name": "<contact name>",
    "company": "<company name>",
    "email": "<realistic email>",
    "phone": "<phone number>",
    "website": "<company website>",
    "status": "new",
    "score": <number 60-95>,
    "source": "ai_discovery",
    "notes": "<why this is a good lead>",
    "tags": ["<tag1>", "<tag2>"]
  }
]`,
          },
        ],
        {
          system: "You are a business development expert. Generate realistic, detailed business leads. Always return valid JSON array only.",
          temperature: 0.8,
          max_tokens: 2000,
        }
      );

      let discoveredLeads: any[] = [];
      try {
        const cleaned = aiResult.content.replace(/```json|```/g, "").trim();
        discoveredLeads = JSON.parse(cleaned);
        if (!Array.isArray(discoveredLeads)) throw new Error("Not an array");
      } catch {
        return NextResponse.json({ error: "AI failed to generate leads. Please try again." }, { status: 500 });
      }

      // Insert all discovered leads
      const leadsToInsert = discoveredLeads.map((lead) => ({
        ...lead,
        user_id: user.id,
        ai_summary: `AI discovered lead for ${industry} in ${location || "any location"}`,
      }));

      const { data: insertedLeads, error: insertError } = await supabase
        .from("leads")
        .insert(leadsToInsert)
        .select();

      if (insertError) throw insertError;

      return NextResponse.json({
        success: true,
        message: `Discovered ${insertedLeads?.length || 0} leads`,
        data: insertedLeads,
        model: aiResult.model,
      });
    }

    // Create single lead
    const { name, email, company } = leadData;
    if (!name) {
      return NextResponse.json({ error: "Lead name is required" }, { status: 400 });
    }

    // AI score the lead
    let aiScore = leadData.score || 50;
    let aiSummary = "";
    try {
      const scoreResult = await callOpenRouter(
        [
          {
            role: "user",
            content: `Score this lead from 0-100 and provide a brief summary.
Name: ${name}
Company: ${company || "Unknown"}
Email: ${email || "Not provided"}
Notes: ${leadData.notes || "None"}

Return JSON only: {"score": <0-100>, "summary": "<2 sentences>"}`,
          },
        ],
        { temperature: 0.3, max_tokens: 200 }
      );
      const parsed = JSON.parse(scoreResult.content.replace(/```json|```/g, "").trim());
      aiScore = parsed.score || 50;
      aiSummary = parsed.summary || "";
    } catch {
      // Use default score if AI fails
    }

    const { data, error } = await supabase
      .from("leads")
      .insert({ ...leadData, user_id: user.id, score: aiScore, ai_summary: aiSummary })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error("Leads POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create lead" },
      { status: 500 }
    );
  }
}

// PATCH - Update lead
export async function PATCH(req: NextRequest) {
  try {
    const supabase = createClient();
    if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: "Lead ID is required" }, { status: 400 });

    const { data, error } = await supabase
      .from("leads")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Leads PATCH error:", error);
    return NextResponse.json({ error: "Failed to update lead" }, { status: 500 });
  }
}

// DELETE - Delete lead
export async function DELETE(req: NextRequest) {
  try {
    const supabase = createClient();
    if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Lead ID is required" }, { status: 400 });

    const { error } = await supabase
      .from("leads")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;
    return NextResponse.json({ success: true, message: "Lead deleted" });
  } catch (error) {
    console.error("Leads DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete lead" }, { status: 500 });
  }
            }
