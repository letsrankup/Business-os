"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const features = [
  { icon:"🔍", title:"SEO Audit",        desc:"AI deep analysis for any website in seconds",       href:"/audit",    color:"#00f5a0" },
  { icon:"✍️", title:"Content AI",        desc:"Blog, LinkedIn, emails, ads — all AI generated",    href:"/content",  color:"#00d9f5" },
  { icon:"🎯", title:"Lead Discovery",    desc:"Find ideal prospects automatically with AI",         href:"/leads",    color:"#f500f5" },
  { icon:"📄", title:"Proposal Generator",desc:"Professional proposals created in seconds",          href:"/proposal", color:"#f5a000" },
  { icon:"👥", title:"CRM",               desc:"Manage all clients and deals in one place",          href:"/crm",      color:"#00f5a0" },
  { icon:"⚡", title:"Dashboard",         desc:"Complete business intelligence at a glance",         href:"/dashboard",color:"#f5f500" },
];

const stats = [
  { value:"10x", label:"Faster Workflow" },
  { value:"6+",  label:"AI Tools in One" },
  { value:"100%",label:"AI Powered"      },
  { value:"24/7",label:"Always On"       },
];

const plans = [
  { name:"Free",   price:"$0",  color:"#fff",     highlight:false, features:["10 Audits/month","20 Content pieces","5 Proposals","Basic CRM"],           cta:"Get Started" },
  { name:"Pro",    price:"$29", color:"#00f5a0",  highlight:true,  features:["Unlimited Audits","Unlimited Content","Unlimited Proposals","Full CRM+Leads"], cta:"Start Pro"   },
  { name:"Agency", price:"$99", color:"#00d9f5",  highlight:false, features:["Everything in Pro","White-label","5 Team members","API access"],             cta:"Start Agency"},
];

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-mono overflow-x-hidden">

      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-[#0a0a0f]/90 backdrop-blur-md border-b border-white/5" : "bg-transparent"}`}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#00f5a0] to-[#00d9f5] flex items-center justify-center text-black font-black text-xs">AI</div>
            <span className="font-bold text-white">Business OS</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-400">
            {["features","stats","pricing"].map(s => (
              <a key={s} href={`#${s}`} className="hover:text-white transition-colors capitalize">{s}</a>
            ))}
          </div>
          <Link href="/dashboard" className="px-4 py-2 rounded-xl bg-[#00f5a0] text-black text-sm font-bold hover:bg-[#00f5a0]/80 transition-all">
            Open App →
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-16">
        {/* Glow blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#00f5a0]/5 blur-[120px]" />
          <div className="absolute bottom-1/3 left-1/4 w-[400px] h-[400px] rounded-full bg-[#00d9f5]/5 blur-[100px]" />
          <div className="absolute top-1/2 right-1/4 w-[300px] h-[300px] rounded-full bg-[#f500f5]/5 blur-[80px]" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center space-y-8 fade-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00f5a0]/10 border border-[#00f5a0]/20 text-[#00f5a0] text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-[#00f5a0] animate-pulse" />
            AI-Powered Business Platform
          </div>

          <h1 className="text-5xl md:text-7xl font-black leading-tight tracking-tight">
            Ek Platform.<br />
            <span className="bg-gradient-to-r from-[#00f5a0] via-[#00d9f5] to-[#f500f5] bg-clip-text text-transparent">
              Poora Business.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            SEO audit, content generation, lead discovery, proposals, CRM —
            sab kuch ek jagah. Alag tools ki zaroorat khatam.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/dashboard" className="px-8 py-4 rounded-2xl bg-[#00f5a0] text-black font-bold text-base hover:bg-[#00f5a0]/80 transition-all hover:-translate-y-0.5 shadow-lg shadow-[#00f5a0]/20">
              🚀 Dashboard Open Karo
            </Link>
            <a href="#features" className="px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-base hover:bg-white/10 transition-all">
              Features Dekho →
            </a>
          </div>
          <p className="text-xs text-gray-600">No credit card required · Free plan available</p>
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className="py-16 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-5">
          {stats.map((s, i) => (
            <div key={i} className="bg-[#12121a] border border-white/10 rounded-2xl p-6 text-center hover:border-[#00f5a0]/20 transition-all">
              <p className="text-4xl font-black text-[#00f5a0] mb-2">{s.value}</p>
              <p className="text-sm text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black mb-3">Sab Kuch <span className="gradient-text">Ek Jagah</span></h2>
            <p className="text-gray-400 max-w-xl mx-auto">6 powerful AI tools jo tumhara poora business handle karte hain</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <Link key={i} href={f.href}
                className="group bg-[#12121a] border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all hover:-translate-y-1">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4"
                  style={{ background: f.color+"14", border:`1px solid ${f.color}22` }}>
                  {f.icon}
                </div>
                <h3 className="text-base font-bold text-white mb-2 group-hover:text-[#00f5a0] transition-colors">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                <div className="mt-4 flex items-center gap-1 text-xs font-medium" style={{ color: f.color }}>
                  Open <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black mb-3">Simple <span className="bg-gradient-to-r from-[#f5a000] to-[#f500f5] bg-clip-text text-transparent">Pricing</span></h2>
            <p className="text-gray-400">Free se shuru karo, baad mein upgrade karo</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan, i) => (
              <div key={i} className={`relative rounded-2xl p-6 transition-all ${plan.highlight ? "bg-[#00f5a0]/5 border-2 border-[#00f5a0]/40 md:scale-105" : "bg-[#12121a] border border-white/10 hover:border-white/20"}`}>
                {plan.highlight && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#00f5a0] text-black text-xs font-black">POPULAR</div>}
                <p className="font-bold text-white mb-1">{plan.name}</p>
                <div className="flex items-end gap-1 mb-5">
                  <span className="text-4xl font-black" style={{ color: plan.color }}>{plan.price}</span>
                  <span className="text-gray-500 text-sm mb-1">/month</span>
                </div>
                <ul className="space-y-2.5 mb-7">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-gray-300">
                      <span style={{ color: plan.color }}>✓</span>{f}
                    </li>
                  ))}
                </ul>
                <Link href="/dashboard" className={`block w-full py-3 rounded-xl text-center text-sm font-bold transition-all ${plan.highlight ? "bg-[#00f5a0] text-black hover:bg-[#00f5a0]/80" : "bg-white/5 border border-white/10 text-white hover:bg-white/10"}`}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#00f5a0] to-[#00d9f5] flex items-center justify-center text-black font-black text-xs">AI</div>
          <span className="font-bold text-white text-sm">Business OS</span>
        </div>
        <p className="text-xs text-gray-600">© 2025 AI Business OS — Built with Next.js + OpenRouter</p>
      </footer>
    </div>
  );
}
