"use client";
import AppLayout from "@/components/AppLayout";
import DashboardCard from "@/components/DashboardCard";
import Link from "next/link";

const stats = [
  { title:"SEO Audits Run",     value:"24",    icon:"🔍", change:"+12%", color:"#00f5a0" },
  { title:"Content Generated",  value:"138",   icon:"✍️", change:"+34%", color:"#00d9f5" },
  { title:"Leads Discovered",   value:"87",    icon:"🎯", change:"+8%",  color:"#f500f5" },
  { title:"Proposals Sent",     value:"19",    icon:"📄", change:"+5%",  color:"#f5a000" },
  { title:"Active Clients",     value:"12",    icon:"👥", change:"+2%",  color:"#00f5a0" },
  { title:"Est. Revenue",       value:"$4,200",icon:"💰", change:"+21%", color:"#f5f500" },
];

const activity = [
  { action:"SEO Audit completed",  target:"mystore.com",          time:"2 min ago",  type:"audit"   },
  { action:"Blog article generated",target:"Top 10 AI Tools 2025",time:"15 min ago", type:"content" },
  { action:"New lead added",        target:"TechCorp Inc.",         time:"1 hr ago",   type:"lead"    },
  { action:"Proposal sent",         target:"Startup XYZ",           time:"3 hr ago",   type:"proposal"},
];

const quickActions = [
  { label:"Run SEO Audit",    href:"/audit",    icon:"🔍" },
  { label:"Generate Content", href:"/content",  icon:"✍️" },
  { label:"Find Leads",       href:"/leads",    icon:"🎯" },
  { label:"Create Proposal",  href:"/proposal", icon:"📄" },
  { label:"Manage CRM",       href:"/crm",      icon:"👥" },
];

export default function DashboardPage() {
  return (
    <AppLayout title="Dashboard">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">AI Business <span className="text-[#00f5a0]">OS</span></h1>
          <p className="text-gray-400 text-xs mt-1">Your complete business intelligence dashboard</p>
        </div>
        <Link href="/audit" className="px-4 py-2 rounded-xl bg-[#00f5a0] text-black text-sm font-bold hover:bg-[#00f5a0]/80 transition-all">
          + New Audit
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((s, i) => <DashboardCard key={i} {...s} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-[#12121a] border border-white/10 rounded-2xl p-5">
          <h2 className="font-bold text-white mb-4 text-sm">Recent Activity</h2>
          <div className="space-y-1">
            {activity.map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-[#00f5a0] border border-[#00f5a0]/20">{item.type}</span>
                  <div>
                    <p className="text-sm text-white">{item.action}</p>
                    <p className="text-xs text-gray-500">{item.target}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-600">{item.time}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#12121a] border border-white/10 rounded-2xl p-5">
          <h2 className="font-bold text-white mb-4 text-sm">Quick Actions</h2>
          <div className="space-y-2">
            {quickActions.map((a, i) => (
              <Link key={i} href={a.href}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-[#00f5a0]/10 hover:border-[#00f5a0]/30 border border-transparent transition-all group">
                <span>{a.icon}</span>
                <span className="text-sm text-gray-300 group-hover:text-[#00f5a0] transition-colors">{a.label}</span>
                <span className="ml-auto text-gray-600 group-hover:text-[#00f5a0]">→</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
