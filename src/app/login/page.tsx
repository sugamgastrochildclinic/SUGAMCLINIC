"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Lock, Mail, Loader2, Home, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        setErrorMsg("Invalid email or password.");
      } else {
        router.push("/admin");
        router.refresh();
      }
    } catch (err) {
      setErrorMsg("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-tr from-brand-blush via-white to-teal-tint/30 flex items-center justify-center p-6 relative">
      {/* Decorative Blob */}
      <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-teal-tint/40 blur-3xl -z-10" />
      <div className="absolute bottom-10 right-10 w-64 h-64 rounded-full bg-brand-blush/60 blur-3xl -z-10" />

      <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-3xl border border-brand-border shadow-xl relative">
        {/* Back Home */}
        <Link
          href="/"
          className="absolute top-6 left-6 text-brand-muted hover:text-teal flex items-center gap-1.5 text-xs font-semibold"
        >
          <Home className="w-4 h-4" />
          <span>Back to Site</span>
        </Link>

        <div className="text-center mt-6 mb-8">
          <div className="w-12 h-12 rounded-full bg-teal-tint text-teal flex items-center justify-center mx-auto mb-4 border border-teal/20">
            <Lock className="w-5 h-5" />
          </div>
          <h1 className="font-heading font-bold text-2xl text-brand-ink">Admin Portal</h1>
          <p className="text-xs text-brand-muted mt-1.5">Sugam Child & Gastro Care Clinic</p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-xl">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-xs font-bold uppercase text-brand-ink mb-2">Admin Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 w-5 h-5 text-brand-muted/70" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@sugamclinic.com"
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-brand-border focus:border-teal focus:outline-none text-sm text-brand-ink"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold uppercase text-brand-ink mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 w-5 h-5 text-brand-muted/70" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-12 pr-12 py-3 rounded-xl border border-brand-border focus:border-teal focus:outline-none text-sm text-brand-ink"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-3.5 text-brand-muted hover:text-teal focus:outline-none cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal text-white hover:bg-teal-dark py-3.5 rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2 mt-4 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <span>Sign In as Admin</span>
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
