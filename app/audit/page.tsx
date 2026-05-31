"use client";
import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import AuditCard from "@/components/AuditCard";

export default function AuditPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const run = async () => {
    if (!url) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch("/api/audit", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ url }) });
      const data = await res.json();
      if (data.error) setError(data.error); else setResult(data);
    } catch { setError("Something went wrong. Try again."); }
    finally { setLoading(false); }
  };

  return (
    <AppLayout title="SEO Audit">
      <div>
        <h1 className="text-2xl font-black">SEO <span className="text-[#00f5a0]">Audit</span></h1>
        <p className="text-gray-400 text-xs mt-1">AI-powered deep SEO analysis for any website</p>
      </div>

      <div className="bg-[#12121a] border border-white/10 rounded-2xl p-5">
        <label className="block text-xs text-gray-400 mb-2">Website URL</label>
        <div className="flex gap-3">
          <input type="url" value={url} onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === "Enter" && run()}
            placeholder="https://yourwebsite.com"
            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#00f5a0]/50 transition-all" />
          <button onClick={run} disabled={loading || !url}
            className="px-6 py-3 rounded-xl bg-[#00f5a0] text-black font-bold hover:bg-[#00f5a0]/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap">
            {loading ? "Analyzing..." : "Run Audit"}
          </button>
        </div>
      </div>

      {loading && (
        <div className="bg-[#12121a] border border-white/10 rounded-2xl p-10 text-center">
          <div className="text-4xl mb-4 animate-pulse">🔍</div>
          <p className="text-[#00f5a0] font-bold">Running AI Audit...</p>
          <p className="text-gray-400 text-xs mt-2">Analyzing meta, performance, content, keywords...</p>
        </div>
      )}

      {error && <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-red-400 text-sm">⚠️ {error}</div>}

      {result && !loading && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label:"Overall Score",  val:result.score,         color:"#00f5a0" },
              { label:"Performance",    val:result.performance,   color:"#00d9f5" },
              { label:"SEO Score",      val:result.seo,           color:"#f5a000" },
              { label:"Accessibility",  val:result.accessibility, color:"#f500f5" },
            ].map((s,i) => (
              <div key={i} className="bg-[#12121a] border border-white/10 rounded-2xl p-4 text-center">
                <p className="text-3xl font-black" style={{color:s.color}}>{s.val}<span className="text-sm text-gray-500">/100</span></p>
                <p className="text-xs text-gray-400 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
          <AuditCard result={result} />
        </div>
      )}
    </AppLayout>
  );
}
