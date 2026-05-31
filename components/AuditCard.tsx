interface AuditResult {
  issues?: string[]; recommendations?: string[]; keywords?: string[]; summary?: string;
}
export default function AuditCard({ result }: { result: AuditResult }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className="bg-[#12121a] border border-red-500/20 rounded-2xl p-5">
        <h3 className="font-bold text-red-400 mb-3 text-sm">⚠️ Issues Found</h3>
        <ul className="space-y-2">
          {(result.issues || []).map((issue, i) => (
            <li key={i} className="flex gap-2 text-sm text-gray-300">
              <span className="text-red-400 flex-shrink-0">•</span>{issue}
            </li>
          ))}
        </ul>
      </div>
      <div className="bg-[#12121a] border border-[#00f5a0]/20 rounded-2xl p-5">
        <h3 className="font-bold text-[#00f5a0] mb-3 text-sm">✅ Recommendations</h3>
        <ul className="space-y-2">
          {(result.recommendations || []).map((r, i) => (
            <li key={i} className="flex gap-2 text-sm text-gray-300">
              <span className="text-[#00f5a0] flex-shrink-0">✓</span>{r}
            </li>
          ))}
        </ul>
      </div>
      {result.keywords && result.keywords.length > 0 && (
        <div className="bg-[#12121a] border border-[#00d9f5]/20 rounded-2xl p-5">
          <h3 className="font-bold text-[#00d9f5] mb-3 text-sm">🔑 Keywords</h3>
          <div className="flex flex-wrap gap-2">
            {result.keywords.map((kw, i) => (
              <span key={i} className="text-xs px-3 py-1 rounded-full bg-[#00d9f5]/10 border border-[#00d9f5]/20 text-[#00d9f5]">{kw}</span>
            ))}
          </div>
        </div>
      )}
      {result.summary && (
        <div className="bg-[#12121a] border border-white/10 rounded-2xl p-5">
          <h3 className="font-bold text-white mb-3 text-sm">📋 AI Summary</h3>
          <p className="text-sm text-gray-300 leading-relaxed">{result.summary}</p>
        </div>
      )}
    </div>
  );
            }
