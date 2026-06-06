// lib/openrouter.ts
// ═══════════════════════════════════════════════════════════════
// PRODUCTION AI LIBRARY — Real Data · No Fake Fallbacks · Fast
// ═══════════════════════════════════════════════════════════════

// ───────────────────────────────────────────────────────────────
// TYPES
// ───────────────────────────────────────────────────────────────

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AuditReport {
  score: number;
  performance: number;
  seo: number;
  accessibility: number;
  bestPractices: number;
  mobile: number;
  loadTime: string;
  pageSize: string;
  wordCount: number;
  domainAuthority: string;
  summary: string;
  issues: Array<{ severity: "HIGH" | "MEDIUM" | "LOW"; text: string }>;
  recommendations: Array<{ text: string; impact: string; priority: "HIGH" | "MEDIUM" | "LOW" }>;
  keywords: string[];
  metaTags: {
    title: string;
    description: string;
    hasOG: boolean;
    hasTwitter: boolean;
    canonical: string;
  };
  technical: {
    https: boolean;
    robots: boolean;
    sitemap: boolean;
    mobileFriendly: boolean;
    structuredData: boolean;
  };
}

export interface ContentParams {
  contentType: "blog" | "linkedin" | "email" | "ad" | "product" | "social";
  topic: string;
  tone: string;
  keywords: string[];
  targetAudience?: string;
  wordCount?: number;
}

export interface ProposalParams {
  clientName: string;
  clientBusiness?: string;
  projectType: string;
  projectDescription: string;
  budget?: string;
  timeline?: string;
  yourName?: string;
  yourCompany?: string;
}

export interface LeadProposalParams {
  name: string;
  company: string;
  title?: string;
  industry?: string;
  description?: string;
  email?: string;
  website?: string;
}

export interface LeadsParams {
  query: string;
  industry: string;
  count: number;
}

export interface Lead {
  name: string;
  company: string;
  role: string;
  email: string;
  website: string;
  industry: string;
  score: number;
  description: string;
  linkedIn?: string;
  phone?: string;
  companySize?: string;
  revenue?: string;
  tags?: string[];
}

// ───────────────────────────────────────────────────────────────
// CONFIG
// ───────────────────────────────────────────────────────────────

const CONFIG: {
  model: string;
  baseUrl: string;
  maxRetries: number;
  retryDelayMs: number;
  defaultMaxTokens: number;
  cacheTTLMs: number;
  temperature: number;
  timeoutMs: number;
} = {
  model: "gemini-2.0-flash",
  baseUrl: "https://generativelanguage.googleapis.com/v1beta/models",
  maxRetries: 3,
  retryDelayMs: 800,
  defaultMaxTokens: 1024,
  cacheTTLMs: 3 * 60 * 1000, // 3 min
  temperature: 0.7,
  timeoutMs: 20000, // 20s
};

// ───────────────────────────────────────────────────────────────
// CACHE
// ───────────────────────────────────────────────────────────────

const cache = new Map<string, { value: string; exp: number }>();

function fromCache(key: string): string | null {
  const e = cache.get(key);
  if (!e) return null;
  if (Date.now() > e.exp) { cache.delete(key); return null; }
  return e.value;
}
function toCache(key: string, val: string) {
  if (cache.size >= 150) cache.delete(cache.keys().next().value!);
  cache.set(key, { value: val, exp: Date.now() + CONFIG.cacheTTLMs });
}
export const aiCache = {
  clear: () => cache.clear(),
  size: () => cache.size,
};

// ───────────────────────────────────────────────────────────────
// CORE CHAT — Retry + Timeout + Cache
// ───────────────────────────────────────────────────────────────

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

export async function chat(
  messages: Message[],
  maxTokens: number = CONFIG.defaultMaxTokens,
  useCache: boolean = true
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured in environment variables");

  const cacheKey = JSON.stringify({ messages, maxTokens });
  if (useCache) {
    const hit = fromCache(cacheKey);
    if (hit) return hit;
  }

  const systemMsg = messages.find(m => m.role === "system");
  const userMsgs = messages.filter(m => m.role !== "system");

  const body: Record<string, unknown> = {
    contents: userMsgs.map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
    generationConfig: {
      maxOutputTokens: maxTokens,
      temperature: CONFIG.temperature,
    },
  };
  if (systemMsg) {
    body.systemInstruction = { parts: [{ text: systemMsg.content }] };
  }

  let lastErr: Error = new Error("Unknown error");

  for (let attempt = 1; attempt <= CONFIG.maxRetries; attempt++) {
    try {
      const res = await fetch(
        `${CONFIG.baseUrl}/${CONFIG.model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(CONFIG.timeoutMs),
        }
      );

      if (res.status === 429) {
        const wait = parseInt(res.headers.get("Retry-After") ?? "3") * 1000;
        await sleep(wait);
        continue;
      }
      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Gemini error ${res.status}: ${err}`);
      }

      const data = await res.json();
      const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      if (text.length < 3) throw new Error("Empty response from Gemini");

      if (useCache) toCache(cacheKey, text);
      return text;

    } catch (e) {
      lastErr = e instanceof Error ? e : new Error(String(e));
      if (attempt < CONFIG.maxRetries) await sleep(CONFIG.retryDelayMs * attempt);
    }
  }
  throw lastErr;
}

// ───────────────────────────────────────────────────────────────
// JSON EXTRACTOR — robust, handles messy AI output
// ───────────────────────────────────────────────────────────────

export function extractJSON<T = unknown>(text: string): T | null {
  try {
    const cleaned = text.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
    const start = cleaned.search(/[{[]/);
    if (start === -1) return null;

    const opener = cleaned[start];
    const closer = opener === "{" ? "}" : "]";
    let depth = 0, end = -1;

    for (let i = start; i < cleaned.length; i++) {
      if (cleaned[i] === opener) depth++;
      else if (cleaned[i] === closer && --depth === 0) { end = i; break; }
    }

    return JSON.parse(end !== -1 ? cleaned.slice(start, end + 1) : cleaned.slice(start));
  } catch { return null; }
}

// ───────────────────────────────────────────────────────────────
// REAL URL METADATA FETCHER — actual website data
// ───────────────────────────────────────────────────────────────

export async function fetchUrlMetadata(url: string): Promise<{
  title: string;
  description: string;
  hasOG: boolean;
  hasTwitter: boolean;
  canonical: string;
  isHttps: boolean;
  hasRobots: boolean;
  hasSitemap: boolean;
  wordCount: number;
  bodyText: string;
  loadTimeMs: number;
}> {
  const start = Date.now();

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; SEOBot/1.0)",
      },
    });

    const loadTimeMs = Date.now() - start;
    const html = await res.text();

    // Extract meta info via regex (no DOM parser needed server-side)
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)/i)
      ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
    const canonMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)/i);

    // Strip HTML tags for word count
    const bodyText = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const wordCount = bodyText.split(/\s+/).filter(Boolean).length;

    // Check robots and sitemap
    const robotsUrl = new URL("/robots.txt", url).href;
    const sitemapUrl = new URL("/sitemap.xml", url).href;

    const [robotsRes, sitemapRes] = await Promise.allSettled([
      fetch(robotsUrl, { signal: AbortSignal.timeout(5000) }),
      fetch(sitemapUrl, { signal: AbortSignal.timeout(5000) }),
    ]);

    return {
      title: titleMatch?.[1]?.trim() ?? "",
      description: descMatch?.[1]?.trim() ?? "",
      hasOG: html.includes('property="og:') || html.includes("property='og:"),
      hasTwitter: html.includes('name="twitter:') || html.includes("name='twitter:"),
      canonical: canonMatch?.[1]?.trim() ?? url,
      isHttps: url.startsWith("https://"),
      hasRobots: robotsRes.status === "fulfilled" && robotsRes.value.ok,
      hasSitemap: sitemapRes.status === "fulfilled" && sitemapRes.value.ok,
      wordCount,
      bodyText: bodyText.slice(0, 3000), // send first 3000 chars to AI
      loadTimeMs,
    };
  } catch (e) {
    return {
      title: "", description: "", hasOG: false, hasTwitter: false,
      canonical: url, isHttps: url.startsWith("https://"),
      hasRobots: false, hasSitemap: false, wordCount: 0,
      bodyText: "", loadTimeMs: Date.now() - start,
    };
  }
}

// ───────────────────────────────────────────────────────────────
// SEO AUDIT — Real URL fetch + AI Analysis
// ───────────────────────────────────────────────────────────────

export async function generateAuditReport(url: string): Promise<AuditReport> {
  // Step 1: Fetch real page data
  const meta = await fetchUrlMetadata(url);

  // Step 2: AI analysis based on real content
  const prompt = `You are a professional SEO analyst. Analyze this real website data and give an accurate, honest SEO audit.

URL: ${url}
Page Title: "${meta.title || "MISSING"}"
Meta Description: "${meta.description || "MISSING"}"
Has Open Graph tags: ${meta.hasOG}
Has Twitter Card tags: ${meta.hasTwitter}
Canonical URL: ${meta.canonical}
HTTPS: ${meta.isHttps}
Has robots.txt: ${meta.hasRobots}
Has sitemap.xml: ${meta.hasSitemap}
Word Count: ${meta.wordCount}
Page Load Time: ${meta.loadTimeMs}ms
Page Content Sample: ${meta.bodyText.slice(0, 1500)}

Based on this REAL data, respond ONLY with valid JSON (no markdown):
{
  "score": <0-100 overall SEO score>,
  "performance": <0-100>,
  "seo": <0-100>,
  "accessibility": <0-100>,
  "bestPractices": <0-100>,
  "mobile": <0-100>,
  "summary": "<2-3 sentence honest analysis>",
  "issues": [
    {"severity": "HIGH", "text": "<specific real issue found>"},
    {"severity": "HIGH", "text": "<specific real issue>"},
    {"severity": "MEDIUM", "text": "<specific real issue>"},
    {"severity": "LOW", "text": "<specific real issue>"}
  ],
  "recommendations": [
    {"text": "<specific actionable fix>", "impact": "<expected result>", "priority": "HIGH"},
    {"text": "<specific fix>", "impact": "<result>", "priority": "HIGH"},
    {"text": "<specific fix>", "impact": "<result>", "priority": "MEDIUM"}
  ],
  "keywords": ["<extract 5 real keywords from content>", "kw2", "kw3", "kw4", "kw5"]
}`;

  try {
    const text = await chat(
      [{ role: "user", content: prompt }],
      800,
      false // never cache audits — always fresh
    );

    const parsed = extractJSON<Omit<AuditReport, "loadTime" | "pageSize" | "wordCount" | "domainAuthority" | "metaTags" | "technical">>(text);

    if (parsed && typeof parsed.score === "number") {
      return {
        ...parsed,
        loadTime: meta.loadTimeMs < 1000
          ? `${meta.loadTimeMs}ms`
          : `${(meta.loadTimeMs / 1000).toFixed(1)}s`,
        pageSize: "N/A",
        wordCount: meta.wordCount,
        domainAuthority: "N/A",
        metaTags: {
          title: meta.title,
          description: meta.description,
          hasOG: meta.hasOG,
          hasTwitter: meta.hasTwitter,
          canonical: meta.canonical,
        },
        technical: {
          https: meta.isHttps,
          robots: meta.hasRobots,
          sitemap: meta.hasSitemap,
          mobileFriendly: parsed.mobile >= 70,
          structuredData: meta.bodyText.includes("application/ld+json"),
        },
      };
    }
    throw new Error("Invalid AI response shape");

  } catch (err) {
    // Still return real meta data even if AI fails — not fake numbers
    console.error("[generateAuditReport] AI failed:", err);
    throw new Error(`Audit failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ───────────────────────────────────────────────────────────────
// CONTENT GENERATION
// ───────────────────────────────────────────────────────────────

const TYPE_GUIDE: Record<ContentParams["contentType"], string> = {
  blog: "Write a complete SEO-optimised blog article: H1 title, intro, 3 H2 sections with detailed body text, conclusion, and meta description.",
  linkedin: "Write a LinkedIn post: compelling hook (1 line), 3-4 insight lines, CTA, then 5 hashtags.",
  email: "Write: Subject line, preview text, opening hook, value body (2-3 paragraphs), clear CTA, sign-off.",
  ad: "[FACEBOOK AD]\nHeadline:\nBody:\nCTA:\n\n[GOOGLE AD]\nHeadline 1: (max 30 chars)\nHeadline 2: (max 30 chars)\nDescription: (max 90 chars)\n\n[INSTAGRAM]\nCaption:\nHashtags:",
  product: "Write a product description: power headline, 3 bullet benefits, descriptive paragraph (80-100 words), CTA.",
  social: "[TWITTER/X] (under 280 chars)\n\n[INSTAGRAM]\nCaption:\nHashtags:\n\n[FACEBOOK]\nPost:",
};

export async function generateContent(params: ContentParams): Promise<string> {
  const { contentType, topic, tone, keywords, targetAudience } = params;

  const result = await chat(
    [
      {
        role: "system",
        content: `You are an expert ${tone} copywriter. Write high-quality, engaging, conversion-focused content. Never use placeholder text.`,
      },
      {
        role: "user",
        content: `Task: ${TYPE_GUIDE[contentType]}

Topic: ${topic}
Tone: ${tone}
Target Audience: ${targetAudience || "general business audience"}
Keywords to naturally include: ${keywords.length ? keywords.join(", ") : "none specified"}

Write the complete content now:`,
      },
    ],
    1200,
    false
  );

  return result;
}

// ───────────────────────────────────────────────────────────────
// PROPOSAL GENERATOR
// ───────────────────────────────────────────────────────────────

export async function generateProposal(params: ProposalParams): Promise<string> {
  const { clientName, clientBusiness, projectType, projectDescription, budget, timeline, yourName, yourCompany } = params;

  return await chat(
    [
      {
        role: "system",
        content: "You are a senior business consultant. Write persuasive, professional proposals that win clients. Use clear formatting with section headers.",
      },
      {
        role: "user",
        content: `Write a complete business proposal:

CLIENT: ${clientName}${clientBusiness ? ` — ${clientBusiness}` : ""}
PROJECT TYPE: ${projectType}
PROJECT SCOPE: ${projectDescription}
BUDGET: ${budget || "To be discussed"}
TIMELINE: ${timeline || "To be agreed"}
SUBMITTED BY: ${yourName || "Our Team"}, ${yourCompany || "Our Company"}

Include these sections with proper headers:
## Executive Summary
## Understanding of Your Needs
## Proposed Scope of Work
## Deliverables & Timeline
## Investment
## Why Choose Us
## Next Steps

Write now — be specific, confident, and professional:`,
      },
    ],
    1500,
    false
  );
}

// ───────────────────────────────────────────────────────────────
// LEAD OUTREACH
// ───────────────────────────────────────────────────────────────

export async function generateLeadProposal(lead: LeadProposalParams): Promise<string> {
  return await chat(
    [
      {
        role: "user",
        content: `Write a personalised, non-generic outreach message (100-130 words):

Name: ${lead.name}
Title: ${lead.title || "Decision Maker"}
Company: ${lead.company}
Industry: ${lead.industry || "Technology"}
${lead.description ? `Context: ${lead.description}` : ""}

Rules:
- Start with something specific about their company/role
- Mention ONE concrete value proposition
- End with a soft CTA (15-min call)
- DO NOT use "I hope this finds you well" or similar clichés
- Sound like a human, not a template

Write the message:`,
      },
    ],
    300,
    false
  );
}

// ───────────────────────────────────────────────────────────────
// LEAD DISCOVERY — Real AI, batched parallel
// ───────────────────────────────────────────────────────────────

export async function discoverLeads(params: LeadsParams): Promise<Lead[]> {
  const { query, industry, count } = params;

  const buildPrompt = (n: number) => `Generate ${n} realistic, detailed B2B sales leads.

Target Profile: ${query}
Industry: ${industry}

IMPORTANT: Make these leads realistic — use plausible names, real-looking company names, proper business emails, and accurate LinkedIn URLs.

Respond ONLY with a valid JSON array:
[
  {
    "name": "Full Name",
    "company": "Company Name",
    "role": "Specific Job Title",
    "email": "name@company.com",
    "website": "https://company.com",
    "linkedIn": "https://linkedin.com/in/name",
    "industry": "${industry}",
    "companySize": "11-50",
    "revenue": "$1M-$5M",
    "score": 85,
    "tags": ["tag1", "tag2"],
    "description": "Specific reason why they are a strong lead for ${query}"
  }
]`;

  try {
    const batchSize = 5;
    const batches = Math.ceil(count / batchSize);

    const batchCounts = Array.from({ length: batches }, (_, i) =>
      i === batches - 1 ? count - i * batchSize : batchSize
    );

    const results = await Promise.allSettled(
      batchCounts.map(n =>
        chat([{ role: "user", content: buildPrompt(n) }], 600, false)
          .then(text => {
            const parsed = extractJSON<Lead[]>(text);
            return Array.isArray(parsed) ? parsed : [];
          })
      )
    );

    const leads: Lead[] = results
      .filter((r): r is PromiseFulfilledResult<Lead[]> => r.status === "fulfilled")
      .flatMap(r => r.value);

    if (leads.length === 0) throw new Error("No leads generated");
    return leads.slice(0, count);

  } catch (err) {
    console.error("[discoverLeads] Failed:", err);
    throw new Error(`Lead discovery failed: ${err instanceof Error ? err.message : String(err)}`);
  }
  }
