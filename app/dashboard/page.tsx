"use client";
import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import DashboardCard from "@/components/DashboardCard";
import Link from "next/link";
import { supabase } from "@/lib/supabase"; // Aapki Supabase connection file[span_0](start_span)[span_0](end_span)

export default function DashboardPage() {
  // Stats ke liye state - shuruat har user ki 0 se hogi[span_1](start_span)[span_1](end_span)
  const [counts, setCounts] = useState({
    audits: 0,
    content: 0,
    leads: 0,
    proposals: 0,
    clients: 0,
    revenue: 0,
  });
  
  // Recent activity dynamic list ke liye state[span_2](start_span)[span_2](end_span)
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRealUserData() {
      try {
        // Strict safe check: Agar supabase null hai toh aage code mat chalao (TS is se satisfy ho jayega)
        if (!supabase) {
          console.warn("Supabase configuration is missing or client is null.");
          setLoading(false);
          return;
        }

        // 1. Logged-in user ki details nikalna (TypeScript Safe Checking)
        const { data: userData, error: authError } = await supabase.auth.getUser();
        
        if (authError || !userData?.user) {
          setLoading(false);
          return;
        }

        const user = userData.user;

        // 2. Alag alag tables se sirf is user ka real data count fetch karna[span_3](start_span)[span_3](end_span)
        const [auditsRes, contentRes, leadsRes, proposalsRes] = await Promise.all([
          supabase.from("seo_audits").select("*", { count: "exact", head: true }).eq("user_id", user.id),[span_4](start_span)[span_4](end_span)
          supabase.from("content").select("*", { count: "exact", head: true }).eq("user_id", user.id),[span_5](start_span)[span_5](end_span)
          supabase.from("leads").select("*", { count: "exact", head: true }).eq("user_id", user.id),[span_6](start_span)[span_6](end_span)
          supabase.from("proposals").select("*", { count: "exact", head: true }).eq("user_id", user.id),[span_7](start_span)[span_7](end_span)
        ]);

        setCounts({
          audits: auditsRes.count || 0,[span_8](start_span)[span_8](end_span)
          content: contentRes.count || 0,[span_9](start_span)[span_9](end_span)
          leads: leadsRes.count || 0,[span_10](start_span)[span_10](end_span)
          proposals: proposalsRes.count || 0,[span_11](start_span)[span_11](end_span)
          clients: 0, // Inka abhi database backend connect hona baqi hai toh 0 rahega[span_12](start_span)[span_12](end_span)
          revenue: 0, // Filhal default 0 se start hoga[span_13](start_span)[span_13](end_span)
        });

        // 3. Activity log ko real banana[span_14](start_span)[span_14](end_span)
        setRecentActivity([]); 

      } catch (error) {
        console.error("Error fetching dashboard counts:", error);[span_15](start_span)[span_15](end_span)
      } finally {
        setLoading(false);[span_16](start_span)[span_16](end_span)
      }
    }

    fetchRealUserData();[span_17](start_span)[span_17](end_span)
  }, []);

  // EXACT SAME DESIGN CODES AND PROPERTIES FROM YOUR FILE[span_18](start_span)[span_18](end_span)
  const stats = [
    { title: "SEO Audits Run",     value: loading ? "..." : String(counts.audits),    icon: "🔍", change: "+12%", color: "#00f5a0" },[span_19](start_span)[span_19](end_span)
    { title: "Content Generated",  value: loading ? "..." : String(counts.content),   icon: "✍️", change: "+34%", color: "#00d9f5" },[span_20](start_span)[span_20](end_span)
    { title: "Leads Discovered",   value: loading ? "..." : String(counts.leads),     icon: "🎯", change: "+8%",  color: "#f500f5" },[span_21](start_span)[span_21](end_span)
    { title: "Proposals Sent",     value: loading ? "..." : String(counts.proposals), icon: "📄", change: "+5%",  color: "#f5a000" },[span_22](start_span)[span_22](end_span)
    { title: "Active Clients",     value: String(counts.clients),                     icon: "👥", change: "+2%",  color: "#00f5a0" },[span_23](start_span)[span_23](end_span)
    { title: "Est. Revenue",       value: `$${counts.revenue}`,                       icon: "💰", change: "+21%", color: "#f5f500" },[span_24](start_span)[span_24](end_span)
  ];

  const quickActions = [
    { label: "Run SEO Audit",    href: "/audit",    icon: "🔍" },[span_25](start_span)[span_25](end_span)
    { label: "Generate Content", href: "/content",  icon: "✍️" },[span_26](start_span)[span_26](end_span)
    { label: "Find Leads",       href: "/leads",    icon: "🎯" },[span_27](start_span)[span_27](end_span)
    { label: "Create Proposal",  href: "/proposal", icon: "📄" },[span_28](start_span)[span_28](end_span)
    { label: "Manage CRM",       href: "/crm",      icon: "👥" },[span_29](start_span)[span_29](end_span)
  ];

  return (
    <AppLayout title="Dashboard">
      {/* Header layout unchanged */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">AI Business <span className="text-[#00f5a0]">OS</span></h1>[span_30](start_span)[span_30](end_span)
          <p className="text-gray-400 text-xs mt-1">Your complete business intelligence dashboard</p>[span_31](start_span)[span_31](end_span)
        </div>
        <Link href="/audit" className="px-4 py-2 rounded-xl bg-[#00f5a0] text-black text-sm font-bold hover:bg-[#00f5a0]/80 transition-all">[span_32](start_span)[span_32](end_span)
          + New Audit
        </Link>
      </div>

      {/* Grid design unchanged */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {stats.map((s, i) => <DashboardCard key={i} {...s} />)}[span_33](start_span)[span_33](end_span)
      </div>

      {/* Activities & Quick Actions Design Unchanged */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-6">
        <div className="lg:col-span-2 bg-[#12121a] border border-white/10 rounded-2xl p-5">[span_34](start_span)[span_34](end_span)
          <h2 className="font-bold text-white mb-4 text-sm">Recent Activity</h2>[span_35](start_span)[span_35](end_span)
          <div className="space-y-1">[span_36](start_span)[span_36](end_span)
            {recentActivity.length > 0 ? ([span_37](start_span)[span_37](end_span)
              recentActivity.map((item, i) => ([span_38](start_span)[span_38](end_span)
                <div key={i} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">[span_39](start_span)[span_39](end_span)
                  <div className="flex items-center gap-3">[span_40](start_span)[span_40](end_span)
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-[#00f5a0] border border-[#00f5a0]/20">{item.type}</span>[span_41](start_span)[span_41](end_span)
                    <div>
                      <p className="text-sm text-white">{item.action}</p>[span_42](start_span)[span_42](end_span)
                      <p className="text-xs text-gray-500">{item.target}</p>[span_43](start_span)[span_43](end_span)
                    </div>
                  </div>
                  <span className="text-xs text-gray-600">{item.time}</span>[span_44](start_span)[span_44](end_span)
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-500 py-6 text-center">No recent activity found. Run some tools to see logs!</p>[span_45](start_span)[span_45](end_span)
            )}
          </div>
        </div>

        <div className="bg-[#12121a] border border-white/10 rounded-2xl p-5">[span_46](start_span)[span_46](end_span)
          <h2 className="font-bold text-white mb-4 text-sm">Quick Actions</h2>[span_47](start_span)[span_47](end_span)
          <div className="space-y-2">[span_48](start_span)[span_48](end_span)
            {quickActions.map((a, i) => ([span_49](start_span)[span_49](end_span)
              <Link key={i} href={a.href}[span_50](start_span)[span_50](end_span)
                className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-[#00f5a0]/10 hover:border-[#00f5a0]/30 border border-transparent transition-all group">[span_51](start_span)[span_51](end_span)
                <span>{a.icon}</span>[span_52](start_span)[span_52](end_span)
                <span className="text-sm text-gray-300 group-hover:text-[#00f5a0] transition-colors">{a.label}</span>[span_53](start_span)[span_53](end_span)
                <span className="ml-auto text-gray-600 group-hover:text-[#00f5a0]">→</span>[span_54](start_span)[span_54](end_span)
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
      }
          
