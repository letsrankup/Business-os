// FILE: app/leads/page.tsx
// Yeh pura code app/leads/page.tsx mein paste karo

"use client";

import { useState } from "react";
import LeadCard from "@/components/LeadCard";

const INDUSTRIES = [
  "SaaS", "Technology", "E-commerce", "Healthcare", "Finance",
  "Marketing", "Real Estate", "Education", "Logistics", "Legal",
];

interface Lead {
  id: string;
  name: string;
  role?: string;
  company?: string;
  email?: string;
  website?: string;
  industry?: string;
  description?: string;
  score?: number;
  tags?: string[];
  phone?: string;
  location?: string;
  companySize?: string;
  revenue?: string;
  linkedIn?: string;
  painPoints?: string[];
  buyingSignals?: string[];
}

export default function LeadsPage() {
  const [query, setQuery] = useState("");
  const [industry, setIndustry] = useState("SaaS");
  const [count, setCount] = useState(6);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const discoverLeads = async () => {
    if (!query.trim()) {
      setError("Please enter a target description");
      return;
    }
    setLoading(true);
    setError("");
    setLeads([]);

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, industry, count }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Server error: ${res.status}`);
      }

      if (!Array.isArray(data)) {
        throw new Error("Invalid response format from server");
      }

      setLeads(data);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePropose = async (lead: Lead) => {
    setGeneratingId(lead.id);
    // Navigate to proposals with pre-filled data
    const params = new URLSearchParams({
      clientName: lead.name,
      clientEmail: lead.email || "",
      clientCompany: lead.company || "",
      industry: lead.industry || industry,
    });
    window.location.href = `/proposal?${params.toString()}`;
  };

  const handleAddToCRM = async (lead: Lead) => {
    try {
      const res = await fetch("/api/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: lead.name,
          email: lead.email,
          company: lead.company,
          phone: lead.phone,
          website: lead.website,
          industry: lead.industry,
          notes: lead.description,
          score: lead.score,
        }),
      });
      if (res.ok) {
        alert(`✅ ${lead.name} added to CRM!`);
      }
    } catch {
      alert("Could not add to CRM");
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">
          Lead <span className="text-[#00e5a0]">Discovery</span>
        </h1>
        <p className="text-gray-400 text-sm mt-1">AI finds your ideal prospects automatically</p>
      </div>

      {/* Search Form */}
      <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          {/* Target Description */}
          <div className="md:col-span-2">
            <label className="text-xs text-gray-500 mb-1 block">Target Description *</label>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && discoverLeads()}
              placeholder="e.g. SaaS founders who need SEO tools"
              className="w-full bg-[#1f2937] border border-[#374151] rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-[#00e5a0] transition-colors"
            />
          </div>

          {/* Industry */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Industry</label>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full bg-[#1f2937] border border-[#374151] rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-[#00e5a0] transition-colors"
            >
              {INDUSTRIES.map((ind) => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Count selector */}
        <div className="flex items-center gap-3 mb-3">
          <label className="text-xs text-gray-500">Leads to generate:</label>
          {[3, 6, 9, 12].map((n) => (
            <button
              key={n}
              onClick={() => setCount(n)}
              className={`text-xs px-3 py-1 rounded-full border transition-all ${
                count === n
                  ? "bg-[#00e5a020] border-[#00e5a060] text-[#00e5a0]"
                  : "border-[#374151] text-gray-400 hover:border-[#374151]"
              }`}
            >
              {n}
            </button>
          ))}
        </div>

        {/* Button */}
        <button
          onClick={discoverLeads}
          disabled={loading}
          className="w-full py-3 rounded-xl font-bold text-sm transition-all"
          style={{
            background: loading ? "#1f2937" : "linear-gradient(135deg, #00e5a0, #0ea5e9)",
            color: loading ? "#6b7280" : "#080c10",
          }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="inline-block w-4 h-4 border-2 border-gray-600 border-t-gray-300 rounded-full animate-spin" />
              Discovering leads with AI...
            </span>
          ) : (
            "🎯 Discover Leads with AI"
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-950 border border-red-800 rounded-xl p-4 mb-4 flex items-start gap-3">
          <span className="text-lg">⚠️</span>
          <div>
            <p className="text-red-400 text-sm font-semibold">Error</p>
            <p className="text-red-300 text-xs mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Results */}
      {leads.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-400 text-sm">
              Found <span className="text-white font-bold">{leads.length}</span> leads
              {query && <span className="text-gray-500"> for "{query}"</span>}
            </p>
            <button
              onClick={discoverLeads}
              className="text-xs text-[#00e5a0] border border-[#00e5a030] px-3 py-1 rounded-full hover:bg-[#00e5a010] transition-all"
            >
              🔄 Refresh
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {leads.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                onPropose={() => handlePropose(lead)}
                onAddToCRM={() => handleAddToCRM(lead)}
                isGenerating={generatingId === lead.id}
              />
            ))}
          </div>
        </>
      )}

      {/* Empty state */}
      {!loading && leads.length === 0 && !error && (
        <div className="text-center py-16 text-gray-500">
          <p className="text-4xl mb-4">🎯</p>
          <p className="text-sm">Enter your target and click Discover to find real leads</p>
        </div>
      )}
    </div>
  );
}
