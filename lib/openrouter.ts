// ============================================================
//  lib/openrouter.ts  —  SERVER-SIDE ONLY
//  FIXED: Anthropic API + Email + Phone Number in leads
// ============================================================

const ANTHROPIC_BASE = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-opus-4-5";

// ─── Core Chat ───────────────────────────────────────────────
async function chat(
  messages: { role: string; content: string }[],
  maxTokens = 4000,
  retries = 3
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not found.");

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
    if (end === -1) throw new Error("Unbalanced");
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch { return null; }
}

// ─── SEO Audit ───────────────────────────────────────────────
export async function generateAuditReport(url: string) {
  const text = await chat([{
    role: "user",
    content: `You are an expert SEO analyst. Analyze: ${url}
Return ONLY valid JSON, no markdown:
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
  }], 4000);
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
  }], 4000);
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
  }], 1500);
}

// ─── Phone number generator by country ───────────────────────
function generatePhone(location: string): string {
  const loc = location.toLowerCase();

  if (loc.includes("new york") || loc.includes("usa") || loc.includes("toronto") || loc.includes("canada")) {
    const area = ["212","646","917","347","718","416","647","437"][Math.floor(Math.random()*8)];
    return `+1 (${area}) ${Math.floor(Math.random()*900+100)}-${Math.floor(Math.random()*9000+1000)}`;
  }
  if (loc.includes("london") || loc.includes("uk") || loc.includes("manchester")) {
    return `+44 20 ${Math.floor(Math.random()*9000+1000)} ${Math.floor(Math.random()*9000+1000)}`;
  }
  if (loc.includes("dubai") || loc.includes("abu dhabi") || loc.includes("uae")) {
    return `+971 ${Math.floor(Math.random()*9+1)*10+Math.floor(Math.random()*9)} ${Math.floor(Math.random()*900+100)} ${Math.floor(Math.random()*9000+1000)}`;
  }
  if (loc.includes("singapore")) {
    return `+65 ${Math.floor(Math.random()*9000+6000)} ${Math.floor(Math.random()*9000+1000)}`;
  }
  if (loc.includes("berlin") || loc.includes("germany") || loc.includes("munich")) {
    return `+49 30 ${Math.floor(Math.random()*90000000+10000000)}`;
  }
  if (loc.includes("sydney") || loc.includes("melbourne") || loc.includes("australia")) {
    return `+61 2 ${Math.floor(Math.random()*90000000+10000000)}`;
  }
  if (loc.includes("mumbai") || loc.includes("delhi") || loc.includes("india") || loc.includes("bangalore")) {
    return `+91 ${Math.floor(Math.random()*9000+6000)} ${Math.floor(Math.random()*900+100)} ${Math.floor(Math.random()*9000+1000)}`;
  }
  if (loc.includes("karachi") || loc.includes("lahore") || loc.includes("islamabad") || loc.includes("pakistan")) {
    return `+92 ${Math.floor(Math.random()*9+1)*100+Math.floor(Math.random()*99)} ${Math.floor(Math.random()*9000000+1000000)}`;
  }
  if (loc.includes("amsterdam") || loc.includes("netherlands")) {
    return `+31 20 ${Math.floor(Math.random()*9000000+1000000)}`;
  }
  if (loc.includes("paris") || loc.includes("france")) {
    return `+33 1 ${Math.floor(Math.random()*90000000+10000000)}`;
  }
  if (loc.includes("riyadh") || loc.includes("jeddah") || loc.includes("saudi")) {
    return `+966 5${Math.floor(Math.random()*9)} ${Math.floor(Math.random()*900+100)} ${Math.floor(Math.random()*9000+1000)}`;
  }
  // Default international
  const codes = ["+1", "+44", "+49", "+33", "+61", "+65"];
  return `${codes[Math.floor(Math.random()*codes.length)]} ${Math.floor(Math.random()*900+100)} ${Math.floor(Math.random()*900+100)} ${Math.floor(Math.random()*9000+1000)}`;
}

// ─── Discover Leads — batch ───────────────────────────────────
async function fetchLeadBatch(
  query: string,
  industry: string,
  batchIndex: number
): Promise<unknown[]> {
  const regions = ["North America & Europe", "Middle East, Asia & Australia"];

  const text = await chat([{
    role: "user",
    content: `You are a world-class B2B lead researcher.
Generate EXACTLY 25 unique realistic B2B leads for:
Target: "${query}" | Industry: "${industry}" | Region: ${regions[batchIndex] || "Global"}

RULES:
- Realistic diverse full names (Western, Arab, South Asian, East Asian)
- Email: firstname.lastname@companydomain.com
- Website: https://companydomain.com (must match email domain)
- Titles: CEO, CTO, VP Sales, Director, Head of, COO, CMO (mix)
- Company sizes: 11-50, 51-200, 201-500 (mix)
- Real cities: New York, London, Dubai, Singapore, Berlin, Toronto, Sydney, Mumbai, Amsterdam, Karachi
- Score 62-99 based on fit
- Tags: 2-3 specific relevant tags
- Description: ONE sentence of their specific current business challenge
- linkedinUrl: realistic LinkedIn URL format

Return ONLY raw JSON array, no markdown, no explanation:
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
  "description":"Their specific current business challenge."
}]`,
  }], 4000);

  const parsed = cleanJSON(text);

  let leads: unknown[] = [];
  if (Array.isArray(parsed) && parsed.length > 0) {
    leads = parsed;
  } else if (parsed && typeof parsed === "object") {
    const obj = parsed as Record<string, unknown>;
    if (Array.isArray(obj.leads)) leads = obj.leads;
    else if (Array.isArray(obj.data)) leads = obj.data;
  }

  if (leads.length === 0) throw new Error(`Batch ${batchIndex + 1} parse failed`);

  // Add phone number based on location
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
  count?: number;
}): Promise<unknown[]> {
  const { query, industry } = params;

  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY not configured in Vercel Environment Variables.");
  }

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
    } else {
      console.error(`Batch ${i + 1} failed:`, r.reason);
    }
  }

  if (allLeads.length > 0) {
    return (allLeads as Record<string, number>[]).sort(
      (a, b) => (b.score ?? 0) - (a.score ?? 0)
    );
  }

  throw new Error("Lead discovery failed. Please try again.");
          }
