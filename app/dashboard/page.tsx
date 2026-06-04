"use client";
import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import DashboardCard from "@/components/DashboardCard";
import Link from "next/link";
import { supabase } from "@/lib/supabase"; // Aapki Supabase connection file

export default function DashboardPage() {
  // Stats ke liye state - shuruat har user ki 0 se hogi
  const [counts, setCounts] = useState({
    audits: 0,
    content: 0,
    leads: 0,
    proposals: 0,
    clients: 0,
    revenue: 0,
  });
  
  // Recent activity dynamic list ke liye state
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRealUserData() {
      try {
        // Strict safe verification: Agar supabase variable null ho toh aage run na ho aur build crash na kare
        if (!supabase) {
          console.warn("Supabase configuration is missing or client is null.");
          setLoading(false);
          return;
        }

        // 1. Logged-in user ki details nikalna
        const { data: userData, error: authError } = await supabase.auth.getUser();
        
        if (authError || !userData?.user) {
          setLoading(false);
          return;
        }

        const user = userData.user;

        // 2. Alag alag tables se sirf is user ka real data count fetch karna
        const [auditsRes, contentRes, leadsRes, proposalsRes] = await Promise.all([
          supabase.from("seo_audits").select("*", { count: "exact", head: true }).eq("user_id", user.id),
          supabase.from("content").select("*", { count: "exact", head: true }).eq("user_id", user.id),
          supabase.from("leads").select("*", { count: "exact", head: true }).eq("user_id", user.id),
          supabase.from("proposals").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        ]);

        setCounts({
          audits: auditsRes.count || 0,
          content: contentRes.count || 0,
          leads: leadsRes.count || 0,
          proposals: proposalsRes.count || 0,
          clients: 0, // Inka abhi database backend connect hona baqi hai toh 0 rahega
          revenue: 0, // Filhal default 0 se start hoga
        });

        // 3. Activity log ko real banana (Agar tables se real activity chahiye ho baad mein)
        setRecentActivity([]); 

      } catch (error) {
        console.error("Error fetching dashboard counts:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchRealUserData();
  }, []);

  // EXACT SAME DESIGN CODES AND PROPERTIES FROM YOUR FILE
  const stats = [
    { title: "SEO Audits Run",     value: loading ? "..." : String(counts.audits),    icon: "🔍", change: "+12%", color: "#00f5a0" },
    { title: "Content Generated",  value: loading ? "..." : String(counts.content),   icon: "✍️", change: "+34%", color: "#00d9f5" },
    { title: "Leads Discovered",   value: loading ? "..." : String(counts.leads),     icon: "🎯", change: "+8%",  color: "#f500f5" },
    { title: "Proposals Sent",     value: loading ? "..." : String(counts.proposals), icon: "📄", change: "+5%",  color: "#f5a000" },
    { title: "Active Clients",     value: String(counts.clients),                     icon: "👥", change: "+2%",  color: "#00f5a0" },
    { title: "Est. Revenue",       value: `$${counts.revenue}`,                       icon: "💰", change: "+21%", color: "#f5f500" },
  ];

  const quickActions = [
    { label: "Run SEO Audit",    href: "/audit",    icon: "🔍" },
    { label: "Generate Content", href: "/content",  icon: "✍️" },
    { label: "Find Leads",       href: "/leads",    icon: "🎯" },
    { label: "Create Proposal",  href: "/proposal", icon: "📄" },
    { label: "Manage CRM",       href: "/crm",      icon: "👥" },
  ];

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
        {stats.map((s, i) => <DashboardCard key="{i}" {...s}/>)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-[#12121a] border border-white/10 rounded-2xl p-5">
          <h2 className="font-bold text-white mb-4 text-sm">Recent Activity</h2>
          <div className="space-y-1">
            {recentActivity.length > 0 ? (
              recentActivity.map((item, i) => (
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
              ))
            ) : (
              <p className="text-xs text-gray-500 py-6 text-center">No recent activity found. Run some tools to see logs!</p>
            )}
          </div>
        </div>

        <div className="bg-[#12121a] border border-white/10 rounded-2xl p-5">
          <h2 className="font-bold text-white mb-4 text-sm">Quick Actions</h2>
          <div className="space-y-2">
            {quickActions.map((a, i) => (
              <Link key="{i}" href="{a.href}" className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-[#00f5a0]/10 hover:border-[#00f5a0]/30 border border-transparent transition-all group">
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
                        
