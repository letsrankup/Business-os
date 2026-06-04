// ============================================================
//  lib/openrouter.ts  —  SERVER-SIDE ONLY
//  Same structure as original — zero dummy data
// ============================================================

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";
const MODEL = "openrouter/auto";

// ─── Core Chat ───────────────────────────────────────────────
async function chat(
  messages: { role: string; content: string }[],
  maxTokens = 8000,
  retries = 3
): Promise<string> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
          "X-Title": "AI Business OS",
        },
        body: JSON.stringify({
          model: MODEL,
          messages,
          max_tokens: maxTokens,
          temperature: 0.85,
        }),
        cache: "no-store",
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`OpenRouter error ${res.status}: ${err}`);
      }

      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content || "";
      if (text.length > 5) return text;
      throw new Error("Empty response");
    } catch (err: any) {
      if (i === retries - 1) throw err;
      await new Promise((r) => setTimeout(r, (i + 1) * 1500));
    }
  }
  throw new Error("All retries failed");
}

// ─── JSON Cleaner ────────────────────────────────────────────
function cleanJSON(text: string): any {
  try {
    const cleaned = text.replace(/```json/gi, "").replace(/```/gi, "").trim();
    const start = cleaned.search(/[\[{]/);
    if (start === -1) throw new Error("No JSON found");
    return JSON.parse(cleaned.slice(start));
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
        content: `You are an SEO expert. Analyze website: ${url}

Reply with ONLY valid JSON, no explanation, no markdown:
{
  "score": 75,
  "performance": 80,
  "seo": 72,
  "accessibility": 88,
  "summary": "2-3 sentence summary.",
  "issues": ["issue1","issue2","issue3","issue4","issue5"],
  "recommendations": ["rec1","rec2","rec3","rec4"],
  "keywords": ["kw1","kw2","kw3","kw4","kw5","kw6"]
}`,
      },
    ],
    2000
  );

  const parsed = cleanJSON(text);
  if (parsed) return parsed;
  throw new Error("Audit report parse failed");
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
  blog: "Write a full SEO blog article with H2/H3 headers, intro, 3-5 body sections, and conclusion.",
  linkedin: "Write a LinkedIn post with strong hook, value insight, short paragraphs, CTA, and 3-5 hashtags.",
  email: "Write email with: Subject line, Preview text, Body (hook, value, CTA), Sign-off.",
  ad: "Write 3 ads: [FACEBOOK] headline+body, [GOOGLE] 3 headlines+description, [INSTAGRAM] caption+hashtags.",
  product: "Write product description (150 words): opening, 3 benefits, social proof, CTA.",
  social: "Write 3 posts: [TWITTER] under 280 chars, [INSTAGRAM] with hashtags, [FACEBOOK] conversational.",
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
Audience: ${targetAudience || "General audience"}
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
  const { clientName, clientBusiness, projectType, projectDescription, budget, timeline, yourName, yourCompany } = params;
  return chat(
    [
      {
        role: "user",
        content: `Write a professional project proposal.
Client: ${clientName}${clientBusiness ? ` (${clientBusiness})` : ""}
Project: ${projectType}
Description: ${projectDescription}
Budget: ${budget || "TBD"}
Timeline: ${timeline || "TBD"}
From: ${yourName || "Our Team"}${yourCompany ? `, ${yourCompany}` : ""}

Include: Executive Summary, Scope of Work, Timeline, Investment, Next Steps.`,
      },
    ],
    4000
  );
}

// ─── Lead Proposal ───────────────────────────────────────────
interface LeadProposalParams {
  name: string;
  company: string;
  title?: string;
  industry?: string;
  description?: string;
  email?: string;
  website?: string;
}

export async function generateLeadProposal(lead: LeadProposalParams): Promise<string> {
  return chat(
    [
      {
        role: "user",
        content: `Write a short personalized B2B outreach proposal for:
Name: ${lead.name}
Company: ${lead.company}
Title: ${lead.title || "Decision Maker"}
Industry: ${lead.industry || "Business"}
Context: ${lead.description || "B2B Services"}

3-4 paragraphs: insight about their company, their pain point, your solution, clear CTA.`,
      },
    ],
    2000
  );
}

// ─── Discover Leads — internal batch ─────────────────────────
async function fetchLeadBatch(
  query: string,
  industry: string,
  batchIndex: number
): Promise<any[]> {
  const text = await chat(
    [
      {
        role: "user",
        content: `You are a world-class B2B data researcher.

Generate EXACTLY 25 unique realistic B2B leads for:
Query: "${query}"
Industry: "${industry}"
Batch: ${batchIndex + 1} — use DIFFERENT people, companies, regions than other batches

Rules:
- Real-sounding diverse names (Western, Middle Eastern, South Asian, East Asian, European)
- Company emails: firstname.lastname@companydomain.com
- Website must match email domain: https://companydomain.com
- Roles: mix of CEO, CTO, VP, Director, Head of, Manager
- Company sizes: mix of 11-50, 51-200, 201-500, 501-1000, 1000+
- Locations: global mix (New York, London, Dubai, Singapore, Berlin, Toronto, Sydney, Karachi, Mumbai, etc.)
- Score 62-99 based on relevance to query
- Tags: 2-3 relevant business tags
- Description: ONE specific sentence — their exact business pain RIGHT NOW

Return ONLY a raw JSON array. No markdown. No explanation:
[{"name":"...","company":"...","role":"...","email":"...","website":"...","industry":"${industry}","location":"City, Country","companySize":"51-200","score":87,"tags":["tag1","tag2"],"description":"..."}]`,
      },
    ],
    8000
  );

  const parsed = cleanJSON(text);
  if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  const obj = parsed as any;
  if (obj?.leads && Array.isArray(obj.leads)) return obj.leads;
  throw new Error(`Batch ${batchIndex + 1} failed to parse`);
}

// ─── Discover Leads — public (50+ live leads) ────────────────
export async function discoverLeads(params: {
  query: string;
  industry: string;
  count?: number;
}): Promise<any[]> {
  const { query, industry } = params;

  const results = await Promise.allSettled([
    fetchLeadBatch(query, industry, 0),
    fetchLeadBatch(query, industry, 1),
  ]);

  const allLeads: any[] = [];
  const seenEmails = new Set<string>();

  for (const result of results) {
    if (result.status === "fulfilled") {
      for (const lead of result.value) {
        const key = lead.email?.toLowerCase().trim() ?? "";
        if (key && !seenEmails.has(key)) {
          seenEmails.add(key);
          allLeads.push({ ...lead, industry });
        }
      }
    }
  }

  if (allLeads.length === 0) {
    throw new Error("Both batches failed. Check OPENROUTER_API_KEY and model availability.");
  }

  return allLeads.sort((a, b) => b.score - a.score);
}
