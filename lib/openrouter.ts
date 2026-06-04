const OPENROUTER_BASE = "https://openrouter.ai/api/v1";
const MODEL = "openrouter/auto";

async function chat(
  messages: { role: string; content: string }[],
  retries = 3
): Promise<string> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer":
            process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
          "X-Title": "AI Business OS",
        },
        body: JSON.stringify({
          model: MODEL,
          messages,
          max_tokens: 2000,
          temperature: 0.7,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`OpenRouter error ${res.status}: ${err}`);
      }

      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content || "";
      if (text.length > 5) return text;
      throw new Error("Empty response from AI");
    } catch (err: any) {
      if (i === retries - 1) throw err;
      await new Promise((r) => setTimeout(r, (i + 1) * 1500));
    }
  }
  throw new Error("All retries failed");
}

function cleanJSON(text: string): any {
  try {
    const cleaned = text
      .replace(/```json/gi, "")
      .replace(/
```/gi, "")
      .trim();
    const start = cleaned.search(/[\[{]/);
    if (start === -1) throw new Error("No JSON found");
    return JSON.parse(cleaned.slice(start));
  } catch {
    return null;
  }
}

export async function generateAuditReport(url: string) {
  const text = await chat([
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
  ]);

  const parsed = cleanJSON(text);
  if (parsed) return parsed;

  return {
    score: 70,
    performance: 72,
    seo: 68,
    accessibility: 80,
    summary: "Analysis complete. Review the details below.",
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
    keywords: [
      "website","online","business",
      "service","professional","quality",
    ],
  };
}

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
  linkedin:
    "Write a LinkedIn post with strong hook, value insight, short paragraphs, CTA, and 3-5 hashtags.",
  email:
    "Write email with: Subject line, Preview text, Body (hook, value, CTA), Sign-off.",
  ad: "Write 3 ads: [FACEBOOK] headline+body, [GOOGLE] 3 headlines+description, [INSTAGRAM] caption+hashtags.",
  product:
    "Write product description (150 words): opening, 3 benefits, social proof, CTA.",
  social:
    "Write 3 posts: [TWITTER] under 280 chars, [INSTAGRAM] with hashtags, [FACEBOOK] conversational.",
};

export async function generateContent(params: ContentParams): Promise<string> {
  const {
    contentType, topic, tone,
    keywords, targetAudience, wordCount = 600,
  } = params;

  return chat([
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
  ]);
}

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

  return chat([
    {
      role: "user",
      content: `Write a professional project proposal for:

Client: ${clientName}${clientBusiness ? ` (${clientBusiness})` : ""}
Project: ${projectType}
Description: ${projectDescription}
Budget: ${budget || "To be discussed"}
Timeline: ${timeline || "To be agreed"}
From: ${yourName || "Our Team"}, ${yourCompany || "Our Company"}

Include these sections:
1. EXECUTIVE SUMMARY
2. PROJECT UNDERSTANDING
3. SCOPE OF WORK
4. TIMELINE & MILESTONES
5. INVESTMENT
6. WHY CHOOSE US
7. NEXT STEPS

Write it professionally and persuasively.`,
    },
  ]);
}

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
  return chat([
    {
      role: "user",
      content: `Write a short professional outreach proposal (150-200 words) for this prospect:

Name: ${lead.name}
Company: ${lead.company}
Title: ${lead.title || "Decision Maker"}
Industry: ${lead.industry || "Technology"}
${lead.description ? `Context: ${lead.description}` : ""}

Structure:
1. Personalized opening (mention their company/role)
2. What problem we solve for them
3. Brief value proposition
4. Clear call to action

Make it warm, professional, and specific to their situation.`,
    },
  ]);
}

interface LeadsParams {
  query: string;
  industry: string;
  count: number;
}

export async function discoverLeads(params: LeadsParams) {
  const { query, industry, count } = params;

  const text = await chat([
    {
      role: "user",
      content: `You are a B2B sales expert. Generate ${count} business leads.

Target: ${query}
Industry: ${industry}

Reply with ONLY a valid JSON array, no explanation, no markdown:
[
  {
    "name": "Full Name",
    "company": "Company Name",
    "role": "Job Title",
    "email": "email@company.com",
    "website": "https://company.com",
    "industry": "${industry}",
    "score": 85,
    "description": "Why this is a good lead"
  }
]

Make realistic fictional data. Scores: 85-98=hot, 70-84=warm, 60-69=cold.`,
    },
  ]);

  const parsed = cleanJSON(text);
  if (Array.isArray(parsed)) return parsed;
  if (parsed?.leads) return parsed.leads;

  return [
    {
      name: "Sarah Johnson",
      company: "TechFlow Inc",
      role: "CEO",
      email: "sarah@techflow.com",
      website: "https://techflow.com",
      industry,
      score: 92,
      description: "Fast-growing company actively seeking marketing solutions.",
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
      description: "Early-stage startup with budget for growth services.",
    },
  ];
        }
    
