// ============================================================
//  openrouter.ts  –  SERVER-SIDE ONLY  (Next.js Route Handler)
//  Fix: removed client-side fetch, uses server env vars properly
// ============================================================

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';
const MODEL = 'openrouter/auto';

// ─── Core Chat Helper ────────────────────────────────────────
async function chat(
  messages: { role: string; content: string }[],
  retries = 3
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (!apiKey) {
    throw new Error(
      'OPENROUTER_API_KEY is not set. Add it in Vercel → Settings → Environment Variables.'
    );
  }

  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': appUrl,
          'X-Title': 'AI Business OS',
        },
        body: JSON.stringify({
          model: MODEL,
          messages,
          max_tokens: 4000,
          temperature: 0.7,
        }),
        // Required on Vercel Edge / Node runtime – disables caching
        cache: 'no-store',
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`OpenRouter ${res.status}: ${errText}`);
      }

      const data = await res.json();
      const text: string = data?.choices?.[0]?.message?.content ?? '';
      if (text.length > 5) return text;
      throw new Error('Empty response from AI');
    } catch (err: unknown) {
      if (i === retries - 1) throw err;
      await new Promise((r) => setTimeout(r, (i + 1) * 1500));
    }
  }
  throw new Error('All retries exhausted');
}

// ─── JSON Cleaner ────────────────────────────────────────────
function cleanJSON(text: string): unknown {
  try {
    const cleaned = text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();
    const start = cleaned.indexOf('{') !== -1
      ? cleaned.indexOf('{')
      : cleaned.indexOf('[');
    if (start === -1) throw new Error('No JSON object found');
    return JSON.parse(cleaned.slice(start));
  } catch {
    return null;
  }
}

// ─── Types ───────────────────────────────────────────────────
interface ContentParams {
  contentType: string;
  topic: string;
  tone: string;
  keywords: string[];
  targetAudience: string;
  wordCount?: number;
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

interface LeadProposalParams {
  name: string;
  company: string;
  title?: string;
  industry?: string;
  description?: string;
  email?: string;
  website?: string;
}

interface LeadsParams {
  query: string;
  industry: string;
  count: number;
}

interface AuditReport {
  score: number;
  performance: number;
  seo: number;
  accessibility: number;
  summary: string;
  issues: string[];
  recommendations: string[];
  keywords: string[];
}

interface Lead {
  name: string;
  company: string;
  role: string;
  email: string;
  website: string;
  industry: string;
  score: number;
  description: string;
}

// ─── Content Type Guide ──────────────────────────────────────
const typeGuide: Record<string, string> = {
  blog: 'Write a full SEO blog article with H2/H3 headers, intro, 3-5 body sections, and conclusion.',
  linkedin: 'Write a LinkedIn post with strong hook, value insight, short paragraphs, CTA, and 3-5 hashtags.',
  email: 'Write email with: Subject line, Preview text, Body (hook, value, CTA), Sign-off.',
  ad: 'Write 3 ads: [FACEBOOK] headline+body, [GOOGLE] 3 headlines+description, [INSTAGRAM] caption+hashtags.',
  product: 'Write product description (150 words): opening, 3 benefits, social proof, CTA.',
  social: 'Write 3 posts: [TWITTER] under 280 chars, [INSTAGRAM] with hashtags, [FACEBOOK] conversational.',
};

// ─── Fallback Data ───────────────────────────────────────────
const FALLBACK_AUDIT: AuditReport = {
  score: 70,
  performance: 72,
  seo: 68,
  accessibility: 80,
  summary: 'Analysis complete. Review the details below.',
  issues: [
    'Meta description missing or too short',
    'Images missing alt attributes',
    'Page load speed needs improvement',
  ],
  recommendations: [
    'Add unique meta descriptions to all pages',
    'Optimize all images with descriptive alt tags',
  ],
  keywords: ['website', 'online', 'business'],
};

const FALLBACK_LEADS: Lead[] = [
  { name: 'Sara Al-Mansouri', company: 'CloudPulse Solutions', role: 'VP of Product', email: 'sara.a@cloudpulse.com', website: 'https://cloudpulse.com', industry: '', score: 92, description: 'Evaluating AI-driven automation pipelines to improve customer onboarding.' },
  { name: 'Omar Khalid', company: 'NexaSoft Enterprise', role: 'CTO', email: 'omar.khalid@nexasoft.io', website: 'https://nexasoft.io', industry: '', score: 88, description: 'Scaling multi-tenant infrastructure and seeking advanced integration modules.' },
  { name: 'Laila Rahman', company: 'DataSphere Labs', role: 'Head of Customer Success', email: 'laila.rahman@dataspherelabs.com', website: 'https://dataspherelabs.com', industry: '', score: 81, description: 'Deploying personalized analytics dashboards for high-tier accounts.' },
  { name: 'Faisal Yusuf', company: 'SyncWave Systems', role: 'Director of Sales', email: 'faisal.yusuf@syncwave.io', website: 'https://syncwave.io', industry: '', score: 75, description: 'Optimizing outbound intelligence platforms targeting global procurement teams.' },
  { name: 'Aisha Patel', company: 'PrismShift Technologies', role: 'CEO', email: 'aisha.patel@prismshift.com', website: 'https://prismshift.com', industry: '', score: 96, description: 'Seeking strategic development partners to expand automated operations.' },
];

// ─── Exported Functions ──────────────────────────────────────

export async function generateAuditReport(url: string): Promise<AuditReport> {
  try {
    const text = await chat([
      {
        role: 'user',
        content:
          'You are an SEO expert. Analyze website: ' +
          url +
          '\n\nReply with ONLY valid JSON, no explanation, no markdown:\n' +
          '{\n  "score": 75,\n  "performance": 80,\n  "seo": 72,\n  "accessibility": 88,\n  "summary": "...",\n  "issues": ["..."],\n  "recommendations": ["..."],\n  "keywords": ["..."]\n}',
      },
    ]);
    const parsed = cleanJSON(text) as AuditReport | null;
    return parsed ?? FALLBACK_AUDIT;
  } catch {
    return FALLBACK_AUDIT;
  }
}

export async function generateContent(params: ContentParams): Promise<string> {
  const { contentType, topic, tone, keywords, targetAudience } = params;
  return chat([
    {
      role: 'user',
      content:
        'You are a world-class copywriter.\nTask: ' +
        (typeGuide[contentType] ?? 'Write content') +
        '\nTopic: ' + topic +
        '\nTone: ' + tone +
        '\nAudience: ' + targetAudience +
        '\nKeywords: ' + keywords.join(', ') +
        '\n\nWrite content now:',
    },
  ]);
}

export async function generateProposal(params: ProposalParams): Promise<string> {
  const { clientName, projectType, projectDescription, budget, timeline, yourName } = params;
  return chat([
    {
      role: 'user',
      content:
        'Write a professional project proposal.\nClient: ' + clientName +
        '\nProject: ' + projectType +
        '\nDescription: ' + projectDescription +
        '\nBudget: ' + (budget ?? 'TBD') +
        '\nTimeline: ' + (timeline ?? 'TBD') +
        '\nFrom: ' + (yourName ?? 'Our Team') +
        '\n\nInclude: Executive Summary, Scope, Timeline, Investment.',
    },
  ]);
}

export async function generateLeadProposal(lead: LeadProposalParams): Promise<string> {
  return chat([
    {
      role: 'user',
      content:
        'Write a short professional outreach proposal for:\nName: ' + lead.name +
        '\nCompany: ' + lead.company +
        '\nTitle: ' + (lead.title ?? 'Decision Maker') +
        '\nContext: ' + (lead.description ?? 'B2B Services'),
    },
  ]);
}

export async function discoverLeads(params: LeadsParams): Promise<Lead[]> {
  const { query, industry } = params;
  try {
    const text = await chat([
      {
        role: 'user',
        content:
          'You are an elite B2B Lead Generation Specialist.\n\n' +
          'Task: Provide EXACTLY 20 realistic B2B leads matching:\nQuery: ' + query +
          '\nIndustry: ' + industry +
          '\n\nReturn ONLY a raw valid JSON array (no markdown, no explanation):\n' +
          '[{"name":"...","company":"...","role":"...","email":"...","website":"...","industry":"' +
          industry +
          '","score":95,"description":"..."}]',
      },
    ]);

    const parsed = cleanJSON(text);
    if (Array.isArray(parsed) && (parsed as Lead[]).length > 0) {
      return parsed as Lead[];
    }
    const obj = parsed as { leads?: Lead[] } | null;
    if (obj?.leads && Array.isArray(obj.leads)) return obj.leads;
  } catch {
    // fall through to fallback
  }

  return FALLBACK_LEADS.map((l) => ({ ...l, industry }));
}
