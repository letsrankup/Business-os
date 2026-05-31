"use client";
import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import { resetPassword } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError("");
    setMessage("");
    try {
      await resetPassword(email);
      setMessage("Password reset link aapke email par bhej diya gaya hai.");
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Kuch ghalat hua. Dobara koshish karein.";
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4 font-mono">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-[#00f5a0]/5 blur-[120px]" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-white">Reset Password</h1>
          <p className="text-gray-400 text-sm mt-1">Apna registered email enter karo</p>
        </div>

        <div className="bg-[#12121a] border border-white/10 rounded-2xl p-6 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tumhara@email.com"
                required
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#00f5a0]/50 transition-all text-sm"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-xs">
                ⚠️ {error}
              </div>
            )}

            {message && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-[#00f5a0] text-xs">
                ✅ {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#00f5a0] text-black font-bold text-sm hover:bg-[#00f5a0]/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? "Sending..." : "Reset Link Bhejo →"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          <Link href="/login" className="text-[#00f5a0] hover:underline font-medium">
            ← Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
        }
              
