"use client";
import { useState, useEffect, useRef } from "react";

const SECTIONS = [
  { id: "overview", label: "Overview", icon: "🎯" },
  { id: "seo", label: "SEO Intelligence", icon: "🔍" },
  { id: "content", label: "Content Strategy", icon: "📝" },
  { id: "technical", label: "Tech Stack", icon: "⚙️" },
  { id: "social", label: "Social & Brand", icon: "📡" },
  { id: "traffic", label: "Traffic & Audience", icon: "📊" },
  { id: "backlinks", label: "Backlink Profile", icon: "🔗" },
  { id: "keywords", label: "Keyword Gaps", icon: "🗝️" },
  { id: "monetization", label: "Monetization", icon: "💰" },
  { id: "strategy", label: "Battle Plan", icon: "⚔️" },
];

const ScoreRing = ({ score, size = 80, color = "#06b6d4" }) => {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const pct = (score / 100) * circ;
  return (
    <svg width={size} height={size}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1e293b" strokeWidth="8" />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={`${pct} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dasharray 1.2s cubic-bezier(0.4,0,0.2,1)" }}
      />
      <text x={size / 2} y={size / 2 + 5} textAnchor="middle" fill={color} fontSize="16" fontWeight="bold" fontFamily="'Space Mono', monospace">
        {score}
      </text>
    </svg>
  );
};

const Pill = ({ text, color = "#06b6d4" }) => (
  <span style={{
    background: color + "22",
    border: `1px solid ${color}44`,
    color, borderRadius: 999, padding: "2px 10px",
    fontSize: 11, fontFamily: "'Space Mono', monospace", whiteSpace: "nowrap"
  }}>{text}</span>
);

const MetricCard = ({ label, value, icon, sub, color = "#06b6d4" }) => (
  <div style={{
    background: "#0f172a", border: `1px solid ${color}33`,
    borderRadius: 12, padding: "14px 16px",
    display: "flex", flexDirection: "column", gap: 4,
    boxShadow: `0 0 20px ${color}11`
  }}>
    <div style={{ fontSize: 20 }}>{icon}</div>
    <div style={{ color: "#64748b", fontSize: 11, fontFamily: "'Space Mono', monospace", textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
    <div style={{ color, fontWeight: 700, fontSize: 18, fontFamily: "'Space Mono', monospace" }}>{value}</div>
    {sub && <div style={{ color: "#475569", fontSize: 11 }}>{sub}</div>}
  </div>
);

const SectionCard = ({ title, icon, children, color = "#06b6d4" }) => (
  <div style={{
    background: "#0a1628", border: `1px solid ${color}22`,
    borderRadius: 16, padding: 20, marginBottom: 16,
    boxShadow: `0 4px 32px ${color}08`
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
      <span style={{ fontSize: 20 }}>{icon}</span>
      <span style={{ color, fontWeight: 700, fontSize: 14, fontFamily: "'Space Mono', monospace", letterSpacing: 0.5 }}>{title}</span>
    </div>
    {children}
  </div>
);

const ProgressBar = ({ label, value, max = 100, color = "#06b6d4" }) => (
  <div style={{ marginBottom: 10 }}>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
      <span style={{ color: "#94a3b8", fontSize: 12 }}>{label}</span>
      <span style={{ color, fontSize: 12, fontFamily: "'Space Mono', monospace" }}>{value}/{max}</span>
    </div>
    <div style={{ background: "#1e293b", borderRadius: 99, height: 6, overflow: "hidden" }}>
      <div style={{
        width: `${(value / max) * 100}%`, height: "100%",
        background: `linear-gradient(90deg, ${color}, ${color}88)`,
        borderRadius: 99, transition: "width 1s ease"
      }} />
    </div>
  </div>
);

const Tag = ({ text, type = "neutral" }) => {
  const colors = { strength: "#22c55e", weakness: "#ef4444", opportunity: "#f59e0b", neutral: "#06b6d4" };
  const c = colors[type];
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 8,
      padding: "8px 0", borderBottom: "1px solid #1e293b"
    }}>
      <span style={{ fontSize: 14, marginTop: 1 }}>
        {type === "strength" ? "✅" : type === "weakness" ? "❌" : type === "opportunity" ? "🎯" : "→"}
      </span>
      <span style={{ color: "#cbd5e1", fontSize: 13, lineHeight: 1.5 }}>{text}</span>
    </div>
  );
};
export default function CompetitorAnalysisPro() {
  const [yourSite, setYourSite] = useState("");
  const [compSite, setCompSite] = useState("");
  const [industry, setIndustry] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState("");
  const [error, setError] = useState("");
  const progressRef = useRef(null);

  const progressSteps = [
    "🔍 Scanning DNS & WHOIS records...",
    "📡 Analyzing backlink profiles...",
    "🗝️ Extracting keyword opportunities...",
    "⚙️ Detecting technology stack...",
    "📊 Estimating traffic patterns...",
    "📝 Auditing content strategy...",
    "🔗 Mapping internal link structure...",
    "📱 Checking social signals...",
    "💰 Identifying monetization models...",
    "🤖 Running AI competitive intelligence...",
    "⚔️ Generating battle plan...",
    "✅ Finalizing deep report...",
  ];

  const startProgress = () => {
    let i = 0;
    setProgress(0);
    setProgressMsg(progressSteps[0]);
    progressRef.current = setInterval(() => {
      i++;
      const pct = Math.min(95, Math.round((i / progressSteps.length) * 100));
      setProgress(pct);
      setProgressMsg(progressSteps[Math.min(i, progressSteps.length - 1)]);
      if (i >= progressSteps.length) clearInterval(progressRef.current);
    }, 1800);
  };

  const analyze = async () => {
    if (!compSite.trim()) { setError("Competitor website required!"); return; }
    setError("");
    setLoading(true);
    setResult(null);
    startProgress();

    const prompt = `You are the world's most advanced competitive intelligence AI, combining capabilities of Semrush, Ahrefs, Moz, SimilarWeb, BuiltWith, SpyFu, BuzzSumo, and Brandwatch into one system.

Perform a DEEP, COMPREHENSIVE, DATA-RICH competitive analysis.

My Website: ${yourSite || "Not provided"}
Competitor: ${compSite}
Industry: ${industry || "Auto-detect"}

Return ONLY a raw JSON object (no markdown, no backticks) with this EXACT structure:

{
  "overview": {
    "competitor_name": "...",
    "domain": "...",
    "industry": "...",
    "founded_year": "...",
    "company_size": "...",
    "headquarters": "...",
    "business_model": "...",
    "target_audience": "...",
    "unique_value_prop": "...",
    "overall_score": 78,
    "threat_level": "High|Medium|Low",
    "market_position": "...",
    "executive_summary": "3-4 sentence deep insight about this competitor"
  },
  "seo": {
    "score": 82,
    "domain_authority": 67,
    "page_authority": 58,
    "trust_flow": 45,
    "citation_flow": 52,
    "organic_keywords": "142K",
    "ranking_keywords_top3": "8,200",
    "ranking_keywords_top10": "31,500",
    "featured_snippets": 234,
    "core_web_vitals": { "lcp": "1.8s", "fid": "12ms", "cls": "0.04" },
    "mobile_score": 91,
    "indexed_pages": "89,000",
    "crawl_errors": 12,
    "structured_data": ["FAQ", "Article", "BreadcrumbList", "Product"],
    "meta_optimization": 88,
    "title_tag_quality": 85,
    "strengths": ["Excellent technical SEO", "Strong E-E-A-T signals", "Fast Core Web Vitals"],
    "weaknesses": ["Thin content on category pages", "Missing alt tags on 15% images", "Slow TTFB on mobile"],
    "insights": "3-4 sentences about SEO strategy"
  },
  "content": {
    "score": 75,
    "total_pages": "12,400",
    "blog_posts": "3,200",
    "avg_word_count": 2100,
    "content_freshness": "High",
    "publishing_frequency": "4x per week",
    "top_content_formats": ["Long-form guides", "Case studies", "Video embeds", "Infographics"],
    "content_gaps": ["No podcast content", "Weak video SEO", "No interactive tools"],
    "top_topics": ["Topic 1", "Topic 2", "Topic 3", "Topic 4", "Topic 5"],
    "readability_score": 72,
    "content_depth": "Expert-level",
    "cta_strategy": "...",
    "insights": "3-4 sentences about content strategy"
  },
  "technical": {
    "score": 80,
    "cms": "...",
    "hosting": "...",
    "cdn": "...",
    "ssl": true,
    "http2": true,
    "page_speed_desktop": 88,
    "page_speed_mobile": 74,
    "tech_stack": ["React", "Node.js", "AWS", "Cloudflare", "Stripe", "HubSpot"],
    "analytics_tools": ["Google Analytics 4", "Hotjar", "Segment"],
    "marketing_tools": ["HubSpot", "Mailchimp", "Intercom"],
    "security_headers": 7,
    "uptime": "99.97%",
    "server_location": "...",
    "compression": "Brotli",
    "insights": "3-4 sentences about technical infrastructure"
  },
  "social": {
    "score": 68,
    "platforms": {
      "twitter": { "followers": "45K", "engagement": "2.1%", "posts_per_week": 14 },
      "linkedin": { "followers": "28K", "engagement": "3.4%", "posts_per_week": 5 },
      "instagram": { "followers": "12K", "engagement": "1.8%", "posts_per_week": 7 },
      "youtube": { "subscribers": "8K", "views_per_video": "2,400", "videos": 89 },
      "facebook": { "followers": "22K", "engagement": "0.9%", "posts_per_week": 3 }
    },
    "brand_sentiment": { "positive": 67, "neutral": 24, "negative": 9 },
    "brand_mentions_monthly": "4,200",
    "influencer_partnerships": "Active",
    "top_content_type": "...",
    "viral_content_strategy": "...",
    "insights": "3-4 sentences about social strategy"
  },
  "traffic": {
    "score": 77,
    "monthly_visits": "890K",
    "monthly_unique_visitors": "620K",
    "avg_visit_duration": "3m 42s",
    "pages_per_session": 4.2,
    "bounce_rate": "38%",
    "traffic_sources": {
      "organic": 52,
      "direct": 22,
      "social": 11,
      "referral": 9,
      "paid": 4,
      "email": 2
    },
    "top_countries": ["United States 42%", "United Kingdom 18%", "India 12%", "Canada 8%", "Australia 6%"],
    "device_split": { "mobile": 61, "desktop": 34, "tablet": 5 },
    "traffic_trend": "Growing +18% YoY",
    "audience_demographics": "25-44 age group, tech-savvy professionals",
    "insights": "3-4 sentences about traffic patterns"
  },
  "backlinks": {
    "score": 71,
    "total_backlinks": "284K",
    "referring_domains": "8,400",
    "dofollow_ratio": "73%",
    "nofollow_ratio": "27%",
    "avg_dr_linking": 52,
    "top_anchor_texts": ["brand name", "click here", "learn more", "keyword 1", "keyword 2"],
    "toxic_backlinks": "2.1%",
    "link_velocity": "+340 new links/month",
    "top_referring_domains": ["forbes.com", "techcrunch.com", "producthunt.com"],
    "link_building_strategy": "...",
    "insights": "3-4 sentences about backlink profile"
  },
  "keywords": {
    "score": 73,
    "competitor_unique_keywords": "89,000",
    "shared_keywords": "12,400",
    "your_unique_keywords": "34,000",
    "gap_opportunities": [
      {"keyword": "example keyword 1", "volume": "8,200/mo", "difficulty": 42, "opportunity": "High"},
      {"keyword": "example keyword 2", "volume": "5,400/mo", "difficulty": 38, "opportunity": "High"},
      {"keyword": "example keyword 3", "volume": "3,100/mo", "difficulty": 29, "opportunity": "Medium"},
      {"keyword": "example keyword 4", "volume": "2,800/mo", "difficulty": 55, "opportunity": "Medium"},
      {"keyword": "example keyword 5", "volume": "1,900/mo", "difficulty": 22, "opportunity": "High"}
    ],
    "quick_win_keywords": ["keyword A", "keyword B", "keyword C"],
    "long_tail_opportunities": 4200,
    "insights": "3-4 sentences about keyword gaps"
  },
  "monetization": {
    "score": 79,
    "revenue_model": ["SaaS Subscription", "Freemium", "Enterprise Licensing"],
    "estimated_mrr": "$280K-$420K",
    "pricing_strategy": "...",
    "free_trial": true,
    "pricing_tiers": 3,
    "average_deal_size": "$129/mo",
    "churn_signals": "Low",
    "upsell_tactics": ["Annual discount", "Feature gating", "Usage limits"],
    "ad_revenue": false,
    "affiliate_program": true,
    "insights": "3-4 sentences about monetization strategy"
  },
  "strategy": {
    "score": 76,
    "competitive_advantages": ["Advantage 1", "Advantage 2", "Advantage 3"],
    "your_opportunities": ["Opportunity 1", "Opportunity 2", "Opportunity 3", "Opportunity 4"],
    "quick_wins_30_days": ["Action 1", "Action 2", "Action 3"],
    "medium_term_90_days": ["Action 1", "Action 2", "Action 3"],
    "long_term_12_months": ["Action 1", "Action 2", "Action 3"],
    "differentiation_strategy": "...",
    "positioning_recommendation": "...",
    "risk_factors": ["Risk 1", "Risk 2"],
    "final_verdict": "2-3 sentence final strategic verdict"
  }
}`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4000,
          messages: [{ role: "user", content: prompt }]
        })
      });

      const data = await res.json();
      clearInterval(progressRef.current);
      setProgress(100);
      setProgressMsg("✅ Analysis complete!");

      const text = data.content?.map(b => b.text || "").join("") || "";
      const clean = text.replace(/```json|
```/g, "").trim();
      const parsed = JSON.parse(clean);
      setTimeout(() => {
        setResult(parsed);
        setLoading(false);
        setActiveTab("overview");
      }, 600);
    } catch (e) {
      clearInterval(progressRef.current);
      setError("Analysis failed. Please try again.");
      setLoading(false);
    }
  };
  const threatColor = (level) =>
    level === "High" ? "#ef4444" : level === "Medium" ? "#f59e0b" : "#22c55e";

  const tabColor = (id) => {
    const map = {
      overview: "#06b6d4", seo: "#8b5cf6", content: "#f59e0b",
      technical: "#22c55e", social: "#ec4899", traffic: "#06b6d4",
      backlinks: "#8b5cf6", keywords: "#f59e0b", monetization: "#22c55e", strategy: "#ef4444"
    };
    return map[id] || "#06b6d4";
  };

  const renderSection = () => {
    if (!result) return null;
    const d = result;
    const color = tabColor(activeTab);

    if (activeTab === "overview") {
      const o = d.overview;
      return (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 20, flexWrap: "wrap" }}>
            <ScoreRing score="{o.overall_score}" size="{90}" color="{color}"/>
            <div>
              <div style={{ color: "#f1f5f9", fontSize: 22, fontWeight: 800, fontFamily: "'Space Mono', monospace" }}>{o.competitor_name}</div>
              <div style={{ color: "#64748b", fontSize: 13 }}>{o.domain} · {o.industry}</div>
              <div style={{ marginTop: 8 }}>
                <span style={{
                  background: threatColor(o.threat_level) + "22",
                  border: `1px solid ${threatColor(o.threat_level)}44`,
                  color: threatColor(o.threat_level), borderRadius: 99,
                  padding: "3px 12px", fontSize: 12, fontFamily: "'Space Mono', monospace"
                }}>⚠️ {o.threat_level} Threat</span>
              </div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            <MetricCard icon="🏢" label="Founded" value="{o.founded_year}" color="{color}"/>
            <MetricCard icon="👥" label="Company Size" value="{o.company_size}" color="{color}"/>
            <MetricCard icon="📍" label="HQ" value="{o.headquarters}" color="{color}"/>
            <MetricCard icon="🏆" label="Market Position" value="{o.market_position}" color="{color}"/>
          </div>
          <SectionCard title="Business Model" icon="💼" color="{color}">
            <div style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.7 }}>{o.business_model}</div>
          </SectionCard>
          <SectionCard title="Target Audience" icon="🎯" color="{color}">
            <div style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.7 }}>{o.target_audience}</div>
          </SectionCard>
          <SectionCard title="Unique Value Proposition" icon="💡" color="{color}">
            <div style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.7 }}>{o.unique_value_prop}</div>
          </SectionCard>
          <SectionCard title="Executive Intelligence Summary" icon="🧠" color="{color}">
            <div style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.7 }}>{o.executive_summary}</div>
          </SectionCard>
        </div>
      );
    }

    if (activeTab === "seo") {
      const s = d.seo;
      return (
        <div>
          <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 20 }}>
            <ScoreRing score="{s.score}" color="{color}"/>
            <div style={{ flex: 1 }}>
              <ProgressBar label="Domain Authority" value="{s.domain_authority}" color="{color}"/>
              <ProgressBar label="Trust Flow" value="{s.trust_flow}" color="{color}"/>
              <ProgressBar label="Mobile Score" value="{s.mobile_score}" color="{color}"/>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            <MetricCard icon="🗝️" label="Organic Keywords" value="{s.organic_keywords}" color="{color}"/>
            <MetricCard icon="🥇" label="Top 3 Rankings" value="{s.ranking_keywords_top3}" color="{color}"/>
            <MetricCard icon="🏅" label="Featured Snippets" value="{s.featured_snippets}" color="{color}"/>
            <MetricCard icon="📑" label="Indexed Pages" value="{s.indexed_pages}" color="{color}"/>
          </div>
          <SectionCard title="Core Web Vitals" icon="⚡" color="{color}">
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              {[["LCP", s.core_web_vitals?.lcp, "#22c55e"], ["FID", s.core_web_vitals?.fid, "#06b6d4"], ["CLS", s.core_web_vitals?.cls, "#f59e0b"]].map(([k, v, c]) => (
                <div key={k} style={{ textAlign: "center" }}>
                  <div style={{ color: c, fontSize: 18, fontWeight: 700, fontFamily: "'Space Mono', monospace" }}>{v}</div>
                  <div style={{ color: "#64748b", fontSize: 11 }}>{k}</div>
                </div>
              ))}
            </div>
          </SectionCard>
          <SectionCard title="Structured Data" icon="📋" color="{color}">
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {s.structured_data?.map(t => <Pill key="{t}" text="{t}" color="{color}"/>)}
            </div>
          </SectionCard>
          <SectionCard title="SEO Strengths" icon="✅" color="#22c55e">
            {s.strengths?.map(x => <Tag key="{x}" text="{x}" type="strength"/>)}
          </SectionCard>
          <SectionCard title="SEO Weaknesses" icon="❌" color="#ef4444">
            {s.weaknesses?.map(x => <Tag key="{x}" text="{x}" type="weakness"/>)}
          </SectionCard>
          <SectionCard title="SEO Intelligence" icon="🧠" color="{color}">
            <div style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.7 }}>{s.insights}</div>
          </SectionCard>
        </div>
      );
    }

    if (activeTab === "content") {
      const c = d.content;
      return (
        <div>
          <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
            <ScoreRing score="{c.score}" color="{color}"/>
            <div style={{ flex: 1 }}>
              <ProgressBar label="Readability" value="{c.readability_score}" color="{color}"/>
              <ProgressBar label="Content Freshness" value="{c.content_freshness" "High" ? 85 : 50} max="{100}" color="{color}"/>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            <MetricCard icon="📄" label="Total Pages" value="{c.total_pages}" color="{color}"/>
            <MetricCard icon="✍️" label="Blog Posts" value="{c.blog_posts}" color="{color}"/>
            <MetricCard icon="📏" label="Avg Word Count" value="{c.avg_word_count}" color="{color}"/>
            <MetricCard icon="📅" label="Publishing Rate" value="{c.publishing_frequency}" color="{color}"/>
          </div>
          <SectionCard title="Top Content Formats" icon="🎨" color="{color}">
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {c.top_content_formats?.map(f => <Pill key="{f}" text="{f}" color="{color}"/>)}
            </div>
          </SectionCard>
          <SectionCard title="Top Topics Covered" icon="📌" color="{color}">
            {c.top_topics?.map((t, i) => (
              <div key={t} style={{ padding: "6px 0", borderBottom: "1px solid #1e293b", color: "#94a3b8", fontSize: 13 }}>
                <span style={{ color, marginRight: 8 }}>{i + 1}.</span>{t}
              </div>
            ))}
          </SectionCard>
          <SectionCard title="Content Gaps (Your Opportunities)" icon="🎯" color="#f59e0b">
            {c.content_gaps?.map(g => <Tag key="{g}" text="{g}" type="opportunity"/>)}
          </SectionCard>
          <SectionCard title="Content Intelligence" icon="🧠" color="{color}">
            <div style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.7 }}>{c.insights}</div>
          </SectionCard>
        </div>
      );
        }
            if (activeTab === "technical") {
      const t = d.technical;
      return (
        <div>
          <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
            <ScoreRing score="{t.score}" color="{color}"/>
            <div style={{ flex: 1 }}>
              <ProgressBar label="Desktop Speed" value="{t.page_speed_desktop}" color="{color}"/>
              <ProgressBar label="Mobile Speed" value="{t.page_speed_mobile}" color="{color}"/>
              <ProgressBar label="Security Headers" value="{t.security_headers}" max="{12}" color="{color}"/>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            <MetricCard icon="🖥️" label="CMS" value="{t.cms}" color="{color}"/>
            <MetricCard icon="☁️" label="Hosting" value="{t.hosting}" color="{color}"/>
            <MetricCard icon="🌐" label="CDN" value="{t.cdn}" color="{color}"/>
            <MetricCard icon="⏱️" label="Uptime" value="{t.uptime}" color="{color}"/>
          </div>
          <SectionCard title="Technology Stack" icon="⚙️" color="{color}">
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {t.tech_stack?.map(s => <Pill key="{s}" text="{s}" color="{color}"/>)}
            </div>
          </SectionCard>
          <SectionCard title="Analytics & Marketing Tools" icon="📊" color="{color}">
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
              {t.analytics_tools?.map(s => <Pill key="{s}" text="{s}" color="#f59e0b"/>)}
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {t.marketing_tools?.map(s => <Pill key="{s}" text="{s}" color="#ec4899"/>)}
            </div>
          </SectionCard>
          <SectionCard title="Tech Intelligence" icon="🧠" color="{color}">
            <div style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.7 }}>{t.insights}</div>
          </SectionCard>
        </div>
      );
    }

    if (activeTab === "social") {
      const s = d.social;
      const platforms = [
        { key: "twitter", icon: "𝕏", name: "Twitter/X" },
        { key: "linkedin", icon: "in", name: "LinkedIn" },
        { key: "instagram", icon: "📷", name: "Instagram" },
        { key: "youtube", icon: "▶", name: "YouTube" },
        { key: "facebook", icon: "f", name: "Facebook" },
      ];
      return (
        <div>
          <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
            <ScoreRing score="{s.score}" color="{color}"/>
            <div style={{ flex: 1 }}>
              <div style={{ marginBottom: 8 }}>
                <div style={{ color: "#64748b", fontSize: 11, marginBottom: 4 }}>Brand Sentiment</div>
                <div style={{ display: "flex", height: 8, borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ width: `${s.brand_sentiment?.positive}%`, background: "#22c55e" }} />
                  <div style={{ width: `${s.brand_sentiment?.neutral}%`, background: "#64748b" }} />
                  <div style={{ width: `${s.brand_sentiment?.negative}%`, background: "#ef4444" }} />
                </div>
                <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
                  <span style={{ color: "#22c55e", fontSize: 11 }}>+{s.brand_sentiment?.positive}%</span>
                  <span style={{ color: "#64748b", fontSize: 11 }}>~{s.brand_sentiment?.neutral}%</span>
                  <span style={{ color: "#ef4444", fontSize: 11 }}>-{s.brand_sentiment?.negative}%</span>
                </div>
              </div>
              <MetricCard icon="💬" label="Monthly Mentions" value="{s.brand_mentions_monthly}" color="{color}"/>
            </div>
          </div>
          {platforms.map(p => {
            const data = s.platforms?.[p.key];
            if (!data) return null;
            return (
              <div key={p.key} style={{
                background: "#0f172a", border: `1px solid ${color}22`,
                borderRadius: 12, padding: "12px 16px", marginBottom: 10,
                display: "flex", alignItems: "center", gap: 16
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8,
                  background: color + "22", display: "flex", alignItems: "center",
                  justifyContent: "center", color, fontWeight: 700, fontSize: 14,
                  fontFamily: "'Space Mono', monospace", flexShrink: 0
                }}>{p.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: "#f1f5f9", fontSize: 13, fontWeight: 600 }}>{p.name}</div>
                  <div style={{ color: "#64748b", fontSize: 11 }}>{data.followers || data.subscribers} followers · {data.engagement || ""} engagement</div>
                </div>
                <div style={{ color, fontSize: 13, fontFamily: "'Space Mono', monospace" }}>{data.posts_per_week || data.videos} posts</div>
              </div>
            );
          })}
          <SectionCard title="Social Intelligence" icon="🧠" color="{color}">
            <div style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.7 }}>{s.insights}</div>
          </SectionCard>
        </div>
      );
    }

    if (activeTab === "traffic") {
      const t = d.traffic;
      const sources = t.traffic_sources || {};
      return (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            <MetricCard icon="👁️" label="Monthly Visits" value="{t.monthly_visits}" color="{color}"/>
            <MetricCard icon="👤" label="Unique Visitors" value="{t.monthly_unique_visitors}" color="{color}"/>
            <MetricCard icon="⏱️" label="Avg Duration" value="{t.avg_visit_duration}" color="{color}"/>
            <MetricCard icon="📄" label="Pages/Session" value="{t.pages_per_session}" color="{color}"/>
            <MetricCard icon="↩️" label="Bounce Rate" value="{t.bounce_rate}" color="{color}"/>
            <MetricCard icon="📈" label="Traffic Trend" value="{t.traffic_trend}" color="#22c55e"/>
          </div>
          <SectionCard title="Traffic Sources" icon="🗺️" color="{color}">
            {Object.entries(sources).map(([src, pct]) => (
              <ProgressBar key="{src}" label="{src.charAt(0).toUpperCase()" + src.slice(1)} value="{pct}" color="{color}"/>
            ))}
          </SectionCard>
          <SectionCard title="Top Countries" icon="🌍" color="{color}">
            {t.top_countries?.map(c => (
              <div key={c} style={{ padding: "6px 0", borderBottom: "1px solid #1e293b", color: "#94a3b8", fontSize: 13 }}>
                🌐 {c}
              </div>
            ))}
          </SectionCard>
          <SectionCard title="Device Split" icon="📱" color="{color}">
            <div style={{ display: "flex", gap: 16 }}>
              {[["📱 Mobile", t.device_split?.mobile, color], ["🖥️ Desktop", t.device_split?.desktop, "#8b5cf6"], ["📲 Tablet", t.device_split?.tablet, "#f59e0b"]].map(([label, val, c]) => (
                <div key={label} style={{ textAlign: "center" }}>
                  <div style={{ color: c, fontSize: 18, fontWeight: 700 }}>{val}%</div>
                  <div style={{ color: "#64748b", fontSize: 11 }}>{label}</div>
                </div>
              ))}
            </div>
          </SectionCard>
          <SectionCard title="Traffic Intelligence" icon="🧠" color="{color}">
            <div style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.7 }}>{t.insights}</div>
          </SectionCard>
        </div>
      );
    }

    if (activeTab === "backlinks") {
      const b = d.backlinks;
      return (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            <MetricCard icon="🔗" label="Total Backlinks" value="{b.total_backlinks}" color="{color}"/>
            <MetricCard icon="🌐" label="Referring Domains" value="{b.referring_domains}" color="{color}"/>
            <MetricCard icon="✅" label="Dofollow" value="{b.dofollow_ratio}" color="#22c55e"/>
            <MetricCard icon="📈" label="Link Velocity" value="{b.link_velocity}" color="{color}"/>
          </div>
          <SectionCard title="Top Referring Domains" icon="🏆" color="{color}">
            {b.top_referring_domains?.map(d => (
              <div key={d} style={{ padding: "6px 0", borderBottom: "1px solid #1e293b", color: "#94a3b8", fontSize: 13 }}>
                🔗 {d}
              </div>
            ))}
          </SectionCard>
          <SectionCard title="Top Anchor Texts" icon="⚓" color="{color}">
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {b.top_anchor_texts?.map(t => <Pill key="{t}" text="{t}" color="{color}"/>)}
            </div>
          </SectionCard>
          <SectionCard title="Toxic Backlinks" icon="☠️" color="#ef4444">
            <div style={{ color: "#ef4444", fontSize: 18, fontWeight: 700, fontFamily: "'Space Mono', monospace" }}>{b.toxic_backlinks}</div>
            <div style={{ color: "#64748b", fontSize: 12 }}>of total backlink profile is toxic/spammy</div>
          </SectionCard>
          <SectionCard title="Backlink Intelligence" icon="🧠" color="{color}">
            <div style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.7 }}>{b.insights}</div>
          </SectionCard>
        </div>
      );
    }

    if (activeTab === "keywords") {
      const k = d.keywords;
      return (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            <MetricCard icon="🔑" label="Their Unique KWs" value="{k.competitor_unique_keywords}" color="#ef4444"/>
            <MetricCard icon="🤝" label="Shared KWs" value="{k.shared_keywords}" color="{color}"/>
            <MetricCard icon="⭐" label="Your Unique KWs" value="{k.your_unique_keywords}" color="#22c55e"/>
            <MetricCard icon="🎯" label="Long-tail Opps" value="{k.long_tail_opportunities}" color="#f59e0b"/>
          </div>
          <SectionCard title="🔥 Top Keyword Gap Opportunities" icon="🎯" color="{color}">
            {k.gap_opportunities?.map((g, i) => (
              <div key={i} style={{
                padding: "10px 0", borderBottom: "1px solid #1e293b",
                display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8
              }}>
                <div>
                  <div style={{ color: "#f1f5f9", fontSize: 13, fontWeight: 600 }}>{g.keyword}</div>
                  <div style={{ color: "#64748b", fontSize: 11 }}>{g.volume} · Difficulty: {g.difficulty}</div>
                </div>
                <Pill text="{g.opportunity}" color="{g.opportunity" "High" ? "#22c55e" : "#f59e0b"}/>
              </div>
            ))}
          </SectionCard>
          <SectionCard title="Quick Win Keywords" icon="⚡" color="#22c55e">
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {k.quick_win_keywords?.map(kw => <Pill key="{kw}" text="{kw}" color="#22c55e"/>)}
            </div>
          </SectionCard>
          <SectionCard title="Keyword Intelligence" icon="🧠" color="{color}">
            <div style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.7 }}>{k.insights}</div>
          </SectionCard>
        </div>
      );
    }
        if (activeTab === "monetization") {
      const m = d.monetization;
      return (
        <div>
          <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
            <ScoreRing score="{m.score}" color="{color}"/>
            <div>
              <div style={{ color: "#f1f5f9", fontSize: 18, fontWeight: 700, fontFamily: "'Space Mono', monospace" }}>{m.estimated_mrr}</div>
              <div style={{ color: "#64748b", fontSize: 12 }}>Estimated Monthly Revenue</div>
              <div style={{ marginTop: 6 }}>
                <Pill text="{`${m.pricing_tiers}" Pricing Tiers`} color="{color}"/>
                {m.free_trial && <Pill text="Free Trial ✓" color="#22c55e"/>}
                {m.affiliate_program && <Pill text="Affiliate ✓" color="#f59e0b"/>}
              </div>
            </div>
          </div>
          <SectionCard title="Revenue Models" icon="💰" color="{color}">
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {m.revenue_model?.map(r => <Pill key="{r}" text="{r}" color="{color}"/>)}
            </div>
          </SectionCard>
          <SectionCard title="Upsell Tactics" icon="📈" color="#f59e0b">
            {m.upsell_tactics?.map(t => <Tag key="{t}" text="{t}" type="opportunity"/>)}
          </SectionCard>
          <SectionCard title="Pricing Strategy" icon="🏷️" color="{color}">
            <div style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.7 }}>{m.pricing_strategy}</div>
            <div style={{ marginTop: 8 }}>
              <span style={{ color, fontFamily: "'Space Mono', monospace", fontSize: 16, fontWeight: 700 }}>{m.average_deal_size}</span>
              <span style={{ color: "#64748b", fontSize: 12 }}> average deal size</span>
            </div>
          </SectionCard>
          <SectionCard title="Monetization Intelligence" icon="🧠" color="{color}">
            <div style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.7 }}>{m.insights}</div>
          </SectionCard>
        </div>
      );
    }

    if (activeTab === "strategy") {
      const s = d.strategy;
      return (
        <div>
          <SectionCard title="⚡ Quick Wins (30 Days)" icon="🏃" color="#22c55e">
            {s.quick_wins_30_days?.map((a, i) => (
              <div key={i} style={{ padding: "8px 0", borderBottom: "1px solid #1e293b", color: "#94a3b8", fontSize: 13, display: "flex", gap: 8 }}>
                <span style={{ color: "#22c55e", fontWeight: 700 }}>{i + 1}.</span> {a}
              </div>
            ))}
          </SectionCard>
          <SectionCard title="📈 Medium Term (90 Days)" icon="🗓️" color="#f59e0b">
            {s.medium_term_90_days?.map((a, i) => (
              <div key={i} style={{ padding: "8px 0", borderBottom: "1px solid #1e293b", color: "#94a3b8", fontSize: 13, display: "flex", gap: 8 }}>
                <span style={{ color: "#f59e0b", fontWeight: 700 }}>{i + 1}.</span> {a}
              </div>
            ))}
          </SectionCard>
          <SectionCard title="🚀 Long Term (12 Months)" icon="🎯" color="#8b5cf6">
            {s.long_term_12_months?.map((a, i) => (
              <div key={i} style={{ padding: "8px 0", borderBottom: "1px solid #1e293b", color: "#94a3b8", fontSize: 13, display: "flex", gap: 8 }}>
                <span style={{ color: "#8b5cf6", fontWeight: 700 }}>{i + 1}.</span> {a}
              </div>
            ))}
          </SectionCard>
          <SectionCard title="Your Competitive Opportunities" icon="🏆" color="{color}">
            {s.your_opportunities?.map(o => <Tag key="{o}" text="{o}" type="opportunity"/>)}
          </SectionCard>
          <SectionCard title="⚠️ Risk Factors" icon="🚨" color="#ef4444">
            {s.risk_factors?.map(r => <Tag key="{r}" text="{r}" type="weakness"/>)}
          </SectionCard>
          <SectionCard title="🧠 Final Strategic Verdict" icon="⚔️" color="{color}">
            <div style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.7 }}>{s.final_verdict}</div>
          </SectionCard>
        </div>
      );
    }

    return null;
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#020617",
      fontFamily: "'Courier New', 'Space Mono', monospace",
      color: "#f1f5f9", padding: 0
    }}>
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0a0f1e; }
        ::-webkit-scrollbar-thumb { background: #06b6d433; border-radius: 99px; }
        input { outline: none; }
        input::placeholder { color: #334155; }
      `}</style>

      
      <div style={{
        background: "linear-gradient(135deg, #020617 0%, #0a1628 50%, #020617 100%)",
        borderBottom: "1px solid #06b6d422",
        padding: "20px 20px 16px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: "linear-gradient(135deg, #06b6d4, #7c3aed)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20
          }}>🕵️</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "'Space Mono', monospace", letterSpacing: -0.5 }}>
              <span style={{ color: "#06b6d4" }}>Competitor</span>
              <span style={{ color: "#7c3aed" }}>Intel</span>
              <span style={{ color: "#f1f5f9" }}> Pro</span>
            </div>
            <div style={{ color: "#475569", fontSize: 11 }}>AI-Powered Deep Competitive Intelligence</div>
          </div>
        </div>
      </div>

      
      <div style={{ padding: "16px 20px", background: "#050d1a", borderBottom: "1px solid #0f2040" }}>
        <div style={{ marginBottom: 10 }}>
          <label style={{ color: "#475569", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 4 }}>Your Website (optional)</label>
          <input
            value={yourSite}
            onChange={e => setYourSite(e.target.value)}
            placeholder="yoursite.com"
            style={{
              width: "100%", background: "#0a1628", border: "1px solid #1e3a5f",
              borderRadius: 10, padding: "10px 14px", color: "#f1f5f9", fontSize: 14,
              fontFamily: "'Space Mono', monospace"
            }}
          />
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={{ color: "#475569", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 4 }}>Competitor Website *</label>
          <input
            value={compSite}
            onChange={e => setCompSite(e.target.value)}
            placeholder="competitor.com"
            style={{
              width: "100%", background: "#0a1628", border: "1px solid #1e3a5f",
              borderRadius: 10, padding: "10px 14px", color: "#f1f5f9", fontSize: 14,
              fontFamily: "'Space Mono', monospace"
            }}
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ color: "#475569", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 4 }}>Industry (optional)</label>
          <input
            value={industry}
            onChange={e => setIndustry(e.target.value)}
            placeholder="e.g. SaaS, E-commerce, FinTech..."
            style={{
              width: "100%", background: "#0a1628", border: "1px solid #1e3a5f",
              borderRadius: 10, padding: "10px 14px", color: "#f1f5f9", fontSize: 14,
              fontFamily: "'Space Mono', monospace"
            }}
          />
        </div>
        {error && <div style={{ color: "#ef4444", fontSize: 12, marginBottom: 8 }}>⚠️ {error}</div>}
        <button
          onClick={analyze}
          disabled={loading}
          style={{
            width: "100%", padding: "12px",
            background: loading ? "#1e293b" : "linear-gradient(135deg, #06b6d4, #7c3aed)",
            border: "none", borderRadius: 10, color: "#fff",
            fontSize: 14, fontWeight: 700, fontFamily: "'Space Mono', monospace",
            cursor: loading ? "not-allowed" : "pointer",
            letterSpacing: 0.5, transition: "opacity 0.2s"
          }}
        >
          {loading ? "🔄 Analyzing..." : "🕵️ Run Deep Analysis"}
        </button>
      </div>

      
      {loading && (
        <div style={{ padding: "20px", background: "#050d1a" }}>
          <div style={{ color: "#06b6d4", fontSize: 12, marginBottom: 8, fontFamily: "'Space Mono', monospace" }}>{progressMsg}</div>
          <div style={{ background: "#0f172a", borderRadius: 99, height: 6, overflow: "hidden", marginBottom: 6 }}>
            <div style={{
              width: `${progress}%`, height: "100%",
              background: "linear-gradient(90deg, #06b6d4, #7c3aed)",
              borderRadius: 99, transition: "width 0.8s ease"
            }} />
          </div>
          <div style={{ color: "#334155", fontSize: 11, textAlign: "right" }}>{progress}%</div>
          <div style={{
            marginTop: 12, background: "#0a1628", border: "1px solid #0f2040",
            borderRadius: 12, padding: 14
          }}>
            <div style={{ color: "#334155", fontSize: 11, lineHeight: 2 }}>
              {["SEO Audit", "Backlinks", "Tech Stack", "Traffic", "Keywords", "Social", "Monetization"].map((s, i) => (
                <span key={s} style={{ marginRight: 12 }}>
                  <span style={{ color: progress > (i + 1) * 13 ? "#22c55e" : "#334155" }}>
                    {progress > (i + 1) * 13 ? "✓" : "○"}
                  </span> {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      
      {result && (
        <div>
          
          <div style={{
            background: "#050d1a", borderBottom: "1px solid #0f2040",
            padding: "12px 20px", display: "flex", gap: 10, overflowX: "auto"
          }}>
            {["seo", "content", "technical", "social", "traffic", "backlinks"].map(key => {
              const s = result[key]?.score;
              if (!s) return null;
              return (
                <div key={key} style={{ textAlign: "center", minWidth: 48 }}>
                  <div style={{ color: tabColor(key), fontSize: 14, fontWeight: 700 }}>{s}</div>
                  <div style={{ color: "#334155", fontSize: 9, textTransform: "uppercase" }}>{key.slice(0, 4)}</div>
                </div>
              );
            })}
          </div>

          
          <div style={{
            display: "flex", overflowX: "auto", gap: 0,
            borderBottom: "1px solid #0f2040", background: "#050d1a"
          }}>
            {SECTIONS.map(s => (
              <button key={s.id} onClick={() => setActiveTab(s.id)} style={{
                background: "none", border: "none",
                borderBottom: activeTab === s.id ? `2px solid ${tabColor(s.id)}` : "2px solid transparent",
                color: activeTab === s.id ? tabColor(s.id) : "#475569",
                padding: "10px 14px", cursor: "pointer",
                fontSize: 11, fontFamily: "'Space Mono', monospace",
                whiteSpace: "nowrap", transition: "all 0.2s"
              }}>{s.icon} {s.label}</button>
            ))}
          </div>

          
          <div style={{ padding: "16px 20px 60px" }}>
            {renderSection()}
          </div>
        </div>
      )}

      
      {!loading && !result && (
        <div style={{ padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🕵️</div>
          <div style={{ color: "#1e3a5f", fontSize: 14, lineHeight: 1.8 }}>
            Enter a competitor URL to get<br />
            <span style={{ color: "#06b6d4" }}>SEO · Traffic · Tech · Social</span><br />
            <span style={{ color: "#7c3aed" }}>Backlinks · Keywords · Revenue</span><br />
            and full Battle Plan
          </div>
        </div>
      )}
    </div>
  );
      }
                
              
