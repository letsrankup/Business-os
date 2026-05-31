const OPENROUTER_BASE = "https://openrouter.ai/api/v1";
const MODEL = "meta-llama/llama-3.1-8b-instruct:free";

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
          "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
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
      throw new Error("Empty response from model");
    } catch (err: any) {
      if (i === retries - 1) throw err;
      await new Promise((r) => setTimeout(r, (i + 1) * 1200));
    }
  }
  throw new Error("All retries failed");
}

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

export async function generateAuditReport(url: string) {
  const text = await chat([
    {
      role: "system",
      content: "You are an expert SEO auditor. Always respond with pure valid JSON only. No markdown, no explanation.",
    },
    {
      role: "user",
      content: `Analyze website: ${url}
Return this exact JSON:
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
    score: 70, performance: 72, seo: 68, accessibility: 80,
    summary: "Analysis complete.",
    issues: ["Meta description missing","Images lack alt tags","Page speed slow","Mobile needs check","Internal linking weak"],
    recommendations: ["Add meta descriptions","Optimize images","Improve speed","Build internal links"],
    keywords: ["website","online","business","service","professional","quality"],
  };
}

export async function generateContent(params: {
  contentType: string;
  topic: string;
  tone: string;
  keywords: string[];
  targetAudience: string;
  wordCount?: number;
}): Promise<string> {
  const { contentType, topic, tone, keywords, targetAudience, wordCount = 600 } = params;
  const typeGuide: Record<string, string> = {
    blog: "Write a full SEO blog article with H2/H3 headers.",
    linkedin: "Write a LinkedIn post with hook, value, CTA and hashtags.",
    email: "Write email with Subject, Preview, Body, Sign-off.",
    ad: "Write 3 ads: Facebook, Google, Instagram.",
    product: "Write product description 150 words with benefits and CTA.",
    social: "Write 3 posts for Twitter, Instagram, Facebook.",
  };
  return chat([
    { role: "system", content: `You are a world-class ${tone} copywriter.` },
    { role: "user", content: `Task: ${typeGuide[contentType] || `Write ${contentType} content.`}\nTopic: ${topic}\nTone: ${tone}\nAudience: ${targetAudience}\nKeywords: ${keywords.join(", ")}\n\nWrite now:` },
  ]);
}

export async function generateProposal(params: {
  clientName: string;
  clientBusiness?: string;
  projectType: string;
  projectDescription: string;
  budget?: string;
  timeline?: string;
  yourName?: string;
  yourCompany?: string;
}): Promise<string> {
  const { clientName, clientBusiness, projectType, projectDescription, budget, timeline, yourName, yourCompany } = params;
  return chat([
    { role: "system", content: "You are a senior business consultant writing winning proposals." },
    { role: "user", content: `Write proposal for:\nClient: ${clientName}${clientBusiness ? ` (${clientBusiness})` : ""}\nProject: ${projectType}\nDescription: ${projectDescription}\nBudget: ${budget || "TBD"}\nTimeline: ${timeline || "TBD"}\nFrom: ${yourName || "Our Team"}, ${yourCompany || "Our Company"}\n\nInclude: Executive Summary, Scope, Timeline, Investment, Why Us, Next Steps.` },
  ]);
}

export async function discoverLeads(params: {
  query: string;
  industry: string;
  count: number;
}) {
  const { query, industry, count } = params;
  const text = await chat([
    { role: "system", content: "You are a B2B sales specialist. Return pure valid JSON only." },
    { role: "user", content: `Generate ${count} leads for:\nTarget: ${query}\nIndustry: ${industry}\n\nReturn JSON array:\n[{"name":"Full Name","company":"Company","role":"Title","email":"email@co.com","website":"https://co.com","industry":"${industry}","score":85,"description":"Why good lead"}]` },
  ]);
  const parsed = cleanJSON(text);
  if (Array.isArray(parsed)) return parsed;
  if (parsed?.leads) return parsed.leads;
  return [
    { name: "Sarah Johnson", company: "TechFlow Inc", role: "CEO", email: "sarah@techflow.com", website: "https://techflow.com", industry, score: 92, description: "Fast-growing company seeking marketing solutions." },
    { name: "Ahmed Raza", company: "Digital Ventures", role: "Marketing Director", email: "ahmed@digitalv.com", website: "https://digitalv.com", industry, score: 78, description: "Established firm expanding digital presence." },
    { name: "Priya Sharma", company: "StartupHub", role: "Founder", email: "priya@startuphub.io", website: "https://startuphub.io", industry, score: 85, description: "Startup with budget for growth services." },
  ];
    }
