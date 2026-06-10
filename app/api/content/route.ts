// File: app/api/content/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// Business OS — Content AI — Full Advanced Route
// Powered by OpenRouter (NO Anthropic SDK — pure OpenRouter API)
// Features:
//   • 12 content types with deep expert prompts
//   • Streaming support (SSE)
//   • Per-user rate limiting
//   • SEO score analysis on generated content
//   • Auto retry on OpenRouter errors (3x)
//   • Word count, reading time, SEO keywords extraction
//   • Save to Supabase with full metadata
//   • Bulk generation support
//   • Content improvement / rewrite endpoint
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";
import { checkAndIncrementUsage } from "@/lib/rateLimit";

// ─── OpenRouter Config ────────────────────────────────────────────────────────
const OR_BASE = "https://openrouter.ai/api/v1/chat/completions";
const OR_HEADERS = () => ({
  Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
  "Content-Type": "application/json",
  "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "https://business-os.vercel.app",
  "X-Title": "Business OS",
});

// Model selection per content type
const CONTENT_MODELS: Record<string, string> = {
  blog_article:      "anthropic/claude-3.5-sonnet",   // Long-form, best quality
  linkedin_post:     "anthropic/claude-3-haiku",       // Fast, punchy
  email_campaign:    "anthropic/claude-3.5-sonnet",   // High conversion needs depth
  ad_copy:           "openai/gpt-4o",                  // Creative ad copy
  product_desc:      "anthropic/claude-3-haiku",       // Fast product copy
  social_media:      "openai/gpt-4o-mini",             // Quick social posts
  youtube_script:    "anthropic/claude-3.5-sonnet",   // Long scripts
  seo_meta:          "anthropic/claude-3-haiku",       // Short precise meta
  press_release:     "anthropic/claude-3.5-sonnet",   // Formal writing
  case_study:        "anthropic/claude-3.5-sonnet",   // Deep storytelling
  newsletter:        "anthropic/claude-3.5-sonnet",   // Engaging newsletters
  twitter_thread:    "openai/gpt-4o-mini",             // Punchy threads
};

const DEFAULT_MODEL = "anthropic/claude-3.5-sonnet";

// ─── Content Type Expert Prompts ──────────────────────────────────────────────
const CONTENT_PROMPTS: Record<string, (data: ContentInput) => string> = {

  blog_article: (d) => `You are an expert SEO content writer and digital marketing specialist with 10+ years experience.

Write a comprehensive, SEO-optimized blog article with the following specifications:

**Topic:** ${d.topic}
**Target Audience:** ${d.targetAudience ?? "general readers"}
**Tone:** ${d.tone ?? "Professional"}
**Primary Keywords:** ${d.keywords ?? "derive from topic"}
**Word Count Target:** ${d.wordCount ?? "1500-2000 words"}
**Language:** ${d.language ?? "English"}

Structure Requirements:
- Compelling H1 title (include primary keyword)
- Meta description (155 chars max)
- Introduction with hook (problem/stat/question)
- 5-7 H2 sections with H3 subsections where needed
- Include relevant statistics, examples, and actionable tips
- Internal linking suggestions [INTERNAL LINK: topic]
- FAQ section (5 questions)
- Strong CTA conclusion
- Keyword density: 1-2% natural placement

Format: Use proper markdown with headers, bullet points, bold key terms.
Return the full article only. No commentary.`,

  linkedin_post: (d) => `You are a LinkedIn growth expert who has helped executives gain 100K+ followers.

Write a viral LinkedIn post with these specs:

**Topic/Hook:** ${d.topic}
**Tone:** ${d.tone ?? "Thought Leadership"}
**Target Audience:** ${d.targetAudience ?? "professionals"}
**Keywords/Hashtags Theme:** ${d.keywords ?? "derive from topic"}
**Language:** ${d.language ?? "English"}

Requirements:
- Opening line must stop the scroll (bold statement, surprising stat, or personal story)
- Use short punchy paragraphs (1-2 lines max)
- Include a personal insight or contrarian take
- 3-5 key takeaways in bullet or numbered format
- Engagement question at the end
- 5-8 relevant hashtags
- Emoji usage: strategic, not excessive
- Total length: 150-300 words

Write 2 variations: Version A (story-based) and Version B (list-based).
Return both versions clearly labeled.`,

  email_campaign: (d) => `You are a direct response copywriter specializing in email marketing with 40%+ open rates.

Write a complete high-converting email campaign sequence:

**Campaign Topic:** ${d.topic}
**Tone:** ${d.tone ?? "Professional but warm"}
**Target Audience:** ${d.targetAudience ?? "subscribers"}
**Goal:** ${d.goal ?? "drive clicks/conversions"}
**Keywords/Offer:** ${d.keywords ?? "derive from topic"}
**Language:** ${d.language ?? "English"}

Deliver a 3-email sequence:

EMAIL 1 — Welcome/Hook
- Subject line (+ 2 A/B variants)
- Preview text
- Full email body (300-400 words)
- CTA button text

EMAIL 2 — Value/Education (send day 3)
- Subject line (+ 2 A/B variants)
- Full email body (400-500 words)
- CTA

EMAIL 3 — Conversion (send day 7)
- Subject line (+ 2 A/B variants)
- Full email body with urgency (300-400 words)
- Strong CTA

Include: personalization tokens {{first_name}}, {{company}} where natural.
Format clearly with labels for each email and section.`,

  ad_copy: (d) => `You are a performance marketing expert specializing in Facebook, Google, and Instagram ads with proven ROAS of 5x+.

Create complete ad copy for a campaign:

**Product/Service:** ${d.topic}
**Target Audience:** ${d.targetAudience ?? "general"}
**Tone:** ${d.tone ?? "Persuasive"}
**USP/Keywords:** ${d.keywords ?? "derive from topic"}
**Language:** ${d.language ?? "English"}

Deliver:

FACEBOOK/INSTAGRAM ADS (3 variations):
Each with:
- Primary text (125 chars)
- Headline (40 chars)
- Description (30 chars)
- CTA button recommendation

GOOGLE SEARCH ADS (2 variations):
Each with:
- Headline 1, 2, 3 (30 chars each)
- Description 1, 2 (90 chars each)
- Display URL path

GOOGLE DISPLAY AD COPY:
- Short headline (25 chars)
- Long headline (90 chars)
- Description (90 chars)

RETARGETING AD (1 variation for warm audience):
- Facebook primary text + headline

Label everything clearly. Focus on pain points, benefits, and urgency.`,

  product_desc: (d) => `You are an expert ecommerce copywriter who has written product descriptions generating millions in sales.

Write persuasive product descriptions:

**Product:** ${d.topic}
**Target Customer:** ${d.targetAudience ?? "general consumers"}
**Tone:** ${d.tone ?? "Persuasive"}
**Key Features/Keywords:** ${d.keywords ?? "derive from product"}
**Language:** ${d.language ?? "English"}

Deliver:

SHORT DESCRIPTION (50-75 words):
- Lead with the main benefit
- 2-3 key features
- Sensory/emotional language

LONG DESCRIPTION (200-300 words):
- Headline
- Problem it solves
- Features as benefits (feature → "which means you...")
- Social proof statement placeholder
- Technical specs section
- CTA

BULLET POINTS (6 items):
- Benefit-focused, scannable
- Start each with action verb or power word

SEO TITLE OPTIONS (3 variants, 60 chars max each)

Return all sections clearly labeled.`,

  social_media: (d) => `You are a social media strategist managing accounts with 1M+ combined followers.

Create a complete social media content pack:

**Topic/Campaign:** ${d.topic}
**Brand Tone:** ${d.tone ?? "Engaging"}
**Target Audience:** ${d.targetAudience ?? "general"}
**Keywords/Themes:** ${d.keywords ?? "derive from topic"}
**Language:** ${d.language ?? "English"}

Deliver content for:

INSTAGRAM (3 posts):
- Caption (150-200 words each)
- 30 relevant hashtags (grouped: niche + broad + branded)
- Story slide text suggestions (5 slides)

TWITTER/X (5 tweets):
- Mix of: insight, question, stat, tip, opinion
- Under 280 chars each
- 2-3 hashtags per tweet

FACEBOOK (2 posts):
- 100-150 words, conversational
- Engagement question

TIKTOK/REELS HOOK IDEAS (5 hooks):
- Opening line for video scripts

Label all sections clearly.`,

  youtube_script: (d) => `You are a YouTube scriptwriter for channels with 1M+ subscribers known for high retention and viral content.

Write a complete YouTube video script:

**Topic:** ${d.topic}
**Target Audience:** ${d.targetAudience ?? "general viewers"}
**Tone:** ${d.tone ?? "Engaging, educational"}
**Keywords:** ${d.keywords ?? "derive from topic"}
**Target Length:** ${d.wordCount ? `${d.wordCount} words` : "8-12 minutes (1200-1800 words)"}
**Language:** ${d.language ?? "English"}

Script Structure:
[HOOK] (0:00-0:30) — Pattern interrupt, bold claim or shocking question
[INTRO] (0:30-1:00) — Who you are, what they'll learn, subscribe nudge
[SECTION 1] with b-roll suggestions in [BROLL: description]
[SECTION 2]
[SECTION 3]
[SECTION 4]
[SECTION 5]
[OUTRO] — CTA: like, subscribe, next video recommendation

Include:
- On-screen text suggestions [TEXT: ...]
- Transition cues [CUT TO:]
- Emphasis markers for delivery
- Thumbnail concept ideas (3 options)
- Video title options (5 variants, YouTube SEO optimized)
- Description (first 150 chars critical, include keywords)
- Tags list (20 tags)`,

  seo_meta: (d) => `You are an SEO specialist with expertise in technical on-page optimization.

Generate complete SEO meta content for:

**Page Topic:** ${d.topic}
**Target Keywords:** ${d.keywords ?? "derive from topic"}
**Page Type:** ${d.targetAudience ?? "blog post / landing page"}
**Tone:** ${d.tone ?? "Professional"}
**Language:** ${d.language ?? "English"}

Deliver:

TITLE TAGS (5 variations, 50-60 chars):
- Include primary keyword
- Power words where natural
- Brand name format: Title | Brand

META DESCRIPTIONS (5 variations, 145-155 chars):
- Include primary keyword naturally
- Include a benefit + CTA
- No clickbait

H1 OPTIONS (3 variants):
- Keyword-rich but natural

H2 SECTION HEADINGS (8 suggestions):
- Structured for topic clusters
- Mix of question and statement formats

SCHEMA MARKUP TYPE: recommendation with reason

OPEN GRAPH TAGS:
- og:title, og:description, og:type

FOCUS KEYWORD ANALYSIS:
- Primary keyword
- 5 LSI keywords
- 5 long-tail variants

URL SLUG OPTIONS (3 variants, SEO-friendly)`,

  press_release: (d) => `You are a PR professional with 15+ years writing press releases picked up by major media outlets.

Write a professional press release:

**Announcement/Topic:** ${d.topic}
**Company/Brand:** ${d.targetAudience ?? "the company"}
**Tone:** ${d.tone ?? "Formal, newsworthy"}
**Keywords:** ${d.keywords ?? "derive from topic"}
**Language:** ${d.language ?? "English"}

Structure:
FOR IMMEDIATE RELEASE

[HEADLINE — newsy, active voice, 80 chars max]
[SUBHEADLINE — expands on headline]

[DATELINE] — [LEAD PARAGRAPH: who, what, when, where, why in 40 words]

[BODY PARAGRAPH 1 — context and significance]
[BODY PARAGRAPH 2 — details and data]
[QUOTE 1 — CEO/spokesperson with name/title placeholder]
[BODY PARAGRAPH 3 — additional details]
[QUOTE 2 — customer/partner with name/title placeholder]
[BOILERPLATE — "About [Company]" placeholder]

CONTACT:
[Contact info template]

###

Also provide:
- Email pitch subject lines (3 variants)
- Social media announcement versions (Twitter + LinkedIn)`,

  case_study: (d) => `You are a B2B content strategist specializing in case studies that convert prospects into customers.

Write a compelling case study:

**Topic/Success Story:** ${d.topic}
**Target Reader:** ${d.targetAudience ?? "potential clients"}
**Tone:** ${d.tone ?? "Professional, results-focused"}
**Keywords:** ${d.keywords ?? "derive from topic"}
**Language:** ${d.language ?? "English"}

Structure:
HEADLINE: [Result-focused, e.g., "How [Client] Achieved X% in Y Days"]

EXECUTIVE SUMMARY (100 words):
- Client background, challenge, solution, result

THE CHALLENGE:
- Specific pain points (3-4)
- Business impact of the problem
- Why previous solutions failed

THE SOLUTION:
- Approach taken
- Implementation process
- Timeline
- Team/tools involved

THE RESULTS (emphasize with metrics):
- Primary KPI improvement
- Secondary metrics
- ROI calculation template
- Timeline to results
- Quote from client [PLACEHOLDER]

WHY IT WORKED:
- Key success factors
- Transferable insights

CALL TO ACTION:
- Next steps for similar companies

PULLQUOTES (3 strong quotes for design use)`,

  newsletter: (d) => `You are a newsletter growth expert running publications with 50K+ engaged subscribers and 45%+ open rates.

Write a complete newsletter issue:

**Topic/Theme:** ${d.topic}
**Subscriber Persona:** ${d.targetAudience ?? "professionals"}
**Tone:** ${d.tone ?? "Smart, conversational"}
**Keywords/Themes:** ${d.keywords ?? "derive from topic"}
**Language:** ${d.language ?? "English"}

Structure:
SUBJECT LINE (5 options — curiosity, benefit, question, list, personal)
PREVIEW TEXT (5 matching options)

NEWSLETTER BODY:
[OPENER — personal, conversational 2-3 sentences]
[THIS WEEK'S BIG IDEA — 200-300 words, core insight]
[QUICK HITS — 3 short news/tips bullets with sources]
[DEEP DIVE — 400-500 words, main article/analysis]
[TOOL OR RESOURCE SPOTLIGHT — 50 words]
[THOUGHT-PROVOKING QUESTION — for replies/engagement]
[SIGN-OFF — warm, on-brand]
[P.S. — teaser for next issue]

DESIGN NOTES:
- Suggested image/header concept
- Pull quote for visual break`,

  twitter_thread: (d) => `You are a Twitter/X growth strategist with threads that regularly hit 1M+ impressions.

Write a viral Twitter thread:

**Topic:** ${d.topic}
**Target Audience:** ${d.targetAudience ?? "Twitter users"}
**Tone:** ${d.tone ?? "Bold, insightful"}
**Keywords:** ${d.keywords ?? "derive from topic"}
**Language:** ${d.language ?? "English"}

Requirements:
- 12-15 tweets
- Tweet 1: HOOK — bold claim, surprising stat, or contrarian take (must stop scroll)
- Tweets 2-11: Value delivery — each tweet stands alone AND builds on previous
- Tweet 12: Summary tweet with key takeaways
- Tweet 13: CTA tweet (follow, retweet, reply)

Rules:
- Max 280 chars per tweet
- Short sentences, punchy
- Numbers and specifics beat vague claims
- End tweet 1 with "Here's what I learned: 🧵" or similar thread opener
- Use line breaks for readability
- Strategic emoji (1-2 per tweet max)
- No filler words

Number each tweet: [1/13], [2/13], etc.

Also provide:
- 3 alternative hook options for tweet 1
- Best time to post recommendation`,
};

// ─── Utility: Call OpenRouter with retry ──────────────────────────────────────
async function callOpenRouter(
  model: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number = 2500,
  retries: number = 3
): Promise<string> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(OR_BASE, {
        method: "POST",
        headers: OR_HEADERS(),
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
          temperature: 0.75,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const errMsg = errData?.error?.message ?? `OpenRouter HTTP ${res.status}`;

        // Don't retry on auth errors
        if (res.status === 401 || res.status === 403) {
          throw new Error(`OpenRouter auth error: ${errMsg}`);
        }

        throw new Error(errMsg);
      }

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content ?? "";

      if (!text) throw new Error("Empty response from OpenRouter");

      return text;
    } catch (err: any) {
      lastError = err;
      if (attempt < retries) {
        // Exponential backoff: 1s, 2s, 4s
        await new Promise((r) => setTimeout(r, Math.pow(2, attempt - 1) * 1000));
      }
    }
  }

  throw lastError ?? new Error("OpenRouter call failed after retries");
}

// ─── Utility: Stream OpenRouter ───────────────────────────────────────────────
async function streamOpenRouter(
  model: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number = 2500
): Promise<ReadableStream> {
  const res = await fetch(OR_BASE, {
    method: "POST",
    headers: OR_HEADERS(),
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      temperature: 0.75,
      stream: true,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error?.message ?? `OpenRouter stream error: ${res.status}`);
  }

  return res.body!;
}

// ─── Utility: Analyze content quality ─────────────────────────────────────────
function analyzeContent(text: string, keywords: string) {
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const readingTimeMin = Math.ceil(wordCount / 200);
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const avgSentenceLength = wordCount / (sentences.length || 1);

  // Keyword density
  const keywordList = keywords
    ? keywords.split(",").map((k) => k.trim().toLowerCase())
    : [];
  const keywordDensity: Record<string, number> = {};
  for (const kw of keywordList) {
    if (!kw) continue;
    const regex = new RegExp(`\\b${kw}\\b`, "gi");
    const matches = text.match(regex);
    keywordDensity[kw] = matches
      ? parseFloat(((matches.length / wordCount) * 100).toFixed(2))
      : 0;
  }

  // Readability score (Flesch approximation)
  const syllables = words.reduce((sum, word) => {
    return sum + Math.max(1, word.replace(/[^aeiouAEIOU]/g, "").length);
  }, 0);
  const fleschScore = Math.round(
    206.835 -
      1.015 * (wordCount / (sentences.length || 1)) -
      84.6 * (syllables / wordCount)
  );

  // SEO score (basic)
  let seoScore = 60;
  if (wordCount >= 1000) seoScore += 10;
  if (wordCount >= 1500) seoScore += 5;
  if (text.includes("##") || text.includes("**")) seoScore += 10; // Has structure
  if (keywordList.length > 0 && Object.values(keywordDensity).some((d) => d >= 0.5 && d <= 2.5)) seoScore += 10;
  if (avgSentenceLength < 25) seoScore += 5;
  seoScore = Math.min(100, seoScore);

  return {
    wordCount,
    readingTimeMin,
    avgSentenceLength: parseFloat(avgSentenceLength.toFixed(1)),
    fleschReadabilityScore: Math.min(100, Math.max(0, fleschScore)),
    keywordDensity,
    seoScore,
  };
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface ContentInput {
  type: string;
  topic: string;
  tone?: string;
  keywords?: string;
  targetAudience?: string;
  wordCount?: number;
  language?: string;
  goal?: string;
  stream?: boolean;
  rewriteId?: string;      // For rewrite mode
  rewriteInstruction?: string;
}

// ─── GET: Fetch content history ───────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const page = parseInt(searchParams.get("page") ?? "1");
    const offset = (page - 1) * limit;
    const sortBy = searchParams.get("sort") ?? "created_at";
    const sortDir = searchParams.get("dir") === "asc";

        // Single item fetch
    const id = searchParams.get("id");
    if (id) {
      const { data, error: dbError } = await supabase
        .from("generated_content")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();
      if (dbError) throw dbError;
      return NextResponse.json({ content: data });
    }

    let query = supabase
      .from("generated_content")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .order(sortBy, { ascending: sortDir })
      .range(offset, offset + limit - 1);

    if (type) query = query.eq("type", type);
    if (search) query = query.ilike("topic", `%${search}%`);

    const { data, count, error: dbError } = await query;
    if (dbError) throw dbError;

    // Usage stats
    const { data: usageData } = await supabase
      .from("ai_usage")
      .select("daily_count, monthly_count, last_day, last_month")
      .eq("user_id", user.id)
      .eq("feature", "content_ai")
      .single();

    const today = new Date().toISOString().split("T")[0];
    const thisMonth = today.substring(0, 7);

    return NextResponse.json({
      content: data,
      total: count,
      page,
      limit,
      totalPages: Math.ceil((count ?? 0) / limit),
      usage: {
        dailyUsed: usageData?.last_day === today ? usageData.daily_count : 0,
        monthlyUsed: usageData?.last_month === thisMonth ? usageData.monthly_count : 0,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── POST: Generate content ───────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Rate limit check
    const rateLimit = await checkAndIncrementUsage(supabase, user.id, "content_ai");
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: rateLimit.reason,
          remaining: rateLimit.remaining,
          upgradeUrl: "/settings?tab=billing",
        },
        { status: 429 }
      );
    }

    const body: ContentInput = await req.json();
    const {
      type,
      topic,
      tone,
      keywords,
      targetAudience,
      wordCount,
      language,
      goal,
      stream: useStream = false,
      rewriteId,
      rewriteInstruction,
    } = body;

    if (!type || !topic) {
      return NextResponse.json(
        { error: "type and topic are required" },
        { status: 400 }
      );
    }

    if (!CONTENT_PROMPTS[type]) {
      return NextResponse.json(
        {
          error: `Invalid content type: ${type}`,
          validTypes: Object.keys(CONTENT_PROMPTS),
        },
        { status: 400 }
      );
    }

    // ── Rewrite mode ─────────────────────────────────────────────────────────
    if (rewriteId) {
      const { data: original, error: fetchError } = await supabase
        .from("generated_content")
        .select("*")
        .eq("id", rewriteId)
        .eq("user_id", user.id)
        .single();

      if (fetchError || !original) {
        return NextResponse.json({ error: "Original content not found" }, { status: 404 });
      }

      const rewritePrompt = `You are an expert content editor. Rewrite the following content based on this instruction:

INSTRUCTION: ${rewriteInstruction ?? "Improve clarity, engagement, and overall quality"}

ORIGINAL CONTENT:
${original.content}

Return only the rewritten content. Maintain the same format and structure unless the instruction says otherwise.`;

      const model = CONTENT_MODELS[type] ?? DEFAULT_MODEL;
      const rewritten = await callOpenRouter(
        model,
        "You are an expert content writer and editor.",
        rewritePrompt,
        3000
      );

      const analysis = analyzeContent(rewritten, keywords ?? original.keywords ?? "");

      const { data: saved, error: saveError } = await supabase
        .from("generated_content")
        .insert({
          user_id: user.id,
          type,
          topic: original.topic,
          tone: tone ?? original.tone,
          keywords: keywords ?? original.keywords,
          target_audience: targetAudience ?? original.target_audience,
          language: language ?? original.language ?? "English",
          content: rewritten,
          word_count: analysis.wordCount,
          reading_time_min: analysis.readingTimeMin,
          seo_score: analysis.seoScore,
          readability_score: analysis.fleschReadabilityScore,
          keyword_density: analysis.keywordDensity,
          model_used: model,
          is_rewrite: true,
          original_id: rewriteId,
        })
        .select()
        .single();

      if (saveError) throw saveError;

      return NextResponse.json(
        { content: saved, analysis, remaining: rateLimit.remaining },
        { status: 201 }
      );
    }

    // ── Build prompt ──────────────────────────────────────────────────────────
    const promptFn = CONTENT_PROMPTS[type];
    const fullPrompt = promptFn({
      type, topic, tone, keywords, targetAudience, wordCount, language, goal,
    });

    const model = CONTENT_MODELS[type] ?? DEFAULT_MODEL;
    const maxTok = type === "blog_article" || type === "youtube_script" || type === "case_study"
      ? 4000
      : type === "email_campaign" || type === "newsletter"
      ? 3000
      : 2000;

    const systemPrompt =
      "You are a world-class content creator and digital marketing expert. " +
      "Generate content that is engaging, accurate, and optimized for its platform. " +
      "Always follow the exact structure and format requested. Return only the content.";

    // ── Streaming mode ────────────────────────────────────────────────────────
    if (useStream) {
      const stream = await streamOpenRouter(model, systemPrompt, fullPrompt, maxTok);

      return new NextResponse(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          "X-Content-Type": type,
          "X-Model-Used": model,
          "X-Remaining-Daily": String(rateLimit.remaining?.daily ?? ""),
          "X-Remaining-Monthly": String(rateLimit.remaining?.monthly ?? ""),
        },
      });
    }

    // ── Non-streaming mode ────────────────────────────────────────────────────
    const generatedText = await callOpenRouter(model, systemPrompt, fullPrompt, maxTok);
    const analysis = analyzeContent(generatedText, keywords ?? "");

    // Save to Supabase
    const { data: saved, error: saveError } = await supabase
      .from("generated_content")
      .insert({
        user_id: user.id,
        type,
        topic,
        tone: tone ?? "Professional",
        keywords: keywords ?? null,
        target_audience: targetAudience ?? null,
        language: language ?? "English",
        content: generatedText,
        word_count: analysis.wordCount,
        reading_time_min: analysis.readingTimeMin,
        seo_score: analysis.seoScore,
        readability_score: analysis.fleschReadabilityScore,
        keyword_density: analysis.keywordDensity,
        model_used: model,
        is_rewrite: false,
        original_id: null,
      })
      .select()
      .single();

    if (saveError) throw saveError;

    // Activity log
    await supabase.from("activity_logs").insert({
      user_id: user.id,
      type: "content_generated",
      description: `Generated ${type}: "${topic.substring(0, 60)}"`,
      metadata: {
        content_id: saved.id,
        type,
        word_count: analysis.wordCount,
        seo_score: analysis.seoScore,
        model_used: model,
      },
    });

    return NextResponse.json(
      {
        content: saved,
        analysis,
        remaining: rateLimit.remaining,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("[Content AI Error]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── PATCH: Update content (title/notes) or mark as favourite ────────────────
export async function PATCH(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { id, favourite, notes, topic } = body;
    if (!id) return NextResponse.json({ error: "Content ID required" }, { status: 400 });

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (typeof favourite === "boolean") updates.favourite = favourite;
    if (notes !== undefined) updates.notes = notes;
    if (topic !== undefined) updates.topic = topic;

    const { data, error: updateError } = await supabase
      .from("generated_content")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({ content: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── DELETE: Remove content ───────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const bulk = searchParams.get("bulk"); // comma-separated IDs

    if (!id && !bulk) {
      return NextResponse.json({ error: "ID or bulk IDs required" }, { status: 400 });
    }

    if (bulk) {
      const ids = bulk.split(",").map((i) => i.trim()).filter(Boolean);
      const { error: deleteError } = await supabase
        .from("generated_content")
        .delete()
        .in("id", ids)
        .eq("user_id", user.id);
      if (deleteError) throw deleteError;
      return NextResponse.json({ message: `${ids.length} items deleted` });
    }

    const { error: deleteError } = await supabase
      .from("generated_content")
      .delete()
      .eq("id", id!)
      .eq("user_id", user.id);

    if (deleteError) throw deleteError;

    return NextResponse.json({ message: "Content deleted" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
      }
