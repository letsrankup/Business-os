"use client";
import { useState, useRef } from "react";

interface KWGap { kw: string; vol: string; kd: number; opportunity: string }
interface TopKW  { kw: string; vol: string; pos: string }
interface Action { action: string; impact: string; effort: string }

interface Result {
  overview:     Record<string, any>;
  performance:  Record<string, any>;
  seo_on_page:  Record<string, any>;
  technical:    Record<string, any>;
  traffic:      Record<string, any>;
  seo_off_page: Record<string, any>;
  keywords:     { organic_total: string; top_keywords: TopKW[]; gap_keywords: KWGap[]; quick_wins: string[]; score: number; insights: string };
  social:       Record<string, any>;
  monetization: Record<string, any>;
  battleplan:   { competitor_advantages: string[]; your_opportunities: string[]; quick_wins_30d: Action[]; medium_90d: string[]; long_12mo: string[]; risks: string[]; differentiation: string; verdict: string };
  _meta:        { domain: string; scanned_at: string; real_sources: Record<string, boolean> };
}

const STEPS = [
  "Resolving target domain records...",
  "Running localized headless crawlers...",
  "Querying Core PageSpeed API performance metrics...",
  "Fetching global PageRank parameters...",
  "Invoking Claude 3.5 AI Core synthesis engines...",
  "Structuring tactical operational matrix..."
];

const TABS = [
  { id: "overview", label: "Overview", icon: "📊" },
  { id: "performance", label: "Performance", icon: "⚡" },
  { id: "seo_on_page", label: "On-Page SEO", icon: "🔍" },
  { id: "technical", label: "Tech Stack", icon: "🛠️" },
  { id: "traffic", label: "Traffic", icon: "📈" },
  { id: "seo_off_page", label: "Off-Page", icon: "🔗" },
  { id: "keywords", label: "Keywords", icon: "🔑" },
  { id: "social", label: "Social", icon: "📱" },
  { id: "monetization", label: "Monetization", icon: "💰" },
  { id: "battleplan", label: "Battle Plan", icon: "⚔️" }
];

export default function CompetitorIntelligence() {
  const [yourSite, setYourSite] = useState("");
  const [compSite, setCompSite] = useState("");
  const [industry, setIndustry] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");

  const timer = useRef<NodeJS.Timeout | null>(null);

  const run = async () => {
    if (!compSite.trim()) {
      setError("Competitor domain setup or target URL is required.");
      return;
    }
    setError("");
    setResult(null);
    setLoading(true);
    setStep(0);
    setProgress(5);

    let currentStep = 0;
    timer.current = setInterval(() => {
      currentStep = Math.min(currentStep + 1, STEPS.length - 1);
      setStep(currentStep);
      setProgress(Math.round((currentStep / STEPS.length) * 85) + 5);
    }, 1200);

    try {
      const res = await fetch("/api/competitor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ yourSite, compSite, industry }),
      });

      if (timer.current) clearInterval(timer.current);

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || `Server communication terminated with status ${res.status}`);
      }

      setProgress(100);
      setTimeout(() => {
        setResult(json.data);
        setLoading(false);
        setActiveTab("overview");
      }, 300);
    } catch (err: any) {
      if (timer.current) clearInterval(timer.current);
      setError(err.message || "Deep diagnostic process halted abruptly. Try again.");
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px", fontFamily: "sans-serif", color: "#1f2937" }}>
      {/* Target Config Block */}
      <div style={{ background: "#f9fafb", padding: "20px", borderRadius: "12px", border: "1px solid #e5e7eb", marginBottom: "20px" }}>
        <h2 style={{ margin: "0 0 15px 0", fontSize: "18px", color: "#111827" }}>⚡ AI Competitor Radar</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "15px" }}>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "bold", marginBottom: "5px" }}>Competitor Website *</label>
            <input type="text" value={compSite} onChange={(e) => setCompSite(e.target.value)} placeholder="e.g. competitorsite.com" style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "bold", marginBottom: "5px" }}>Your Website (Optional)</label>
            <input type="text" value={yourSite} onChange={(e) => setYourSite(e.target.value)} placeholder="e.g. mysite.com" style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "bold", marginBottom: "5px" }}>Industry / Niche</label>
            <input type="text" value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="e.g. SaaS, E-commerce" style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db" }} />
          </div>
        </div>
        <button onClick={run} disabled={loading} style={{ marginTop: "15px", width: "100%", padding: "12px", background: "#10b981", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" }}>
          {loading ? "Analyzing Matrix Target..." : "Launch Deep Scan Target Engine"}
        </button>
      </div>

      {/* Error Output Log */}
      {error && (
        <div style={{ background: "#fef2f2", color: "#b91c1c", padding: "15px", borderRadius: "8px", border: "1px solid #fee2e2", marginBottom: "20px", fontSize: "14px" }}>
          <strong>⚠️ Execution Blocked:</strong> {error}
        </div>
      )}

      {/* Loader Matrix Animation */}
      {loading && (
        <div style={{ textAlign: "center", padding: "40px", background: "#f3f4f6", borderRadius: "12px" }}>
          <div style={{ fontSize: "24px", marginBottom: "10px", animation: "spin 2s linear infinite" }}>🔄</div>
          <div style={{ fontWeight: "bold", marginBottom: "5px" }}>{STEPS[step]}</div>
          <div style={{ width: "100%", background: "#e5e7eb", borderRadius: "10px", height: "8px", overflow: "hidden", marginTop: "10px" }}>
            <div style={{ width: `${progress}%`, background: "#10b981", height: "100%", transition: "width 0.3s ease" }}></div>
          </div>
          <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "5px" }}>{progress}% Synchronized</div>
        </div>
      )}

      {/* Structured Output Grid Tabulation */}
      {result && (
        <div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginBottom: "15px", borderBottom: "1px solid #e5e7eb", paddingBottom: "10px" }}>
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ padding: "10px 15px", borderRadius: "6px", border: "none", background: activeTab === t.id ? "#10b981" : "transparent", color: activeTab === t.id ? "#fff" : "#4b5563", cursor: "pointer", fontWeight: "bold" }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          <div style={{ background: "#fff", border: "1px solid #e5e7eb", padding: "20px", borderRadius: "12px" }}>
            {activeTab === "overview" && (
              <div>
                <h3>📊 Tactical Operational Profile</h3>
                <p><strong>Brand / Target Title:</strong> {result.overview?.name || "N/A"}</p>
                <p><strong>Positioning Statement:</strong> {result.overview?.market_position || "N/A"}</p>
                <p><strong>Threat Core Score:</strong> <span style={{ color: result.overview?.threat_level === "High" ? "#ef4444" : "#f59e0b" }}>{result.overview?.threat_level || "N/A"}</span></p>
                <p><strong>Operational Model:</strong> {result.overview?.business_model || "N/A"}</p>
                <p><strong>Value Prop:</strong> {result.overview?.value_prop || "N/A"}</p>
                <p><strong>Executive Abstract:</strong> {result.overview?.summary || "N/A"}</p>
              </div>
            )}

            {activeTab === "performance" && (
              <div>
                <h3>⚡ Real Core Vitals Metrics</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "10px", marginBottom: "20px" }}>
                  <div style={{ background: "#f3f4f6", padding: "15px", borderRadius: "8px", textAlign: "center" }}>
                    <div style={{ fontSize: "20px", fontWeight: "bold" }}>{result.performance?.mob_perf || "N/A"}</div>
                    <div style={{ fontSize: "11px", color: "#6b7280" }}>Mobile Speed</div>
                  </div>
                  <div style={{ background: "#f3f4f6", padding: "15px", borderRadius: "8px", textAlign: "center" }}>
                    <div style={{ fontSize: "20px", fontWeight: "bold" }}>{result.performance?.desk_perf || "N/A"}</div>
                    <div style={{ fontSize: "11px", color: "#6b7280" }}>Desktop Speed</div>
                  </div>
                </div>
                <p><strong>LCP:</strong> {result.performance?.lcp || "N/A"}</p>
                <p><strong>TTFB:</strong> {result.performance?.ttfb || "N/A"}</p>
                <p><strong>Total Byte Weight:</strong> {result.performance?.size || "N/A"}</p>
              </div>
            )}

            {activeTab === "seo_on_page" && (
              <div>
                <h3>🔍 On-Page Engine Diagnostics</h3>
                <p><strong>Title Element:</strong> {result.seo_on_page?.title || "N/A"}</p>
                <p><strong>Meta Description:</strong> {result.seo_on_page?.description || "N/A"}</p>
                <p><strong>SSL Connection:</strong> {result.seo_on_page?.ssl ? "✅ Verified Secure" : "❌ No SSL Detected"}</p>
              </div>
            )}

            {activeTab === "technical" && (
              <div>
                <h3>🛠️ Detected Core Stack & Footprints</h3>
                <p><strong>CMS Signature:</strong> {result.technical?.cms || "N/A"}</p>
                <p><strong>Hosting Network:</strong> {result.technical?.hosting || "N/A"}</p>
                <p><strong>IP Resolved Address:</strong> {result.technical?.ip || "N/A"}</p>
                <div>
                  <strong>Integrated Technologies Matrix:</strong>
                  <ul>
                    {result.technical?.tech_stack?.map((tech: string, idx: number) => (
                      <li key={idx}>{tech}</li>
                    )) || <li>No dynamic records returned.</li>}
                  </ul>
                </div>
              </div>
            )}

            {activeTab === "traffic" && (
              <div>
                <h3>📈 Volumetric Traffic Reports</h3>
                <p><strong>Estimated Monthly Visits:</strong> {result.traffic?.monthly_visits || "N/A"}</p>
                <p><strong>Avg Session Duration:</strong> {result.traffic?.avg_duration || "N/A"}</p>
                <p><strong>Bounce Rate:</strong> {result.traffic?.bounce_rate || "N/A"}</p>
              </div>
            )}

            {activeTab === "seo_off_page" && (
              <div>
                <h3>🔗 Authority Profile & Backlinks</h3>
                <p><strong>Total Indexed Backlinks:</strong> {result.seo_off_page?.total_backlinks || "N/A"}</p>
                <p><strong>Referring Domains Network:</strong> {result.seo_off_page?.referring_domains || "N/A"}</p>
                <p><strong>Global Authority Indicator:</strong> {result.seo_off_page?.global_rank || "N/A"}</p>
              </div>
            )}

            {activeTab === "keywords" && (
              <div>
                <h3>🔑 High Intent Keyword Map</h3>
                <p><strong>Total Organic Spectrum:</strong> {result.keywords?.organic_total || "N/A"}</p>
                <h4>Target Competitor Keyphrases:</h4>
                <ul>
                  {result.keywords?.top_keywords?.map((k: any, idx: number) => (
                    <li key={idx}><strong>{k.kw}</strong> — Vol: {k.vol} | Pos: {k.pos}</li>
                  )) || <li>No records available.</li>}
                </ul>
              </div>
            )}

            {activeTab === "social" && (
              <div>
                <h3>📱 Social Reach & Sentiment</h3>
                <p><strong>Audience Vector Insights:</strong> {result.social?.insights || "N/A"}</p>
              </div>
            )}

            {activeTab === "monetization" && (
              <div>
                <h3>💰 Revenue Stream Analysis</h3>
                <p><strong>Estimated MRR Run Rate:</strong> {result.monetization?.estimated_mrr || "N/A"}</p>
                <p><strong>Affiliate Channels Enabled:</strong> {result.monetization?.affiliate_program ? "Yes" : "No"}</p>
              </div>
            )}

            {activeTab === "battleplan" && (
              <div>
                <h3>⚔️ Tactical Playbook & Battle Plan</h3>
                <h4>Competitor Advantages:</h4>
                <ul>{result.battleplan?.competitor_advantages?.map((v, i) => <li key={i}>{v}</li>)}</ul>
                <h4>Your Direct Opportunities:</h4>
                <ul>{result.battleplan?.your_opportunities?.map((v, i) => <li key={i}>{v}</li>)}</ul>
                <h4>High-Impact 30-Day Quick Wins:</h4>
                <ul>
                  {result.battleplan?.quick_wins_30d?.map((w, i) => (
                    <li key={i}><strong>{w.action}</strong> (Impact: {w.impact} | Effort: {w.effort})</li>
                  ))}
                </ul>
                <p><strong>Strategic Verdict:</strong> {result.battleplan?.verdict || "N/A"}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
                       }
          
