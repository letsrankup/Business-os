"use client";
import { useState } from "react";

export default function ProposalForm() {
  const [form, setForm] = useState({ clientName:"", clientBusiness:"", projectType:"Web Development", projectDescription:"", budget:"", timeline:"4 weeks", yourName:"", yourCompany:"" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const generate = async () => {
    if (!form.clientName || !form.projectDescription) return;
    setLoading(true); setError(""); setResult("");
    try {
      const res = await fetch("/api/proposal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (data.error) setError(data.error); else setResult(data.proposal);
    } catch { setError("Failed. Try again."); }
    finally { setLoading(false); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className="bg-[#12121a] border border-white/10 rounded-2xl p-5 space-y-4">
        <h2 className="font-bold text-white text-sm">Proposal Details</h2>
        {[["yourName","Your Name","John Doe"],["yourCompany","Your Company","Acme Agency"],["clientName","Client Name *","TechCorp Inc."],["clientBusiness","Client Business","SaaS startup"],["budget","Budget","$5,000"]].map(([k,l,p]) => (
          <div key={k}>
            <label className="block text-xs text-gray-500 mb-1.5">{l}</label>
            <input value={(form as any)[k]} onChange={e => set(k, e.target.value)} placeholder={p}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#f5a000]/50 transition-all" />
          </div>
        ))}
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">Project Type</label>
          <select value={form.projectType} onChange={e => set("projectType", e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#f5a000]/50 transition-all">
            {["Web Development","Mobile App","SEO & Marketing","SaaS","Design","Consulting"].map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">Timeline</label>
          <select value={form.timeline} onChange={e => set("timeline", e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none transition-all">
            {["1 week","2 weeks","1 month","2 months","3 months"].map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">Project Description *</label>
          <textarea value={form.projectDescription} onChange={e => set("projectDescription", e.target.value)} placeholder="Describe the project..." rows={3}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#f5a000]/50 transition-all resize-none" />
        </div>
        <button onClick={generate} disabled={loading || !form.clientName || !form.projectDescription}
          className="w-full py-3 rounded-xl bg-[#f5a000] text-black font-bold text-sm hover:bg-[#f5a000]/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
          {loading ? "📝 Generating..." : "📝 Generate Proposal"}
        </button>
      </div>

      <div className="bg-[#12121a] border border-white/10 rounded-2xl p-5 flex flex-col min-h-[500px]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-white text-sm">Proposal Output</h2>
          {result && <button onClick={() => { navigator.clipboard.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 transition-all">{copied ? "✓ Copied!" : "Copy"}</button>}
        </div>
        {error && <p className="text-red-400 text-sm">⚠️ {error}</p>}
        {loading && <div className="flex-1 flex items-center justify-center"><div className="text-center"><div className="text-3xl mb-3 animate-pulse">📄</div><p className="text-[#f5a000] text-sm">Crafting proposal...</p></div></div>}
        {result && !loading && <pre className="flex-1 text-sm text-gray-300 whitespace-pre-wrap leading-relaxed font-mono overflow-y-auto">{result}</pre>}
        {!result && !loading && !error && <div className="flex-1 flex items-center justify-center"><p className="text-gray-600 text-sm text-center">Fill details and generate</p></div>}
      </div>
    </div>
  );
          }
