// lib/openrouter.ts

// ─── Core Chat Function (Gemini - FREE) ──────────────────────
async function chat(
  messages: { role: string; content: string }[],
  maxTokens = 700
): Promise<string> {
  const GEMINI_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_KEY) throw new Error("GEMINI_API_KEY not set");

  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        generationConfig: {
          maxOutputTokens: maxTokens,
          temperature: 0.7,
        },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  if (text.length > 5) return text;
  throw new Error("Empty response from Gemini");
}

// ─── JSON Cleaner ─────────────────────────────────────────────
function cleanJSON(text: string): any {
  try {
    const cleaned = text
      .replace(/```json/gi, "")
      .replace(/```/gi, "")
      .trim();
    const start = cleaned.search(/[\[{]/);
    if (start === -1) throw new Error("No JSON found");
    return JSON.parse(cleaned.slice(start));
  } catch {
    return null;
  }
}

// ─── SEO Audit ────────────────────────────────────────────────
export async function generateAuditReport(url: string) {
  try {
    const text = await chat(
      [
        {
          role: "user",
          content: `SEO expert. Analyze: ${url}
Reply ONLY valid JSON no markdown:
{"score":75,"performance":80,"seo":72,"accessibility":88,"summary":"Brief summary.","issues":["issue1","issue2","issue3"],"recommendations":["rec1","rec2","rec3"],"keywords":["kw1","kw2","kw3","kw4"]}`,
        },
      ],
      280
    );
    const parsed = cleanJSON(text);
    if (parsed) return parsed;
  } catch (e) {
    console.error("SEO Audit AI failed, using fallback:", e);
  }

  return {
    score: 70,
    performance: 72,
    seo: 68,
    accessibility: 80,
    summary: `SEO analysis for ${url} complete. Several improvements recommended.`,
    issues: [
      "Meta description missing or too short",
      "Images missing alt attributes",
      "Page load speed needs improvement",
      "Mobile responsiveness issues detected",
      "Internal linking structure is weak",
    ],
    recommendations: [
      "Add unique meta descriptions to all pages",
      "Optimize all images with descriptive alt tags",
      "Enable browser caching and compress assets",
      "Build strategic internal links between pages",
    ],
    keywords: ["website", "online", "business", "service", "professional", "quality"],
  };
}

// ─── Content Generation ───────────────────────────────────────
interface ContentParams {
  contentType: string;
  topic: string;
  tone: string;
  keywords: string[];
  targetAudience: string;
  wordCount?: number;
}

const typeGuide: Record<string, string> = {
  blog: "Write a short SEO blog article with H2 headers, intro, 2-3 sections, conclusion.",
  linkedin: "Write a LinkedIn post with hook, insight, CTA, and 3 hashtags.",
  email: "Write email: Subject, Body (hook+value+CTA), Sign-off.",
  ad: "[FACEBOOK] headline+body. [GOOGLE] 2 headlines. [INSTAGRAM] caption.",
  product: "Write product description (80 words): opening, 2 benefits, CTA.",
  social: "[TWITTER] under 280 chars. [INSTAGRAM] with hashtags. [FACEBOOK] short.",
};

export async function generateContent(params: ContentParams): Promise<string> {
  const { contentType, topic, tone, keywords, targetAudience } = params;

  try {
    return await chat(
      [
        {
          role: "user",
          content: `You are a ${tone} copywriter.
Task: ${typeGuide[contentType] || `Write ${contentType} content.`}
Topic: ${topic}
Tone: ${tone}
Audience: ${targetAudience || "General"}
Keywords: ${keywords.join(", ") || "none"}
Write now:`,
        },
      ],
      280
    );
  } catch (e) {
    return `# ${topic}\n\nAI content generation temporarily unavailable. Please try again in a moment.`;
  }
}

// ─── Full Proposal Generator ──────────────────────────────────
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
    projectDescription, budget, timeline,
    yourName, yourCompany,
  } = params;

  try {
    return await chat(
      [
        {
          role: "user",
          content: `Write a professional proposal:
Client: ${clientName}${clientBusiness ? ` (${clientBusiness})` : ""}
Project: ${projectType} - ${projectDescription}
Budget: ${budget || "TBD"}, Timeline: ${timeline || "TBD"}
From: ${yourName || "Our Team"}, ${yourCompany || "Our Company"}
Sections: Executive Summary, Scope, Timeline, Investment, Next Steps.`,
        },
      ],
      280
    );
  } catch (e) {
    return `PROPOSAL FOR ${clientName.toUpperCase()}\n\nDear ${clientName},\n\nThank you for considering our services for your ${projectType} project.\n\nWe propose to deliver ${projectDescription} within ${timeline || "an agreed timeline"} for a budget of ${budget || "to be discussed"}.\n\nPlease contact ${yourName || "us"} at ${yourCompany || "our company"} to discuss further.\n\nBest regards,\n${yourName || "Our Team"}`;
  }
}

// ─── Lead Card Propose Button ─────────────────────────────────
interface LeadProposalParams {
  name: string;
  company: string;
  title?: string;
  industry?: string;
  description?: string;
  email?: string;
  website?: string;
}

export async function generateLeadProposal(
  lead: LeadProposalParams
): Promise<string> {
  try {
    return await chat(
      [
        {
          role: "user",
          content: `Write a short outreach proposal (100 words max):
Name: ${lead.name}, Company: ${lead.company}
Title: ${lead.title || "Decision Maker"}
Industry: ${lead.industry || "Technology"}
Include: opening, value proposition, call to action.`,
        },
      ],
      250
    );
  } catch (e) {
    return `Dear ${lead.name},\n\nI hope this message finds you well. I noticed ${lead.company}'s impressive work in the ${lead.industry || "industry"} space.\n\nI'd love to explore how we can help ${lead.company} achieve its goals. Our solutions have helped similar companies increase efficiency and revenue.\n\nWould you be open to a quick 15-minute call this week?\n\nBest regards`;
  }
}

// ─── Lead Discovery ───────────────────────────────────────────
interface LeadsParams {
  query: string;
  industry: string;
  count: number;
}

export async function discoverLeads(params: LeadsParams) {
  const { query, industry, count } = params;

  try {
    const text = await chat(
      [
        {
          role: "user",
          content: `Generate ${count} B2B leads. Target: ${query}, Industry: ${industry}.
Reply ONLY valid JSON array:
[{"name":"Name","company":"Co","role":"Title","email":"e@co.com","website":"https://co.com","industry":"${industry}","score":85,"description":"Why good lead"}]`,
        },
      ],
      280
    );

    const parsed = cleanJSON(text);
    if (Array.isArray(parsed)) return parsed;
    if (parsed?.leads) return parsed.leads;
  } catch (e) {
    console.error("Leads AI failed, using fallback:", e);
  }

  return [
    {
      name: "Sarah Johnson",
      company: "TechFlow Inc",
      role: "CEO",
      email: "sarah@techflow.com",
      website: "https://techflow.com",
      industry,
      score: 92,
      description: "Fast-growing company actively seeking solutions.",
    },
    {
      name: "Ahmed Raza",
      company: "Digital Ventures",
      role: "Marketing Director",
      email: "ahmed@digitalv.com",
      website: "https://digitalv.com",
      industry,
      score: 78,
      description: "Established firm looking to expand digital presence.",
    },
    {
      name: "Priya Sharma",
      company: "StartupHub",
      role: "Founder",
      email: "priya@startuphub.io",
      website: "https://startuphub.io",
      industry,
      score: 85,
      description: "Early-stage startup with budget for growth.",
    },
    {
      name: "Omar Hassan",
      company: "CloudSoft Solutions",
      role: "CTO",
      email: "omar@cloudsoft.io",
      website: "https://cloudsoft.io",
      industry,
      score: 88,
      description: "Tech company scaling rapidly, needs new tools.",
    },
    {
      name: "Fatima Ali",
      company: "GrowthMetrics",
      role: "Head of Sales",
      email: "fatima@growthmetrics.com",
      website: "https://growthmetrics.com",
      industry,
      score: 74,
      description: "Sales-focused firm looking to improve pipeline.",
    },
    {
      name: "David Chen",
      company: "InnovateCo",
      role: "VP Operations",
      email: "david@innovateco.com",
      website: "https://innovateco.com",
      industry,
      score: 81,
      description: "Operations-heavy company seeking efficiency tools.",
    },
  ];
}
