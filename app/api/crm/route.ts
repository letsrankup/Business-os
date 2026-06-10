// app/api/crm/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { callOpenRouter } from "@/lib/openrouter";
import { checkRateLimit, getClientId, getRateLimitHeaders } from "@/lib/rateLimit";

// GET - Fetch contacts or activities
export async function GET(req: NextRequest) {
  const clientId = getClientId(req.headers);
  const rateLimit = checkRateLimit(`crm-get:${clientId}`, { max: 30 });
  if (!rateLimit.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const supabase = createClient();
    if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const resource = searchParams.get("resource") || "contacts"; // contacts | activities
    const search = searchParams.get("search");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const contactId = searchParams.get("contactId");

    if (resource === "activities") {
      let query = supabase
        .from("crm_activities")
        .select("*, crm_contacts(first_name, last_name, company)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (contactId) query = query.eq("contact_id", contactId);

      const { data, error } = await query;
      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }

    // Contacts
    let query = supabase
      .from("crm_contacts")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (search) {
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,company.ilike.%${search}%,email.ilike.%${search}%`
      );
    }

    const { data, count, error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, data, total: count });
  } catch (error) {
    console.error("CRM GET error:", error);
    return NextResponse.json({ error: "Failed to fetch CRM data" }, { status: 500 });
  }
}

// POST - Create contact, activity, or AI enrich contact
export async function POST(req: NextRequest) {
  const clientId = getClientId(req.headers);
  const rateLimit = checkRateLimit(`crm-post:${clientId}`, { max: 15 });
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
    const { action, resource = "contact" } = body;

    // AI Enrich Contact
    if (action === "enrich") {
      const { name, company, email, website } = body;

      const aiResult = await callOpenRouter(
        [
          {
            role: "user",
            content: `Enrich this business contact with additional insights:
Name: ${name || "Unknown"}
Company: ${company || "Unknown"}
Email: ${email || "Unknown"}
Website: ${website || "Unknown"}

Return ONLY valid JSON:
{
  "industry": "<likely industry>",
  "company_size": "<small/medium/large/enterprise>",
  "potential_needs": ["<need 1>", "<need 2>"],
  "communication_style": "<formal/casual/technical>",
  "best_outreach_time": "<suggestion>",
  "talking_points": ["<point 1>", "<point 2>"],
  "risk_level": "<low/medium/high>",
  "estimated_deal_size": "<small/medium/large>",
  "summary": "<2-3 sentence profile>"
}`,
          },
        ],
        { temperature: 0.5, max_tokens: 800 }
      );

      let enrichment: Record<string, unknown> = {};
      try {
        enrichment = JSON.parse(aiResult.content.replace(/```json|```/g, "").trim());
      } catch {
        enrichment = { summary: aiResult.content };
      }

      return NextResponse.json({ success: true, enrichment, model: aiResult.model });
    }

    // Create Activity
    if (resource === "activity") {
      const { contact_id, lead_id, type, title, description, scheduled_at } = body;
      if (!type || !title) {
        return NextResponse.json({ error: "type and title are required" }, { status: 400 });
      }

      const { data, error } = await supabase
        .from("crm_activities")
        .insert({ user_id: user.id, contact_id, lead_id, type, title, description, scheduled_at })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, data }, { status: 201 });
    }

    // Create Contact
    const { first_name } = body;
    if (!first_name) {
      return NextResponse.json({ error: "first_name is required" }, { status: 400 });
    }

    const { action: _action, resource: _resource, ...contactData } = body;

    const { data, error } = await supabase
      .from("crm_contacts")
      .insert({ ...contactData, user_id: user.id })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error("CRM POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create CRM record" },
      { status: 500 }
    );
  }
}

// PATCH - Update contact
export async function PATCH(req: NextRequest) {
  try {
    const supabase = createClient();
    if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { id, resource = "contact", ...updates } = body;
    if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

    const table = resource === "activity" ? "crm_activities" : "crm_contacts";

    const { data, error } = await supabase
      .from(table)
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("CRM PATCH error:", error);
    return NextResponse.json({ error: "Failed to update record" }, { status: 500 });
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
    const resource = searchParams.get("resource") || "contact";
    if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

    const table = resource === "activity" ? "crm_activities" : "crm_contacts";

    const { error } = await supabase
      .from(table)
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;
    return NextResponse.json({ success: true, message: "Record deleted" });
  } catch (error) {
    console.error("CRM DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete record" }, { status: 500 });
  }
                                             }
