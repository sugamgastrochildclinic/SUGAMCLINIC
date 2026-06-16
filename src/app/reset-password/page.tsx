"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Mail, Loader2, Home, Eye, EyeOff, KeyRound, ArrowLeft, CheckCircle2 } from "lucide-react";

type Step = "request" | "verify" | "done";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("request");

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [info, setInfo] = useState("");

  const requestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setInfo("");
    try {
      const res = await fetch("/api/admin/password/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not send code.");
      setInfo("A 6-digit code has been sent to the admin email. It expires in 10 minutes.");
      setStep("verify");
    } catch (err: any) {
      setErrorMsg(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (newPassword !== confirm) {
      setErrorMsg("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        const issue =
          data.issues?.newPassword?.[0] || data.issues?.otp?.[0] || data.error;
        throw new Error(issue || "Could not reset password.");
      }
      setStep("done");
    } catch (err: any) {
      setErrorMsg(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen pt-28 md:pt-36 bg-gradient-to-tr from-brand-blush via-white to-teal-tint/30 flex items-center justify-center p-6 relative">
      <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-teal-tint/40 blur-3xl -z-10" />
      <div className="absolute bottom-10 right-10 w-64 h-64 rounded-full bg-brand-blush/60 blur-3xl -z-10" />

      <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-3xl border border-brand-border shadow-xl relative">
        <Link
          href="/login"
          className="absolute top-6 left-6 text-brand-muted hover:text-teal flex items-center gap-1.5 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Login</span>
        </Link>

        <div className="text-center mt-6 mb-8">
          <div className="w-12 h-12 rounded-full bg-teal-tint text-teal flex items-center justify-center mx-auto mb-4 border border-teal/20">
            <KeyRound className="w-5 h-5" />
          </div>
          <h1 className="font-heading font-bold text-2xl text-brand-ink">
            {step === "done" ? "Password Updated" : "Reset Password"}
          </h1>
          <p className="text-xs text-brand-muted mt-1.5">
            {step === "request" && "We'll email a verification code to the admin address."}
            {step === "verify" && "Enter the code and choose a new password."}
            {step === "done" && "You can now sign in with your new password."}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-xl">
            {errorMsg}
          </div>
        )}
        {info && step === "verify" && (
          <div className="mb-6 p-4 bg-teal-tint/50 border border-teal/20 text-teal-dark text-xs rounded-xl">
            {info}
          </div>
        )}

        {/* Step 1 — request code */}
        {step === "request" && (
          <form onSubmit={requestOtp} className="space-y-5">
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
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal text-white hover:bg-teal-dark py-3.5 rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Send Verification Code</span>}
            </button>
          </form>
        )}

        {/* Step 2 — verify + new password */}
        {step === "verify" && (
          <form onSubmit={resetPassword} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase text-brand-ink mb-2">Verification Code</label>
              <div className="relative">
                <KeyRound className="absolute left-4 top-3.5 w-5 h-5 text-brand-muted/70" />
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="6-digit code"
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-brand-border focus:border-teal focus:outline-none text-sm text-brand-ink tracking-widest"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-brand-ink mb-2">New Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-brand-muted/70" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
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

            <div>
              <label className="block text-xs font-bold uppercase text-brand-ink mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-brand-muted/70" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-brand-border focus:border-teal focus:outline-none text-sm text-brand-ink"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal text-white hover:bg-teal-dark py-3.5 rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Reset Password</span>}
            </button>

            <button
              type="button"
              onClick={() => { setStep("request"); setOtp(""); setErrorMsg(""); }}
              className="w-full text-xs font-semibold text-brand-muted hover:text-teal cursor-pointer"
            >
              Didn't get a code? Resend
            </button>
          </form>
        )}

        {/* Step 3 — done */}
        {step === "done" && (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-full bg-teal-tint text-teal flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <button
              onClick={() => router.push("/login")}
              className="w-full bg-teal text-white hover:bg-teal-dark py-3.5 rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Home className="w-4 h-4" /> Go to Login
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
