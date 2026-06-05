// ============================================================
//  lib/openrouter.ts  —  WORKING CONFIG FOR ALL TOOLS
// ============================================================

const OPENROUTER_BASE = "https://openrouter.ai/api/v1/chat/completions";

// 🔴 SEO Audit wala original auto-router model jo bilkul sahi data nikal raha tha
const MODEL = "openrouter/auto"; 

// ─── Core Chat ───────────────────────────────────────────────
async function chat(
  messages: { role: string; content: string }[],
  maxTokens = 2000,
  retries = 3
): Promise<string> {
  // Dono env names ka support taake authentication pass ho jaye
  const apiKey = process.env.OPENROUT_API_KEY || process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OpenRouter API key missing in Vercel environment variables.");

  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(OPENROUTER_BASE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": "https://netlify.app",
          "X-Title": "Business OS"
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
        throw new Error(`OpenRouter error ${res.status}: ${errText}`);
      }

      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content || "";

      if (text.length > 5) return text;
      throw new Error("Empty response");
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise((r) => setTimeout(r, (i + 1) * 1500));
    }
  }
  throw new Error("AI request failed");
}

// ─── JSON Cleaner ─────────────────────────────────────────────
function cleanJSON(text: string): unknown {
  try {
    const cleaned = text.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
    const startBrace   = cleaned.indexOf("{");
    const startBracket = cleaned.indexOf("[");
    let start = -1;
    if (startBrace === -1 && startBracket === -1) throw new Error("No JSON");
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
    if (end === -1) throw new Error("Unbalanced");
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch { return null; }
}

// ─── SEO Audit ───────────────────────────────────────────────
export async function generateAuditReport(url: string) {
  const text = await chat([{
    role: "user",
    content: `You are an expert SEO analyst. Analyze: ${url}
Return ONLY valid JSON, no markdown, no text explanation outside JSON:
{"score":75,"performance":80,"seo":72,"accessibility":88,"bestPractices":85,"mobile":78,"loadTime":"2.1s","pageSize":"1.8 MB","wordCount":1240,"summary":"2-3 sentence summary.","issues":[{"severity":"HIGH","message":"issue1"},{"severity":"MEDIUM","message":"issue2"},{"severity":"LOW","message":"issue3"}],"recommendations":[{"text":"rec1","impact":"HIGH","expectedImpact":"impact1"},{"text":"rec2","impact":"MEDIUM","expectedImpact":"impact2"}],"keywords":["kw1","kw2","kw3","kw4","kw5"],"metaTags":{"title":"title here","description":"desc here","hasOG":true,"hasTwitterCard":false},"backlinks":{"estimated":"~1,200","domainAuthority":45}}`,
  }], 2000);
  const parsed = cleanJSON(text);
  if (parsed) return parsed;
  throw new Error("Audit parse failed");
}

// ─── Content Generation ──────────────────────────────────────
interface ContentParams {
  contentType: string; topic: string; tone: string;
  keywords: string[]; targetAudience: string; wordCount?: number;
}
const typeGuide: Record<string, string> = {
  blog:     "Write a full SEO blog article with H2/H3 headers, intro, 3-5 body sections, conclusion.",
  linkedin: "Write a LinkedIn post with strong hook, value insight, short paragraphs, CTA, 3-5 hashtags.",
  email:    "Write email with: Subject line, Preview text, Body (hook+value+CTA), Sign-off.",
  ad:       "Write 3 ads: [FACEBOOK] headline+body, [GOOGLE] 3 headlines+descriptions, [INSTAGRAM] caption+hashtags.",
  product:  "Write product description (150 words): opening, 3 benefits, social proof, CTA.",
  social:   "Write 3 posts: [TWITTER] under 280 chars, [INSTAGRAM] with hashtags, [FACEBOOK] conversational.",
};
export async function generateContent(params: ContentParams): Promise<string> {
  const { contentType, topic, tone, keywords, targetAudience, wordCount = 600 } = params;
  return chat([{
    role: "user",
    content: `You are a world-class ${tone} copywriter.
Task: ${typeGuide[contentType] || `Write ${contentType} content (~${wordCount} words).`}
Topic: ${topic}
Tone: ${tone}
Audience: ${targetAudience || "General audience"}
Keywords: ${keywords.join(", ") || "none"}
Write the content now:`,
  }], 2500);
}

// ─── Proposal Generator ──────────────────────────────────────
interface ProposalParams {
  clientName: string; clientBusiness?: string; projectType: string;
  projectDescription: string; budget?: string; timeline?: string;
  yourName?: string; yourCompany?: string;
}
export async function generateProposal(params: ProposalParams): Promise<string> {
  const { clientName, clientBusiness, projectType, projectDescription, budget, timeline, yourName, yourCompany } = params;
  return chat([{
    role: "user",
    content: `Write a professional project proposal.
Client: ${clientName}${clientBusiness ? ` (${clientBusiness})` : ""}
Project: ${projectType}
Description: ${projectDescription}
Budget: ${budget || "TBD"}
Timeline: ${timeline || "TBD"}
From: ${yourName || "Our Team"}${yourCompany ? `, ${yourCompany}` : ""}
Include: Executive Summary, Scope of Work, Timeline, Investment, Next Steps.`,
  }], 2500);
}

// ─── Lead Outreach Email ──────────────────────────────────────
interface LeadProposalParams {
  name: string; company: string; title?: string;
  industry?: string; description?: string;
}
export async function generateLeadProposal(lead: LeadProposalParams): Promise<string> {
  return chat([{
    role: "user",
    content: `Write a short personalized B2B cold outreach email:
Name: ${lead.name} | Title: ${lead.title || "Decision Maker"}
Company: ${lead.company} | Industry: ${lead.industry || "Business"}
Context: ${lead.description || "B2B services"}
Format: Subject line, 3-4 short paras (opener, pain point, solution, CTA), max 150 words body. Sound human.`,
  }], 1000);
}

// ─── Phone number generator by country ───────────────────────
function generatePhone(location: string): string {
  const loc = location.toLowerCase();
  if (loc.includes("new york") || loc.includes("usa") || loc.includes("toronto") || loc.includes("canada")) {
    return `+1 (212) ${Math.floor(Math.random()*900+100)}-${Math.floor(Math.random()*9000+1000)}`;
  }
  if (loc.includes("london") || loc.includes("uk")) {
    return `+44 20 ${Math.floor(Math.random()*9000+1000)} ${Math.floor(Math.random()*9000+1000)}`;
  }
  if (loc.includes("dubai") || loc.includes("uae")) {
    return `+971 50 ${Math.floor(Math.random()*900+100)} ${Math.floor(Math.random()*9000+1000)}`;
  }
  return `+1 (800) ${Math.floor(Math.random()*900+100)}-${Math.floor(Math.random()*9000+1000)}`;
}

// ─── Discover Leads — batch ───────────────────────────────────
async function fetchLeadBatch(
  query: string,
  industry: string,
  batchIndex: number
): Promise<unknown[]> {
  const regions = ["Global North", "Global South"];

  const text = await chat([{
    role: "user",
    content: `You are a world-class B2B lead researcher.
Generate EXACTLY 8 unique realistic B2B leads for:
Target: "${query}" | Industry: "${industry}" | Region: ${regions[batchIndex] || "Global"}

Return ONLY raw JSON array, no markdown wrap, no conversation outside JSON:
[{
  "name":"Full Name",
  "company":"Company Name",
  "role":"Job Title",
  "email":"firstname.lastname@companydomain.com",
  "website":"https://companydomain.com",
  "linkedinUrl":"https://linkedin.com/in/firstname-lastname",
  "industry":"${industry}",
  "location":"City, Country",
  "companySize":"51-200",
  "score":87,
  "tags":["tag1","tag2"],
  "description":"One sentence current business challenge."
}]`,
  }], 2500);

  const parsed = cleanJSON(text);
  let leads: unknown[] = [];
  if (Array.isArray(parsed)) {
    leads = parsed;
  } else if (parsed && typeof parsed === "object") {
    const obj = parsed as Record<string, unknown>;
    if (Array.isArray(obj.leads)) leads = obj.leads;
  }

  if (leads.length === 0) return []; 

  return leads.map((lead) => {
    const l = lead as Record<string, string>;
    return {
      ...l,
      phone: generatePhone(l.location || ""),
    };
  });
}

// ─── Discover Leads — public ──────────────────────────────────
export async function discoverLeads(params: {
  query: string;
  industry: string;
}): Promise<unknown[]> {
  const { query, industry } = params;

  const results = await Promise.allSettled([
    fetchLeadBatch(query, industry, 0),
    fetchLeadBatch(query, industry, 1),
  ]);

  const allLeads: unknown[] = [];
  const seenEmails = new Set<string>();

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    if (r.status === "fulfilled") {
      for (const lead of r.value) {
        const l = lead as Record<string, string>;
        const key = l.email?.toLowerCase().trim() || `lead-${Math.random()}`;
        if (!seenEmails.has(key)) {
          seenEmails.add(key);
          allLeads.push({ ...l, industry });
        }
      }
    }
  }

  return allLeads.sort((a: any, b: any) => (b.score ?? 0) - (a.score ?? 0));
  }
