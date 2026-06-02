interface Lead {
  name: string; company: string; role: string;
  email?: string; website?: string; score?: number;
  industry?: string; description?: string;
}

// Props ki type define kar di taake TypeScript gussa na kare
interface LeadCardProps {
  lead: Lead;
  onPropose: () => void;
  isGenerating: boolean;
}

export default function LeadCard({ lead, onPropose, isGenerating }: LeadCardProps) {
  const sc = lead.score || 0;
  const scColor = sc >= 85 ? "#00f5a0" : sc >= 70 ? "#f5a000" : "#f55";
  return (
    <div className="bg-[#12121a] border border-white/10 rounded-2xl p-5 hover:border-[#00d9f5]/30 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00d9f5]/20 to-[#f500f5]/20 flex items-center justify-center font-bold text-white text-sm border border-white/10">
            {lead.name?.[0] || "?"}
          </div>
          <div>
            <p className="text-sm font-bold text-white">{lead.name}</p>
            <p className="text-xs text-gray-500">{lead.role}</p>
          </div>
        </div>
        {lead.score !== undefined && (
          <div className="text-right">
            <p className="text-xs text-gray-600">Score</p>
            <p className="text-sm font-bold" style={{ color: scColor }}>{lead.score}/100</p>
          </div>
        )}
      </div>
      <p className="text-sm text-[#00d9f5] font-medium mb-2">{lead.company}</p>
      {lead.industry && (
        <span className="text-xs px-2 py-1 rounded-full bg-[#00d9f5]/10 border border-[#00d9f5]/20 text-[#00d9f5]">{lead.industry}</span>
      )}
      {lead.description && <p className="text-xs text-gray-500 mt-3 leading-relaxed">{lead.description}</p>}
      <div className="mt-3 space-y-1">
        {lead.email && <p className="text-xs text-gray-400">📧 {lead.email}</p>}
        {lead.website && <a href={lead.website} target="_blank" rel="noreferrer" className="text-xs text-[#00d9f5] hover:underline">🌐 {lead.website}</a>}
      </div>
      <div className="mt-4 flex gap-2">
        <button className="flex-1 text-xs py-2 rounded-xl bg-[#00d9f5]/10 border border-[#00d9f5]/20 text-[#00d9f5] hover:bg-[#00d9f5]/20 transition-all">Add to CRM</button>
        
        {/* Propose Button ko completely wire up kar diya hai */}
        <button 
          onClick={onPropose}
          disabled={isGenerating}
          className="flex-1 text-xs py-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isGenerating ? "⏳ Generating..." : "Propose"}
        </button>
      </div>
    </div>
  );
                             }
        
