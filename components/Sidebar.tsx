"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { label: "Dashboard", href: "/dashboard", icon: "⚡" },
  { label: "SEO Audit",  href: "/audit",     icon: "🔍" },
  { label: "Content AI", href: "/content",   icon: "✍️" },
  { label: "Proposals",  href: "/proposal",  icon: "📄" },
  { label: "Leads",      href: "/leads",     icon: "🎯" },
  { label: "CRM",        href: "/crm",       icon: "👥" },
  { label: "Settings",   href: "/settings",  icon: "⚙️" },
];

export default function Sidebar({ open = true }: { open?: boolean }) {
  const path = usePathname();
  if (!open) return null;

  return (
    <aside className="w-60 bg-[#0d0d14] border-r border-white/5 flex flex-col flex-shrink-0 h-screen sticky top-0">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#00f5a0] to-[#00d9f5] flex items-center justify-center font-black text-black text-xs">
            AI
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-none">Business OS</p>
            <p className="text-[#00f5a0] text-[10px] mt-0.5">Powered by AI</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {nav.map((item) => {
          const active = path === item.href || path?.startsWith(item.href + "/");
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                active
                  ? "bg-[#00f5a0]/10 text-[#00f5a0] border border-[#00f5a0]/20"
                  : "text-gray-500 hover:text-white hover:bg-white/5 border border-transparent"
              }`}>
              <span className="text-base w-5 text-center">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
              {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#00f5a0]" />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom user */}
      <div className="p-3 border-t border-white/5">
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00f5a0] to-[#00d9f5] flex items-center justify-center font-bold text-black text-xs">
            U
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">User</p>
            <p className="text-[10px] text-gray-500">Free Plan</p>
          </div>
        </div>
      </div>
    </aside>
  );
                }
