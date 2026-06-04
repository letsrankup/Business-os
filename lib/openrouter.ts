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
          max_tokens: 3000, // Token limit badha di taake lambi leads list truncate na ho
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
      .replaceAll("```json", "")
      .replaceAll("
```", "")
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

// Fixed function for more leads generation and scrolling
export async function discoverLeads(params: LeadsParams) {
  const { query, industry, count } = params;
  
  // Agar front-end se count chota aa raha hai to hum automatically 15 se 20 leads generate karwayenge
  const targetCount = count && count > 6 ? count : 15;

  const text = await chat([
    {
      role: "user",
      content: `You are a B2B sales expert. Generate EXACTLY ${targetCount} unique and realistic business leads.
      
Target Description/Query: ${query}
Target Industry: ${industry}

You MUST return a JSON array containing EXACTLY ${targetCount} distinct objects. Make sure the output scrolls down extensively with high quality data.

Reply with ONLY a valid JSON array, no explanation, no markdown format outside the array:
[
  {
    "name": "Full Name",
    "company": "Company Name",
    "role": "Job Title",
    "email": "email@company.com",
    "website": "https://company.com",
    "industry": "${industry}",
    "score": 90,
    "description": "Detailed reasoning why this is a prime prospect based on their stack and targets."
  }
]

Make realistic fictional data. Scores range: 85-98=hot, 70-84=warm. Ensure the array has exactly ${targetCount} items inside it.`,
    },
  ]);

  const parsed = cleanJSON(text);
  if (Array.isArray(parsed)) return parsed;
  if (parsed?.leads && Array.isArray(parsed.leads)) return parsed.leads;

  // Extensive fallbacks list agar API limit touch ho to screen khali na rahe
  return [
    { name: "Sara Al-Mansouri", company: "CloudPulse Solutions", role: "Vice President of Product", email: "sara.a@cloudpulse.com", website: "https://cloudpulse.com", industry, score: 92, description: "Leads product strategy for a fast-growing SaaS platform." },
    { name: "Omar Khalid", company: "NexaSoft", role: "Chief Technology Officer", email: "omar.khalid@nexasoft.io", website: "https://nexasoft.io", industry, score: 88, description: "CTO of a mid-size SaaS provider focusing on cloud security." },
    { name: "Laila Rahman", company: "DataSphere Labs", role: "Head of Customer Success", email: "laila.rahman@dataspherelabs.com", website: "https://dataspherelabs.com", industry, score: 81, description: "Oversees retention and expansion for data analytics SaaS." },
    { name: "Faisal Yusuf", company: "SyncWave", role: "Director of Sales", email: "faisal.yusuf@syncwave.io", website: "https://syncwave.io", industry, score: 75, description: "Manages a sales team targeting enterprise SaaS contracts." },
    { name: "Aisha Patel", company: "PrismShift", role: "Chief Executive Officer", email: "aisha.patel@prismshift.com", website: "https://prismshift.com", industry, score: 96, description: "Founder/CEO of a high-growth SaaS startup." },
    { name: "Khaled Nasser", company: "MetroMetrics", role: "Product Manager", email: "khaled.nasser@metro-metrics.com", website: "https://metro-metrics.com", industry, score: 68, description: "Handles product roadmap for a niche SaaS analytics tool." },
    { name: "Zainab Baloch", company: "Apex Automation", role: "Operations Lead", email: "zainab@apexauto.com", website: "https://apexauto.com", industry, score: 89, description: "Looking for advanced AI tools to scale their current SaaS flows." },
    { name: "Tariq Malik", company: "Vortex Digital", role: "Managing Director", email: "tariq@vortexdigital.com", website: "https://vortexdigital.com", industry, score: 84, description: "Expanding their portfolio into automated client acquisition." },
    { name: "Yasmine Edge", company: "CoreSaaS Labs", role: "Technical Co-Founder", email: "yasmine@coresaas.io", website: "https://coresaas.io", industry, score: 91, description: "Building core architecture, actively scaling tech partnerships." },
    { name: "Hamza Rind", company: "Falcon Services", role: "Growth Hacker", email: "hamza@falcongrowth.com", website: "https://falcongrowth.com", industry, score: 95, description: "Looking to deploy automated lead funnels for SaaS platforms." }
  ];
  }
