"use client";
import { useState } from "react";
import Link from "next/link";
import { signUp, signInWithGoogle } from "@/lib/supabase";

export default function SignupPage() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const set = (k: string, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.fullName || !form.email || !form.password) {
      setError("Sab fields zaroor bharo.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password kam se kam 6 characters ka hona chahiye.");
      return;
    }
    if (form.password !== form.confirm) {
      setError("Dono passwords match nahi kar rahe.");
      return;
    }

    setLoading(true);
    try {
      await signUp(form.email, form.password, form.fullName);
      setDone(true);
    } catch (err: any) {
      setError(err.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4 font-mono">
        <div className="text-center max-w-sm">
          <div className="text-6xl mb-4">📧</div>
          <h1 className="text-2xl font-black text-white mb-2">Email Check Karo!</h1>
          <p className="text-gray-400 text-sm mb-2">
            Confirmation link bheja gaya hai:
          </p>
          <p className="text-[#00f5a0] font-bold text-sm mb-6">{form.email}</p>
          <p className="text-gray-500 text-xs mb-6">
            Link click karne ke baad login kar sakte ho.
          </p>
          <Link
            href="/login"
            className="px-6 py-3 rounded-xl bg-[#00f5a0] text-black font-bold text-sm hover:bg-[#00f5a0]/80 transition-all"
          >
            Login Page Pe Jao →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4 font-mono">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-[#00f5a0]/5 blur-[120px]" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00f5a0] to-[#00d9f5] flex items-center justify-center font-black text-black text-sm">
              AI
            </div>
            <span className="text-white font-bold text-xl">Business OS</span>
          </Link>
          <h1 className="text-2xl font-black text-white">Free Account Banao</h1>
          <p className="text-gray-400 text-sm mt-1">Koi credit card nahi chahiye</p>
        </div>

        <div className="bg-[#12121a] border border-white/10 rounded-2xl p-6 space-y-4">
          {/* Google */}
          <button
            type="button"
            onClick={() => signInWithGoogle()}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-xl bg-white text-black font-bold text-sm hover:bg-gray-100 transition-all"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google se Signup karo
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-gray-600 text-xs">ya email se</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            {[
              { key: "fullName", label: "Poora Naam", type: "text", ph: "Ali Hassan", ac: "name" },
              { key: "email", label: "Email", type: "email", ph: "ali@email.com", ac: "email" },
              { key: "password", label: "Password", type: "password", ph: "••••••••", ac: "new-password" },
              { key: "confirm", label: "Password Confirm karo", type: "password", ph: "••••••••", ac: "new-password" },
            ].map((f) => (
              <div key={f.key}>
                <label className="block text-xs text-gray-400 mb-1.5">{f.label}</label>
                <input
                  type={f.type}
                  value={(form as any)[f.key]}
                  onChange={(e) => set(f.key, e.target.value)}
                  placeholder={f.ph}
                  autoComplete={f.ac}
                  required
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#00f5a0]/50 transition-all text-sm"
                />
              </div>
            ))}

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-xs">
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#00f5a0] text-black font-bold text-sm hover:bg-[#00f5a0]/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? "Account ban raha hai..." : "Free Account Banao →"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          Pehle se account hai?{" "}
          <Link href="/login" className="text-[#00f5a0] hover:underline font-medium">
            Login karo
          </Link>
        </p>
      </div>
    </div>
  );
      }
