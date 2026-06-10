// app/api/content/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { callOpenRouter } from "@/lib/openrouter";
import { checkRateLimit, getClientId, getRateLimitHeaders } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const clientId = getClientId(req.headers);
  const rateLimit = checkRateLimit(`content:${clientId}`, { max: 10, windowMs: 60_000 });
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please wait before generating more content." },
      { status: 429, headers: getRateLimitHeaders(rateLimit) }
    );
  }

  try {
    const body = await req.json();
    const {
      type = "blog",
      topic,
      tone = "professional",
      keywords = [],
      length = "medium",
      language = "English",
      targetAudience,
      save = false,
    } = body;

    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    const lengthMap: Record<string, string> = {
      short: "300-500 words",
      medium: "600-900 words",
      long: "1200-1800 words",
    };

    const typePrompts: Record<string, string> = {
      blog: `Write a comprehensive blog post about: "${topic}"
Tone: ${tone}
Target audience: ${targetAudience || "general business audience"}
Length: ${lengthMap[length] || "600-900 words"}
Keywords to include: ${keywords.join(", ") || "none specified"}
Language: ${language}

Structure: Include an engaging title, introduction, 3-5 main sections with subheadings, and conclusion.`,

      social: `Write engaging social media content about: "${topic}"
Platform-ready format (LinkedIn + Twitter/X versions)
Tone: ${tone}
Keywords/hashtags: ${keywords.join(", ")}
Language: ${language}

Provide: LinkedIn post (150-300 words) + Twitter thread (5 tweets)`,

      email: `Write a professional email about: "${topic}"
Tone: ${tone}
Target: ${targetAudience || "business clients"}
Language: ${language}

Include: Subject line, greeting, body (3-4 paragraphs), call-to-action, professional sign-off`,

      ad: `Write compelling ad copy for: "${topic}"
Tone: ${tone}
Keywords: ${keywords.join(", ")}
Language: ${language}

Provide: Headline (max 30 chars), Primary text (max 125 chars), Description (max 30 chars), and 3 variations`,
    };

    const prompt = typePrompts[type] || typePrompts.blog;

    const aiResult = await callOpenRouter(
      [{ role: "user", content: prompt }],
      {
        system: `You are an expert content writer specializing in business and marketing content. 
Write compelling, SEO-optimized content that drives engagement and conversions.
Always write in ${language}.`,
        temperature: 0.75,
        max_tokens: 2500,
      }
    );

    const generatedContent = aiResult.content;

    // Save to DB if requested and user is authenticated
    let savedRecord = null;
    if (save) {
      try {
        const supabase = createClient();
        if (supabase) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const titleMatch = generatedContent.match(/^#\s+(.+)$/m) || generatedContent.match(/^(.{10,80})\n/);
            const title = titleMatch?.[1]?.replace(/[#*]/g, "").trim() || topic;

            const { data } = await supabase.from("content_items").insert({
              user_id: user.id,
              title,
              content: generatedContent,
              type,
              status: "draft",
              ai_generated: true,
              model_used: aiResult.model,
              tags: keywords,
              metadata: { tone, length, targetAudience, language },
            }).select().single();

            savedRecord = data;
          }
        }
      } catch (dbErr) {
        console.error("Failed to save content:", dbErr);
      }
    }

    return NextResponse.json(
      {
        success: true,
        content: generatedContent,
        model: aiResult.model,
        usage: aiResult.usage,
        saved: savedRecord,
      },
      { headers: getRateLimitHeaders(rateLimit) }
    );
  } catch (error) {
    console.error("Content generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Content generation failed" },
      { status: 500 }
    );
  }
}

// GET - Fetch saved content
export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    if (!supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

    let query = supabase
      .from("content_items")
      .select("id, title, type, status, tags, created_at, ai_generated")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (type) query = query.eq("type", type);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Content GET error:", error);
    return NextResponse.json({ error: "Failed to fetch content" }, { status: 500 });
  }
}
