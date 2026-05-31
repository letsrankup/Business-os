"use client";
import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import ContentForm from "@/components/ContentForm";

const types = [
  { id:"blog",    label:"Blog Article",      icon:"📝", desc:"SEO article" },
  { id:"linkedin",label:"LinkedIn Post",     icon:"💼", desc:"Viral post"  },
  { id:"email",   label:"Email Campaign",    icon:"📧", desc:"High-convert"},
  { id:"ad",      label:"Ad Copy",           icon:"📣", desc:"FB/Google"   },
  { id:"product", label:"Product Desc",      icon:"🛍️", desc:"Conversion"  },
  { id:"social",  label:"Social Media",      icon:"📱", desc:"IG/Twitter"  },
];

export default function ContentPage() {
  const [selected, setSelected] = useState("blog");
  return (
    <AppLayout title="Content AI">
      <div>
        <h1 className="text-2xl font-black">Content <span className="text-[#00d9f5]">Generator</span></h1>
        <p className="text-gray-400 text-xs mt-1">AI-powered content for every channel</p>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {types.map(t => (
          <button key={t.id} onClick={() => setSelected(t.id)}
            className={`p-3 rounded-2xl border text-left transition-all ${selected===t.id ? "border-[#00d9f5]/50 bg-[#00d9f5]/10 text-white" : "border-white/10 bg-[#12121a] text-gray-400 hover:border-white/20"}`}>
            <div className="text-xl mb-1.5">{t.icon}</div>
            <p className="text-xs font-bold leading-tight">{t.label}</p>
            <p className="text-[10px] opacity-50 mt-0.5">{t.desc}</p>
          </button>
        ))}
      </div>

      <ContentForm contentType={selected} />
    </AppLayout>
  );
}
