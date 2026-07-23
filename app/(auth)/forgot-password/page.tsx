"use client";

import { useState } from "react";
import Link from "next/link";
import { Key, Mail } from "lucide-react";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
    } catch (err: any) {
      setError(err.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#030303] px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="mb-6 inline-flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-aura-pink">
              <Key className="h-5 w-5" />
            </span>
            <span className="text-lg font-bold tracking-[0.2em] text-white">
              AURA
            </span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Reset Password
          </h1>
          <p className="mt-1 text-sm text-aura-muted">
            {sent
              ? "Check your email for the reset link"
              : "Enter your email and we'll send you a reset link"}
          </p>
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-[#0a0a0f]/60 p-6 backdrop-blur-xl">
          {sent ? (
            <div className="text-center text-sm text-aura-muted">
              <p>
                If an account exists with that email, you&apos;ll receive a
                password reset link shortly.
              </p>
              <Link
                href="/login"
                className="mt-4 inline-block text-white underline hover:text-white/80"
              >
                Back to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="mb-1 block text-sm font-medium text-white"
                >
                  Email
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-aura-muted" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] py-2.5 pl-10 pr-3 text-white placeholder:text-aura-muted outline-none transition-all focus:border-white/[0.16] focus:ring-2 focus:ring-white/[0.08]"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              {error && <p className="text-sm text-aura-pink">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-white py-2.5 font-medium text-black transition-colors hover:bg-white/90 disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-aura-muted">
          Remember your password?{" "}
          <Link
            href="/login"
            className="text-white underline hover:text-white/80"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
