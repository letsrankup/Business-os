// ============================================================
//  lib/openrouter.ts  —  SERVER-SIDE ONLY
//  FIXED: Now uses Anthropic API (already working in your app)
//  No need for OpenRouter credits anymore!
// ============================================================

const ANTHROPIC_BASE = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-opus-4-5"; // Best model for lead generation

// ─── Core Chat using Anthropic ───────────────────────────────
async function chat(
  messages: { role: string; content: string }[],
  maxTokens = 4000,
  retries = 3
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY not found. Please add it to Vercel Environment Variables."
    );
  }

  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(ANTHROPIC_BASE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: maxTokens,
          messages: messages.map((m) => ({
            role: m.role === "assistant" ? "assistant" : "user",
            content: m.content,
          })),
        }),
        cache: "no-store",
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Anthropic error ${res.status}: ${errText}`);
      }

      const data = await res.json();
      const text =
        data?.content
          ?.filter((b: { type: string }) => b.type === "text")
          .map((b: { text: string }) => b.text)
          .join("") || "";

      if (text.length > 5) return text;
      throw new Error("Empty response from AI");
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise((r) => setTimeout(r, (i + 1) * 1500));
    }
  }

  throw new Error("AI request failed after all retries");
}

// ─── JSON Cleaner ─────────────────────────────────────────────
function cleanJSON(text: string): unknown {
  try {
    const cleaned = text
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/gi, "")
      .trim();

    const startBrace   = cleaned.indexOf("{");
    const startBracket = cleaned.indexOf("[");

    let start = -1;
    if      (startBrace === -1 && startBracket === -1) throw new Error("No JSON");
    else if (startBrace === -1)   start = startBracket;
    else if (startBracket === -1) start = startBrace;
    else start = Math.min(startBrace, startBracket);

    const openChar  = cleaned[start] === "[" ? "[" : "{";
    const closeChar = openChar === "[" ? "]" : "}";

    let depth = 0, end = -1;
    for (let i = start; i < cleaned.length; i++) {
      if (cleaned[i] === openChar)  depth++;
      if (cleaned[i] === closeChar) depth--;
      if (depth === 0) { end = i; break; }
    }

    if (end === -1) throw new Error("Unbalanced JSON");
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return null;
  }
}

// ─── SEO Audit ───────────────────────────────────────────────
export async function generateAuditReport(url: string) {
  const text = await chat(
    [
      {
        role: "user",
        content: `You are an expert SEO analyst. Analyze this website: ${url}

Return ONLY valid JSON, no explanation, no markdown:
{
  "score": 75,
  "performance": 80,
  "seo": 72,
  "accessibility": 88,
  "bestPractices": 85,
  "mobile": 78,
  "loadTime": "2.1s",
  "pageSize": "1.8 MB",
  "wordCount": 1240,
  "summary": "2-3 sentence expert summary.",
  "issues": [
    {"severity":"HIGH","message":"Issue description here"},
    {"severity":"MEDIUM","message":"Issue description here"},
    {"severity":"LOW","message":"Issue description here"}
  ],
  "recommendations": [
    {"text":"Recommendation 1","impact":"HIGH","expectedImpact":"Improve ranking by 15%"},
    {"text":"Recommendation 2","impact":"MEDIUM","expectedImpact":"Reduce bounce rate"}
  ],
  "keywords": ["keyword1","keyword2","keyword3","keyword4","keyword5"],
  "metaTags": {
    "title": "page title",
    "description": "meta description",
    "hasOG": true,
    "hasTwitterCard": false
  },
  "backlinks": {
    "estimated": "~1,200",
    "domainAuthority": 45
  }
}`,
      },
    ],
    2000
  );

  const parsed = cleanJSON(text);
  if (parsed) return parsed;
  throw new Error("Audit parse failed — please try again");
}

// ─── Content Generation ──────────────────────────────────────
interface ContentParams {
  contentType: string;
  topic: string;
  tone: string;
  keywords: string[];
  targetAudience: string;
  wordCount?: number;
}

const typeGuide: Record<string, string> = {
  blog:     "Write a full SEO blog article with H2/H3 headers, strong intro, 3-5 body sections, and conclusion.",
  linkedin: "Write a LinkedIn post with strong hook, value insight, short paragraphs, CTA, and 3-5 hashtags.",
  email:    "Write email with: Subject line, Preview text, Body (hook + value + CTA), Sign-off.",
  ad:       "Write 3 ads: [FACEBOOK] headline+body, [GOOGLE] 3 headlines+descriptions, [INSTAGRAM] caption+hashtags.",
  product:  "Write product description (~150 words): opening, 3 key benefits, social proof, CTA.",
  social:   "Write 3 posts: [TWITTER] under 280 chars, [INSTAGRAM] with hashtags, [FACEBOOK] conversational.",
};

export async function generateContent(params: ContentParams): Promise<string> {
  const { contentType, topic, tone, keywords, targetAudience, wordCount = 600 } = params;
  return chat(
    [
      {
        role: "user",
        content: `You are a world-class ${tone} copywriter.

Task: ${typeGuide[contentType] || `Write ${contentType} content (~${wordCount} words).`}

Topic: ${topic}
Tone: ${tone}
Audience: ${targetAudience || "Business professionals"}
Keywords: ${keywords.join(", ") || "none"}

Write the content now:`,
      },
    ],
    4000
  );
}

// ─── Proposal Generator ──────────────────────────────────────
interface ProposalParams {
  clientName: string;
  clientBusiness?: string;
  projectType: string;
  projectDescription: string;
  budget?: string;
  timeline?: string;
  yourName?: string;
  yourCompany?: string;
}

export async function generateProposal(params: ProposalParams): Promise<string> {
  const {
    clientName, clientBusiness, projectType,
    projectDescription, budget, timeline, yourName, yourCompany,
  } = params;

  return chat(
    [
      {
        role: "user",
        content: `Write a professional project proposal.

Client: ${clientName}${clientBusiness ? ` (${clientBusiness})` : ""}
Project: ${projectType}
Description: ${projectDescription}
Budget: ${budget || "To be discussed"}
Timeline: ${timeline || "To be discussed"}
From: ${yourName || "Our Team"}${yourCompany ? `, ${yourCompany}` : ""}

Include: Executive Summary, Scope of Work, Timeline, Investment, Next Steps.
Write professionally and confidently:`,
      },
    ],
    4000
  );
}

// ─── Lead Outreach Email ──────────────────────────────────────
interface LeadProposalParams {
  name: string;
  company: string;
  title?: string;
  industry?: string;
  description?: string;
}

export async function generateLeadProposal(lead: LeadProposalParams): Promise<string> {
  return chat(
    [
      {
        role: "user",
        content: `Write a short personalized B2B cold outreach email:

Name: ${lead.name}
Title: ${lead.title || "Decision Maker"}
Company: ${lead.company}
Industry: ${lead.industry || "Business"}
Context: ${lead.description || "B2B services"}

Format:
- Subject: [subject line]
- Para 1: Personalized opener about their company
- Para 2: Their likely pain point
- Para 3: How you can help (outcome-focused)
- Para 4: Low-friction CTA (15-min call)
- Max 150 words body
- Sound human, not templated`,
      },
    ],
    1500
  );
}

// ─── Discover Leads — single batch ───────────────────────────
async function fetchLeadBatch(
  query: string,
  industry: string,
  batchIndex: number
): Promise<unknown[]> {
  const regions = ["North America & Europe", "Middle East, Asia & Australia"];

  const text = await chat(
    [
      {
        role: "user",
        content: `You are a world-class B2B lead researcher.

Generate EXACTLY 25 unique realistic B2B leads for:
Target: "${query}"
Industry: "${industry}"
Region: ${regions[batchIndex] || "Global"}

RULES:
- Realistic diverse full names (Western, Arab, South Asian, East Asian mix)
- Email: firstname.lastname@companydomain.com
- Website: https://companydomain.com (must match email domain)
- Job titles: CEO, CTO, VP Sales, Director, Head of, COO, CMO
- Company sizes: 11-50, 51-200, 201-500, 501-1000 (mix)
- Real cities: New York, London, Dubai, Singapore, Berlin, Toronto, Sydney, Mumbai, Amsterdam
- Score 62-99 (relevance to target)
- Tags: 2-3 specific business tags
- Description: ONE sentence — their specific current business challenge

Return ONLY raw JSON array. No markdown. No explanation:
[{"name":"Full Name","company":"Company Name","role":"Job Title","email":"name@company.com","website":"https://company.com","industry":"${industry}","location":"City, Country","companySize":"51-200","score":87,"tags":["tag1","tag2"],"description":"Specific challenge they face right now."}]`,
      },
    ],
    4000
  );

  const parsed = cleanJSON(text);
  if (Array.isArray(parsed) && parsed.length > 0) return parsed;

  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    const obj = parsed as Record<string, unknown>;
    if (Array.isArray(obj.leads)) return obj.leads;
    if (Array.isArray(obj.data))  return obj.data;
  }

  throw new Error(`Batch ${batchIndex + 1}: parse failed`);
}

// ─── Discover Leads — public (50 leads) ──────────────────────
export async function discoverLeads(params: {
  query: string;
  industry: string;
  count?: number;
}): Promise<unknown[]> {
  const { query, industry } = params;

  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "ANTHROPIC_API_KEY not configured. Add it in Vercel → Environment Variables."
    );
  }

  // Run 2 batches in parallel for 50 leads
  const results = await Promise.allSettled([
    fetchLeadBatch(query, industry, 0),
    fetchLeadBatch(query, industry, 1),
  ]);

  const allLeads: unknown[] = [];
  const seenEmails = new Set<string>();
  const errors: string[] = [];

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === "fulfilled") {
      for (const lead of result.value) {
        const l = lead as Record<string, string>;
        const key = l.email?.toLowerCase().trim() ?? `lead-${Math.random()}`;
        if (!seenEmails.has(key)) {
          seenEmails.add(key);
          allLeads.push({ ...l, industry });
        }
      }
    } else {
      errors.push(`Batch ${i + 1}: ${(result.reason as Error)?.message || "failed"}`);
      console.error(`Batch ${i + 1} failed:`, result.reason);
    }
  }

  // If at least 1 batch succeeded, return what we have
  if (allLeads.length > 0) {
    return (allLeads as Record<string, number>[]).sort(
      (a, b) => (b.score ?? 0) - (a.score ?? 0)
    );
  }

  throw new Error(
    "Lead discovery failed. Please try again in a few seconds."
  );
      }
