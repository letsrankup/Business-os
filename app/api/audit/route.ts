// File: app/api/audit/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";

// GET: List all audits for user
export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const page = parseInt(searchParams.get("page") ?? "1");
    const offset = (page - 1) * limit;

    const { data, count, error: dbError } = await supabase
      .from("seo_audits")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (dbError) throw dbError;

    return NextResponse.json({ audits: data, total: count, page, limit });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Create new audit
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { url, domain } = body;

    if (!url) return NextResponse.json({ error: "URL is required" }, { status: 400 });

    // Insert audit record with pending status
    const { data, error: insertError } = await supabase
      .from("seo_audits")
      .insert({
        user_id: user.id,
        url,
        domain: domain ?? new URL(url).hostname,
        status: "pending",
        score: null,
        results: null,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Log activity
    await supabase.from("activity_logs").insert({
      user_id: user.id,
      type: "seo_audit",
      description: `SEO Audit started for ${url}`,
      metadata: { audit_id: data.id },
    });

    return NextResponse.json({ audit: data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE: Remove audit by id
export async function DELETE(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Audit ID required" }, { status: 400 });

    const { error: deleteError } = await supabase
      .from("seo_audits")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (deleteError) throw deleteError;

    return NextResponse.json({ message: "Audit deleted" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
    }
