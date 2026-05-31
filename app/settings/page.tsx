"use client";
import { useState } from "react";
import AppLayout from "@/components/AppLayout";

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <AppLayout title="Settings">
      <div>
        <h1 className="text-2xl font-black">Settings <span className="text-gray-500">& Config</span></h1>
        <p className="text-gray-400 text-xs mt-1">Manage integrations and preferences</p>
      </div>

      <div className="max-w-2xl space-y-5">
        <div className="bg-[#12121a] border border-white/10 rounded-2xl p-5 space-y-4">
          <h2 className="font-bold text-white text-sm">🔑 API Configuration</h2>
          <div className="bg-[#00f5a0]/5 border border-[#00f5a0]/20 rounded-xl p-4">
            <p className="text-xs text-[#00f5a0] font-medium">ℹ️ API keys are stored in your <code className="bg-black/40 px-1 rounded">.env.local</code> file — never in the browser.</p>
          </div>
          {[
            { label:"OpenRouter API Key", key:"OPENROUTER_API_KEY", hint:"sk-or-v1-..." },
            { label:"Supabase URL", key:"NEXT_PUBLIC_SUPABASE_URL", hint:"https://xxx.supabase.co" },
            { label:"Supabase Anon Key", key:"NEXT_PUBLIC_SUPABASE_ANON_KEY", hint:"eyJ..." },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-xs text-gray-500 mb-1.5">{f.label}</label>
              <input readOnly placeholder={`Set in .env.local as ${f.key}=${f.hint}`}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-500 cursor-not-allowed" />
            </div>
          ))}
        </div>

        <div className="bg-[#12121a] border border-white/10 rounded-2xl p-5">
          <h2 className="font-bold text-white text-sm mb-4">📦 Current Plan</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#00f5a0] font-black text-xl">Free Plan</p>
              <p className="text-gray-400 text-xs mt-1">10 audits · 20 content · 5 proposals</p>
            </div>
            <button className="px-4 py-2 rounded-xl bg-[#00f5a0] text-black font-bold text-sm hover:bg-[#00f5a0]/80 transition-all">
              Upgrade →
            </button>
          </div>
        </div>

        <div className="bg-[#12121a] border border-white/10 rounded-2xl p-5">
          <h2 className="font-bold text-white text-sm mb-4">🤖 AI Model</h2>
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
            <div>
              <p className="text-sm font-bold text-white">mistralai/mistral-7b-instruct:free</p>
              <p className="text-xs text-gray-500 mt-0.5">Via OpenRouter · 100% Free</p>
            </div>
            <span className="text-xs px-2 py-1 rounded-full bg-[#00f5a0]/10 border border-[#00f5a0]/20 text-[#00f5a0]">Active</span>
          </div>
        </div>

        <div className="bg-[#12121a] border border-red-500/20 rounded-2xl p-5">
          <h2 className="font-bold text-red-400 text-sm mb-3">⚠️ Danger Zone</h2>
          <button className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm hover:bg-red-500/20 transition-all">
            Delete Account
          </button>
        </div>
      </div>
    </AppLayout>
  );
      }
