// app/api/competitor/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { callOpenRouter } from "@/lib/openrouter";
import { checkRateLimit, getClientId, getRateLimitHeaders } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const clientId = getClientId(req.headers);
  const rateLimit = checkRateLimit(`competitor:${clientId}`, { max: 8, windowMs: 60_000 });
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: "Rate limit exceeded for competitor analysis." },
      { status: 429, headers: getRateLimitHeaders(rateLimit) }
    );
  }

  try {
    const body = await req.json();
    const { yourDomain, competitorDomains, industry, focus = "all" } = body;

    if (!yourDomain) {
      return NextResponse.json({ error: "yourDomain is required" }, { status: 400 });
    }
    if (!competitorDomains || !Array.isArray(competitorDomains) || competitorDomains.length === 0) {
      return NextResponse.json({ error: "competitorDomains array is required" }, { status: 400 });
    }

    const competitors = competitorDomains.slice(0, 5); // Max 5 competitors

    // Fetch basic info about each competitor
    const fetchPromises = [yourDomain, ...competitors].map(async (domain) => {
      try {
        const url = domain.startsWith("http") ? domain : `https://${domain}`;
        const res = await fetch(url, {
          headers: { "User-Agent": "BusinessOS/1.0" },
          signal: AbortSignal.timeout(8000),
        });
        const html = await res.text();
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        const descMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i);
        return {
          domain,
          title: titleMatch?.[1]?.trim() || domain,
          description: descMatch?.[1]?.trim() || "No description found",
          statusCode: res.status,
        };
      } catch {
        return { domain, title: domain, description: "Could not fetch", statusCode: 0 };
      }
    });

    const siteData = await Promise.all(fetchPromises);
    const [yourSite, ...competitorSites] = siteData;

    const aiResult = await callOpenRouter(
      [
        {
          role: "user",
          content: `Perform a detailed competitor analysis:

YOUR BUSINESS:
Domain: ${yourSite.domain}
Title: ${yourSite.title}
Description: ${yourSite.description}
Industry: ${industry || "Unknown"}

COMPETITORS:
${competitorSites.map((c, i) => `${i + 1}. ${c.domain}\n   Title: ${c.title}\n   Description: ${c.description}`).join("\n\n")}

Analysis Focus: ${focus}

Return ONLY valid JSON (no markdown):
{
  "overview": "<2-3 paragraph strategic overview>",
  "your_strengths": ["<strength 1>", "<strength 2>"],
  "your_weaknesses": ["<weakness 1>", "<weakness 2>"],
  "opportunities": ["<opportunity 1>", "<opportunity 2>"],
  "threats": ["<threat 1>", "<threat 2>"],
  "competitor_profiles": [
    {
      "domain": "<domain>",
      "strengths": ["<strength>"],
      "weaknesses": ["<weakness>"],
      "estimated_traffic": "<low/medium/high>",
      "market_position": "<description>",
      "threat_level": "<low/medium/high>"
    }
  ],
  "recommendations": [
    {
      "priority": "<high/medium/low>",
      "action": "<specific action>",
      "rationale": "<why>",
      "timeline": "<timeframe>"
    }
  ],
  "keywords_to_target": ["<keyword 1>", "<keyword 2>"],
  "content_gaps": ["<gap 1>", "<gap 2>"]
}`,
        },
      ],
      {
        system: "You are a senior competitive intelligence analyst. Provide actionable, data-driven competitive analysis. Return valid JSON only.",
        temperature: 0.4,
        max_tokens: 2500,
      }
    );

    let analysis: Record<string, unknown> = {};
    try {
      const cleaned = aiResult.content.replace(/```json|```/g, "").trim();
      analysis = JSON.parse(cleaned);
    } catch {
      analysis = { raw: aiResult.content, error: "Could not parse structured analysis" };
    }

    return NextResponse.json(
      {
        success: true,
        yourDomain,
        competitors,
        analysis,
        siteData: { yourSite, competitorSites },
        model: aiResult.model,
      },
      { headers: getRateLimitHeaders(rateLimit) }
    );
  } catch (error) {
    console.error("Competitor analysis error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Competitor analysis failed" },
      { status: 500 }
    );
  }
          }
