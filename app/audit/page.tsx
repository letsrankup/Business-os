"use client";
import { useState } from "react";
import AppLayout from "@/components/AppLayout";

// Small Sub-components for modern look
const ScoreRing = ({ score, label, color }: { score: number; label: string; color: string }) => {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = ((score || 0) / 100) * circ;
  const colorMap: any = {
    green: { stroke: "#00e5a0", bg: "#0a2e22", text: "#00e5a0" },
    blue: { stroke: "#38bdf8", bg: "#0a1f2e", text: "#38bdf8" },
    purple: { stroke: "#a78bfa", bg: "#1a0a2e", text: "#a78bfa" },
    orange: { stroke: "#fb923c", bg: "#2e1a0a", text: "#fb923c" },
    pink: { stroke: "#f472b6", bg: "#2e0a1f", text: "#f472b6" },
    cyan: { stroke: "#22d3ee", bg: "#0a2228", text: "#22d3ee" },
  };
  const c = colorMap[color] || colorMap.green;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative w-[72px] h-[72px]">
        <svg width="72" height="72" viewBox="0 0 72 72" className="-rotate-90">
          <circle cx="36" cy="36" r={r} fill={c.bg} stroke="#ffffff10" strokeWidth="5" />
          <circle cx="36" cy="36" r={r} fill="none" stroke={c.stroke} strokeWidth="5"
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            className="transition-all duration-1000 ease-out" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-base font-black font-mono" style={{ color: c.text }}>{score}</span>
        </div>
      </div>
      <span className="text-[10px] text-gray-400 tracking-wider uppercase text-center">{label}</span>
    </div>
  );
};

const Badge = ({ text, type }: { text: string; type: string }) => {
  const styles: any = {
    high: { bg: "#3f0f0f", color: "#f87171", border: "#7f1d1d" },
    medium: { bg: "#3f2f0f", color: "#fbbf24", border: "#78350f" },
    low: { bg: "#0f2f1f", color: "#34d399", border: "#064e3b" },
    good: { bg: "#0f2a1f", color: "#10b981", border: "#065f46" },
    missing: { bg: "#3f0f0f", color: "#f87171", border: "#7f1d1d" },
    too_long: { bg: "#3f2f0f", color: "#fbbf24", border: "#78350f" },
    too_short: { bg: "#3f2f0f", color: "#fbbf24", border: "#78350f" },
  };
  const s = styles[type] || styles.low;
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border"
          style={{ background: s.bg, color: s.color, borderColor: s.border }}>
      {text}
    </span>
  );
};

const Section = ({ icon, title, children, accent = "#00e5a0" }: any) => (
  <div className="bg-[#12121a] border border-white/10 rounded-2xl overflow-hidden mb-4">
    <div className="px-[18px] py-3.5 border-b border-white/10 flex items-center gap-2">
      <span className="text-base">{icon}</span>
      <span className="text-[13px] font-bold uppercase tracking-widest font-mono" style={{ color: accent }}>{title}</span>
    </div>
    <div className="p-[18px]">{children}</div>
  </div>
);

const Row = ({ label, value, status }: { label: string; value: any; status?: string }) => (
  <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
    <span className="text-xs text-gray-400">{label}</span>
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-200 font-mono">{value}</span>
      {status && <Badge text="{status}" type="{status}"/>}
    </div>
  </div>
);

export default function SEOAuditPro() {
  const [url, setUrl] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  const runAudit = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const response = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      });

      const result = await response.json();
      if (!response.ok || result.error) {
        setError(result.error || "Analysis failed.");
      } else {
        setData(result);
      }
    } catch (e) {
      setError("Analysis failed. Please check the URL and try again.");
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "meta", label: "Meta Tags", icon: "🏷️" },
    { id: "technical", label: "Technical", icon: "⚙️" },
    { id: "keywords", label: "Keywords", icon: "🔑" },
    { id: "backlinks", label: "Backlinks", icon: "🔗" },
    { id: "competitors", label: "Competitors", icon: "🎯" },
  ];

  return (
    <AppLayout title="SEO Audit Pro">
      <div className="max-w-[900px] mx-auto space-y-5">
        
        <div>
          <h1 className="text-2xl font-black font-mono bg-gradient-to-r from-[#00e5a0] to-[#38bdf8] WebkitBackgroundClip: 'text' text-transparent bg-clip-text">SEO Audit Pro</h1>
          <p className="text-gray-400 text-xs mt-1">AI-Powered Deep SEO Analysis</p>
        </div>

        
        <div className="bg-[#12121a] border border-white/10 rounded-2xl p-5">
          <div className="flex gap-3">
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === "Enter" && runAudit()}
              placeholder="Enter website URL (e.g. https://example.com)"
              className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#00e5a0]/50 transition-all font-mono"
            />
            <button
              onClick={runAudit}
              disabled={loading || !url}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#00e5a0] to-[#0ea5e9] text-black font-extrabold text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap"
            >
              {loading ? "Analyzing..." : "Run Audit"}
            </button>
          </div>
        </div>

        
        {loading && (
          <div className="bg-[#12121a] border border-white/10 rounded-2xl p-10 text-center">
            <div className="text-4xl mb-4 animate-spin inline-block">⚙️</div>
            <p className="text-[#00e5a0] text-sm font-mono font-bold">Running deep AI SEO analysis...</p>
            <p className="text-gray-500 text-xs mt-1">Checking meta tags, speed indexes, and keywords...</p>
          </div>
        )}

        
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-red-400 text-sm">
            ⚠️ {error}
          </div>
        )}

        
        {data && !loading && (
          <>
            
            <div className="bg-[#12121a] border border-white/10 rounded-2xl p-5">
              <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                <ScoreRing score="{data.scores?.overall}" label="Overall" color="green"/>
                <ScoreRing score="{data.scores?.performance}" label="Performance" color="blue"/>
                <ScoreRing score="{data.scores?.seo}" label="SEO" color="purple"/>
                <ScoreRing score="{data.scores?.accessibility}" label="Accessibility" color="orange"/>
                <ScoreRing score="{data.scores?.bestPractices}" label="Best Practices" color="pink"/>
                <ScoreRing score="{data.scores?.mobileScore}" label="Mobile" color="cyan"/>
              </div>
            </div>

            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Load Time", value: data.pageInfo?.loadTime || "N/A", icon: "⚡" },
                { label: "Page Size", value: data.pageInfo?.pageSize || "N/A", icon: "📦" },
                { label: "Word Count", value: data.pageInfo?.wordCount || "N/A", icon: "📝" },
                { label: "Domain Authority", value: data.backlinks?.domainAuthority || "N/A", icon: "🏆" },
              ].map((stat, i) => (
                <div key={i} className="bg-[#12121a] border border-white/10 rounded-xl p-4 text-center">
                  <div className="text-xl mb-1">{stat.icon}</div>
                  <div className="text-base font-black text-gray-100 font-mono">{stat.value}</div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-wide mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>

            
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-[14px] py-2 rounded-lg border text-[11px] font-bold whitespace-nowrap transition-all uppercase tracking-wider
                    ${activeTab === tab.id ? "bg-[#00e5a0]/10 border-[#00e5a0]/40 text-[#00e5a0]" : "bg-transparent border-white/10 text-gray-400"}`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            
            {activeTab === "overview" && (
              <div className="space-y-4">
                <Section icon="⚠️" title="Issues Found" accent="#f87171">
                  {data.issues?.map((item: any, i: number) => (
                    <div key={i} className="flex items-start gap-3 py-2 border-b border-white/5 last:border-0">
                      <Badge text="{item.severity}" type="{item.severity}"/>
                      <span className="text-xs text-gray-300 leading-relaxed">{item.issue}</span>
                    </div>
                  ))}
                </Section>
                <Section icon="✅" title="Recommendations" accent="#00e5a0">
                  {data.recommendations?.map((item: any, i: number) => (
                    <div key={i} className="py-2.5 border-b border-white/5 last:border-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[#00e5a0] text-sm">✓</span>
                        <span className="text-xs text-gray-200 font-semibold">{item.action}</span>
                        <Badge text="{item.priority}" type="{item.priority}"/>
                      </div>
                      <p className="text-[11px] text-gray-500 pl-4.5">Expected impact: {item.impact}</p>
                    </div>
                  ))}
                </Section>
                <Section icon="🤖" title="AI Summary" accent="#a78bfa">
                  <p className="text-xs text-gray-300 leading-loose">{data.summary}</p>
                </Section>
              </div>
            )}

            {activeTab === "meta" && data.metaTags && (
              <Section icon="🏷️" title="Meta Tags Analysis" accent="#38bdf8">
                <Row label="Page Title" value="{data.pageInfo?.title" || "N/A"} status="{data.metaTags.title?.status}"/>
                <Row label="Title Length" value="{`${data.metaTags.title?.length" || 0} chars`} status="{data.metaTags.title?.status}"/>
                <Row label="Meta Description" value="{data.pageInfo?.metaDescription" || "Missing"} status="{data.metaTags.description?.status}"/>
                <Row label="Description Length" value="{`${data.metaTags.description?.length" || 0} chars`} status="{data.metaTags.description?.status}"/>
                <Row label="Open Graph Tags" value="{`${data.metaTags.ogTags?.count" || 0} tags`} status="{data.metaTags.ogTags?.present" ? "good" : "missing"}/>
                <Row label="Canonical" value="{data.metaTags.canonical?.present" ? "Present" : "Missing"} status="{data.metaTags.canonical?.present" "good" "missing"}/>
              </Section>
            )}

            {activeTab === "technical" && data.technical && (
              <Section icon="⚙️" title="Technical SEO" accent="#fb923c">
                {Object.entries(data.technical).map(([key, value]: any) => (
                  <div key={key} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                    <span className="text-xs text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                    <span className="text-sm">{value ? "✅" : "❌"}</span>
                  </div>
                ))}
              </Section>
            )}

            {activeTab === "keywords" && (
              <Section icon="🔑" title="Keyword Density" accent="#fbbf24">
                <div className="flex flex-wrap gap-2">
                  {data.keywords?.map((kw: any, i: number) => (
                    <div key={i} className="bg-black/30 border border-white/10 rounded-xl p-3">
                      <div className="text-xs text-gray-200 font-bold">{kw.keyword}</div>
                      <div className="text-[10px] text-gray-500 mt-1">Density: {kw.density}</div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {activeTab === "backlinks" && data.backlinks && (
              <Section icon="🔗" title="Top Profiles" accent="#38bdf8">
                {data.backlinks.topSources?.map((src: any, i: number) => (
                  <Row key="{i}" label="{src.domain}" value="{`Authority:" ${src.authority}`} status="{src.type}"/>
                ))}
              </Section>
            )}

            {activeTab === "competitors" && (
              <Section icon="🎯" title="Competitors" accent="#f472b6">
                {data.competitors?.map((comp: any, i: number) => (
                  <div key={i} className="py-2 border-b border-white/5 last:border-0">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-200 font-bold">{comp.domain}</span>
                      <span className="text-gray-500">{comp.commonKeywords} common keywords</span>
                    </div>
                    <div className="w-full bg-black/40 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-gradient-to-r from-[#f472b6] to-[#a78bfa] h-full" style={{ width: `${comp.overlapScore}%` }} />
                    </div>
                  </div>
                ))}
              </Section>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
      }
