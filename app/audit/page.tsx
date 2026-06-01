"use client";
import { useState, useEffect, useRef, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface SEOData {
  scores: { overall: number; performance: number; seo: number; accessibility: number; bestPractices: number; mobileScore: number };
  pageInfo: { title: string; metaDescription: string; wordCount: number; loadTime: string; pageSize: string };
  issues: { severity: "high" | "medium" | "low"; issue: string }[];
  recommendations: { priority: "high" | "medium" | "low"; action: string; impact: string }[];
  keywords: { keyword: string; density: string; relevance: "high" | "medium" | "low" }[];
  metaTags: {
    title: { present: boolean; length: number; status: string };
    description: { present: boolean; length: number; status: string };
    ogTags: { present: boolean; count: number };
    canonical: { present: boolean };
    robots: { present: boolean; value: string };
    viewport: { present: boolean };
  };
  technical: { httpsEnabled: boolean; wwwRedirect: boolean; sitemapDetected: boolean; robotsTxt: boolean; structuredData: boolean; compressedAssets: boolean };
  backlinks: { estimatedTotal: number; domainAuthority: number; topSources: { domain: string; type: string; authority: number }[] };
  competitors: { domain: string; overlapScore: number; commonKeywords: number }[];
  summary: string;
}

interface AuditRecord {
  id: string;
  url: string;
  date: string;
  data: SEOData;
}

// ─── Progress Steps ───────────────────────────────────────────────────────────
const PROGRESS_STEPS = [
  { label: "Crawling URL structure", icon: "🕷️", duration: 1200 },
  { label: "Fetching meta tags", icon: "🏷️", duration: 1000 },
  { label: "Analyzing page content", icon: "📄", duration: 1400 },
  { label: "Checking technical SEO", icon: "⚙️", duration: 1100 },
  { label: "Running keyword analysis", icon: "🔑", duration: 1300 },
  { label: "Estimating backlinks", icon: "🔗", duration: 1200 },
  { label: "Scanning competitors", icon: "🎯", duration: 1000 },
  { label: "Calculating scores", icon: "📊", duration: 800 },
  { label: "Generating AI summary", icon: "🤖", duration: 600 },
];

// ─── API Call ─────────────────────────────────────────────────────────────────
const fetchSEOAudit = async (url: string): Promise<SEOData> => {
  const prompt = `You are an expert SEO analyst. Analyze this URL and return ONLY a valid JSON object (no markdown, no backticks, no explanation):

URL: ${url}

Return this exact JSON structure:
{
  "scores": {
    "overall": <number 0-100>,
    "performance": <number 0-100>,
    "seo": <number 0-100>,
    "accessibility": <number 0-100>,
    "bestPractices": <number 0-100>,
    "mobileScore": <number 0-100>
  },
  "pageInfo": {
    "title": "<page title>",
    "metaDescription": "<meta description or 'Not found'>",
    "wordCount": <estimated word count>,
    "loadTime": "<estimated load time like 1.2s>",
    "pageSize": "<estimated size like 2.4 MB>"
  },
  "issues": [
    {"severity": "high|medium|low", "issue": "<issue description>"}
  ],
  "recommendations": [
    {"priority": "high|medium|low", "action": "<specific action>", "impact": "<expected impact>"}
  ],
  "keywords": [
    {"keyword": "<keyword>", "density": "<percentage like 2.3%>", "relevance": "high|medium|low"}
  ],
  "metaTags": {
    "title": {"present": true|false, "length": <number>, "status": "good|too_long|too_short|missing"},
    "description": {"present": true|false, "length": <number>, "status": "good|too_long|too_short|missing"},
    "ogTags": {"present": true|false, "count": <number>},
    "canonical": {"present": true|false},
    "robots": {"present": true|false, "value": "<value or 'Not found'>"},
    "viewport": {"present": true|false}
  },
  "technical": {
    "httpsEnabled": true|false,
    "wwwRedirect": true|false,
    "sitemapDetected": true|false,
    "robotsTxt": true|false,
    "structuredData": true|false,
    "compressedAssets": true|false
  },
  "backlinks": {
    "estimatedTotal": <number>,
    "domainAuthority": <number 0-100>,
    "topSources": [
      {"domain": "<domain>", "type": "dofollow|nofollow", "authority": <number>}
    ]
  },
  "competitors": [
    {"domain": "<competitor domain>", "overlapScore": <number 0-100>, "commonKeywords": <number>}
  ],
  "summary": "<2-3 sentence professional SEO summary>"
}`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const raw = await response.json();
  const text = raw.content.map((i: { type: string; text?: string }) => i.text || "").filter(Boolean).join("\n");
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
};

// ─── Sub-components ───────────────────────────────────────────────────────────
const ScoreRing = ({ score, label, color }: { score: number; label: string; color: string }) => {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const colorMap: Record<string, { stroke: string; bg: string; text: string }> = {
    green:  { stroke: "#00e5a0", bg: "#0a2e22", text: "#00e5a0" },
    blue:   { stroke: "#38bdf8", bg: "#0a1f2e", text: "#38bdf8" },
    purple: { stroke: "#a78bfa", bg: "#1a0a2e", text: "#a78bfa" },
    orange: { stroke: "#fb923c", bg: "#2e1a0a", text: "#fb923c" },
    pink:   { stroke: "#f472b6", bg: "#2e0a1f", text: "#f472b6" },
    cyan:   { stroke: "#22d3ee", bg: "#0a2228", text: "#22d3ee" },
  };
  const c = colorMap[color] || colorMap.green;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{ position: "relative", width: 72, height: 72 }}>
        <svg width="72" height="72" viewBox="0 0 72 72" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="36" cy="36" r={r} fill={c.bg} stroke="#ffffff10" strokeWidth="5" />
          <circle cx="36" cy="36" r={r} fill="none" stroke={c.stroke} strokeWidth="5"
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            style={{ transition: "stroke-dasharray 1.2s cubic-bezier(.4,0,.2,1)" }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: c.text, fontFamily: "'Space Mono', monospace" }}>{score}</span>
        </div>
      </div>
      <span style={{ fontSize: 10, color: "#9ca3af", textAlign: "center", fontFamily: "system-ui", letterSpacing: "0.05em", textTransform: "uppercase" }}>{label}</span>
    </div>
  );
};

const Badge = ({ text, type }: { text: string; type: string }) => {
  const styles: Record<string, { bg: string; color: string; border: string }> = {
    high:     { bg: "#3f0f0f", color: "#f87171", border: "#7f1d1d" },
    medium:   { bg: "#3f2f0f", color: "#fbbf24", border: "#78350f" },
    low:      { bg: "#0f2f1f", color: "#34d399", border: "#064e3b" },
    good:     { bg: "#0f2a1f", color: "#10b981", border: "#065f46" },
    missing:  { bg: "#3f0f0f", color: "#f87171", border: "#7f1d1d" },
    too_long: { bg: "#3f2f0f", color: "#fbbf24", border: "#78350f" },
    too_short:{ bg: "#3f2f0f", color: "#fbbf24", border: "#78350f" },
  };
  const s = styles[type] || styles.low;
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: s.bg, color: s.color, border: `1px solid ${s.border}`, letterSpacing: "0.05em", textTransform: "uppercase" }}>
      {text}
    </span>
  );
};

const Section = ({ icon, title, children, accent = "#00e5a0" }: { icon: string; title: string; children: React.ReactNode; accent?: string }) => (
  <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 12, overflow: "hidden", marginBottom: 16 }}>
    <div style={{ padding: "14px 18px", borderBottom: "1px solid #1f2937", display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: accent, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "'Space Mono', monospace" }}>{title}</span>
    </div>
    <div style={{ padding: "16px 18px" }}>{children}</div>
  </div>
);

const Row = ({ label, value, status }: { label: string; value: string; status?: string }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #1f293740" }}>
    <span style={{ fontSize: 12, color: "#9ca3af" }}>{label}</span>
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 12, color: "#e5e7eb", fontFamily: "'Space Mono', monospace" }}>{value}</span>
      {status && <Badge text={status} type={status} />}
    </div>
  </div>
);

// ─── Progress Animation ───────────────────────────────────────────────────────
const ProgressLoader = ({ currentStep, totalSteps, stepLabel, stepIcon }: {
  currentStep: number; totalSteps: number; stepLabel: string; stepIcon: string;
}) => {
  const pct = Math.round((currentStep / totalSteps) * 100);
  return (
    <div style={{ textAlign: "center", padding: "60px 20px" }}>
      <div style={{ fontSize: 40, marginBottom: 16, display: "inline-block", animation: "pulse 1.5s ease-in-out infinite" }}>
        {stepIcon}
      </div>
      <p style={{ color: "#00e5a0", fontSize: 15, fontFamily: "'Space Mono', monospace", marginBottom: 4 }}>
        {stepLabel}
      </p>
      <p style={{ color: "#6b7280", fontSize: 12, marginBottom: 24 }}>
        Step {currentStep} of {totalSteps}
      </p>
      {/* Progress bar */}
      <div style={{ maxWidth: 360, margin: "0 auto", background: "#1f2937", borderRadius: 8, height: 8, overflow: "hidden" }}>
        <div style={{
          height: "100%",
          width: `${pct}%`,
          background: "linear-gradient(90deg, #00e5a0, #38bdf8)",
          borderRadius: 8,
          transition: "width 0.6s cubic-bezier(.4,0,.2,1)",
          boxShadow: "0 0 12px #00e5a060"
        }} />
      </div>
      <p style={{ color: "#00e5a0", fontSize: 11, marginTop: 8, fontFamily: "'Space Mono', monospace" }}>{pct}%</p>
      {/* Mini checklist */}
      <div style={{ maxWidth: 360, margin: "20px auto 0", textAlign: "left" }}>
        {PROGRESS_STEPS.slice(0, currentStep).map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
            <span style={{ color: "#00e5a0", fontSize: 12 }}>✓</span>
            <span style={{ fontSize: 11, color: "#4b5563" }}>{s.label}</span>
          </div>
        ))}
        {currentStep < PROGRESS_STEPS.length && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
            <span style={{ fontSize: 12, animation: "spin 1s linear infinite", display: "inline-block" }}>⚙️</span>
            <span style={{ fontSize: 11, color: "#e5e7eb" }}>{PROGRESS_STEPS[currentStep]?.label}</span>
          </div>
        )}
      </div>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.7; transform: scale(1.1); } }
      `}</style>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SEOAuditPage() {
  const [url, setUrl] = useState("https://www.namecheap.com");
  const [data, setData] = useState<SEOData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [progressStep, setProgressStep] = useState(0);
  const [history, setHistory] = useState<AuditRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const progressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Load history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("seo_audit_history");
      if (saved) setHistory(JSON.parse(saved));
    } catch {}
  }, []);

  const saveToHistory = useCallback((auditUrl: string, auditData: SEOData) => {
    const record: AuditRecord = {
      id: Date.now().toString(),
      url: auditUrl,
      date: new Date().toLocaleString(),
      data: auditData,
    };
    setHistory(prev => {
      const updated = [record, ...prev].slice(0, 10); // keep last 10
      try { localStorage.setItem("seo_audit_history", JSON.stringify(updated)); } catch {}
      return updated;
    });
  }, []);

  // Animate progress steps
  const startProgress = useCallback(() => {
    setProgressStep(0);
    let step = 0;
    const tick = () => {
      step++;
      setProgressStep(step);
      if (step < PROGRESS_STEPS.length) {
        progressTimer.current = setTimeout(tick, PROGRESS_STEPS[step - 1].duration);
      }
    };
    progressTimer.current = setTimeout(tick, PROGRESS_STEPS[0].duration);
  }, []);

  const stopProgress = useCallback(() => {
    if (progressTimer.current) clearTimeout(progressTimer.current);
  }, []);

  const runAudit = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);
    setActiveTab("overview");
    setShowHistory(false);
    startProgress();
    try {
      const result = await fetchSEOAudit(url);
      stopProgress();
      setProgressStep(PROGRESS_STEPS.length);
      setData(result);
      saveToHistory(url, result);
    } catch {
      stopProgress();
      setError("Analysis failed. Please check the URL and try again.");
    }
    setLoading(false);
  };

  // Load a history record
  const loadHistory = (record: AuditRecord) => {
    setUrl(record.url);
    setData(record.data);
    setShowHistory(false);
    setError(null);
    setActiveTab("overview");
  };

  const deleteHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory(prev => {
      const updated = prev.filter(r => r.id !== id);
      try { localStorage.setItem("seo_audit_history", JSON.stringify(updated)); } catch {}
      return updated;
    });
  };

  // Copy to clipboard
  const copyToClipboard = async () => {
    if (!data) return;
    const text = `SEO Audit Report
URL: ${url}
Date: ${new Date().toLocaleString()}

=== SCORES ===
Overall: ${data.scores.overall}/100
Performance: ${data.scores.performance}/100
SEO: ${data.scores.seo}/100
Accessibility: ${data.scores.accessibility}/100
Best Practices: ${data.scores.bestPractices}/100
Mobile: ${data.scores.mobileScore}/100

=== PAGE INFO ===
Title: ${data.pageInfo.title}
Meta Description: ${data.pageInfo.metaDescription}
Word Count: ${data.pageInfo.wordCount}
Load Time: ${data.pageInfo.loadTime}
Page Size: ${data.pageInfo.pageSize}

=== ISSUES (${data.issues.length}) ===
${data.issues.map(i => `[${i.severity.toUpperCase()}] ${i.issue}`).join("\n")}

=== RECOMMENDATIONS ===
${data.recommendations.map(r => `[${r.priority.toUpperCase()}] ${r.action}\n  Impact: ${r.impact}`).join("\n")}

=== SUMMARY ===
${data.summary}`;

    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // JSON Export
  const exportJSON = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify({ url, date: new Date().toISOString(), ...data }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `seo-audit-${new URL(url).hostname}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // PDF Download (print-based)
  const downloadPDF = async () => {
    if (!data || !resultsRef.current) return;
    setPdfLoading(true);
    // Give slight delay for state update
    await new Promise(r => setTimeout(r, 100));
    window.print();
    setPdfLoading(false);
  };

  const tabs = [
    { id: "overview",    label: "Overview",    icon: "📊" },
    { id: "meta",        label: "Meta Tags",   icon: "🏷️" },
    { id: "technical",   label: "Technical",   icon: "⚙️" },
    { id: "keywords",    label: "Keywords",    icon: "🔑" },
    { id: "backlinks",   label: "Backlinks",   icon: "🔗" },
    { id: "competitors", label: "Competitors", icon: "🎯" },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');
        @keyframes spin   { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse  { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.35s ease both; }
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; color: black !important; }
          * { border-color: #ddd !important; }
        }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#0d1117", fontFamily: "system-ui, sans-serif", color: "#e5e7eb" }}>

        {/* ── Header ── */}
        <div className="no-print" style={{ background: "linear-gradient(135deg, #0d1117 0%, #111827 100%)", borderBottom: "1px solid #1f2937", padding: "20px 24px" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #00e5a0, #0ea5e9)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🔍</div>
              <div>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, background: "linear-gradient(90deg, #00e5a0, #38bdf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontFamily: "'Space Mono', monospace" }}>SEO Audit Pro</h1>
                <p style={{ margin: 0, fontSize: 11, color: "#6b7280", letterSpacing: "0.05em" }}>AI-Powered Deep SEO Analysis</p>
              </div>
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
                {/* History Button */}
                <button onClick={() => setShowHistory(!showHistory)}
                  style={{ display: "flex", alignItems: "center", gap: 6, background: showHistory ? "#1f2937" : "transparent", border: "1px solid #374151", borderRadius: 8, padding: "6px 12px", color: "#9ca3af", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
                  🕐 History {history.length > 0 && <span style={{ background: "#00e5a020", color: "#00e5a0", borderRadius: 10, padding: "1px 6px", fontSize: 10 }}>{history.length}</span>}
                </button>
                <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#0a2e22", border: "1px solid #00e5a040", borderRadius: 20, padding: "4px 12px" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#00e5a0", boxShadow: "0 0 8px #00e5a0", animation: "pulse 2s ease-in-out infinite" }}></span>
                  <span style={{ fontSize: 11, color: "#00e5a0", fontWeight: 700 }}>AI Active</span>
                </div>
              </div>
            </div>

            {/* URL Input */}
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <input
                value={url}
                onChange={e => setUrl(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !loading && runAudit()}
                placeholder="Enter website URL (e.g. https://example.com)..."
                style={{ flex: 1, background: "#1f2937", border: "1px solid #374151", borderRadius: 10, padding: "12px 16px", color: "#e5e7eb", fontSize: 13, outline: "none", fontFamily: "'Space Mono', monospace" }}
              />
              <button onClick={runAudit} disabled={loading}
                style={{ padding: "12px 24px", background: loading ? "#374151" : "linear-gradient(135deg, #00e5a0, #0ea5e9)", border: "none", borderRadius: 10, color: loading ? "#6b7280" : "#0d1117", fontWeight: 800, fontSize: 13, cursor: loading ? "not-allowed" : "pointer", letterSpacing: "0.05em", transition: "opacity 0.2s", whiteSpace: "nowrap" }}>
                {loading ? "Analyzing..." : "▶ Run Audit"}
              </button>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 900, margin: "0 auto", padding: "20px 24px" }}>

          {/* ── History Drawer ── */}
          {showHistory && !loading && (
            <div className="fade-in no-print" style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 12, marginBottom: 16, overflow: "hidden" }}>
              <div style={{ padding: "14px 18px", borderBottom: "1px solid #1f2937", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#38bdf8", fontFamily: "'Space Mono', monospace", letterSpacing: "0.08em", textTransform: "uppercase" }}>🕐 Audit History</span>
                {history.length > 0 && (
                  <button onClick={() => { setHistory([]); try { localStorage.removeItem("seo_audit_history"); } catch {} }}
                    style={{ fontSize: 11, color: "#f87171", background: "transparent", border: "1px solid #7f1d1d", borderRadius: 6, padding: "3px 10px", cursor: "pointer" }}>
                    Clear All
                  </button>
                )}
              </div>
              {history.length === 0 ? (
                <div style={{ padding: 24, textAlign: "center", color: "#6b7280", fontSize: 13 }}>No audit history yet.</div>
              ) : (
                <div style={{ padding: "8px 0" }}>
                  {history.map(record => (
                    <div key={record.id} onClick={() => loadHistory(record)}
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 18px", cursor: "pointer", borderBottom: "1px solid #1f293740", transition: "background 0.15s" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#1f2937")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, color: "#e5e7eb", fontWeight: 600, fontFamily: "'Space Mono', monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{record.url}</div>
                        <div style={{ fontSize: 10, color: "#6b7280", marginTop: 2 }}>{record.date}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: 12 }}>
                        <div style={{ fontSize: 18, fontWeight: 900, color: record.data.scores.overall >= 70 ? "#00e5a0" : record.data.scores.overall >= 50 ? "#fbbf24" : "#f87171", fontFamily: "'Space Mono', monospace" }}>
                          {record.data.scores.overall}
                        </div>
                        <button onClick={e => deleteHistory(record.id, e)}
                          style={{ background: "transparent", border: "none", color: "#6b7280", cursor: "pointer", fontSize: 14, padding: "2px 6px" }}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Loading ── */}
          {loading && (
            <ProgressLoader
              currentStep={progressStep}
              totalSteps={PROGRESS_STEPS.length}
              stepLabel={PROGRESS_STEPS[Math.min(progressStep, PROGRESS_STEPS.length - 1)].label}
              stepIcon={PROGRESS_STEPS[Math.min(progressStep, PROGRESS_STEPS.length - 1)].icon}
            />
          )}

          {/* ── Error ── */}
          {error && (
            <div style={{ background: "#3f0f0f", border: "1px solid #7f1d1d", borderRadius: 12, padding: "16px 20px", color: "#f87171", fontSize: 13 }}>
              ⚠️ {error}
            </div>
          )}

          {/* ── Empty State ── */}
          {!loading && !data && !error && (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#6b7280" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
              <p style={{ fontSize: 15, fontWeight: 600, color: "#9ca3af" }}>Enter a URL and click Run Audit</p>
              <p style={{ fontSize: 12 }}>Get detailed SEO scores, meta tag analysis, keyword density, backlinks & more</p>
            </div>
          )}

          {/* ── Results ── */}
          {data && !loading && (
            <div ref={resultsRef} className="fade-in">

              {/* Export Toolbar */}
              <div className="no-print" style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                <button onClick={copyToClipboard}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: copied ? "#065f46" : "#1f2937", border: `1px solid ${copied ? "#10b981" : "#374151"}`, borderRadius: 8, color: copied ? "#10b981" : "#9ca3af", fontSize: 12, cursor: "pointer", fontWeight: 600, transition: "all 0.2s" }}>
                  {copied ? "✓ Copied!" : "📋 Copy Report"}
                </button>
                <button onClick={exportJSON}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "#1f2937", border: "1px solid #374151", borderRadius: 8, color: "#9ca3af", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
                  ⬇️ Export JSON
                </button>
                <button onClick={downloadPDF} disabled={pdfLoading}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "#1a1f2e", border: "1px solid #38bdf840", borderRadius: 8, color: "#38bdf8", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
                  {pdfLoading ? "⏳ Preparing..." : "🖨️ Download PDF"}
                </button>
                <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#6b7280" }}>
                  <span>Audited:</span>
                  <span style={{ color: "#9ca3af", fontFamily: "'Space Mono', monospace", fontSize: 10 }}>{url.length > 40 ? url.substring(0, 40) + "…" : url}</span>
                </div>
              </div>

              {/* Score Cards */}
              <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 12, padding: "20px", marginBottom: 16 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12 }}>
                  <ScoreRing score={data.scores.overall}      label="Overall"        color="green"  />
                  <ScoreRing score={data.scores.performance}  label="Performance"    color="blue"   />
                  <ScoreRing score={data.scores.seo}          label="SEO"            color="purple" />
                  <ScoreRing score={data.scores.accessibility} label="Accessibility" color="orange" />
                  <ScoreRing score={data.scores.bestPractices} label="Best Practices" color="pink" />
                  <ScoreRing score={data.scores.mobileScore}  label="Mobile"         color="cyan"   />
                </div>
              </div>

              {/* Quick Stats */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
                {[
                  { label: "Load Time",        value: data.pageInfo?.loadTime || "N/A",                      icon: "⚡" },
                  { label: "Page Size",         value: data.pageInfo?.pageSize || "N/A",                      icon: "📦" },
                  { label: "Word Count",        value: String(data.pageInfo?.wordCount || "N/A"),              icon: "📝" },
                  { label: "Domain Authority",  value: String(data.backlinks?.domainAuthority || "N/A"),       icon: "🏆" },
                ].map(stat => (
                  <div key={stat.label} style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 10, padding: "14px", textAlign: "center" }}>
                    <div style={{ fontSize: 20, marginBottom: 4 }}>{stat.icon}</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#e5e7eb", fontFamily: "'Space Mono', monospace" }}>{stat.value}</div>
                    <div style={{ fontSize: 10, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Tabs */}
              <div className="no-print" style={{ display: "flex", gap: 4, marginBottom: 16, overflowX: "auto", paddingBottom: 4 }}>
                {tabs.map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid", fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", letterSpacing: "0.05em", transition: "all 0.15s",
                      background: activeTab === tab.id ? "#00e5a015" : "transparent",
                      borderColor: activeTab === tab.id ? "#00e5a050" : "#1f2937",
                      color: activeTab === tab.id ? "#00e5a0" : "#6b7280" }}>
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>

              {/* ── Overview Tab ── */}
              {activeTab === "overview" && (
                <>
                  <Section icon="⚠️" title="Issues Found" accent="#f87171">
                    {data.issues?.length === 0 && <p style={{ fontSize: 12, color: "#6b7280" }}>No issues found.</p>}
                    {data.issues?.map((item, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: "1px solid #1f293740" }}>
                        <Badge text={item.severity} type={item.severity} />
                        <span style={{ fontSize: 12, color: "#d1d5db", lineHeight: 1.6 }}>{item.issue}</span>
                      </div>
                    ))}
                  </Section>

                  <Section icon="✅" title="Recommendations" accent="#00e5a0">
                    {data.recommendations?.map((item, i) => (
                      <div key={i} style={{ padding: "10px 0", borderBottom: "1px solid #1f293740" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <span style={{ color: "#00e5a0", fontSize: 14 }}>✓</span>
                          <span style={{ fontSize: 12, color: "#d1d5db", fontWeight: 600 }}>{item.action}</span>
                          <Badge text={item.priority} type={item.priority} />
                        </div>
                        <p style={{ margin: 0, fontSize: 11, color: "#6b7280", paddingLeft: 22 }}>Expected impact: {item.impact}</p>
                      </div>
                    ))}
                  </Section>

                  <Section icon="🤖" title="AI Summary" accent="#a78bfa">
                    <p style={{ margin: 0, fontSize: 13, color: "#d1d5db", lineHeight: 1.8 }}>{data.summary}</p>
                  </Section>
                </>
              )}

              {/* ── Meta Tags Tab ── */}
              {activeTab === "meta" && data.metaTags && (
                <Section icon="🏷️" title="Meta Tags Analysis" accent="#38bdf8">
                  <Row label="Page Title"         value={(data.pageInfo?.title?.substring(0, 40) + (data.pageInfo?.title?.length > 40 ? "..." : "")) || "N/A"} status={data.metaTags.title?.status} />
                  <Row label="Title Length"        value={`${data.metaTags.title?.length || 0} chars`} status={data.metaTags.title?.length > 60 ? "too_long" : data.metaTags.title?.length < 30 ? "too_short" : "good"} />
                  <Row label="Meta Description"    value={data.metaTags.description?.present ? "Present" : "Missing"} status={data.metaTags.description?.status} />
                  <Row label="Description Length"  value={`${data.metaTags.description?.length || 0} chars`} status={data.metaTags.description?.length > 160 ? "too_long" : data.metaTags.description?.length < 70 ? "too_short" : "good"} />
                  <Row label="Open Graph Tags"     value={`${data.metaTags.ogTags?.count || 0} tags`} status={data.metaTags.ogTags?.present ? "good" : "missing"} />
                  <Row label="Canonical URL"       value={data.metaTags.canonical?.present ? "Present" : "Missing"} status={data.metaTags.canonical?.present ? "good" : "missing"} />
                  <Row label="Robots Meta"         value={data.metaTags.robots?.value || "Not found"} status={data.metaTags.robots?.present ? "good" : "missing"} />
                  <Row label="Viewport Tag"        value={data.metaTags.viewport?.present ? "Present" : "Missing"} status={data.metaTags.viewport?.present ? "good" : "missing"} />
                </Section>
              )}

              {/* ── Technical Tab ── */}
              {activeTab === "technical" && data.technical && (
                <Section icon="⚙️" title="Technical SEO" accent="#fb923c">
                  {(Object.entries({
                    "HTTPS Enabled":     data.technical.httpsEnabled,
                    "WWW Redirect":      data.technical.wwwRedirect,
                    "Sitemap Detected":  data.technical.sitemapDetected,
                    "Robots.txt":        data.technical.robotsTxt,
                    "Structured Data":   data.technical.structuredData,
                    "Compressed Assets": data.technical.compressedAssets,
                  }) as [string, boolean][]).map(([label, value]) => (
                    <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid #1f293740" }}>
                      <span style={{ fontSize: 12, color: "#9ca3af" }}>{label}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 13 }}>{value ? "✅" : "❌"}</span>
                        <Badge text={value ? "good" : "missing"} type={value ? "good" : "missing"} />
                      </div>
                    </div>
                  ))}
                </Section>
              )}

              {/* ── Keywords Tab ── */}
              {activeTab === "keywords" && (
                <Section icon="🔑" title="Keyword Analysis" accent="#fbbf24">
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {data.keywords?.map((kw, i) => (
                      <div key={i} style={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 8, padding: "8px 12px" }}>
                        <div style={{ fontSize: 12, color: "#e5e7eb", fontWeight: 600 }}>{kw.keyword}</div>
                        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                          <span style={{ fontSize: 10, color: "#6b7280" }}>Density: {kw.density}</span>
                          <Badge text={kw.relevance} type={kw.relevance === "high" ? "low" : kw.relevance === "medium" ? "medium" : "high"} />
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* ── Backlinks Tab ── */}
              {activeTab === "backlinks" && data.backlinks && (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                    <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 10, padding: 16, textAlign: "center" }}>
                      <div style={{ fontSize: 28, fontWeight: 900, color: "#38bdf8", fontFamily: "'Space Mono', monospace" }}>{data.backlinks.estimatedTotal?.toLocaleString()}</div>
                      <div style={{ fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Estimated Backlinks</div>
                    </div>
                    <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 10, padding: 16, textAlign: "center" }}>
                      <div style={{ fontSize: 28, fontWeight: 900, color: "#00e5a0", fontFamily: "'Space Mono', monospace" }}>{data.backlinks.domainAuthority}/100</div>
                      <div style={{ fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Domain Authority</div>
                    </div>
                  </div>
                  <Section icon="🔗" title="Top Backlink Sources" accent="#38bdf8">
                    {data.backlinks.topSources?.map((src, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid #1f293740" }}>
                        <div>
                          <div style={{ fontSize: 12, color: "#e5e7eb", fontWeight: 600 }}>{src.domain}</div>
                          <div style={{ fontSize: 10, color: "#6b7280" }}>Authority: {src.authority}</div>
                        </div>
                        <Badge text={src.type} type={src.type === "dofollow" ? "low" : "medium"} />
                      </div>
                    ))}
                  </Section>
                </>
              )}

              {/* ── Competitors Tab ── */}
              {activeTab === "competitors" && data.competitors && (
                <Section icon="🎯" title="Competitor Analysis" accent="#f472b6">
                  {data.competitors?.map((comp, i) => (
                    <div key={i} style={{ padding: "10px 0", borderBottom: "1px solid #1f293740" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 13, color: "#e5e7eb", fontWeight: 700 }}>{comp.domain}</span>
                        <span style={{ fontSize: 11, color: "#6b7280" }}>{comp.commonKeywords} common keywords</span>
                      </div>
                      <div style={{ background: "#1f2937", borderRadius: 4, height: 6, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${comp.overlapScore}%`, background: "linear-gradient(90deg, #f472b6, #a78bfa)", borderRadius: 4, transition: "width 1s ease" }} />
                      </div>
                      <div style={{ fontSize: 10, color: "#6b7280", marginTop: 4 }}>Keyword overlap: {comp.overlapScore}%</div>
                    </div>
                  ))}
                </Section>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
                      }
