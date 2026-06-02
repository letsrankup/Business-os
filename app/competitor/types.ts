// app/competitor/types.ts

export interface KWGap {
  kw: string;
  vol: string;
  kd: number;
  opportunity: string;
}

export interface TopKW {
  kw: string;
  vol: string;
  pos: string;
}

export interface Action {
  action: string;
  impact: string;
  effort: string;
}

export interface IntelligenceResult {
  overview: {
    name: string;
    domain: string;
    industry: string;
    threat_level: "High" | "Medium" | "Low";
    market_position: string;
    founded: string;
    employees: string;
    headquarters: string;
    funding: string;
    business_model: string;
    target_audience: string;
    value_prop: string;
    summary: string;
    overall_score: number;
  };
  performance: {
    mob_perf: number | null;
    desk_perf: number | null;
    mob_access: number | null;
    mob_seo: number | null;
    mob_bp: number | null;
    lcp: string | null;
    tbt: string | null;
    cls: string | null;
    ttfb: string | null;
    fcp: string | null;
    size: string | null;
    grade: string;
    issues: string[];
    fixes: string[];
  };
  seo_on_page: {
    score: number;
    domain_authority: number;
    title: string | null;
    description: string | null;
    h1: string | null;
    keywords_meta: string | null;
    ssl: boolean;
    canonical: boolean;
    structured_data: boolean;
    open_graph: boolean;
    twitter_card: boolean;
    robots_meta: boolean;
    schema_types: string[];
    organic_keywords: string;
    word_count: number;
    issues: string[];
  };
  technical: {
    score: number;
    cms: string | null;
    hosting: string | null;
    cdn: string | null;
    email_system: string | null;
    ip: string | null;
    html_size: string | null;
    tech_stack: string[];
    security_headers: string[];
    analytics: string[];
    marketing: string[];
    payments: string[];
    insights: string;
  };
  traffic: {
    score: number;
    monthly_visits: string;
    unique_visitors: string;
    avg_duration: string;
    bounce_rate: string;
    trend: string;
    yoy_change: string;
    traffic_sources: { direct: number; search: number; social: number };
    top_countries: string[];
    insights: string;
  };
  seo_off_page: {
    score: number;
    total_backlinks: string;
    referring_domains: string;
    dofollow_pct: string;
    link_velocity: string;
    domain_rank: string;
    global_rank: string;
    top_backlinks: string[];
    insights: string;
  };
  keywords: {
    organic_total: string;
    score: number;
    insights: string;
    top_keywords: TopKW[];
    gap_keywords: KWGap[];
    quick_wins: string[];
  };
  social: {
    score: number;
    insights: string;
    sentiment: { positive: number; neutral: number; negative: number };
    twitter: { followers: string; engagement: string };
    linkedin: { followers: string };
  };
  monetization: {
    score: number;
    estimated_mrr: string;
    free_trial: boolean;
    freemium: boolean;
    affiliate_program: boolean;
    models: string[];
    pricing_tiers: string;
    avg_deal: string;
    insights: string;
  };
  battleplan: {
    competitor_advantages: string[];
    your_opportunities: string[];
    quick_wins_30d: Action[];
    medium_90d: string[];
    long_12mo: string[];
    risks: string[];
    differentiation: string;
    verdict: string;
  };
  _meta: {
    domain: string;
    scanned_at: string;
    real_sources: {
      pagespeed: boolean;
      scraped: boolean;
      pagerank: boolean;
      dns: boolean;
      web_search: boolean;
    };
  };
}
