// File: app/api/content/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const CONTENT_TYPES: Record<string, string> = {
  blog_article: "Write a detailed, SEO-optimized blog article",
  linkedin_post: "Write a viral LinkedIn post",
  email_campaign: "Write a high-converting email campaign",
  ad_copy: "Write compelling Facebook/Google ad copy",
  product_desc: "Write a persuasive product description",
  social_media: "Write engaging Instagram/Twitter social media content",
};

// GET: Fetch content history
export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const page = parseInt(searchParams.get("page") ?? "1");
    const offset = (page - 1) * limit;

    let query = supabase
      .from("generated_content")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (type) query = query.eq("type", type);

    const { data, count, error: dbError } = await query;
    if (dbError) throw dbError;

    return NextResponse.json({ content: data, total: count, page, limit });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Generate new AI content
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { type, topic, tone, keywords, targetAudience } = body;

    if (!type || !topic) {
      return NextResponse.json({ error: "Type and topic are required" }, { status: 400 });
    }

    const instruction = CONTENT_TYPES[type] ?? "Write content";

    const prompt = `${instruction} about: "${topic}"
Tone: ${tone ?? "Professional"}
Keywords to include: ${keywords ?? "none"}
Target Audience: ${targetAudience ?? "general"}

Return only the final content, no commentary.`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });

    const generatedText = message.content
      .filter((b) => b.type === "text")
      .map((b) => (b as any).text)
      .join("\n");

    // Save to DB
    const { data: saved, error: saveError } = await supabase
      .from("generated_content")
      .insert({
        user_id: user.id,
        type,
        topic,
        tone: tone ?? "Professional",
        keywords: keywords ?? null,
        target_audience: targetAudience ?? null,
        content: generatedText,
      })
      .select()
      .single();

    if (saveError) throw saveError;

    await supabase.from("activity_logs").insert({
      user_id: user.id,
      type: "content_generated",
      description: `Generated ${type} about: ${topic}`,
      metadata: { content_id: saved.id },
    });

    return NextResponse.json({ content: saved }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE: Remove content item
export async function DELETE(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Content ID required" }, { status: 400 });

    const { error: deleteError } = await supabase
      .from("generated_content")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (deleteError) throw deleteError;

    return NextResponse.json({ message: "Content deleted" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
                              }
