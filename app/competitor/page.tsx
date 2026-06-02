"use client";
// app/competitor/page.tsx — REAL LIVE Competitor Intelligence

import { useState, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface KWGap { kw: string; vol: string; kd: number; opportunity: string }
interface TopKW  { kw: string; vol: string; pos: string }
interface Action { action: string; impact: string; effort: string }

interface Result {
  overview:     Record<string, string | number>;
  performance:  Record<string, string | number | string[]>;
  seo_on_page:  Record<string, string | number | boolean | string[]>;
  technical:    Record<string, string | number | string[]>;
  traffic:      Record<string, string | number | Record<string,number> | string[]>;
  seo_off_page: Record<string, string | number | string[]>;
  keywords:     { organic_total:string; top_keywords:TopKW[]; gap_keywords:KWGap[]; quick_wins:string[]; score:number; insights:string };
  social:       Record<string, string | number | Record<string,string|number>>;
  monetization: Record<string, string | number | boolean | string[]>;
  battleplan:   { competitor_advantages:string[]; your_opportunities:string[]; quick_wins_30d:Action[]; medium_90d:string[]; long_12mo:string[]; risks:string[]; differentiation:string; verdict:string };
  _meta:        { domain:string; scanned_at:string; real_sources:Record<string,boolean> };
}

// ─── Constants ────────────────────────────────────────────────────────────────
const TABS = [
  { id:"overview",     icon:"🎯", label:"Overview"   },
  { id:"performance",  icon:"⚡", label:"Performance" },
  { id:"seo",          icon:"🔍", label:"SEO"         },
  { id:"technical",    icon:"⚙️", label:"Tech Stack"  },
  { id:"traffic",      icon:"📊", label:"Traffic"     },
  { id:"backlinks",    icon:"🔗", label:"Backlinks"   },
  { id:"keywords",     icon:"🗝️", label:"Keywords"    },
  { id:"social",       icon:"📡", label:"Social"      },
  { id:"monetization", icon:"💰", label:"Revenue"     },
  { id:"battleplan",   icon:"⚔️", label:"Battle Plan" },
];

const STEPS = [
  "🔍 Resolving DNS records...",
  "🌐 Scraping website metadata...",
  "⚡ Running Google PageSpeed test...",
  "📊 Fetching domain rank...",
  "🤖 AI searching the web for company info...",
  "📡 Scanning social media presence...",
  "🗝️ Discovering keyword gaps...",
  "💰 Analyzing monetization model...",
  "⚔️ Building your battle plan...",
  "✅ Finalizing live report...",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const score2color = (s: number) => s >= 70 ? "#10b981" : s >= 50 ? "#f59e0b" : "#ef4444";
const score2grade = (s: number) => s >= 90 ? "A+" : s >= 80 ? "A" : s >= 70 ? "B" : s >= 60 ? "C" : s >= 50 ? "D" : "F";

// ─── Micro Components ─────────────────────────────────────────────────────────
const LiveBadge = ({ real }: { real?: boolean }) => (
  <span style={{
    background: real ? "#10b98120" : "#6b728020",
    border: `1px solid ${real ? "#10b98150" : "#6b728040"}`,
    color: real ? "#10b981" : "#9ca3af",
    fontSize: 9, padding: "1px 6px", borderRadius: 99,
    fontFamily: "monospace", whiteSpace: "nowrap", flexShrink: 0,
  }}>{real ? "🟢 LIVE" : "🤖 AI"}</span>
);

const Ring = ({ score, size = 72 }: { score: number; size?: number }) => {
  const r = (size - 8) / 2, c = 2 * Math.PI * r, f = (score / 100) * c;
  const col = score2color(score);
  return (
    <svg width={size} height={size}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1f2937" strokeWidth="6"/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={col} strokeWidth="6"
        strokeDasharray={`${f} ${c}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: "stroke-dasharray 1.2s ease" }}/>
      <text x={size/2} y={size/2+5} textAnchor="middle" fill={col}
        fontSize="14" fontWeight="bold" fontFamily="monospace">{score}</text>
    </svg>
  );
};

const Bar = ({ label, val, max = 100, color = "#10b981", real }: {
  label: string; val: number; max?: number; color?: string; real?: boolean
}) => (
  <div style={{ marginBottom: 10 }}>
    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3, alignItems:"center" }}>
      <span style={{ color:"#9ca3af", fontSize:12 }}>{label}</span>
      <div style={{ display:"flex", gap:6, alignItems:"center" }}>
        <LiveBadge real={real}/>
        <span style={{ color, fontSize:12, fontFamily:"monospace" }}>{val}/{max}</span>
      </div>
    </div>
    <div style={{ background:"#1f2937", borderRadius:99, height:5 }}>
      <div style={{ width:`${Math.min((val/max)*100,100)}%`, height:"100%", background:color, borderRadius:99, transition:"width 1s ease" }}/>
    </div>
  </div>
);

const Card = ({ title, icon, accent="#10b981", badge, children }: {
  title:string; icon:string; accent?:string; badge?:boolean; children:React.ReactNode
}) => (
  <div style={{ background:"#111827", border:`1px solid ${accent}22`, borderRadius:12, padding:16, marginBottom:12 }}>
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <span>{icon}</span>
        <span style={{ color:accent, fontWeight:700, fontSize:13, fontFamily:"monospace" }}>{title}</span>
      </div>
      {badge !== undefined && <LiveBadge real={badge}/>}
    </div>
    {children}
  </div>
);

const Grid2 = ({ items }: { items: { icon:string; label:string; val:string|number; color?:string; real?:boolean }[] }) => (
  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
    {items.map((m,i) => (
      <div key={i} style={{ background:"#111827", border:"1px solid #1f2937", borderRadius:10, padding:12 }}>
        <div style={{ fontSize:18, marginBottom:4 }}>{m.icon}</div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <div style={{ color:"#6b7280", fontSize:10, textTransform:"uppercase", letterSpacing:0.5 }}>{m.label}</div>
            <div style={{ color:m.color||"#10b981", fontWeight:700, fontSize:14, fontFamily:"monospace", marginTop:2 }}>{m.val}</div>
          </div>
          <LiveBadge real={m.real}/>
        </div>
      </div>
    ))}
  </div>
);

const Chip = ({ text, color="#10b981" }: { text:string; color?:string }) => (
  <span style={{ background:color+"20", border:`1px solid ${color}40`, color, borderRadius:999,
    padding:"2px 10px", fontSize:11, fontFamily:"monospace", display:"inline-block", margin:"2px" }}>{text}</span>
);

const Row = ({ text, icon="→", color="#d1d5db" }: { text:string; icon?:string; color?:string }) => (
  <div style={{ display:"flex", gap:8, padding:"7px 0", borderBottom:"1px solid #1f2937" }}>
    <span style={{ flexShrink:0 }}>{icon}</span>
    <span style={{ color, fontSize:13, lineHeight:1.5 }}>{text}</span>
  </div>
);

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function CompetitorPage() {
  const [yourSite,  setYourSite]  = useState("");
  const [compSite,  setCompSite]  = useState("");
  const [industry,  setIndustry]  = useState("");
  const [loading,   setLoading]   = useState(false);
  const [step,      setStep]      = useState(0);
  const [progress,  setProgress]  = useState(0);
  const [result,    setResult]    = useState<Result | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [error,     setError]     = useState("");
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const run = async () => {
    if (!compSite.trim()) { setError("Competitor URL zaroori hai!"); return; }
    setError(""); setResult(null); setLoading(true); setStep(0); setProgress(0);
    let s = 0;
    timer.current = setInterval(() => {
      s = Math.min(s + 1, STEPS.length - 1);
      setStep(s);
      setProgress(Math.round((s / STEPS.length) * 90) + 5);
    }, 2200);
    try {
      const res = await fetch("/api/competitor", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ yourSite, compSite, industry }),
      });
      if (timer.current) clearInterval(timer.current);
      if (!res.ok) throw new Error("API Error");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setProgress(100);
      setTimeout(() => { setResult(json.data); setLoading(false); setActiveTab("overview"); }, 400);
    } catch {
      if (timer.current) clearInterval(timer.current);
      setError("Analysis fail hua. Dobara try karo.");
      setLoading(false);
    }
  };

  // ── Section renderers ────────────────────────────────────────────────────────
  const renderSection = () => {
    if (!result) return null;
    const src = result._meta?.real_sources || {};

    // ── Overview ──
    if (activeTab === "overview") {
      const o = result.overview;
      const score = Number(o.overall_score) || 70;
      const tc = o.threat_level === "High" ? "#ef4444" : o.threat_level === "Medium" ? "#f59e0b" : "#10b981";
      return (
        <>
          <div style={{ display:"flex", gap:14, alignItems:"center", marginBottom:16, flexWrap:"wrap" }}>
            <Ring score={score}/>
            <div>
              <h2 style={{ margin:0, fontSize:20, fontWeight:800, color:"#f9fafb" }}>{String(o.name)}</h2>
              <p style={{ margin:"2px 0 6px", color:"#6b7280", fontSize:12 }}>{String(o.domain)} · {String(o.industry)}</p>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                <span style={{ background:tc+"20", border:`1px solid ${tc}50`, color:tc, borderRadius:99, padding:"3px 12px", fontSize:11, fontFamily:"monospace" }}>
                  ⚠️ {String(o.threat_level)} Threat
                </span>
                <span style={{ background:"#8b5cf620", border:"1px solid #8b5cf640", color:"#8b5cf6", borderRadius:99, padding:"3px 12px", fontSize:11, fontFamily:"monospace" }}>
                  {String(o.market_position)}
                </span>
              </div>
            </div>
          </div>

          {/* Real sources badge bar */}
          <div style={{ background:"#111827", border:"1px solid #1f2937", borderRadius:10, padding:"10px 14px", marginBottom:12, display:"flex", gap:10, flexWrap:"wrap" }}>
            <span style={{ color:"#6b7280", fontSize:11 }}>Live Sources:</span>
            {[
              ["PageSpeed", src.pagespeed],
              ["Scraper",   src.scraped],
              ["PageRank",  src.pagerank],
              ["DNS",       src.dns],
              ["Web Search",src.web_search],
            ].map(([label, ok]) => (
              <span key={String(label)} style={{ fontSize:11, color: ok ? "#10b981" : "#4b5563" }}>
                {ok ? "✅" : "⭕"} {String(label)}
              </span>
            ))}
          </div>

          <Grid2 items={[
            { icon:"🏢", label:"Founded",    val:String(o.founded),     real:src.web_search },
            { icon:"👥", label:"Team Size",  val:String(o.employees),   real:src.web_search },
            { icon:"📍", label:"Location",   val:String(o.headquarters),real:src.web_search },
            { icon:"💸", label:"Funding",    val:String(o.funding),     real:src.web_search },
          ]}/>
          <Card title="Business Model" icon="💼" badge={src.web_search}>
            <p style={{ color:"#9ca3af", fontSize:13, lineHeight:1.7, margin:0 }}>{String(o.business_model)}</p>
          </Card>
          <Card title="Target Audience" icon="🎯" badge={src.web_search}>
            <p style={{ color:"#9ca3af", fontSize:13, lineHeight:1.7, margin:0 }}>{String(o.target_audience)}</p>
          </Card>
          <Card title="Unique Value Proposition" icon="💡" accent="#f59e0b" badge={src.web_search}>
            <p style={{ color:"#9ca3af", fontSize:13, lineHeight:1.7, margin:0 }}>{String(o.value_prop)}</p>
          </Card>
          <Card title="Executive Intelligence" icon="🧠" accent="#8b5cf6" badge={src.web_search}>
            <p style={{ color:"#d1d5db", fontSize:13, lineHeight:1.7, margin:0 }}>{String(o.summary)}</p>
          </Card>
        </>
      );
    }

    // ── Performance ──
    if (activeTab === "performance") {
      const p = result.performance;
      const issues = (p.issues as string[]) || [];
      const fixes  = (p.fixes  as string[]) || [];
      return (
        <>
          <div style={{ display:"flex", gap:16, marginBottom:12 }}>
            <Ring score={Number(p.mob_perf)||0}/>
            <div style={{ flex:1 }}>
              <div style={{ color:"#6b7280", fontSize:11, marginBottom:8 }}>
                🟢 LIVE data from Google PageSpeed API
              </div>
              <Bar label="Mobile Performance" val={Number(p.mob_perf)||0}  real={src.pagespeed}/>
              <Bar label="Desktop Performance" val={Number(p.desk_perf)||0} real={src.pagespeed}/>
              <Bar label="Accessibility"       val={Number(p.mob_access)||0} real={src.pagespeed} color="#f59e0b"/>
            </div>
          </div>

          <Card title="Core Web Vitals" icon="⚡" badge={src.pagespeed}>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
              {[["LCP",p.lcp,"#10b981"],["TBT",p.tbt,"#f59e0b"],["CLS",p.cls,"#06b6d4"],
                ["TTFB",p.ttfb,"#8b5cf6"],["FCP",p.fcp,"#ec4899"],["Size",p.size,"#64748b"]
              ].map(([k,v,c]) => (
                <div key={k as string} style={{ background:"#0d1117", borderRadius:8, padding:10, textAlign:"center" }}>
                  <div style={{ color:c as string, fontWeight:700, fontSize:15, fontFamily:"monospace" }}>{String(v||"N/A")}</div>
                  <div style={{ color:"#4b5563", fontSize:10 }}>{k as string}</div>
                </div>
              ))}
            </div>
          </Card>

          <Grid2 items={[
            { icon:"📱", label:"Mobile SEO",    val:String(p.mob_seo)||"N/A",  color:score2color(Number(p.mob_seo)||0), real:src.pagespeed },
            { icon:"🏅", label:"Best Practices",val:String(p.mob_bp)||"N/A",   color:score2color(Number(p.mob_bp)||0),  real:src.pagespeed },
            { icon:"♿", label:"Accessibility", val:String(p.mob_access)||"N/A",color:score2color(Number(p.mob_access)||0), real:src.pagespeed },
            { icon:"🏆", label:"Grade",         val:String(p.grade)||score2grade(Number(p.mob_perf)||0), color:"#10b981", real:src.pagespeed },
          ]}/>

          <Card title="⚠️ Performance Issues" icon="🔴" accent="#ef4444" badge={src.pagespeed}>
            {issues.map((x,i) => <Row key={i} text={x} icon="❌" color="#fca5a5"/>)}
          </Card>
          <Card title="✅ Recommended Fixes" icon="🔧" accent="#10b981" badge={src.pagespeed}>
            {fixes.map((x,i) => <Row key={i} text={x} icon="✅"/>)}
          </Card>
        </>
      );
    }

    // ── SEO ──
    if (activeTab === "seo") {
      const s = result.seo_on_page;
      const off = result.seo_off_page;
      const issues = (s.issues as string[]) || [];
      return (
        <>
          <div style={{ display:"flex", gap:12, marginBottom:12 }}>
            <Ring score={Number(s.score)||0}/>
            <div style={{ flex:1 }}>
              <Bar label="Mobile SEO Score"   val={Number(s.score)||0}  real={src.pagespeed}/>
              <Bar label="Domain Authority"    val={Number(s.domain_authority)||0} real={src.pagerank}/>
            </div>
          </div>

          <Card title="On-Page SEO Elements" icon="📋" badge={src.scraped}>
            {[
              ["Page Title",     String(s.title||"Missing"),     (s.title as string)?.length > 0],
              ["Meta Description",String(s.description||"Missing"), (s.description as string)?.length > 0],
              ["H1 Tag",         String(s.h1||"Missing"),         !!s.h1],
              ["Keywords Meta",  String(s.keywords_meta||"None"), !!s.keywords_meta],
            ].map(([label, val, ok]) => (
              <div key={label as string} style={{ padding:"8px 0", borderBottom:"1px solid #1f2937" }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:2 }}>
                  <span style={{ color:"#6b7280", fontSize:11 }}>{label as string}</span>
                  <span style={{ color: ok ? "#10b981" : "#ef4444", fontSize:11 }}>{ok ? "✅" : "❌"}</span>
                </div>
                <span style={{ color:"#d1d5db", fontSize:12 }}>{String(val).slice(0, 90)}{String(val).length > 90 ? "…" : ""}</span>
              </div>
            ))}
          </Card>

          <Card title="SEO Signals" icon="🔬" badge={src.scraped}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              {[
                ["SSL/HTTPS",      s.ssl,            "🔒"],
                ["Canonical Tag",  s.canonical,      "🔗"],
                ["Structured Data",s.structured_data,"📋"],
                ["Open Graph",     s.open_graph,     "🌐"],
                ["Twitter Card",   s.twitter_card,   "🐦"],
                ["Robots Meta",    s.robots_meta,    "🤖"],
              ].map(([label, ok, icon]) => (
                <div key={label as string} style={{ background:"#0d1117", borderRadius:8, padding:"8px 10px", display:"flex", gap:8, alignItems:"center" }}>
                  <span>{icon as string}</span>
                  <span style={{ color:"#9ca3af", fontSize:12, flex:1 }}>{label as string}</span>
                  <span style={{ color: ok ? "#10b981" : "#ef4444" }}>{ok ? "✅" : "❌"}</span>
                </div>
              ))}
            </div>
          </Card>

          {(s.schema_types as string[])?.length > 0 && (
            <Card title="Schema Types Detected" icon="🏗️" badge={src.scraped}>
              <div>{(s.schema_types as string[]).map(t => <Chip key={t} text={t}/>)}</div>
            </Card>
          )}

          <Grid2 items={[
            { icon:"🔑", label:"Organic Keywords", val:String(s.organic_keywords||"~est"), real:src.web_search },
            { icon:"🌐", label:"Domain Authority",  val:String(s.domain_authority||"N/A"), real:src.pagerank },
            { icon:"🏆", label:"Global Rank",       val:String(off?.global_rank||"N/A"),   real:src.pagerank },
            { icon:"📝", label:"Word Count",        val:String(s.word_count||0),            real:src.scraped },
          ]}/>

          <Card title="SEO Issues Found" icon="⚠️" accent="#ef4444">
            {issues.map((x,i) => <Row key={i} text={x} icon="❌" color="#fca5a5"/>)}
          </Card>

          <Card title="Off-Page: Backlinks" icon="🔗" badge={src.web_search}>
            <Grid2 items={[
              { icon:"🔗", label:"Total Backlinks",   val:String(off?.total_backlinks||"~est"),      real:src.web_search },
              { icon:"🌐", label:"Ref. Domains",      val:String(off?.referring_domains||"~est"),    real:src.web_search },
              { icon:"✅", label:"Dofollow %",        val:String(off?.dofollow_pct||"~est"),         real:src.web_search },
              { icon:"📈", label:"Link Velocity",     val:String(off?.link_velocity||"~est"),        real:src.web_search },
            ]}/>
          </Card>
        </>
      );
    }

    // ── Technical ──
    if (activeTab === "technical") {
      const t = result.technical;
      const techStack   = (t.tech_stack   as string[]) || [];
      const secHeaders  = (t.security_headers as string[]) || [];
      const analytics   = (t.analytics    as string[]) || [];
      const marketing   = (t.marketing    as string[]) || [];
      const payments    = (t.payments     as string[]) || [];
      return (
        <>
          <Grid2 items={[
            { icon:"🖥️", label:"CMS/Framework", val:String(t.cdn||"Unknown"),      real:src.scraped },
            { icon:"☁️", label:"Hosting",        val:String(t.hosting||"Unknown"),  real:src.dns     },
            { icon:"🌐", label:"CDN",             val:String(t.cdn||"Unknown"),      real:src.dns     },
            { icon:"📧", label:"Email System",    val:String(t.email_system||"?"),   real:src.dns     },
            { icon:"🖧",  label:"IP Address",     val:String(t.ip||"N/A"),           real:src.dns     },
            { icon:"📦", label:"HTML Size",       val:String(t.html_size||"N/A"),    real:src.scraped },
          ]}/>
          <Card title="Technologies Detected" icon="⚙️" badge={src.scraped}>
            {techStack.length ? <div>{techStack.map(s => <Chip key={s} text={s}/>)}</div>
              : <p style={{ color:"#4b5563", fontSize:13, margin:0 }}>No specific tech detected</p>}
          </Card>
          <Card title="Security Headers" icon="🔐" badge={src.scraped} accent={secHeaders.length >= 4 ? "#10b981" : "#f59e0b"}>
            <div style={{ display:"flex", gap:6, alignItems:"center", marginBottom:8 }}>
              <span style={{ color: secHeaders.length >= 4 ? "#10b981" : "#f59e0b", fontWeight:700, fontSize:18, fontFamily:"monospace" }}>{secHeaders.length}/6</span>
              <span style={{ color:"#6b7280", fontSize:12 }}>headers present</span>
            </div>
            <div>{secHeaders.length ? secHeaders.map(s => <Chip key={s} text={s} color="#10b981"/>) : <span style={{ color:"#ef4444", fontSize:13 }}>No security headers detected ⚠️</span>}</div>
          </Card>
          {analytics.length > 0 && (
            <Card title="Analytics Stack" icon="📊" badge={src.scraped} accent="#f59e0b">
              <div>{analytics.map(s => <Chip key={s} text={s} color="#f59e0b"/>)}</div>
            </Card>
          )}
          {marketing.length > 0 && (
            <Card title="Marketing Tools" icon="📣" badge={src.scraped} accent="#ec4899">
              <div>{marketing.map(s => <Chip key={s} text={s} color="#ec4899"/>)}</div>
            </Card>
          )}
          {payments.length > 0 && (
            <Card title="Payment System" icon="💳" badge={src.scraped} accent="#8b5cf6">
              <div>{payments.map(s => <Chip key={s} text={s} color="#8b5cf6"/>)}</div>
            </Card>
          )}
          <Card title="Tech Intelligence" icon="🧠" accent="#8b5cf6" badge={src.web_search}>
            <p style={{ color:"#9ca3af", fontSize:13, lineHeight:1.7, margin:0 }}>{String(t.insights||"")}</p>
          </Card>
        </>
      );
    }

    // ── Traffic ──
    if (activeTab === "traffic") {
      const t = result.traffic;
      const sources = (t.traffic_sources || t.sources || {}) as Record<string, number>;
      const countries = (t.top_countries as string[]) || [];
      return (
        <>
          <Grid2 items={[
            { icon:"👁️", label:"Monthly Visits",    val:String(t.monthly_visits||"~est"),  real:src.web_search },
            { icon:"👤", label:"Unique Visitors",   val:String(t.unique_visitors||"~est"), real:src.web_search },
            { icon:"⏱️", label:"Avg Duration",      val:String(t.avg_duration||"~est"),    real:src.web_search },
            { icon:"↩️", label:"Bounce Rate",       val:String(t.bounce_rate||"~est"),     real:src.web_search },
            { icon:"📈", label:"Trend",             val:String(t.trend||"~est"),   color:"#10b981", real:src.web_search },
            { icon:"📅", label:"YoY Change",        val:String(t.yoy_change||"~est"), color:"#10b981", real:src.web_search },
          ]}/>
          <Card title="Traffic Sources" icon="🗺️" badge={src.web_search}>
            {Object.entries(sources).map(([src2, pct]) => (
              <Bar key={src2} label={src2.charAt(0).toUpperCase()+src2.slice(1)} val={Number(pct)||0}/>
            ))}
          </Card>
          <Card title="Top Countries" icon="🌍" badge={src.web_search}>
            {countries.map(c => <Row key={c} text={c} icon="🌐" color="#9ca3af"/>)}
          </Card>
          <Card title="Traffic Intelligence" icon="🧠" accent="#8b5cf6" badge={src.web_search}>
            <p style={{ color:"#9ca3af", fontSize:13, lineHeight:1.7, margin:0 }}>{String(t.insights||"")}</p>
          </Card>
        </>
      );
    }

    // ── Backlinks ──
    if (activeTab === "backlinks") {
      const b = result.seo_off_page;
      const topDoms = (b.top_backlinks as string[]) || [];
      return (
        <>
          <Grid2 items={[
            { icon:"🔗", label:"Total Backlinks",  val:String(b.total_backlinks||"~est"),    real:src.web_search },
            { icon:"🌐", label:"Ref. Domains",     val:String(b.referring_domains||"~est"),  real:src.web_search },
            { icon:"✅", label:"Dofollow %",       val:String(b.dofollow_pct||"~est"),       real:src.web_search },
            { icon:"📈", label:"Link Velocity",    val:String(b.link_velocity||"~est"),      real:src.web_search },
            { icon:"🏅", label:"Domain Rank",      val:String(b.domain_rank||"N/A"),         real:src.pagerank   },
            { icon:"🌍", label:"Global Rank",      val:String(b.global_rank||"N/A"),         real:src.pagerank   },
          ]}/>
          <Card title="Top Referring Domains" icon="🏆" badge={src.web_search}>
            {topDoms.map(d => <Row key={d} text={d} icon="🔗" color="#9ca3af"/>)}
          </Card>
          <Card title="Backlink Intelligence" icon="🧠" accent="#8b5cf6" badge={src.web_search}>
            <p style={{ color:"#9ca3af", fontSize:13, lineHeight:1.7, margin:0 }}>{String(b.insights||"")}</p>
          </Card>
        </>
      );
    }

    // ── Keywords ──
    if (activeTab === "keywords") {
      const k = result.keywords;
      return (
        <>
          <Grid2 items={[
            { icon:"🔑", label:"Total Organic KWs", val:String(k.organic_total||"~est"), real:src.web_search },
            { icon:"🏆", label:"Score",             val:String(k.score||0),              real:src.web_search },
          ]}/>
          <Card title="Top Ranking Keywords" icon="📌" badge={src.web_search}>
            {(k.top_keywords||[]).map((kw, i) => (
              <div key={i} style={{ padding:"8px 0", borderBottom:"1px solid #1f2937", display:"flex", justifyContent:"space-between" }}>
                <div>
                  <span style={{ color:"#10b981", marginRight:8, fontFamily:"monospace" }}>{i+1}.</span>
                  <span style={{ color:"#f9fafb", fontSize:13 }}>{kw.kw}</span>
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <Chip text={kw.vol} color="#6b7280"/>
                  <Chip text={`Pos ${kw.pos}`} color="#8b5cf6"/>
                </div>
              </div>
            ))}
          </Card>
          <Card title="🔥 Keyword Gap Opportunities" icon="🎯" accent="#f59e0b" badge={src.web_search}>
            {(k.gap_keywords||[]).map((g, i) => (
              <div key={i} style={{ padding:"10px 0", borderBottom:"1px solid #1f2937", display:"flex", justifyContent:"space-between", alignItems:"center", gap:8 }}>
                <div>
                  <div style={{ color:"#f9fafb", fontSize:13, fontWeight:600 }}>{g.kw}</div>
                  <div style={{ color:"#6b7280", fontSize:11 }}>{g.vol} · KD: {g.kd}</div>
                </div>
                <Chip text={g.opportunity} color={g.opportunity==="High"?"#10b981":"#f59e0b"}/>
              </div>
            ))}
          </Card>
          <Card title="⚡ Quick Win Keywords" icon="⚡" accent="#10b981">
            <div>{(k.quick_wins||[]).map(kw => <Chip key={kw} text={kw}/>)}</div>
          </Card>
          <Card title="Keyword Intelligence" icon="🧠" accent="#8b5cf6" badge={src.web_search}>
            <p style={{ color:"#9ca3af", fontSize:13, lineHeight:1.7, margin:0 }}>{k.insights}</p>
          </Card>
        </>
      );
          }

    // ── Social ──
    if (activeTab === "social") {
      const s = result.social as Record<string, Record<string,string|number>|string|number>;
      const sent = (s.sentiment||{}) as {positive:number;neutral:number;negative:number};
      return (
        <>
          <Card title="Brand Sentiment" icon="💬" badge={src.web_search}>
            <div style={{ display:"flex", height:10, borderRadius:99, overflow:"hidden", marginBottom:8 }}>
              <div style={{ width:`${sent.positive||65}%`, background:"#10b981" }}/>
              <div style={{ width:`${sent.neutral||25}%`,  background:"#4b5563" }}/>
              <div style={{ width:`${sent.negative||10}%`, background:"#ef4444" }}/>
            </div>
            <div style={{ display:"flex", gap:16 }}>
              <span style={{ color:"#10b981", fontSize:13 }}>+{sent.positive||65}% Positive</span>
              <span style={{ color:"#6b7280", fontSize:13 }}>~{sent.neutral||25}% Neutral</span>
              <span style={{ color:"#ef4444", fontSize:13 }}>-{sent.negative||10}% Negative</span>
            </div>
          </Card>

          {[
            { key:"twitter",   icon:"𝕏",  name:"Twitter / X",  sub:"followers" },
            { key:"linkedin",  icon:"in", name:"LinkedIn",      sub:"followers" },
            { key:"instagram", icon:"📷", name:"Instagram",     sub:"followers" },
            { key:"youtube",   icon:"▶",  name:"YouTube",       sub:"subscribers" },
            { key:"facebook",  icon:"f",  name:"Facebook",      sub:"followers" },
          ].map(p => {
            const d = s[p.key] as Record<string,string|number>|undefined;
            if (!d) return null;
            return (
              <div key={p.key} style={{ background:"#111827", border:"1px solid #1f2937", borderRadius:10, padding:"12px 14px", marginBottom:8, display:"flex", gap:12, alignItems:"center" }}>
                <div style={{ width:34, height:34, borderRadius:8, background:"#10b98120", display:"flex", alignItems:"center", justifyContent:"center", color:"#10b981", fontWeight:700, fontSize:13, flexShrink:0 }}>{p.icon}</div>
                <div style={{ flex:1 }}>
                  <div style={{ color:"#f9fafb", fontSize:13, fontWeight:600 }}>{p.name}</div>
                  <div style={{ color:"#6b7280", fontSize:12 }}>{String(d[p.sub]||d.followers||"~est")} {p.sub} {d.engagement ? `· ${d.engagement} engagement` : ""}</div>
                </div>
                <LiveBadge real={src.web_search}/>
              </div>
            );
          })}

          <Card title="Social Intelligence" icon="🧠" accent="#8b5cf6" badge={src.web_search}>
            <p style={{ color:"#9ca3af", fontSize:13, lineHeight:1.7, margin:0 }}>{String(s.insights||"")}</p>
          </Card>
        </>
      );
    }

    // ── Monetization ──
    if (activeTab === "monetization") {
      const m = result.monetization;
      const models = (m.models as string[]) || [];
      return (
        <>
          <div style={{ display:"flex", gap:12, marginBottom:12, alignItems:"center" }}>
            <Ring score={Number(m.score)||70}/>
            <div>
              <div style={{ color:"#10b981", fontSize:20, fontWeight:800, fontFamily:"monospace" }}>{String(m.estimated_mrr||"~est")}</div>
              <div style={{ color:"#6b7280", fontSize:12 }}>Estimated Monthly Revenue</div>
              <div style={{ marginTop:6, display:"flex", gap:4, flexWrap:"wrap" }}>
                {m.free_trial && <Chip text="Free Trial ✓" color="#10b981"/>}
                {m.freemium   && <Chip text="Freemium ✓" color="#06b6d4"/>}
                {m.affiliate_program && <Chip text="Affiliate ✓" color="#f59e0b"/>}
              </div>
            </div>
            <LiveBadge real={src.web_search}/>
          </div>
          <Card title="Revenue Models" icon="💰" badge={src.web_search}>
            <div>{models.map(r => <Chip key={r} text={r}/>)}</div>
          </Card>
          <Card title="Pricing" icon="🏷️" badge={src.web_search}>
            <p style={{ color:"#9ca3af", fontSize:13, lineHeight:1.7, margin:"0 0 6px" }}>{String(m.pricing_tiers||"~est")}</p>
            {m.avg_deal && <div><span style={{ color:"#10b981", fontSize:16, fontWeight:700, fontFamily:"monospace" }}>{String(m.avg_deal)}</span><span style={{ color:"#6b7280", fontSize:12 }}> avg deal</span></div>}
          </Card>
          <Card title="Monetization Intelligence" icon="🧠" accent="#8b5cf6" badge={src.web_search}>
            <p style={{ color:"#9ca3af", fontSize:13, lineHeight:1.7, margin:0 }}>{String(m.insights||"")}</p>
          </Card>
        </>
      );
    }

    // ── Battle Plan ──
    if (activeTab === "battleplan") {
      const b = result.battleplan;
      return (
        <>
          <Card title="⚡ Quick Wins — 30 Days" icon="🏃" accent="#10b981">
            {(b.quick_wins_30d||[]).map((a,i) => (
              <div key={i} style={{ padding:"10px 0", borderBottom:"1px solid #1f2937" }}>
                <div style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
                  <span style={{ color:"#10b981", fontWeight:700, fontFamily:"monospace", flexShrink:0 }}>{i+1}.</span>
                  <span style={{ color:"#d1d5db", fontSize:13, flex:1 }}>{a.action}</span>
                </div>
                <div style={{ display:"flex", gap:6, marginTop:6, marginLeft:16 }}>
                  <Chip text={`Impact: ${a.impact}`} color={a.impact==="High"?"#10b981":"#f59e0b"}/>
                  <Chip text={`Effort: ${a.effort}`} color={a.effort==="Low"?"#10b981":"#f59e0b"}/>
                </div>
              </div>
            ))}
          </Card>
          <Card title="📈 Medium Term — 90 Days" icon="🗓️" accent="#f59e0b">
            {(b.medium_90d||[]).map((a,i) => (
              <div key={i} style={{ padding:"7px 0", borderBottom:"1px solid #1f2937", display:"flex", gap:8 }}>
                <span style={{ color:"#f59e0b", fontFamily:"monospace" }}>{i+1}.</span>
                <span style={{ color:"#d1d5db", fontSize:13 }}>{a}</span>
              </div>
            ))}
          </Card>
          <Card title="🚀 Long Term — 12 Months" icon="🎯" accent="#8b5cf6">
            {(b.long_12mo||[]).map((a,i) => (
              <div key={i} style={{ padding:"7px 0", borderBottom:"1px solid #1f2937", display:"flex", gap:8 }}>
                <span style={{ color:"#8b5cf6", fontFamily:"monospace" }}>{i+1}.</span>
                <span style={{ color:"#d1d5db", fontSize:13 }}>{a}</span>
              </div>
            ))}
          </Card>
          <Card title="Your Opportunities" icon="🏆" accent="#10b981">
            {(b.your_opportunities||[]).map((o,i) => <Row key={i} text={o} icon="🎯"/>)}
          </Card>
          <Card title="⚠️ Risk Factors" icon="🚨" accent="#ef4444">
            {(b.risks||[]).map((r,i) => <Row key={i} text={r} icon="⚠️" color="#fca5a5"/>)}
          </Card>
          <Card title="Differentiation Strategy" icon="🧬" accent="#06b6d4">
            <p style={{ color:"#9ca3af", fontSize:13, lineHeight:1.7, margin:0 }}>{b.differentiation}</p>
          </Card>
          <Card title="🏁 Final Strategic Verdict" icon="⚔️" accent="#10b981">
            <p style={{ color:"#d1fae5", fontSize:14, lineHeight:1.7, margin:0, fontWeight:500 }}>{b.verdict}</p>
          </Card>
        </>
      );
    }
    return null;
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    width:"100%", background:"#0d1117", border:"1px solid #1f2937",
    borderRadius:8, padding:"10px 12px", color:"#f9fafb", fontSize:14,
    fontFamily:"monospace", boxSizing:"border-box", outline:"none",
  };

  return (
    <div style={{ background:"#030712", minHeight:"100vh", color:"#f9fafb" }}>

      {/* Header */}
      <div style={{ padding:"18px 20px 0", borderBottom:"1px solid #0f172a" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, paddingBottom:14 }}>
          <div style={{ width:36, height:36, borderRadius:8, background:"linear-gradient(135deg,#10b981,#059669)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>🕵️</div>
          <div>
            <h1 style={{ margin:0, fontSize:17, fontWeight:800 }}>
              Competitor <span style={{ color:"#10b981" }}>Intelligence</span>
            </h1>
            <p style={{ margin:0, fontSize:10, color:"#374151" }}>
              🟢 Google PageSpeed &nbsp;·&nbsp; 🟢 Web Scraper &nbsp;·&nbsp; 🟢 OpenPageRank &nbsp;·&nbsp; 🟢 DNS &nbsp;·&nbsp; 🟢 AI Web Search
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div style={{ padding:"14px 20px", borderBottom:"1px solid #0f172a" }}>
        <div style={{ marginBottom:8 }}>
          <label style={{ display:"block", color:"#4b5563", fontSize:10, textTransform:"uppercase", letterSpacing:1, marginBottom:3 }}>Your Website (optional)</label>
          <input value={yourSite} onChange={e=>setYourSite(e.target.value)} placeholder="yoursite.com" style={inputStyle}/>
        </div>
        <div style={{ marginBottom:8 }}>
          <label style={{ display:"block", color:"#4b5563", fontSize:10, textTransform:"uppercase", letterSpacing:1, marginBottom:3 }}>Competitor Website *</label>
          <input value={compSite} onChange={e=>setCompSite(e.target.value)} placeholder="competitor.com" style={{ ...inputStyle, border:`1px solid ${error?"#ef4444":"#1f2937"}` }}/>
        </div>
        <div style={{ marginBottom:10 }}>
          <label style={{ display:"block", color:"#4b5563", fontSize:10, textTransform:"uppercase", letterSpacing:1, marginBottom:3 }}>Industry (optional)</label>
          <input value={industry} onChange={e=>setIndustry(e.target.value)} placeholder="SaaS, E-commerce, FinTech..." style={inputStyle}/>
        </div>
        {error && <div style={{ background:"#7f1d1d30", border:"1px solid #ef444440", borderRadius:8, padding:"8px 12px", color:"#ef4444", fontSize:13, marginBottom:8 }}>⚠️ {error}</div>}
        <button onClick={run} disabled={loading} style={{
          width:"100%", padding:"12px", border:"none", borderRadius:8,
          background:loading?"#1f2937":"linear-gradient(135deg,#10b981,#059669)",
          color:loading?"#4b5563":"#fff", fontWeight:700, fontSize:14,
          fontFamily:"monospace", cursor:loading?"not-allowed":"pointer",
        }}>
          {loading ? "🔄 Running Live Analysis..." : "🕵️ Run Live Analysis →"}
        </button>
      </div>

      {/* Progress */}
      {loading && (
        <div style={{ padding:"14px 20px", borderBottom:"1px solid #0f172a" }}>
          <p style={{ color:"#10b981", fontSize:12, margin:"0 0 6px", fontFamily:"monospace" }}>{STEPS[step]}</p>
          <div style={{ background:"#1f2937", borderRadius:99, height:4, marginBottom:4 }}>
            <div style={{ width:`${progress}%`, height:"100%", background:"linear-gradient(90deg,#10b981,#059669)", borderRadius:99, transition:"width 0.8s ease" }}/>
          </div>
          <p style={{ color:"#374151", fontSize:10, margin:0, textAlign:"right", fontFamily:"monospace" }}>{progress}% — ~25 seconds</p>
        </div>
      )}

      {/* Score bar */}
      {result && (
        <div style={{ padding:"10px 20px", borderBottom:"1px solid #0f172a", display:"flex", gap:12, overflowX:"auto", background:"#030712" }}>
          {[
            ["⚡", "perf",  result.performance?.mob_perf],
            ["🔍", "seo",   result.seo_on_page?.score],
            ["⚙️", "tech",  result.technical?.score],
            ["📊", "traffic",result.traffic?.score],
            ["🔗", "links", result.seo_off_page?.score],
            ["🗝️", "kw",   result.keywords?.score],
            ["📡", "social",result.social?.score],
            ["💰", "rev",   result.monetization?.score],
          ].map(([icon, label, sc]) => {
            if (!sc) return null;
            const s = Number(sc);
            const c = score2color(s);
            const tabMap: Record<string,string> = { perf:"performance", seo:"seo", tech:"technical", traffic:"traffic", links:"backlinks", kw:"keywords", social:"social", rev:"monetization" };
            return (
              <div key={label as string} style={{ textAlign:"center", minWidth:40, cursor:"pointer" }} onClick={()=>setActiveTab(tabMap[label as string]||"overview")}>
                <div style={{ fontSize:12 }}>{icon as string}</div>
                <div style={{ color:c, fontSize:14, fontWeight:700, fontFamily:"monospace" }}>{s}</div>
                <div style={{ color:"#374151", fontSize:9 }}>{String(label).toUpperCase()}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tabs */}
      {result && (
        <div style={{ display:"flex", overflowX:"auto", borderBottom:"1px solid #0f172a" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={()=>setActiveTab(t.id)} style={{
              background:"none", border:"none",
              borderBottom: activeTab===t.id ? "2px solid #10b981" : "2px solid transparent",
              color: activeTab===t.id ? "#10b981" : "#4b5563",
              padding:"9px 13px", cursor:"pointer", fontSize:11,
              fontFamily:"monospace", whiteSpace:"nowrap",
            }}>{t.icon} {t.label}</button>
          ))}
        </div>
      )}

      {/* Content */}
      <div style={{ padding: result ? "14px 20px 80px" : "40px 20px" }}>
        {!loading && !result && (
          <div style={{ textAlign:"center", padding:"20px 0" }}>
            <div style={{ fontSize:48, marginBottom:10 }}>🕵️</div>
            <p style={{ color:"#1f2937", fontSize:14, lineHeight:2 }}>
              Enter competitor URL to get<br/>
              <span style={{ color:"#10b981" }}>LIVE PageSpeed · Real Tech Stack · DNS Info</span><br/>
              <span style={{ color:"#6b7280" }}>Web-Searched Traffic · Social · Revenue · Battle Plan</span>
            </p>
            <div style={{ marginTop:12, background:"#0d1117", border:"1px solid #1f2937", borderRadius:10, padding:14, textAlign:"left" }}>
              <p style={{ color:"#374151", fontSize:11, margin:"0 0 6px" }}>💡 Optional: Add OPEN_PAGERANK_API_KEY to .env.local for real domain authority</p>
              <p style={{ color:"#374151", fontSize:11, margin:0 }}>💡 Optional: Add GOOGLE_PAGESPEED_API_KEY for higher rate limits</p>
            </div>
          </div>
        )}
        {renderSection()}
      </div>
    </div>
  );
                     }
