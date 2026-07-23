"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Key, Mail, Lock, User, Loader2 } from "lucide-react";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#030303]">
          <Loader2 className="h-6 w-6 animate-spin text-aura-muted" />
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  );
}

function SignupForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const planParam = searchParams?.get("plan") || "";

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      setError(
        "You must agree to the Terms and Conditions and Privacy Policy",
      );
      return;
    }
    setLoading(true);
    setError("");

    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
        },
      });
      if (error) throw error;

      // The trigger handle_new_org_and_member will create the org + membership.
      // Redirect to dashboard.
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#030303] px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-aura-pink">
              <Key className="h-5 w-5" />
            </span>
            <span className="text-lg font-bold tracking-[0.2em] text-white">
              AURA
            </span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Create Account
          </h1>
          <p className="mt-1 text-sm text-aura-muted">
            {planParam
              ? `Get started with the ${planParam.charAt(0).toUpperCase() + planParam.slice(1)} plan`
              : "Start your free trial today"}
          </p>
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-[#0a0a0f]/60 p-6 backdrop-blur-xl">
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label
                htmlFor="full-name"
                className="mb-1 block text-sm font-medium text-white"
              >
                Full Name
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-aura-muted" />
                <input
                  id="full-name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] py-2.5 pl-10 pr-3 text-white placeholder:text-aura-muted outline-none transition-all focus:border-white/[0.16] focus:ring-2 focus:ring-white/[0.08]"
                  placeholder="Jane Smith"
                />
              </div>
            </div>

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

            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-sm font-medium text-white"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-aura-muted" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] py-2.5 pl-10 pr-3 text-white placeholder:text-aura-muted outline-none transition-all focus:border-white/[0.16] focus:ring-2 focus:ring-white/[0.08]"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-start gap-2">
              <input
                id="terms"
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border border-white/[0.08] bg-white/[0.02] accent-aura-pink"
              />
              <label
                htmlFor="terms"
                className="text-xs leading-relaxed text-aura-muted"
              >
                I agree to the{" "}
                <Link
                  href="/terms-of-service"
                  className="text-white/80 underline underline-offset-2 hover:text-white"
                  target="_blank"
                >
                  Terms and Conditions
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy-policy"
                  className="text-white/80 underline underline-offset-2 hover:text-white"
                  target="_blank"
                >
                  Privacy Policy
                </Link>
              </label>
            </div>

            {error && <p className="text-sm text-aura-pink">{error}</p>}

            <button
              type="submit"
              disabled={loading || !agreed}
              className="w-full rounded-xl bg-white py-2.5 font-medium text-black transition-colors hover:bg-white/90 disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-aura-muted">
          Already have an account?{" "}
          <Link href="/login" className="text-white underline hover:text-white/80">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
