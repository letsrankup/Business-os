// File: app/api/content/route.ts
// Business OS — Content AI | Pure OpenRouter | No external SDK

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { checkAndIncrementUsage } from "@/lib/rateLimit";

// ── OpenRouter Setup ──────────────────────────────────────────────────────────
const OR_URL = "https://openrouter.ai/api/v1/chat/completions";

const MODELS: Record<string, string> = {
  blog_article:   "anthropic/claude-3.5-sonnet",
  email_campaign: "anthropic/claude-3.5-sonnet",
  case_study:     "anthropic/claude-3.5-sonnet",
  youtube_script: "anthropic/claude-3.5-sonnet",
  newsletter:     "anthropic/claude-3.5-sonnet",
  press_release:  "anthropic/claude-3.5-sonnet",
  linkedin_post:  "anthropic/claude-3-haiku",
  product_desc:   "anthropic/claude-3-haiku",
  seo_meta:       "anthropic/claude-3-haiku",
  ad_copy:        "openai/gpt-4o",
  social_media:   "openai/gpt-4o-mini",
  twitter_thread: "openai/gpt-4o-mini",
};

// ── Expert Prompts ────────────────────────────────────────────────────────────
const PROMPTS: Record<string, (d: any) => string> = {
  blog_article: (d) =>
    `Write a detailed SEO-optimized blog article.
Topic: ${d.topic} | Tone: ${d.tone||"Professional"} | Audience: ${d.targetAudience||"general"} | Keywords: ${d.keywords||"auto"}
Structure: Hook intro, 5+ H2 sections with tips/stats, FAQ (5 questions), strong CTA.
Include meta title + meta description at top. Use markdown formatting. 1500+ words.`,

  linkedin_post: (d) =>
    `Write 2 viral LinkedIn posts (Version A: story-based, Version B: list-based).
Topic: ${d.topic} | Tone: ${d.tone||"Thought Leadership"} | Audience: ${d.targetAudience||"professionals"}
Rules: Scroll-stopping first line, short paragraphs, 1 insight, engagement question, 5 hashtags. 150-300 words each.`,

  email_campaign: (d) =>
    `Write a 3-email sequence (welcome → value → conversion).
Topic: ${d.topic} | Tone: ${d.tone||"Professional"} | Audience: ${d.targetAudience||"subscribers"} | Goal: ${d.goal||"conversions"}
Each email: Subject (+ 2 A/B variants), preview text, body, CTA. Use {{first_name}} tokens.`,

  ad_copy: (d) =>
    `Write complete ad copy pack.
Product: ${d.topic} | Audience: ${d.targetAudience||"general"} | Keywords: ${d.keywords||"auto"}
Deliver: 3x Facebook/Instagram ads (primary text 125c, headline 40c, description 30c), 2x Google Search ads (3 headlines 30c, 2 descriptions 90c), 1x Retargeting ad.`,

  product_desc: (d) =>
    `Write product descriptions.
Product: ${d.topic} | Customer: ${d.targetAudience||"general"} | Keywords: ${d.keywords||"auto"}
Deliver: Short desc (75 words), Long desc (300 words, features-as-benefits), 6 bullet points, 3 SEO title options.`,

  social_media: (d) =>
    `Write a full social media content pack.
Topic: ${d.topic} | Tone: ${d.tone||"Engaging"} | Audience: ${d.targetAudience||"general"}
Deliver: 3 Instagram captions + 30 hashtags, 5 Tweets, 2 Facebook posts, 5 TikTok/Reels hooks.`,

  youtube_script: (d) =>
    `Write a complete YouTube video script (8-12 min).
Topic: ${d.topic} | Tone: ${d.tone||"Engaging"} | Audience: ${d.targetAudience||"viewers"}
Structure: [HOOK] → [INTRO] → 5 sections with [BROLL] cues → [OUTRO+CTA].
Also include: 5 title options, description (150 chars), 20 tags, 3 thumbnail concepts.`,

  seo_meta: (d) =>
    `Generate complete SEO meta content.
Page: ${d.topic} | Keywords: ${d.keywords||"auto"} | Type: ${d.targetAudience||"blog/landing page"}
Deliver: 5 title tags (55-60c), 5 meta descriptions (150-155c), 3 H1 options, 8 H2 suggestions, 5 LSI keywords, 5 long-tail variants, 3 URL slugs, OG tags.`,

  press_release: (d) =>
    `Write a professional press release.
Topic: ${d.topic} | Company: ${d.targetAudience||"the company"} | Tone: ${d.tone||"Formal"}
Structure: FOR IMMEDIATE RELEASE → Headline → Subheadline → Lead para (who/what/when/where/why) → 3 body paras → 2 quotes [PLACEHOLDER] → Boilerplate → Contact template.
Also include: 3 email pitch subjects, Twitter + LinkedIn announcements.`,

  case_study: (d) =>
    `Write a B2B case study.
Topic: ${d.topic} | Reader: ${d.targetAudience||"potential clients"} | Keywords: ${d.keywords||"auto"}
Structure: Result-focused headline → Executive summary → Challenge (3-4 pain points) → Solution → Results (with metrics) → Why it worked → CTA → 3 pull quotes.`,

  newsletter: (d) =>
    `Write a complete newsletter issue.
Topic: ${d.topic} | Audience: ${d.targetAudience||"professionals"} | Tone: ${d.tone||"Smart, conversational"}
Deliver: 5 subject lines + preview texts → Opener → Big Idea (300w) → 3 Quick Hits → Deep Dive (500w) → Tool Spotlight → Engagement question → Sign-off → P.S.`,

  twitter_thread: (d) =>
    `Write a 13-tweet viral Twitter thread.
Topic: ${d.topic} | Tone: ${d.tone||"Bold"} | Audience: ${d.targetAudience||"Twitter users"}
Tweet 1: scroll-stopping hook. Tweets 2-12: value delivery, each standalone. Tweet 13: CTA.
Rules: max 280 chars, numbered [1/13], short punchy sentences. Also give 3 alternative hooks.`,
};

// ── OpenRouter Call with Retry ────────────────────────────────────────────────
async function callOR(
  model: string,
  prompt: string,
  maxTokens = 2500,
  stream = false
): Promise<string | ReadableStream> {
  const headers = {
    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    "Content-Type": "application/json",
    "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "https://business-os.vercel.app",
    "X-Title": "Business OS",
  };

  const body = JSON.stringify({
    model,
    max_tokens: maxTokens,
    temperature: 0.75,
    stream,
    messages: [
      { role: "system", content: "You are a world-class content creator. Return only the requested content, no commentary." },
      { role: "user", content: prompt },
    ],
  });

  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(OR_URL, { method: "POST", headers, body });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) throw new Error(`OpenRouter auth failed: check OPENROUTER_API_KEY`);
      if (attempt === 3) throw new Error(err?.error?.message ?? `OpenRouter error ${res.status}`);
      await new Promise((r) => setTimeout(r, attempt * 1000));
      continue;
    }

    if (stream) return res.body!;

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content ?? "";
    if (!text) throw new Error("Empty response from OpenRouter");
    return text;
  }

  throw new Error("OpenRouter failed after 3 retries");
}

// ── Content Analysis ──────────────────────────────────────────────────────────
function analyze(text: string, keywords = "") {
  const words = text.split(/\s+/).filter(Boolean);
  const wc = words.length;
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim());
  const kwList = keywords.split(",").map((k) => k.trim().toLowerCase()).filter(Boolean);
  const density: Record<string, number> = {};
  for (const kw of kwList) {
    const hits = (text.match(new RegExp(`\\b${kw}\\b`, "gi")) ?? []).length;
    density[kw] = parseFloat(((hits / wc) * 100).toFixed(2));
  }
  let seo = 60;
  if (wc >= 1000) seo += 10;
  if (wc >= 1500) seo += 5;
  if (text.includes("##") || text.includes("**")) seo += 10;
  if (kwList.length && Object.values(density).some((d) => d >= 0.5 && d <= 2.5)) seo += 10;
  if (wc / (sentences.length || 1) < 25) seo += 5;
  return {
    wordCount: wc,
    readingTimeMin: Math.ceil(wc / 200),
    seoScore: Math.min(100, seo),
    keywordDensity: density,
  };
}

// ── GET: List / Single fetch ──────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const sp = new URL(req.url).searchParams;
    const id = sp.get("id");
    const type = sp.get("type");
    const search = sp.get("search");
    const limit = parseInt(sp.get("limit") ?? "20");
    const page = parseInt(sp.get("page") ?? "1");
    const offset = (page - 1) * limit;

    if (id) {
      const { data, error: e } = await supabase.from("generated_content").select("*").eq("id", id).eq("user_id", user.id).single();
      if (e) throw e;
      return NextResponse.json({ content: data });
    }

    let q = supabase.from("generated_content").select("*", { count: "exact" }).eq("user_id", user.id).order("created_at", { ascending: false }).range(offset, offset + limit - 1);
    if (type) q = q.eq("type", type);
    if (search) q = q.ilike("topic", `%${search}%`);

    const { data, count, error: e } = await q;
    if (e) throw e;

    const today = new Date().toISOString().split("T")[0];
    const thisMonth = today.slice(0, 7);
    const { data: usage } = await supabase.from("ai_usage").select("daily_count,monthly_count,last_day,last_month").eq("user_id", user.id).eq("feature", "content_ai").single();

    return NextResponse.json({
      content: data,
      total: count,
      page,
      totalPages: Math.ceil((count ?? 0) / limit),
      usage: {
        dailyUsed: usage?.last_day === today ? usage.daily_count : 0,
        monthlyUsed: usage?.last_month === thisMonth ? usage.monthly_count : 0,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ── POST: Generate Content ────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rl = await checkAndIncrementUsage(supabase, user.id, "content_ai");
    if (!rl.allowed) return NextResponse.json({ error: rl.reason, remaining: rl.remaining, upgradeUrl: "/settings?tab=billing" }, { status: 429 });

    const body = await req.json();
    const { type, topic, tone, keywords, targetAudience, goal, stream: useStream = false } = body;

    if (!type || !topic) return NextResponse.json({ error: "type and topic required" }, { status: 400 });
    if (!PROMPTS[type]) return NextResponse.json({ error: `Invalid type. Valid: ${Object.keys(PROMPTS).join(", ")}` }, { status: 400 });

    const model = MODELS[type] ?? "anthropic/claude-3.5-sonnet";
    const maxTok = ["blog_article", "youtube_script", "email_campaign", "newsletter", "case_study"].includes(type) ? 3500 : 2000;
    const prompt = PROMPTS[type]({ type, topic, tone, keywords, targetAudience, goal });

    // Streaming
    if (useStream) {
      const stream = await callOR(model, prompt, maxTok, true);
      return new NextResponse(stream as ReadableStream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          "X-Model": model,
          "X-Remaining-Daily": String(rl.remaining?.daily ?? ""),
          "X-Remaining-Monthly": String(rl.remaining?.monthly ?? ""),
        },
      });
    }

    // Non-streaming
    const text = await callOR(model, prompt, maxTok) as string;
    const stats = analyze(text, keywords ?? "");

    const { data: saved, error: se } = await supabase.from("generated_content").insert({
      user_id: user.id, type, topic,
      tone: tone ?? "Professional",
      keywords: keywords ?? null,
      target_audience: targetAudience ?? null,
      language: "English",
      content: text,
      word_count: stats.wordCount,
      reading_time_min: stats.readingTimeMin,
      seo_score: stats.seoScore,
      keyword_density: stats.keywordDensity,
      model_used: model,
    }).select().single();

    if (se) throw se;

    await supabase.from("activity_logs").insert({
      user_id: user.id,
      type: "content_generated",
      description: `Generated ${type}: "${topic.slice(0, 60)}"`,
      metadata: { content_id: saved.id, word_count: stats.wordCount, seo_score: stats.seoScore },
    });

    return NextResponse.json({ content: saved, analysis: stats, remaining: rl.remaining }, { status: 201 });
  } catch (err: any) {
    console.error("[Content AI]", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ── PATCH: Favourite / Update notes ──────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id, favourite, notes, topic } = await req.json();
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const updates: any = { updated_at: new Date().toISOString() };
    if (typeof favourite === "boolean") updates.favourite = favourite;
    if (notes !== undefined) updates.notes = notes;
    if (topic !== undefined) updates.topic = topic;

    const { data, error: e } = await supabase.from("generated_content").update(updates).eq("id", id).eq("user_id", user.id).select().single();
    if (e) throw e;
    return NextResponse.json({ content: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ── DELETE: Single or Bulk ────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const sp = new URL(req.url).searchParams;
    const id = sp.get("id");
    const bulk = sp.get("bulk");

    if (!id && !bulk) return NextResponse.json({ error: "ID required" }, { status: 400 });

    if (bulk) {
      const ids = bulk.split(",").map((i) => i.trim()).filter(Boolean);
      const { error: e } = await supabase.from("generated_content").delete().in("id", ids).eq("user_id", user.id);
      if (e) throw e;
      return NextResponse.json({ message: `${ids.length} items deleted` });
    }

    const { error: e } = await supabase.from("generated_content").delete().eq("id", id!).eq("user_id", user.id);
    if (e) throw e;
    return NextResponse.json({ message: "Deleted" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
    }
      
