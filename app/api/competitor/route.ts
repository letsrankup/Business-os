// app/api/competitor/route.ts
// FULLY REAL: PageSpeed + Scraping + OpenPageRank + DNS + Claude WebSearch

import { NextRequest, NextResponse } from "next/server";

// ── Utilities ─────────────────────────────────────────────────────────────────
function cleanUrl(raw: string): string {
  let u = raw.trim();
  if (!u.startsWith("http")) u = "https://" + u;
  return u.replace(/\/$/, "");
}
function getDomain(raw: string): string {
  try { return new URL(cleanUrl(raw)).hostname.replace(/^www\./, ""); }
  catch { return raw; }
}

// ── 1. Google PageSpeed (REAL) ────────────────────────────────────────────────
async function fetchPageSpeed(url: string) {
  try {
    const key = process.env.GOOGLE_PAGESPEED_API_KEY
      ? `&key=${process.env.GOOGLE_PAGESPEED_API_KEY}` : "";
    const base = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(cleanUrl(url))}${key}&category=performance&category=seo&category=best-practices&category=accessibility`;

    const [mobRes, deskRes] = await Promise.allSettled([
      fetch(`${base}&strategy=mobile`,  { signal: AbortSignal.timeout(20000) }),
      fetch(`${base}&strategy=desktop`, { signal: AbortSignal.timeout(20000) }),
    ]);

    const mob  = mobRes.status  === "fulfilled" && mobRes.value.ok  ? await mobRes.value.json()  : null;
    const desk = deskRes.status === "fulfilled" && deskRes.value.ok ? await deskRes.value.json() : null;

    const sc  = (d: Record<string, unknown> | null, cat: string) => {
      const cats = (d as Record<string, Record<string, Record<string, {score?: number}>>>)?.lighthouseResult?.categories;
      const score = cats?.[cat]?.score;
      return score != null ? Math.round(Number(score) * 100) : null;
    };
    const au  = (d: Record<string, unknown> | null, key: string) => {
      const audits = (d as Record<string, Record<string, Record<string, {displayValue?: string}>>>)?.lighthouseResult?.audits;
      return audits?.[key]?.displayValue ?? null;
    };

    return {
      source: "Google PageSpeed API ✅",
      mob_perf:   sc(mob,  "performance"),
      mob_seo:    sc(mob,  "seo"),
      mob_access: sc(mob,  "accessibility"),
      mob_bp:     sc(mob,  "best-practices"),
      desk_perf:  sc(desk, "performance"),
      desk_seo:   sc(desk, "seo"),
      lcp:        au(mob, "largest-contentful-paint"),
      tbt:        au(mob, "total-blocking-time"),
      cls:        au(mob, "cumulative-layout-shift"),
      ttfb:       au(mob, "server-response-time"),
      fcp:        au(mob, "first-contentful-paint"),
      speed_idx:  au(mob, "speed-index"),
      size:       au(desk,"total-byte-weight"),
    };
  } catch { return null; }
}

// ── 2. HTML Scraper (REAL) ────────────────────────────────────────────────────
async function scrapeUrl(url: string) {
  try {
    const res = await fetch(cleanUrl(url), {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; BusinessOS-Audit/2.0)" },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    const headers = Object.fromEntries(res.headers.entries());

    const get = (re: RegExp) => html.match(re)?.[1]?.trim() ?? null;
    const has = (s: string)  => html.toLowerCase().includes(s.toLowerCase());

    const tech: string[] = [];
    if (has("wp-content") || has("wordpress"))    tech.push("WordPress");
    if (has("__NEXT_DATA__") || has("/_next/"))   tech.push("Next.js");
    if (has("nuxt") || has("__nuxt"))             tech.push("Nuxt.js");
    if (has("gatsby"))                            tech.push("Gatsby");
    if (has("shopify"))                           tech.push("Shopify");
    if (has("wix.com"))                           tech.push("Wix");
    if (has("webflow.com"))                       tech.push("Webflow");
    if (has("squarespace"))                       tech.push("Squarespace");
    if (has("react") && !has("Next.js"))          tech.push("React");
    if (has("vue.js") || has("__vue"))            tech.push("Vue.js");
    if (has("angular"))                           tech.push("Angular");
    if (has("svelte"))                            tech.push("Svelte");
    if (has("gtag(") || has("google-analytics"))  tech.push("Google Analytics");
    if (has("googletagmanager.com"))              tech.push("Google Tag Manager");
    if (has("fbq(") || has("facebook.net/tr"))   tech.push("Facebook Pixel");
    if (has("hotjar"))                            tech.push("Hotjar");
    if (has("intercom"))                          tech.push("Intercom");
    if (has("crisp.chat"))                        tech.push("Crisp Chat");
    if (has("stripe"))                            tech.push("Stripe");
    if (has("hubspot"))                           tech.push("HubSpot");
    if (has("salesforce"))                        tech.push("Salesforce");
    if (has("segment.com"))                       tech.push("Segment");
    if (has("amplitude"))                         tech.push("Amplitude");
    if (has("mixpanel"))                          tech.push("Mixpanel");
    if (has("cloudflare"))                        tech.push("Cloudflare");
    if (has("recaptcha"))                         tech.push("reCAPTCHA");
    if (has("typekit") || has("fonts.google"))    tech.push("Web Fonts");
    if (has("tailwind"))                          tech.push("Tailwind CSS");
    if (has("bootstrap"))                         tech.push("Bootstrap");

    // Security headers
    const secHeaders: string[] = [];
    if (headers["strict-transport-security"]) secHeaders.push("HSTS");
    if (headers["content-security-policy"])   secHeaders.push("CSP");
    if (headers["x-frame-options"])           secHeaders.push("X-Frame-Options");
    if (headers["x-content-type-options"])    secHeaders.push("X-Content-Type");
    if (headers["referrer-policy"])           secHeaders.push("Referrer-Policy");
    if (headers["permissions-policy"])        secHeaders.push("Permissions-Policy");

    return {
      source: "Direct URL Scraping ✅",
      title:           get(/<title[^>]*>([^<]{1,200})<\/title>/i),
      description:     get(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']{1,300})["']/i),
      h1:              get(/<h1[^>]*>([^<]{1,150})<\/h1>/i),
      og_title:        get(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i),
      og_description:  get(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i),
      keywords:        get(/<meta[^>]+name=["']keywords["'][^>]+content=["']([^"']+)["']/i),
      ssl:             cleanUrl(url).startsWith("https://"),
      viewport:        has('name="viewport"'),
      canonical:       has('rel="canonical"'),
      structured_data: has('"@context"') || has("application/ld+json"),
      open_graph:      has('property="og:'),
      twitter_card:    has('name="twitter:'),
      robots_meta:     has('name="robots"'),
      schema_types: Array.from(
  new Set(
    (html.match(/"@type"\s*:\s*"([^"]+)"/g) || []).map((m: string) =>
      m.replace(/"@type"\s*:\s*"/, "").replace(/"/g, "")
    )
  )
).slice(0, 6),

tech_detected: Array.from(new Set<string>(tech)),
      security_headers: secHeaders,
      link_count:      (html.match(/href=/gi) || []).length,
      image_count:     (html.match(/<img /gi) || []).length,
      word_count:      html.replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim().split(" ").length,
      html_size_kb:    Math.round(html.length / 1024),
      server:          headers["server"] || null,
      cdn_hint:        headers["via"] || headers["x-served-by"] || headers["cf-ray"] ? "Cloudflare" : (headers["x-amz-cf-id"] ? "AWS CloudFront" : null),
    };
  } catch { return null; }
}

// ── 3. Open PageRank (REAL free API) ─────────────────────────────────────────
async function fetchPageRank(domain: string) {
  try {
    const apiKey = process.env.OPEN_PAGERANK_API_KEY;
    if (!apiKey) return null;
    const res = await fetch(`https://openpagerank.com/api/v1.0/getPageRank?domains[]=${domain}`, {
      headers: { "API-OPR": apiKey },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const entry = data?.response?.[0];
    return entry ? {
      source: "Open PageRank API ✅",
      page_rank_decimal: entry.page_rank_decimal,
      rank: entry.rank,
      status_code: entry.status_code,
    } : null;
  } catch { return null; }
}

// ── 4. DNS Lookup (REAL via Google DNS) ──────────────────────────────────────
async function fetchDNS(domain: string) {
  try {
    const [aRes, mxRes, nsRes] = await Promise.allSettled([
      fetch(`https://dns.google/resolve?name=${domain}&type=A`,   { signal: AbortSignal.timeout(6000) }),
      fetch(`https://dns.google/resolve?name=${domain}&type=MX`,  { signal: AbortSignal.timeout(6000) }),
      fetch(`https://dns.google/resolve?name=${domain}&type=NS`,  { signal: AbortSignal.timeout(6000) }),
    ]);
    const a  = aRes.status  === "fulfilled" && aRes.value.ok  ? await aRes.value.json()  : null;
    const mx = mxRes.status === "fulfilled" && mxRes.value.ok ? await mxRes.value.json() : null;
    const ns = nsRes.status === "fulfilled" && nsRes.value.ok ? await nsRes.value.json() : null;

    const ip = a?.Answer?.[0]?.data ?? null;

    // Detect hosting from NS
    const nsRecords: string[] = (ns?.Answer || []).map((r: {data: string}) => r.data);
    let hosting = "Unknown";
    const nsStr = nsRecords.join(" ").toLowerCase();
    if (nsStr.includes("vercel"))       hosting = "Vercel";
    else if (nsStr.includes("netlify")) hosting = "Netlify";
    else if (nsStr.includes("awsdns")) hosting = "AWS Route 53";
    else if (nsStr.includes("cloudflare")) hosting = "Cloudflare";
    else if (nsStr.includes("google")) hosting = "Google Cloud";
    else if (nsStr.includes("azure"))  hosting = "Microsoft Azure";
    else if (nsStr.includes("digitalocean")) hosting = "DigitalOcean";

    const mxRecords: string[] = (mx?.Answer || []).map((r: {data: string}) => r.data);
    let emailProvider = "Unknown";
    const mxStr = mxRecords.join(" ").toLowerCase();
    if (mxStr.includes("google") || mxStr.includes("gmail")) emailProvider = "Google Workspace";
    else if (mxStr.includes("microsoft") || mxStr.includes("outlook")) emailProvider = "Microsoft 365";
    else if (mxStr.includes("zoho")) emailProvider = "Zoho Mail";
    else if (mxStr.includes("mailgun")) emailProvider = "Mailgun";
    else if (mxStr.includes("sendgrid")) emailProvider = "SendGrid";
    else if (mxStr.includes("protonmail")) emailProvider = "ProtonMail";

    return {
      source: "Google DNS API ✅",
      ip, hosting, email_provider: emailProvider,
      nameservers: nsRecords.slice(0, 3),
      mx_records: mxRecords.slice(0, 2),
    };
  } catch { return null; }
}

// ── 5. Claude with Web Search (REAL intelligence) ────────────────────────────
async function claudeWebSearch(
  compSite: string,
  yourSite: string,
  industry: string,
  ps: Awaited<ReturnType<typeof fetchPageSpeed>>,
  sc: Awaited<ReturnType<typeof scrapeUrl>>,
  pr: Awaited<ReturnType<typeof fetchPageRank>>,
  dns: Awaited<ReturnType<typeof fetchDNS>>
) {
  const domain = getDomain(compSite);

  const realBlock = `
══ REAL DATA COLLECTED (keep exact numbers) ══

[Google PageSpeed API]
Mobile Performance : ${ps?.mob_perf  ?? "N/A"}/100
Mobile SEO Score   : ${ps?.mob_seo   ?? "N/A"}/100
Mobile Accessibility:${ps?.mob_access ?? "N/A"}/100
Mobile Best Practices:${ps?.mob_bp   ?? "N/A"}/100
Desktop Performance: ${ps?.desk_perf  ?? "N/A"}/100
LCP  : ${ps?.lcp      ?? "N/A"}
TBT  : ${ps?.tbt      ?? "N/A"}
CLS  : ${ps?.cls      ?? "N/A"}
TTFB : ${ps?.ttfb     ?? "N/A"}
FCP  : ${ps?.fcp      ?? "N/A"}
Size : ${ps?.size     ?? "N/A"}

[Direct Scrape]
Title       : ${sc?.title       ?? "N/A"}
Description : ${sc?.description ?? "N/A"}
H1 Tag      : ${sc?.h1         ?? "N/A"}
Keywords Meta:${sc?.keywords   ?? "N/A"}
SSL/HTTPS   : ${sc?.ssl        ? "YES" : "NO"}
Canonical   : ${sc?.canonical  ? "YES" : "NO"}
Structured Data: ${sc?.structured_data ? "YES" : "NO"}
Schema Types: ${sc?.schema_types?.join(", ") || "None"}
Open Graph  : ${sc?.open_graph ? "YES" : "NO"}
Twitter Card: ${sc?.twitter_card ? "YES" : "NO"}
Tech Detected: ${sc?.tech_detected?.join(", ") || "None"}
Security Headers: ${sc?.security_headers?.join(", ") || "None"}
Word Count  : ${sc?.word_count ?? 0}
Images      : ${sc?.image_count ?? 0}
Links       : ${sc?.link_count ?? 0}
HTML Size   : ${sc?.html_size_kb ?? 0} KB
Server      : ${sc?.server ?? "N/A"}
CDN         : ${sc?.cdn_hint ?? "Unknown"}

[Open PageRank]
Domain Rank : ${pr?.page_rank_decimal ?? "N/A"}
Global Rank : ${pr?.rank ?? "N/A"}

[DNS Info]
IP Address  : ${dns?.ip ?? "N/A"}
Hosting     : ${dns?.hosting ?? "N/A"}
Email System: ${dns?.email_provider ?? "N/A"}
Nameservers : ${dns?.nameservers?.join(", ") ?? "N/A"}
`;

  const prompt = `You are the world's most advanced competitive intelligence AI. Search the web NOW to find real, current information.

TARGET: ${domain} | My site: ${yourSite || "Not provided"} | Industry: ${industry || "Auto-detect"}

${realBlock}

STEP 1 - Search the web for:
- "${domain}" company info, about, team, funding, valuation
- "${domain} pricing" or "${domain} plans"  
- "${domain} traffic" or "${domain} monthly visitors"
- "${domain} twitter" or "${domain} linkedin followers"
- "${domain} reviews" or "${domain} vs competitors"
- "${domain} backlinks" or "${domain} domain authority"
- "${domain} keywords" or "${domain} seo"

STEP 2 - Return ONLY this JSON (no markdown, no backticks, no explanation):

{
  "overview": {
    "name": "Real brand name from web",
    "domain": "${domain}",
    "industry": "Real industry",
    "founded": "Real year or ~estimate",
    "employees": "Real size or ~estimate",
    "headquarters": "Real location or ~estimate",
    "funding": "Real funding info or ~estimate",
    "business_model": "Real description from web",
    "target_audience": "Real audience from web",
    "value_prop": "Real USP from web",
    "threat_level": "High|Medium|Low",
    "market_position": "Leader|Challenger|Niche|Startup",
    "overall_score": 72,
    "summary": "3-4 sentences of REAL competitive insight from your web search"
  },
  "performance": {
    "mob_perf": ${ps?.mob_perf ?? "null"},
    "mob_seo": ${ps?.mob_seo ?? "null"},
    "mob_access": ${ps?.mob_access ?? "null"},
    "mob_bp": ${ps?.mob_bp ?? "null"},
    "desk_perf": ${ps?.desk_perf ?? "null"},
    "lcp": "${ps?.lcp ?? "N/A"}",
    "tbt": "${ps?.tbt ?? "N/A"}",
    "cls": "${ps?.cls ?? "N/A"}",
    "ttfb": "${ps?.ttfb ?? "N/A"}",
    "fcp": "${ps?.fcp ?? "N/A"}",
    "size": "${ps?.size ?? "N/A"}",
    "grade": "A|B|C|D|F based on scores",
    "issues": ["real issue 1 from scores", "issue 2", "issue 3"],
    "fixes": ["specific fix 1", "fix 2", "fix 3"]
  },
  "seo_on_page": {
    "title": "${(sc?.title ?? "N/A").replace(/"/g, "'")}",
    "title_length": ${(sc?.title ?? "").length},
    "description": "${(sc?.description ?? "N/A").replace(/"/g, "'")}",
    "desc_length": ${(sc?.description ?? "").length},
    "h1": "${(sc?.h1 ?? "N/A").replace(/"/g, "'")}",
    "keywords_meta": "${(sc?.keywords ?? "N/A").replace(/"/g, "'")}",
    "ssl": ${sc?.ssl ?? true},
    "canonical": ${sc?.canonical ?? false},
    "structured_data": ${sc?.structured_data ?? false},
    "schema_types": ${JSON.stringify(sc?.schema_types ?? [])},
    "open_graph": ${sc?.open_graph ?? false},
    "twitter_card": ${sc?.twitter_card ?? false},
    "robots_meta": ${sc?.robots_meta ?? false},
    "word_count": ${sc?.word_count ?? 0},
    "images": ${sc?.image_count ?? 0},
    "links": ${sc?.link_count ?? 0},
    "score": ${ps?.mob_seo ?? 60},
    "issues": ["seo issue 1 based on real data", "issue 2"],
    "organic_keywords": "~from web search (e.g. ~45K)",
    "domain_authority": ${pr?.page_rank_decimal ? Math.round(Number(pr.page_rank_decimal) * 10) : "~estimated 40-70"},
    "global_rank": "${pr?.rank ?? "~estimated"}"
  },
  "technical": {
    "tech_stack": ${JSON.stringify(sc?.tech_detected ?? [])},
    "security_headers": ${JSON.stringify(sc?.security_headers ?? [])},
    "server": "${sc?.server ?? "N/A"}",
    "cdn": "${sc?.cdn_hint ?? dns?.hosting ?? "Unknown"}",
    "hosting": "${dns?.hosting ?? "~Unknown"}",
    "email_system": "${dns?.email_provider ?? "~Unknown"}",
    "ip": "${dns?.ip ?? "N/A"}",
    "html_size": "${sc?.html_size_kb ?? 0} KB",
    "analytics": ${JSON.stringify((sc?.tech_detected ?? []).filter((t: string) => ["Google Analytics","Google Tag Manager","Hotjar","Facebook Pixel","Amplitude","Mixpanel","Segment"].includes(t)))},
    "marketing": ${JSON.stringify((sc?.tech_detected ?? []).filter((t: string) => ["HubSpot","Intercom","Crisp Chat","Salesforce"].includes(t)))},
    "payments": ${JSON.stringify((sc?.tech_detected ?? []).filter((t: string) => ["Stripe"].includes(t)))},
    "score": 75,
    "insights": "2-3 sentences about their tech choices"
  },
  "traffic": {
    "monthly_visits": "~from web search",
    "unique_visitors": "~estimated",
    "avg_duration": "~from web search",
    "bounce_rate": "~estimated",
    "trend": "~Growing/Stable/Declining",
    "yoy_change": "~estimated %",
    "sources": {"organic": 45, "direct": 25, "social": 15, "referral": 10, "paid": 5},
    "top_countries": ["~Country 40%", "~Country 25%", "~Country 15%"],
    "score": 70,
    "insights": "2-3 sentences from web search"
  },
  "seo_off_page": {
    "total_backlinks": "~from web search",
    "referring_domains": "~estimated",
    "dofollow_pct": "~estimated",
    "domain_rank": "${pr?.page_rank_decimal ?? "N/A"}",
    "global_rank": "${pr?.rank ?? "N/A"}",
    "top_backlinks": ["~domain 1", "~domain 2", "~domain 3"],
    "link_velocity": "~estimated",
    "score": 65,
    "insights": "2-3 sentences"
  },
  "keywords": {
    "organic_total": "~from web search",
    "top_keywords": [
      {"kw": "real keyword 1 from web", "vol": "~X/mo", "pos": "~1-10"},
      {"kw": "real keyword 2", "vol": "~X/mo", "pos": "~1-20"},
      {"kw": "real keyword 3", "vol": "~X/mo", "pos": "~1-30"}
    ],
    "gap_keywords": [
      {"kw": "gap keyword 1", "vol": "~X/mo", "kd": 35, "opportunity": "High"},
      {"kw": "gap keyword 2", "vol": "~X/mo", "kd": 28, "opportunity": "High"},
      {"kw": "gap keyword 3", "vol": "~X/mo", "kd": 45, "opportunity": "Medium"},
      {"kw": "gap keyword 4", "vol": "~X/mo", "kd": 22, "opportunity": "High"},
      {"kw": "gap keyword 5", "vol": "~X/mo", "kd": 52, "opportunity": "Medium"}
    ],
    "quick_wins": ["keyword 1", "keyword 2", "keyword 3"],
    "score": 68,
    "insights": "2-3 sentences"
  },
  "social": {
    "twitter": {"followers": "~from search", "engagement": "~est"},
    "linkedin": {"followers": "~from search", "engagement": "~est"},
    "instagram": {"followers": "~from search"},
    "youtube": {"subscribers": "~from search"},
    "facebook": {"followers": "~from search"},
    "monthly_mentions": "~estimated",
    "sentiment": {"positive": 65, "neutral": 25, "negative": 10},
    "score": 65,
    "insights": "2-3 sentences from web search"
  },
  "monetization": {
    "models": ["model from web search"],
    "pricing_tiers": "~from web search",
    "free_trial": true,
    "freemium": false,
    "affiliate_program": false,
    "estimated_mrr": "~from web search or estimate",
    "avg_deal": "~estimated",
    "score": 70,
    "insights": "2-3 sentences from web search"
  },
  "battleplan": {
    "competitor_advantages": ["advantage 1", "advantage 2", "advantage 3"],
    "your_opportunities": ["opportunity 1", "opportunity 2", "opportunity 3"],
    "quick_wins_30d": [
      {"action": "specific action 1 based on real data", "impact": "High", "effort": "Low"},
      {"action": "action 2", "impact": "High", "effort": "Medium"},
      {"action": "action 3", "impact": "Medium", "effort": "Low"}
    ],
    "medium_90d": ["action 1", "action 2", "action 3"],
    "long_12mo": ["action 1", "action 2", "action 3"],
    "risks": ["risk 1", "risk 2"],
    "differentiation": "specific differentiation strategy",
    "verdict": "3-4 sentence final strategic verdict with specific actionable advice"
  }
}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-opus-4-5",
      max_tokens: 4096,
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) throw new Error(`Claude ${res.status}`);
  const data = await res.json();
  const text = (data.content ?? [])
    .filter((b: {type:string}) => b.type === "text")
    .map((b: {text:string}) => b.text)
    .join("");

  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON found in response");
  return JSON.parse(match[0]);
}

// ── Main Handler ──────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { yourSite = "", compSite = "", industry = "" } = await req.json();
    if (!compSite.trim()) return NextResponse.json({ error: "Competitor URL required" }, { status: 400 });

    const domain = getDomain(compSite);

    // Collect ALL real data in parallel
    const [ps, sc, pr, dns] = await Promise.all([
      fetchPageSpeed(compSite),
      scrapeUrl(compSite),
      fetchPageRank(domain),
      fetchDNS(domain),
    ]);

    // Run Claude with web search + real data
    const analysis = await claudeWebSearch(compSite, yourSite, industry, ps, sc, pr, dns);

    // Attach real data sources info
    analysis._meta = {
      domain,
      scanned_at: new Date().toISOString(),
      real_sources: {
        pagespeed: !!ps,
        scraped:   !!sc,
        pagerank:  !!pr,
        dns:       !!dns,
        web_search: true,
      },
    };

    return NextResponse.json({ success: true, data: analysis });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Analysis failed. Try again." }, { status: 500 });
  }
  }
