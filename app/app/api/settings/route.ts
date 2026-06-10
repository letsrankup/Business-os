// app/api/settings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { checkRateLimit, getClientId } from "@/lib/rateLimit";

// GET - Fetch user settings
export async function GET(req: NextRequest) {
  const clientId = getClientId(req.headers);
  const rateLimit = checkRateLimit(`settings-get:${clientId}`, { max: 30 });
  if (!rateLimit.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const supabase = createClient();
    if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", user.id)
      .single();

    // Return defaults if no settings exist yet
    if (error?.code === "PGRST116") {
      return NextResponse.json({
        success: true,
        data: {
          user_id: user.id,
          business_name: "",
          business_email: user.email || "",
          business_phone: "",
          business_address: {},
          logo_url: null,
          invoice_prefix: "INV",
          invoice_counter: 1,
          default_currency: "USD",
          default_tax_rate: 0,
          ai_preferences: {
            preferred_model: "qwen/qwen3-coder:free",
            tone: "professional",
            language: "English",
          },
          notifications: {
            email_new_lead: true,
            email_invoice_paid: true,
            email_proposal_viewed: true,
          },
        },
        isNew: true,
      });
    }

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Settings GET error:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

// POST/PUT - Create or update settings
export async function POST(req: NextRequest) {
  const clientId = getClientId(req.headers);
  const rateLimit = checkRateLimit(`settings-post:${clientId}`, { max: 10 });
  if (!rateLimit.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const supabase = createClient();
    if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();

    // Remove fields that shouldn't be updated by user
    const { id: _id, user_id: _uid, created_at: _ca, ...updateData } = body;

    const { data, error } = await supabase
      .from("user_settings")
      .upsert({
        ...updateData,
        user_id: user.id,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data, message: "Settings saved" });
  } catch (error) {
    console.error("Settings POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save settings" },
      { status: 500 }
    );
  }
}

// PATCH - Partial update
export async function PATCH(req: NextRequest) {
  const clientId = getClientId(req.headers);
  const rateLimit = checkRateLimit(`settings-patch:${clientId}`, { max: 20 });
  if (!rateLimit.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const supabase = createClient();
    if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { id: _id, user_id: _uid, created_at: _ca, ...updateData } = body;

    const { data, error } = await supabase
      .from("user_settings")
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      // If no row exists, create one
      if (error.code === "PGRST116") {
        const { data: newData, error: insertError } = await supabase
          .from("user_settings")
          .insert({ ...updateData, user_id: user.id })
          .select()
          .single();

        if (insertError) throw insertError;
        return NextResponse.json({ success: true, data: newData });
      }
      throw error;
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Settings PATCH error:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
