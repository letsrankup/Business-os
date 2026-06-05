// FILE: components/LeadCard.tsx
// Yeh pura code components/LeadCard.tsx mein paste karo

"use client";

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

interface LeadCardProps {
  lead: Lead;
  onPropose: () => void;
  onAddToCRM: () => void;
  isGenerating: boolean;
}

export default function LeadCard({ lead, onPropose, onAddToCRM, isGenerating }: LeadCardProps) {
  const sc = lead.score ?? 0;
  const scoreColor =
    sc >= 85 ? "#00e5a0" :
    sc >= 70 ? "#fbbf24" :
    "#f87171";

  const initial = lead.name?.[0]?.toUpperCase() || "?";

  return (
    <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4 flex flex-col gap-3 hover:border-[#374151] transition-all">

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
            style={{ background: `linear-gradient(135deg, ${scoreColor}40, ${scoreColor}20)`, border: `1px solid ${scoreColor}60` }}>
            {initial}
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">{lead.name}</p>
            <p className="text-gray-400 text-xs">{lead.role}</p>
          </div>
        </div>
        {sc > 0 && (
          <div className="text-right shrink-0">
            <p className="text-xs text-gray-500">Score</p>
            <p className="text-sm font-bold" style={{ color: scoreColor }}>{sc}/100</p>
          </div>
        )}
      </div>

      {/* Company */}
      {lead.company && (
        <div>
          <p className="text-[#00e5a0] text-sm font-semibold">{lead.company}</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {lead.tags?.map((tag) => (
              <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-[#1f2937] text-gray-400 border border-[#374151]">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      {lead.description && (
        <p className="text-gray-400 text-xs leading-relaxed">{lead.description}</p>
      )}

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        {lead.location && (
          <p className="text-gray-500">📍 {lead.location}</p>
        )}
        {lead.companySize && (
          <p className="text-gray-500">👥 {lead.companySize}</p>
        )}
        {lead.revenue && (
          <p className="text-gray-500">💰 {lead.revenue}</p>
        )}
        {lead.phone && (
          <p className="text-gray-500">📞 {lead.phone}</p>
        )}
      </div>

      {/* Pain Points */}
      {lead.painPoints && lead.painPoints.length > 0 && (
        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Pain Points</p>
          <div className="flex flex-col gap-1">
            {lead.painPoints.slice(0, 2).map((p, i) => (
              <p key={i} className="text-xs text-orange-400">⚡ {p}</p>
            ))}
          </div>
        </div>
      )}

      {/* Buying Signals */}
      {lead.buyingSignals && lead.buyingSignals.length > 0 && (
        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Buying Signals</p>
          <div className="flex flex-col gap-1">
            {lead.buyingSignals.slice(0, 2).map((s, i) => (
              <p key={i} className="text-xs text-green-400">✅ {s}</p>
            ))}
          </div>
        </div>
      )}

      {/* Contact */}
      <div className="flex flex-col gap-1">
        {lead.email && (
          <a href={`mailto:${lead.email}`} className="text-xs text-gray-400 hover:text-white flex items-center gap-1 truncate">
            ✉️ {lead.email}
          </a>
        )}
        {lead.website && (
          <a href={lead.website} target="_blank" rel="noopener noreferrer"
            className="text-xs text-[#00e5a0] hover:underline flex items-center gap-1 truncate">
            🌐 {lead.website}
          </a>
        )}
        {lead.linkedIn && (
          <a href={lead.linkedIn} target="_blank" rel="noopener noreferrer"
            className="text-xs text-blue-400 hover:underline flex items-center gap-1 truncate">
            💼 LinkedIn Profile
          </a>
        )}
      </div>

      {/* Buttons */}
      <div className="flex gap-2 mt-1">
        <button
          onClick={onAddToCRM}
          className="flex-1 text-xs py-2 rounded-lg border border-[#374151] text-gray-300 hover:border-[#00e5a0] hover:text-[#00e5a0] transition-all font-medium"
        >
          + Add to CRM
        </button>
        <button
          onClick={onPropose}
          disabled={isGenerating}
          className="flex-1 text-xs py-2 rounded-lg border border-[#374151] text-gray-300 hover:border-yellow-400 hover:text-yellow-400 transition-all font-medium disabled:opacity-50"
        >
          {isGenerating ? "..." : "Propose"}
        </button>
      </div>
    </div>
  );
      }
