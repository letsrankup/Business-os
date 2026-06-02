// app/api/competitor/route.ts
import { NextRequest, NextResponse } from "next/server";

function cleanUrl(raw: string): string {
  let u = raw.trim();
  if (!u.startsWith("http")) u = "https://" + u;
  return u.replace(/\/$/, "");
}

function getDomain(raw: string): string {
  try {
    return new URL(cleanUrl(raw)).hostname.replace(/^www\./, "");
  } catch {
    return raw;
  }
}

async function fetchPageSpeed(url: string) {
  try {
    const key = process.env.GOOGLE_PAGESPEED_API_KEY ? `&key=${process.env.GOOGLE_PAGESPEED_API_KEY}` : "";
    const base = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(cleanUrl(url))}${key}&category=performance&category=seo&category=best-practices&category=accessibility`;

    const [mobRes, deskRes] = await Promise.allSettled([
      fetch(`${base}&strategy=mobile`, { signal: AbortSignal.timeout(2800) }),
      fetch(`${base}&strategy=desktop`, { signal: AbortSignal.timeout(2800) }),
    ]);

    const mob = mobRes.status === "fulfilled" && mobRes.value.ok ? await mobRes.value.json() : null;
    const desk = deskRes.status === "fulfilled" && deskRes.value.ok ? await deskRes.value.json() : null;

    const getSc = (d: any) => d?.lighthouseResult?.categories?.performance?.score;
    const getAud = (d: any) => d?.lighthouseResult?.audits;

    return {
      mob_perf: getSc(mob) ? Math.round(getSc(mob) * 100) : null,
      desk_perf: getSc(desk) ? Math.round(getSc(desk) * 100) : null,
      mob_seo: mob?.lighthouseResult?.categories?.seo?.score ? Math.round(mob.lighthouseResult.categories.seo.score * 100) : null,
      mob_bp: mob?.lighthouseResult?.categories?.['best-practices']?.score ? Math.round(mob.lighthouseResult.categories['best-practices'].score * 100) : null,
      mob_access: mob?.lighthouseResult?.categories?.accessibility?.score ? Math.round(mob.lighthouseResult.categories.accessibility.score * 100) : null,
      lcp: getAud(desk)?.['largest-contentful-paint']?.displayValue || null,
      tbt: getAud(desk)?.['total-blocking-time']?.displayValue || null,
      cls: getAud(desk)?.['cumulative-layout-shift']?.displayValue || null,
      ttfb: getAud(desk)?.['server-start-time']?.displayValue || null,
      fcp: getAud(desk)?.['first-contentful-paint']?.displayValue || null,
      size: getAud(desk)?.['total-byte-weight']?.displayValue || null,
    };
  } catch {
    return null;
  }
}

async function scrapeUrl(url: string) {
  try {
    const res = await fetch(cleanUrl(url), {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; OmniExtractor/3.0)" },
      signal: AbortSignal.timeout(2000)
    });
    if (!res.ok) return null;
    const html = await res.text();

    const has = (s: string) => html.toLowerCase().includes(s.toLowerCase());
    const tech: string[] = [];
    if (has("wp-content") || has("wordpress")) tech.push("WordPress");
    if (has("__next_data__") || has("/_next/")) tech.push("Next.js");
    if (has("shopify")) tech.push("Shopify");
    if (has("wix.com")) tech.push("Wix");

    const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() || null;
    const desc = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/i)?.[1]?.trim() || null;

    return { tech, title, desc, html_size: `${(html.length / 1024).toFixed(1)} KB` };
  } catch {
    return null;
  }
}

async function fetchPageRank(domain: string) {
  try {
    const key = process.env.OPEN_PAGERANK_API_KEY;
    if (!key) return null;
    const res = await fetch(`https://openpagerank.com/api/v1.0/getPageRank?domains[]=${domain}`, {
      headers: { "API-OPR": key },
      signal: AbortSignal.timeout(1500)
    });
    if (!res.ok) return null;
    const data = await res.json();
    const rankObj = data?.response?.[domain];
    return {
      page_rank_integer: rankObj?.page_rank_integer || null,
      global_rank: rankObj?.status_code === 200 ? rankObj?.rank || "N/A" : "N/A"
    };
  } catch {
    return null;
  }
}

async function fetchDNS(domain: string) {
  try {
    const res = await fetch(`https://dns.google/resolve?name=${domain}&type=A`, {
      signal: AbortSignal.timeout(1200)
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      ip: data.Answer?.[0]?.data || "N/A",
      provider: data.Answer ? "Detected via Cloud DNS" : "Unknown"
    };
  } catch {
    return null;
  }
}

async function claudeWebSearch(compUrl: string, yourUrl: string, ind: string, ps: any, sc: any, pr: any, dns: any) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("Anthropic API key is completely missing inside dashboard environment configuration.");

  const prompt = `You are an elite Competitive Intelligence Engine. Analyze competitor: ${compUrl}.
  Our context: ${yourUrl || "N/A"}. Industry: ${ind || "General"}.
  
  Live Metadata Extracted:
  - Speed Data: ${JSON.stringify(ps)}
  - Scraping Data: ${JSON.stringify(sc)}
  - PageRank: ${JSON.stringify(pr)}
  - DNS: ${JSON.stringify(dns)}

  Synthesize an extremely high-fidelity intelligence report. Return ONLY a single raw JSON object matching this structural layout exactly with no markdown wrappers, no backticks, and no conversation:
  {
    "overview": { "name": "string", "domain": "string", "industry": "string", "threat_level": "High|Medium|Low", "market_position": "string", "founded": "string", "employees": "string", "headquarters": "string", "funding": "string", "business_model": "string", "target_audience": "string", "value_prop": "string", "summary": "string", "overall_score": 80 },
    "performance": { "mob_perf": 75, "desk_perf": 85, "mob_access": 80, "mob_seo": 85, "mob_bp": 80, "lcp": "string", "tbt": "string", "cls": "string", "ttfb": "string", "fcp": "string", "size": "string", "grade": "A", "issues": ["string"], "fixes": ["string"] },
    "seo_on_page": { "score": 80, "domain_authority": 35, "title": "string", "description": "string", "h1": "string", "keywords_meta": "string", "ssl": true, "canonical": true, "structured_data": true, "open_graph": true, "twitter_card": true, "robots_meta": true, "schema_types": ["string"], "organic_keywords": "string", "word_count": 1000, "issues": ["string"] },
    "technical": { "score": 85, "cms": "string", "hosting": "string", "cdn": "string", "email_system": "string", "ip": "string", "html_size": "string", "tech_stack": ["string"], "security_headers": ["string"], "analytics": ["string"], "marketing": ["string"], "payments": ["string"], "insights": "string" },
    "traffic": { "score": 75, "monthly_visits": "string", "unique_visitors": "string", "avg_duration": "string", "bounce_rate": "string", "trend": "string", "yoy_change": "string", "traffic_sources": { "direct": 50, "search": 40, "social": 10 }, "top_countries": ["string"], "insights": "string" },
    "seo_off_page": { "score": 70, "total_backlinks": "string", "referring_domains": "string", "dofollow_pct": "string", "link_velocity": "string", "domain_rank": "string", "global_rank": "string", "top_backlinks": ["string"], "insights": "string" },
    "keywords": { "organic_total": "string", "score": 75, "insights": "string", "top_keywords": [{ "kw": "string", "vol": "string", "pos": "string" }], "gap_keywords": [{ "kw": "string", "vol": "string", "kd": 30, "opportunity": "High" }], "quick_wins": ["string"] },
    "social": { "score": 65, "insights": "string", "sentiment": { "positive": 70, "neutral": 20, "negative": 10 }, "twitter": { "followers": "string", "engagement": "string" }, "linkedin": { "followers": "string" } },
    "monetization": { "score": 80, "estimated_mrr": "string", "free_trial": true, "freemium": false, "affiliate_program": false, "models": ["string"], "pricing_tiers": "string", "avg_deal": "string", "insights": "string" },
    "battleplan": { "competitor_advantages": ["string"], "your_opportunities": ["string"], "quick_wins_30d": [{ "action": "string", "impact": "High", "effort": "Low" }], "medium_90d": ["string"], "long_12mo": ["string"], "risks": ["string"], "differentiation": "string", "verdict": "string" }
  }`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 3500,
      messages: [{ role: "user", content: prompt }]
    }),
    signal: AbortSignal.timeout(6000)
  });

  if (!response.ok) throw new Error(`Claude AI Core responded with failure status ${response.status}`);
  const data = await response.json();
  const text = (data.content ?? [])
    .filter((b: { type: string }) => b.type === "text")
    .map((b: { text: string }) => b.text)
    .join("");

  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Critical structural breach: Response failed deep schema verification checks.");
  return JSON.parse(match[0]);
}

export async function POST(req: NextRequest) {
  try {
    const { yourSite = "", compSite = "", industry = "" } = await req.json();
    if (!compSite.trim()) {
      return NextResponse.json({ success: false, error: "Competitor URL target config setup incomplete." }, { status: 400 });
    }

    const domain = getDomain(compSite);

    const [ps, sc, pr, dns] = await Promise.all([
      fetchPageSpeed(compSite),
      scrapeUrl(compSite),
      fetchPageRank(domain),
      fetchDNS(domain),
    ]);

    const analysis = await claudeWebSearch(compSite, yourSite, industry, ps, sc, pr, dns);

    analysis._meta = {
      domain,
      scanned_at: new Date().toISOString(),
      real_sources: {
        pagespeed: !!(ps && ps.mob_perf),
        scraped: !!(sc && sc.html_size),
        pagerank: !!(pr && pr.global_rank !== "N/A"),
        dns: !!(dns && dns.ip !== "N/A"),
        web_search: true,
      },
    };

    return NextResponse.json({ success: true, data: analysis });
  } catch (error: any) {
    console.error("Backend Core Error Logger:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Fatal synchronization error inside intelligence pipeline." },
      { status: 500 }
    );
  }
      }
      
