"use client";
import { useState } from "react";
import Link from "next/link";
import { resetPassword } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError("");
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err: any) {
      setError(err.message || "Failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4 font-mono">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-[#00f5a0]/5 blur-[100px]" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00f5a0] to-[#00d9f5] flex items-center justify-center font-black text-black text-sm">
              AI
            </div>
            <span className="text-white font-bold text-xl">Business OS</span>
          </Link>
          <h1 className="text-2xl font-black text-white">Password Reset</h1>
          <p className="text-gray-400 text-sm mt-1">Email daalo — reset link bhej denge</p>
        </div>

        <div className="bg-[#12121a] border border-white/10 rounded-2xl p-6">
          {sent ? (
            <div className="text-center space-y-4 py-4">
              <div className="text-5xl">📧</div>
              <p className="text-white font-bold">Reset Link Bhej Di!</p>
              <p className="text-gray-400 text-sm">
                <span className="text-[#00f5a0]">{email}</span> pe link bheja gaya hai.
                Email check karo.
              </p>
              <Link
                href="/login"
                className="block w-full py-3 rounded-xl bg-[#00f5a0] text-black font-bold text-sm text-center hover:bg-[#00f5a0]/80 transition-all"
              >
                Login Pe Wapis Jao →
              </Link>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tumhara@email.com"
                  required
                  autoComplete="email"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#00f5a0]/50 transition-all text-sm"
                />
              </div>
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-xs">
                  ⚠️ {error}
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-[#00f5a0] text-black font-bold text-sm hover:bg-[#00f5a0]/80 disabled:opacity-50 transition-all"
              >
                {loading ? "Bhej raha hoon..." : "Reset Link Bhejo →"}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          <Link href="/login" className="text-[#00f5a0] hover:underline">
            ← Login pe wapis jao
          </Link>
        </p>
      </div>
    </div>
  );
      }
