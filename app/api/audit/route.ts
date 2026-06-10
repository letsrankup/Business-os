// app/api/audit/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { callOpenRouter } from "@/lib/openrouter";
import { checkRateLimit, getClientId, getRateLimitHeaders } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const clientId = getClientId(req.headers);
  const rateLimit = checkRateLimit(`audit:${clientId}`, { max: 10, windowMs: 60_000 });
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: "Too many requests. Please wait before running another audit." },
      { status: 429, headers: getRateLimitHeaders(rateLimit) }
    );
  }

  try {
    const body = await req.json();
    const { url } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Validate URL format
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url.startsWith("http") ? url : `https://${url}`);
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
    }

    const cleanUrl = parsedUrl.href;

    // Fetch page content for analysis
    let pageContent = "";
    try {
      const pageRes = await fetch(cleanUrl, {
        headers: { "User-Agent": "BusinessOS-SEOBot/1.0" },
        signal: AbortSignal.timeout(10000),
      });
      pageContent = await pageRes.text();
      // Truncate to avoid huge payloads
      pageContent = pageContent.slice(0, 8000);
    } catch {
      pageContent = `Could not fetch page content from ${cleanUrl}`;
    }

    // AI-powered SEO analysis
    const aiResult = await callOpenRouter(
      [
        {
          role: "user",
          content: `Perform a comprehensive SEO audit for: ${cleanUrl}

Page HTML snippet (first 8000 chars):
${pageContent}

Return a JSON object ONLY (no markdown, no explanation) with this exact structure:
{
  "score": <number 0-100>,
  "grade": "<A/B/C/D/F>",
  "summary": "<2-3 sentence overview>",
  "issues": [
    {
      "category": "<Technical|Content|Performance|Mobile|Security>",
      "severity": "<critical|warning|info>",
      "title": "<issue title>",
      "description": "<what's wrong>",
      "fix": "<how to fix>"
    }
  ],
  "recommendations": [
    {
      "priority": "<high|medium|low>",
      "title": "<recommendation>",
      "impact": "<expected impact>",
      "effort": "<easy|medium|hard>"
    }
  ],
  "metrics": {
    "title_tag": "<present|missing|too_long|too_short>",
    "meta_description": "<present|missing|too_long|too_short>",
    "h1_count": <number>,
    "images_without_alt": <number>,
    "has_canonical": <boolean>,
    "has_schema": <boolean>,
    "has_robots_txt": <boolean>,
    "has_sitemap": <boolean>
  }
}`,
        },
      ],
      {
        system: "You are an expert SEO auditor. Always respond with valid JSON only, no markdown code blocks.",
        temperature: 0.3,
        max_tokens: 2000,
      }
    );

    let auditData;
    try {
      const cleaned = aiResult.content.replace(/```json|```/g, "").trim();
      auditData = JSON.parse(cleaned);
    } catch {
      // Fallback structure if JSON parse fails
      auditData = {
        score: 50,
        grade: "C",
        summary: aiResult.content.slice(0, 200),
        issues: [],
        recommendations: [],
        metrics: {},
      };
    }

    // Save to Supabase if user is authenticated
    try {
      const supabase = createClient();
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("seo_audits").insert({
            user_id: user.id,
            url: cleanUrl,
            score: auditData.score,
            issues: auditData.issues,
            recommendations: auditData.recommendations,
            metadata: { grade: auditData.grade, metrics: auditData.metrics, model: aiResult.model },
          });
        }
      }
    } catch (dbErr) {
      console.error("Failed to save audit to DB:", dbErr);
      // Don't fail the request over DB save error
    }

    return NextResponse.json(
      { success: true, url: cleanUrl, audit: auditData, model: aiResult.model },
      { headers: getRateLimitHeaders(rateLimit) }
    );
  } catch (error) {
    console.error("SEO Audit error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Audit failed" },
      { status: 500 }
    );
  }
}
