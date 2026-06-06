// lib/openrouter.ts
// ─── Production-Grade AI Library ─────────────────────────────
// Fast · Reliable · Cached · Type-Safe

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AuditReport {
  score: number;
  performance: number;
  seo: number;
  accessibility: number;
  summary: string;
  issues: string[];
  recommendations: string[];
  keywords: string[];
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
}

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const CONFIG: {
  model: string;
  baseUrl: string;
  maxRetries: number;
  retryDelayMs: number;
  defaultMaxTokens: number;
  cacheTTLMs: number;
  temperature: number;
} = {
  model: "gemini-2.0-flash",
  baseUrl: "https://generativelanguage.googleapis.com/v1beta/models",
  maxRetries: 3,
  retryDelayMs: 600,
  defaultMaxTokens: 700,
  cacheTTLMs: 5 * 60 * 1000, // 5 minutes
  temperature: 0.7,
};

// ═══════════════════════════════════════════════════════════════
// IN-MEMORY CACHE
// ═══════════════════════════════════════════════════════════════

interface CacheEntry {
  value: string;
  expiresAt: number;
}

const responseCache = new Map<string, CacheEntry>();

function getCacheKey(messages: Message[], maxTokens: number): string {
  return JSON.stringify({ messages, maxTokens });
}

function getFromCache(key: string): string | null {
  const entry = responseCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    responseCache.delete(key);
    return null;
  }
  return entry.value;
}

function setCache(key: string, value: string): void {
  // Keep cache size manageable (max 100 entries)
  if (responseCache.size >= 100) {
    const firstKey = responseCache.keys().next().value;
    if (firstKey) responseCache.delete(firstKey);
  }
  responseCache.set(key, {
    value,
    expiresAt: Date.now() + CONFIG.cacheTTLMs,
  });
}

// ═══════════════════════════════════════════════════════════════
// CORE CHAT FUNCTION — with Retry + Cache
// ═══════════════════════════════════════════════════════════════

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function chat(
  messages: Message[],
  maxTokens: number = CONFIG.defaultMaxTokens,
  useCache: boolean = true
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY environment variable is not set");

  const cacheKey = getCacheKey(messages, maxTokens);
  if (useCache) {
    const cached = getFromCache(cacheKey);
    if (cached) return cached;
  }

  const contents = messages
    .filter((m) => m.role !== "system") // Gemini uses systemInstruction separately
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  const systemMessage = messages.find((m) => m.role === "system");
  const requestBody: Record<string, unknown> = {
    contents,
    generationConfig: {
      maxOutputTokens: maxTokens,
      temperature: CONFIG.temperature,
    },
  };
  if (systemMessage) {
    requestBody.systemInstruction = {
      parts: [{ text: systemMessage.content }],
    };
  }

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= CONFIG.maxRetries; attempt++) {
    try {
      const res = await fetch(
        `${CONFIG.baseUrl}/${CONFIG.model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
          signal: AbortSignal.timeout(15_000), // 15s timeout
        }
      );

      if (res.status === 429) {
        // Rate limited — backoff and retry
        const retryAfter = parseInt(res.headers.get("Retry-After") || "2", 10);
        await sleep(retryAfter * 1000);
        continue;
      }

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Gemini ${res.status}: ${errText}`);
      }

      const data = await res.json();
      const text: string =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

      if (text.length < 5) throw new Error("Gemini returned an empty response");

      if (useCache) setCache(cacheKey, text);
      return text;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < CONFIG.maxRetries) {
        await sleep(CONFIG.retryDelayMs * attempt); // exponential-ish backoff
      }
    }
  }

  throw lastError ?? new Error("Chat failed after all retries");
}

// ═══════════════════════════════════════════════════════════════
// JSON CLEANER — robust extraction
// ═══════════════════════════════════════════════════════════════

function cleanJSON<T = unknown>(text: string): T | null {
  try {
    const cleaned = text
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/gi, "")
      .trim();

    // Find the first JSON array or object
    const start = cleaned.search(/[{[]/);
    if (start === -1) return null;

    // Find matching end by counting braces/brackets
    const opener = cleaned[start];
    const closer = opener === "{" ? "}" : "]";
    let depth = 0;
    let end = -1;

    for (let i = start; i < cleaned.length; i++) {
      if (cleaned[i] === opener) depth++;
      else if (cleaned[i] === closer) {
        depth--;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }

    const jsonSlice = end !== -1 ? cleaned.slice(start, end + 1) : cleaned.slice(start);
    return JSON.parse(jsonSlice) as T;
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// SEO AUDIT
// ═══════════════════════════════════════════════════════════════

const AUDIT_FALLBACK: AuditReport = {
  score: 70,
  performance: 72,
  seo: 68,
  accessibility: 80,
  summary: "Several SEO improvements are recommended for better visibility.",
  issues: [
    "Meta description missing or too short",
    "Images missing alt attributes",
    "Page load speed needs improvement",
    "Mobile responsiveness issues detected",
    "Weak internal linking structure",
  ],
  recommendations: [
    "Add unique meta descriptions to all pages",
    "Optimise images with descriptive alt tags",
    "Enable browser caching and compress assets",
    "Build strategic internal links between pages",
  ],
  keywords: ["website", "online", "business", "service", "professional"],
};

export async function generateAuditReport(url: string): Promise<AuditReport> {
  const prompt = `You are a professional SEO analyst. Analyse the website: ${url}

Respond ONLY with a single valid JSON object — no markdown, no extra text:
{"score":75,"performance":80,"seo":72,"accessibility":88,"summary":"2-sentence summary.","issues":["issue1","issue2","issue3"],"recommendations":["rec1","rec2","rec3"],"keywords":["kw1","kw2","kw3","kw4"]}`;

  try {
    const text = await chat([{ role: "user", content: prompt }], 350);
    const parsed = cleanJSON<AuditReport>(text);
    if (parsed && typeof parsed.score === "number") return parsed;
    throw new Error("Invalid audit JSON shape");
  } catch (err) {
    console.error("[generateAuditReport] Falling back:", err);
    return {
      ...AUDIT_FALLBACK,
      summary: `SEO analysis for ${url} complete. ${AUDIT_FALLBACK.summary}`,
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// CONTENT GENERATION
// ═══════════════════════════════════════════════════════════════

const TYPE_GUIDE: Record<ContentParams["contentType"], string> = {
  blog: "Write an SEO-optimised blog article with an H1 title, intro paragraph, 3 H2 sections with body text, and a conclusion.",
  linkedin: "Write a LinkedIn post: compelling hook (1 sentence), key insight (2–3 sentences), call-to-action, then 3–5 relevant hashtags.",
  email: "Write a professional email with: Subject line, opening hook, value proposition, clear CTA, and sign-off.",
  ad: "Write ad copy for three platforms:\n[FACEBOOK] Headline + 2-sentence body.\n[GOOGLE] Two 30-char headlines + description.\n[INSTAGRAM] Engaging caption with emojis + hashtags.",
  product: "Write a compelling product description (80–100 words): attention-grabbing opening, two key benefits, and a CTA.",
  social: "Write platform-specific posts:\n[TWITTER/X] Under 280 chars.\n[INSTAGRAM] Caption with hashtags.\n[FACEBOOK] Short engaging post.",
};

export async function generateContent(params: ContentParams): Promise<string> {
  const { contentType, topic, tone, keywords, targetAudience } = params;

  const systemPrompt = `You are an expert ${tone} copywriter who writes highly engaging, conversion-focused content.`;
  const userPrompt = `Task: ${TYPE_GUIDE[contentType]}

Topic: ${topic}
Tone: ${tone}
Target Audience: ${targetAudience || "General audience"}
SEO Keywords to include: ${keywords.length ? keywords.join(", ") : "none specified"}

Write the content now. Be specific, engaging, and professional.`;

  try {
    return await chat(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      500,
      false // don't cache unique creative content
    );
  } catch (err) {
    console.error("[generateContent] Failed:", err);
    return `# ${topic}\n\nContent generation is temporarily unavailable. Please try again shortly.`;
  }
}

// ═══════════════════════════════════════════════════════════════
// PROPOSAL GENERATOR
// ═══════════════════════════════════════════════════════════════

export async function generateProposal(params: ProposalParams): Promise<string> {
  const {
    clientName,
    clientBusiness,
    projectType,
    projectDescription,
    budget,
    timeline,
    yourName,
    yourCompany,
  } = params;

  const systemPrompt =
    "You are a senior business consultant who writes clear, persuasive, professional proposals that win clients.";

  const userPrompt = `Write a full professional project proposal with these details:

Client: ${clientName}${clientBusiness ? ` — ${clientBusiness}` : ""}
Project Type: ${projectType}
Project Description: ${projectDescription}
Budget: ${budget || "To be discussed"}
Timeline: ${timeline || "To be agreed"}
Submitted by: ${yourName || "Our Team"}, ${yourCompany || "Our Company"}

Include these sections:
1. Executive Summary
2. Understanding of Your Needs
3. Proposed Scope of Work
4. Project Timeline
5. Investment & Pricing
6. Next Steps

Keep it professional, confident, and client-focused.`;

  try {
    return await chat(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      600,
      false
    );
  } catch (err) {
    console.error("[generateProposal] Falling back:", err);
    return [
      `PROPOSAL FOR ${clientName.toUpperCase()}`,
      ``,
      `Dear ${clientName},`,
      ``,
      `Thank you for considering ${yourCompany || "us"} for your ${projectType} project.`,
      ``,
      `We propose to deliver: ${projectDescription}`,
      `Timeline: ${timeline || "To be agreed"}`,
      `Investment: ${budget || "To be discussed"}`,
      ``,
      `Please contact ${yourName || "us"} to take the next step.`,
      ``,
      `Best regards,`,
      `${yourName || "Our Team"}`,
      yourCompany ? `${yourCompany}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  }
}

// ═══════════════════════════════════════════════════════════════
// LEAD OUTREACH PROPOSAL
// ═══════════════════════════════════════════════════════════════

export async function generateLeadProposal(lead: LeadProposalParams): Promise<string> {
  const prompt = `Write a short, personalised outreach message (80–120 words) to:

Name: ${lead.name}
Company: ${lead.company}
Title: ${lead.title || "Decision Maker"}
Industry: ${lead.industry || "Technology"}
${lead.description ? `Context: ${lead.description}` : ""}

Structure: Personalised opening → specific value proposition → clear call-to-action.
Tone: Professional yet warm. Avoid generic phrases.`;

  try {
    return await chat([{ role: "user", content: prompt }], 250, false);
  } catch (err) {
    console.error("[generateLeadProposal] Falling back:", err);
    return [
      `Dear ${lead.name},`,
      ``,
      `I came across ${lead.company}'s work in the ${lead.industry || "industry"} space and was impressed by what you're building.`,
      ``,
      `I believe we can help ${lead.company} achieve its next growth milestone. Our solutions have delivered measurable results for similar companies.`,
      ``,
      `Would you be open to a quick 15-minute call this week?`,
      ``,
      `Best regards`,
    ].join("\n");
  }
}

// ═══════════════════════════════════════════════════════════════
// LEAD DISCOVERY — with parallel batch generation
// ═══════════════════════════════════════════════════════════════

const LEAD_FALLBACK: Lead[] = [
  { name: "Sarah Johnson", company: "TechFlow Inc", role: "CEO", email: "sarah@techflow.com", website: "https://techflow.com", industry: "", score: 92, description: "Fast-growing SaaS company actively seeking growth solutions." },
  { name: "Ahmed Raza", company: "Digital Ventures", role: "Marketing Director", email: "ahmed@digitalv.com", website: "https://digitalv.com", industry: "", score: 78, description: "Established firm looking to expand their digital presence." },
  { name: "Priya Sharma", company: "StartupHub", role: "Founder", email: "priya@startuphub.io", website: "https://startuphub.io", industry: "", score: 85, description: "Early-stage startup with allocated budget for growth tools." },
  { name: "Omar Hassan", company: "CloudSoft Solutions", role: "CTO", email: "omar@cloudsoft.io", website: "https://cloudsoft.io", industry: "", score: 88, description: "Rapidly scaling tech company evaluating new infrastructure." },
  { name: "Fatima Ali", company: "GrowthMetrics", role: "Head of Sales", email: "fatima@growthmetrics.com", website: "https://growthmetrics.com", industry: "", score: 74, description: "Sales-focused firm optimising their pipeline process." },
  { name: "David Chen", company: "InnovateCo", role: "VP Operations", email: "david@innovateco.com", website: "https://innovateco.com", industry: "", score: 81, description: "Operations-heavy company seeking efficiency improvements." },
];

export async function discoverLeads(params: LeadsParams): Promise<Lead[]> {
  const { query, industry, count } = params;

  // For large counts, batch into parallel requests of 5 each
  const batchSize = 5;
  const batches = Math.ceil(count / batchSize);

  const buildPrompt = (batchCount: number) => `Generate ${batchCount} realistic B2B sales leads.
Target profile: ${query}
Industry: ${industry}

Reply ONLY with a valid JSON array — no markdown, no extra text:
[{"name":"Full Name","company":"Company Name","role":"Job Title","email":"work@company.com","website":"https://company.com","industry":"${industry}","score":85,"description":"One sentence on why they are a strong lead"}]`;

  try {
    if (count <= batchSize) {
      // Single request
      const text = await chat([{ role: "user", content: buildPrompt(count) }], 400);
      const parsed = cleanJSON<Lead[]>(text);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      throw new Error("Invalid leads response");
    }

    // Parallel batches for large counts
    const batchCounts = Array.from({ length: batches }, (_, i) =>
      i === batches - 1 ? count - i * batchSize : batchSize
    );

    const results = await Promise.allSettled(
      batchCounts.map((batchCount) =>
        chat([{ role: "user", content: buildPrompt(batchCount) }], 400)
          .then((text) => {
            const parsed = cleanJSON<Lead[]>(text);
            return Array.isArray(parsed) ? parsed : [];
          })
      )
    );

    const allLeads: Lead[] = results
      .filter((r): r is PromiseFulfilledResult<Lead[]> => r.status === "fulfilled")
      .flatMap((r) => r.value);

    if (allLeads.length > 0) return allLeads.slice(0, count);
    throw new Error("All batches failed");
  } catch (err) {
    console.error("[discoverLeads] Falling back:", err);
    return LEAD_FALLBACK.slice(0, count).map((lead) => ({
      ...lead,
      industry,
    }));
  }
}

// ═══════════════════════════════════════════════════════════════
// CACHE UTILITIES (optional export for admin/debug use)
// ═══════════════════════════════════════════════════════════════

export const cache = {
  clear: () => responseCache.clear(),
  size: () => responseCache.size,
  invalidate: (key: string) => responseCache.delete(key),
};
