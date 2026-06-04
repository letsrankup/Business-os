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
  const [loadingLeadId, setLoadingLeadId] = useState<string | null>(null);
  const [selectedProposal, setSelectedProposal] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ─── Discover Leads ──────────────────────────────────────────
  const discover = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setLeads([]);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, industry }),
      });
      const data = await res.json();

      // API seedha array return karta hai
      if (Array.isArray(data)) {
        if (data.length === 0) {
          setError("No leads found. Try a different query.");
        } else {
          setLeads(data);
        }
      } else if (data.error) {
        setError(data.error);
      } else {
        setError("Unexpected response from server.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ─── AI Proposal Handler ─────────────────────────────────────
  const handlePropose = async (lead: any, index: number) => {
    const leadId = lead.id || String(index);
    setLoadingLeadId(leadId);
    try {
      const response = await fetch("/api/proposals/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadName: lead.name || "Prospect",
          leadEmail: lead.email || "",
          companyName: lead.company || "",
          description: lead.description || "",
          industry,
        }),
      });
      const result = await response.json();
      if (result.success) {
        setSelectedProposal(result.proposal);
        setIsModalOpen(true);
      } else {
        alert("AI Error: " + result.error);
      }
    } catch {
      alert("Failed to generate proposal.");
    } finally {
      setLoadingLeadId(null);
    }
  };

  return (
    <AppLayout title="Lead Discovery">
      <div className="space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-black">
            Lead <span className="text-[#00d9f5]">Discovery</span>
          </h1>
          <p className="text-gray-400 text-xs mt-1">
            AI finds your ideal prospects automatically
          </p>
        </div>

        {/* Search Box */}
        <div className="bg-[#12121a] border border-white/10 rounded-2xl p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-500 mb-1.5">
                Target Description
              </label>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && discover()}
                placeholder="e.g. B2B SaaS founders in US with 10-50 employees"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#00d9f5]/50 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">
                Industry
              </label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none transition-all"
              >
                {[
                  "SaaS","E-commerce","Healthcare","Finance",
                  "Education","Real Estate","Marketing",
                  "FinTech","LegalTech","HR / Recruitment",
                  "Cybersecurity","Logistics",
                ].map((i) => (
                  <option key={i}>{i}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={discover}
            disabled={loading || !query.trim()}
            className="w-full py-3 rounded-xl bg-[#00d9f5] text-black font-bold hover:bg-[#00d9f5]/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? "🔍 Discovering 50+ leads..." : "🎯 Discover Leads with AI"}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-red-400 text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="bg-[#12121a] border border-white/10 rounded-2xl p-10 text-center">
            <div className="text-4xl mb-3 animate-pulse">🎯</div>
            <p className="text-[#00d9f5] font-bold">
              Scanning global database...
            </p>
            <p className="text-gray-500 text-xs mt-1">
              Generating 50+ leads in parallel — takes ~30 seconds
            </p>
          </div>
        )}

        {/* Results */}
        {leads.length > 0 && (
          <div>
            <p className="text-sm text-gray-400 mb-4">
              Found{" "}
              <span className="text-[#00d9f5] font-bold">{leads.length}</span>{" "}
              leads
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {leads.map((lead, i) => (
                <LeadCard
                  key={lead.email || i}
                  lead={lead}
                  onPropose={() => handlePropose(lead, i)}
                  isGenerating={loadingLeadId === (lead.id || String(i))}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Proposal Modal */}
      {isModalOpen && selectedProposal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#0b0f19] border border-zinc-800 rounded-xl max-w-2xl w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
            >
              ✕
            </button>

            <div className="mb-4">
              <h3 className="text-xl font-semibold text-[#00d9f5]">
                AI Generated Proposal
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                To: {selectedProposal.lead_email || "No Email Found"}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-xs text-gray-500 mb-1">Subject</label>
              <input
                type="text"
                value={selectedProposal.subject}
                onChange={(e) =>
                  setSelectedProposal({ ...selectedProposal, subject: e.target.value })
                }
                className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-[#00d9f5]/50"
              />
            </div>

            <div className="mb-5">
              <label className="block text-xs text-gray-500 mb-1">
                Email Body
              </label>
              <textarea
                rows={8}
                value={selectedProposal.email_body}
                onChange={(e) =>
                  setSelectedProposal({ ...selectedProposal, email_body: e.target.value })
                }
                className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-[#00d9f5]/50 font-mono resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="bg-zinc-900 text-zinc-300 text-sm px-4 py-2 rounded-xl border border-white/10 hover:bg-zinc-800 transition-all"
              >
                Close
              </button>
              <button
                onClick={() => alert("Sending functionality coming next!")}
                className="bg-[#00d9f5] text-black font-bold text-sm px-5 py-2 rounded-xl hover:bg-[#00d9f5]/80 transition-all"
              >
                Send Proposal
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
        }
