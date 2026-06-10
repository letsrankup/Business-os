// File: app/api/competitor/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { callOpenRouter } from "@/lib/openrouter";
import { checkAndIncrementUsage } from "@/lib/rateLimit";

// GET: List competitor analyses
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
      .from("competitor_analyses")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (dbError) throw dbError;
    return NextResponse.json({ analyses: data, total: count, page, limit });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Run AI competitor analysis
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Rate limit check
    const rateLimitResult = await checkAndIncrementUsage(supabase, user.id, "competitor_ai");
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: rateLimitResult.reason, remaining: rateLimitResult.remaining },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { yourDomain, competitorDomain, industry, analysisType = "full" } = body;

    if (!yourDomain || !competitorDomain) {
      return NextResponse.json({ error: "Both your domain and competitor domain required" }, { status: 400 });
    }

    const prompts: Record<string, string> = {
      full: `Perform a comprehensive competitor analysis between these two businesses:

Your Business: ${yourDomain}
Competitor: ${competitorDomain}
Industry: ${industry ?? "Not specified"}

Provide a detailed analysis covering:
1. **Market Positioning** — How each is positioned
2. **SEO & Content Strategy** — Keywords, content approach
3. **Strengths & Weaknesses** — SWOT-style breakdown
4. **Unique Value Propositions** — What makes each stand out
5. **Gap Opportunities** — Where your business can win
6. **Actionable Recommendations** — 5 specific steps to outperform competitor

Be specific and actionable. Format with clear sections.`,

      seo: `Analyze the SEO competition between ${yourDomain} vs ${competitorDomain} in the ${industry ?? "general"} industry.
Cover: keyword gaps, backlink strategy, content volume, technical SEO differences, and 5 ways to outrank them.`,

      content: `Compare the content strategies of ${yourDomain} vs ${competitorDomain} (${industry ?? "general"} industry).
Cover: content types, publishing frequency, engagement tactics, topic clusters, and 5 content opportunities to steal market share.`,
    };

    const analysisText = await callOpenRouter(
      [{ role: "user", content: prompts[analysisType] ?? prompts.full }],
      { model: "powerful", maxTokens: 2500 }
    );

    const { data: saved, error: saveError } = await supabase
      .from("competitor_analyses")
      .insert({
        user_id: user.id,
        your_domain: yourDomain,
        competitor_domain: competitorDomain,
        industry: industry ?? null,
        analysis_type: analysisType,
        content: analysisText,
      })
      .select()
      .single();

    if (saveError) throw saveError;

    await supabase.from("activity_logs").insert({
      user_id: user.id,
      type: "competitor_analysis",
      description: `Competitor analysis: ${yourDomain} vs ${competitorDomain}`,
      metadata: { analysis_id: saved.id },
    });

    return NextResponse.json(
      { analysis: saved, remaining: rateLimitResult.remaining },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE: Remove analysis
export async function DELETE(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Analysis ID required" }, { status: 400 });

    const { error: deleteError } = await supabase
      .from("competitor_analyses")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (deleteError) throw deleteError;
    return NextResponse.json({ message: "Analysis deleted" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
