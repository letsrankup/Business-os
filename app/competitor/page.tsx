"use client";

import { useState } from "react";

export default function CompetitorPage() {
  const [yourWebsite, setYourWebsite] = useState("");
  const [competitorWebsite, setCompetitorWebsite] = useState("");
  const [industry, setIndustry] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const handleAnalysis = async () => {
    if (!competitorWebsite) {
      setError("Competitor Website ka URL dalna lazmi hai!");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/competitor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: yourWebsite,
          competitorUrl: competitorWebsite,
          industry: industry,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Analysis fail hua. Debara try karo.");
      }

      setResult(data);
    } catch (err: any) {
      console.error("Frontend Fetch Error:", err);
      setError(err.message || "Server se rabta nahi ho pa raha. Debara koshish karein.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1d] text-white p-6 font-mono">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center space-x-2 text-xl font-bold border-b border-gray-800 pb-4">
          <span className="text-green-400">🕵️‍♂️ Competitor</span>
          <span className="text-gray-400">Intelligence</span>
        </div>

        {/* Form Inputs */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 uppercase mb-1">Your Website (Optional)</label>
            <input
              type="text"
              placeholder="https://yourwebsite.com"
              value={yourWebsite}
              onChange={(e) => setYourWebsite(e.target.value)}
              className="w-full bg-[#111827] border border-gray-800 rounded p-3 text-sm focus:outline-none focus:border-green-500"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 uppercase mb-1">Competitor Website *</label>
            <input
              type="text"
              placeholder="https://competitor.com"
              value={competitorWebsite}
              onChange={(e) => setCompetitorWebsite(e.target.value)}
              className="w-full bg-[#111827] border border-gray-800 rounded p-3 text-sm focus:outline-none focus:border-green-500"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 uppercase mb-1">Industry (Optional)</label>
            <input
              type="text"
              placeholder="SaaS, E-commerce, FinTech..."
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full bg-[#111827] border border-gray-800 rounded p-3 text-sm focus:outline-none focus:border-green-500"
            />
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-950/50 border border-red-800 text-red-400 text-xs p-3 rounded flex items-center space-x-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleAnalysis}
          disabled={loading}
          className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-800 disabled:cursor-not-allowed text-black font-bold p-3 rounded transition text-sm"
        >
          {loading ? "Analyzing Live Data..." : "🏃‍♂️ Run Live Analysis →"}
        </button>

        {/* Results View */}
        {result && (
          <div className="bg-[#111827] border border-gray-800 rounded p-4 space-y-4 text-sm">
            <h3 className="text-green-400 font-bold border-b border-gray-800 pb-2">Analysis Results:</h3>
            
            {result.meta && (
              <div>
                <p className="text-gray-400 font-semibold">Meta Details:</p>
                <p className="text-xs text-gray-300">Title: {result.meta.title || "N/A"}</p>
                <p className="text-xs text-gray-300">Description: {result.meta.description || "N/A"}</p>
              </div>
            )}

            <div>
              <p className="text-gray-400 font-semibold">Detected Tech Stack:</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {result.techStack.length > 0 ? (
                  result.techStack.map((tech: string, i: number) => (
                    <span key={i} className="bg-gray-800 text-xs px-2 py-1 rounded text-gray-300">{tech}</span>
                  ))
                ) : (
                  <span className="text-xs text-gray-500">No major tech signatures found via HTML.</span>
                )}
              </div>
            </div>

            {result.pageSpeed && (
              <div>
                <p className="text-gray-400 font-semibold">PageSpeed Scores:</p>
                <p className="text-xs text-gray-300">Desktop Perf: {result.pageSpeed.desk_perf || "N/A"}%</p>
                <p className="text-xs text-gray-300">Mobile Perf: {result.pageSpeed.mob_perf || "N/A"}%</p>
                <p className="text-xs text-gray-300">LCP: {result.pageSpeed.lcp || "N/A"}</p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
            }
