"use client";
import { useState } from "react";

const tones = ["Professional","Casual","Humorous","Inspiring","Educational","Persuasive"];

export default function ContentForm({ contentType }: { contentType: string }) {
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("Professional");
  const [keywords, setKeywords] = useState("");
  const [audience, setAudience] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    if (!topic) return;
    setLoading(true); setError(""); setResult("");
    try {
      const res = await fetch("/api/content", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType, topic, tone, keywords: keywords.split(",").map(k => k.trim()).filter(Boolean), targetAudience: audience }),
      });
      const data = await res.json();
      if (data.error) setError(data.error); else setResult(data.content);
    } catch { setError("Generation failed. Try again."); }
    finally { setLoading(false); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className="bg-[#12121a] border border-white/10 rounded-2xl p-5 space-y-4">
        <h2 className="font-bold text-white text-sm">Settings</h2>
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">Topic *</label>
          <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Top 10 AI tools 2025"
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00d9f5]/50 transition-all" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">Tone</label>
          <div className="flex flex-wrap gap-2">
            {tones.map(t => (
              <button key={t} onClick={() => setTone(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${tone === t ? "bg-[#00d9f5]/20 border border-[#00d9f5]/40 text-[#00d9f5]" : "bg-white/5 border border-white/10 text-gray-400 hover:text-white"}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">Keywords (comma separated)</label>
          <input value={keywords} onChange={e => setKeywords(e.target.value)} placeholder="AI, automation, growth"
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00d9f5]/50 transition-all" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">Target Audience</label>
          <input value={audience} onChange={e => setAudience(e.target.value)} placeholder="e.g. Startup founders"
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00d9f5]/50 transition-all" />
        </div>
        <button onClick={generate} disabled={loading || !topic}
          className="w-full py-3 rounded-xl bg-[#00d9f5] text-black font-bold text-sm hover:bg-[#00d9f5]/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
          {loading ? "✨ Generating..." : "✨ Generate"}
        </button>
      </div>

      <div className="bg-[#12121a] border border-white/10 rounded-2xl p-5 flex flex-col min-h-[400px]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-white text-sm">Output</h2>
          {result && (
            <button onClick={() => { navigator.clipboard.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 transition-all">
              {copied ? "✓ Copied!" : "Copy"}
            </button>
          )}
        </div>
        {error && <p className="text-red-400 text-sm">⚠️ {error}</p>}
        {loading && <div className="flex-1 flex items-center justify-center"><div className="text-center"><div className="text-3xl mb-3 animate-bounce">✨</div><p className="text-[#00d9f5] text-sm">Writing...</p></div></div>}
        {result && !loading && <pre className="flex-1 text-sm text-gray-300 whitespace-pre-wrap leading-relaxed font-mono overflow-y-auto">{result}</pre>}
        {!result && !loading && !error && <div className="flex-1 flex items-center justify-center"><p className="text-gray-600 text-sm">Content will appear here...</p></div>}
      </div>
    </div>
  );
      }
