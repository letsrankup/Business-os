    import { NextRequest, NextResponse } from "next/server";

// --- Utilities ---
function cleanUrl(raw: string): string {
  let u = raw.trim();
  if (!u.startsWith("http://") && !u.startsWith("https://")) {
    u = "https://" + u;
  }
  return u.replace(/\/$/, "");
}

function getDomain(raw: string): string {
  try {
    const urlObj = new URL(cleanUrl(raw));
    return urlObj.hostname.replace("www.", "");
  } catch {
    return raw;
  }
}

// --- 1. Google PageSpeed API ---
async function fetchPageSpeed(url: string) {
  try {
    const key = process.env.GOOGLE_PAGESPEED_API_KEY;
    const apiKeyParam = key ? `&key=${key}` : "";
    const base = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';
    const target = encodeURIComponent(cleanUrl(url));

    const [mobRes, deskRes] = await Promise.all([
      fetch(`${base}?url=${target}&strategy=mobile${apiKeyParam}`).then(res => res.json()),
      fetch(`${base}?url=${target}&strategy=desktop${apiKeyParam}`).then(res => res.json())
    ]);

    const sc = (d: any) => d?.lighthouseResult?.categories?.performance?.score;
    const au = (d: any) => d?.lighthouseResult?.audits;

    return {
      source: "Google PageSpeed API",
      mob_perf: sc(mobRes) ? Math.round(sc(mobRes) * 100) : null,
      desk_perf: sc(deskRes) ? Math.round(sc(deskRes) * 100) : null,
      lcp: au(deskRes)?.['largest-contentful-paint']?.displayValue || null,
      tbt: au(deskRes)?.['total-blocking-time']?.displayValue || null,
      cls: au(deskRes)?.['cumulative-layout-shift']?.displayValue || null,
    };
  } catch (error) {
    console.error("PageSpeed API Error (Skipped):", error);
    return null;
  }
}

// --- 2. HTML Scraper (Parallel Friendly) ---
async function scrapeUrl(url: string) {
  try {
    const cleaned = cleanUrl(url);
    // Timeout reduced to 5000ms to prevent Vercel 10s Serverless crash
    const res = await fetch(cleaned, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; BusinessOS-Audit/2.0)" },
      signal: AbortSignal.timeout(5000) 
    });

    if (!res.ok) return null;
    const html = await res.text();

    const has = (s: string) => html.toLowerCase().includes(s.toLowerCase());
    const tech: string[] = [];

    if (has("wp-content") || has("wordpress")) tech.push("WordPress");
    if (has("__NEXT_DATA__") || has("/_next/")) tech.push("Next.js");
    if (has("nuxt") || has("__nuxt")) tech.push("Nuxt.js");
    if (has("shopify")) tech.push("Shopify");
    if (has("wix.com")) tech.push("Wix");
    if (has("webflow.com")) tech.push("Webflow");
    if (has("squarespace")) tech.push("Squarespace");

    // Basic Meta Extraction
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const descMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/i);

    return {
      tech,
      meta: {
        title: titleMatch ? titleMatch[1].trim() : null,
        description: descMatch ? descMatch[1].trim() : null,
      }
    };
  } catch (error) {
    console.error("Scraper Error (Skipped):", error);
    return null;
  }
}

// --- 3. DNS Info ---
async function fetchDnsInfo(url: string) {
  try {
    const domain = getDomain(url);
    const res = await fetch(`https://dns.google/resolve?name=${domain}&type=A`, {
      signal: AbortSignal.timeout(3000)
    });
    if (!res.ok) return null;
    const data = await res.parseJson ? await res.json() : await res.json();
    
    return {
      domain,
      ips: data.Answer ? data.Answer.map((a: any) => a.data) : []
    };
  } catch (error) {
    console.error("DNS Info Error (Skipped):", error);
    return null;
  }
}

// --- Main API Handler ---
export async function POST(req: NextRequest) {
  try {
    const { url, competitorUrl, industry } = await req.json();

    if (!competitorUrl) {
      return NextResponse.json({ error: "Competitor URL lazmi hai." }, { status: 400 });
    }

    // Saari API calls ek sath (Parallel) chalengi, maximum 5-6 seconds mein response ready!
    const [pageSpeedData, scraperData, dnsData] = await Promise.all([
      fetchPageSpeed(competitorUrl),
      scrapeUrl(competitorUrl),
      fetchDnsInfo(competitorUrl)
    ]);

    return NextResponse.json({
      success: true,
      yourWebsite: url ? cleanUrl(url) : null,
      competitorUrl: cleanUrl(competitorUrl),
      industry: industry || "General",
      pageSpeed: pageSpeedData,
      techStack: scraperData?.tech || [],
      meta: scraperData?.meta || null,
      dns: dnsData
    });

  } catch (error: any) {
    console.error("Global Backend Error:", error);
    return NextResponse.json(
      { error: error.message || "Backend par koi masla hua hai." },
      { status: 500 }
    );
  }
  }
