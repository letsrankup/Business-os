"use client";

import { useState } from "react";
import CompetitorResult from "./CompetitorResult";

export default function CompetitorForm() {
  const [website, setWebsite] = useState("");
  const [competitor, setCompetitor] = useState("");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/competitor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          website,
          competitor,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error(error);
      alert("Request Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-gray-700 p-5">

      <div className="mb-4">
        <label className="block mb-2">
          Your Website
        </label>

        <input
          type="text"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder="https://yourwebsite.com"
          className="w-full p-3 rounded border"
        />
      </div>

      <div className="mb-4">
        <label className="block mb-2">
          Competitor Website
        </label>

        <input
          type="text"
          value={competitor}
          onChange={(e) => setCompetitor(e.target.value)}
          placeholder="https://competitor.com"
          className="w-full p-3 rounded border"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="px-6 py-3 rounded bg-green-600 text-white"
      >
        {loading ? "Analyzing..." : "Analyze Competitor"}
      </button>

      {result && (
        <CompetitorResult
          result={result}
        />
      )}

    </div>
  );
}
