"use client";
import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import LeadCard from "@/components/LeadCard";

export default function LeadsPage() {
  const [query, setQuery] = useState("");
  const [industry, setIndustry] = useState("SaaS");
  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState<any[]>([]);
  const [error, setError] = useState("");
  
  // Automation & Modal States
  const [loadingLeadId, setLoadingLeadId] = useState<string | null>(null);
  const [selectedProposal, setSelectedProposal] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Discover Leads Function
  const discover = async () => {
    if (!query) return;
    setLoading(true); setError(""); setLeads([]);
    try {
      const res = await fetch("/api/leads", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ query, industry }) });
      const data = await res.json();
      if (data.error) setError(data.error); else setLeads(data.leads || []);
    } catch { setError("Failed. Try again."); }
    finally { setLoading(false); }
  };

  // AI Proposal Handler Function
  const handlePropose = async (lead: any, index: number) => {
    const leadId = lead.id || String(index);
    setLoadingLeadId(leadId);
    try {
      const response = await fetch('/api/proposals/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadName: lead.name || lead.lead_name || lead.leadName || "Prospect", 
          leadEmail: lead.email || lead.leadEmail || "",
          companyName: lead.company || lead.company_name || lead.companyName || "",
          description: lead.description || "",
          industry: industry,
          userId: "YOUR_LOGGED_IN_USER_ID" // Isay baad mein session user id se replace kar dena
        }),
      });

      const result = await response.json();
      if (result.success) {
        setSelectedProposal(result.proposal);
        setIsModalOpen(true);
      } else {
        alert("AI Error: " + result.error);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingLeadId(null);
    }
  };

  return (
    <AppLayout title="Lead Discovery">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black">Lead <span className="text-[#00d9f5]">Discovery</span></h1>
          <p className="text-gray-400 text-xs mt-1">AI finds your ideal prospects automatically</p>
        </div>

        <div className="bg-[#12121a] border border-white/10 rounded-2xl p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-500 mb-1.5">Target Description</label>
              <input value={query} onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && discover()}
                placeholder="e.g. B2B SaaS founders in US with 10-50 employees"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#00d9f5]/50 transition-all" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Industry</label>
              <select value={industry} onChange={e => setIndustry(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none transition-all">
                {["SaaS","E-commerce","Healthcare","Finance","Education","Real Estate","Marketing"].map(i => <option key={i}>{i}</option>)}
              </select>
            </div>
          </div>
          <button onClick={discover} disabled={loading || !query}
            className="w-full py-3 rounded-xl bg-[#00d9f5] text-black font-bold hover:bg-[#00d9f5]/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
            {loading ? "🔍 Discovering..." : "🎯 Discover Leads with AI"}
          </button>
        </div>

        {error && <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-red-400 text-sm">⚠️ {error}</div>}

        {loading && (
          <div className="bg-[#12121a] border border-white/10 rounded-2xl p-10 text-center">
            <div className="text-4xl mb-3 animate-pulse">🎯</div>
            <p className="text-[#00d9f5] font-bold">Finding leads...</p>
          </div>
        )}

        {leads.length > 0 && (
          <div>
            <p className="text-sm text-gray-400 mb-4">Found <span className="text-[#00d9f5] font-bold">{leads.length}</span> leads</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {leads.map((lead, i) => (
                <LeadCard 
                  key={i} 
                  lead={lead} 
                  onPropose={() => handlePropose(lead, i)}
                  isGenerating={loadingLeadId === (lead.id || String(i))}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* AI Proposal Modal Popup */}
      {isModalOpen && selectedProposal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#0b0f19] border border-zinc-800 rounded-xl max-w-2xl w-full p-6 shadow-2xl relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors">✕</button>
            
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-[#00d9f5]">AI Generated Proposal</h3>
              <p className="text-xs text-zinc-400 mt-1">To: {selectedProposal.lead_email || 'No Email Found'}</p>
            </div>

            <div className="mb-4">
              <label className="block text-xs text-gray-500 mb-1">Subject</label>
              <input type="text" value={selectedProposal.subject} onChange={(e) => setSelectedProposal({...selectedProposal, subject: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-[#00d9f5]/50" />
            </div>

            <div className="mb-5">
              <label className="block text-xs text-gray-500 mb-1">Email Body</label>
              <textarea rows={8} value={selectedProposal.email_body} onChange={(e) => setSelectedProposal({...selectedProposal, email_body: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-[#00d9f5]/50 font-mono resize-none" />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setIsModalOpen(false)} className="bg-zinc-900 text-zinc-300 text-sm px-4 py-2 rounded-xl border border-white/10 hover:bg-zinc-800 transition-all">Close</button>
              <button onClick={() => alert('Sending functionality coming next!')} className="bg-[#00d9f5] text-black font-bold text-sm px-5 py-2 rounded-xl hover:bg-[#00d9f5]/80 transition-all">Send Proposal</button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
