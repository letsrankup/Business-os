"use client";
interface Props { onMenuClick?: () => void; title?: string; }

export default function Navbar({ onMenuClick, title }: Props) {
  return (
    <header className="h-14 bg-[#0a0a0f]/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-5 flex-shrink-0 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="text-gray-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        {title && <h2 className="text-sm font-bold text-gray-300">{title}</h2>}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#00f5a0]/10 border border-[#00f5a0]/20">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00f5a0] animate-pulse" />
          <span className="text-[11px] text-[#00f5a0] font-medium">AI Active</span>
        </div>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00f5a0] to-[#00d9f5] flex items-center justify-center font-bold text-black text-xs cursor-pointer">
          U
        </div>
      </div>
    </header>
  );
}
