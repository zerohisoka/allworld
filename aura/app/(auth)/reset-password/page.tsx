"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Key, Lock } from "lucide-react";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#030303] px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="mx-auto mb-6 flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-aura-pink">
            <Key className="h-5 w-5" />
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Set New Password
          </h1>
          <p className="mt-1 text-sm text-aura-muted">
            Choose a new password for your account
          </p>
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-[#0a0a0f]/60 p-6 backdrop-blur-xl">
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-sm font-medium text-white"
              >
                New Password
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

            <div>
              <label
                htmlFor="confirm"
                className="mb-1 block text-sm font-medium text-white"
              >
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-aura-muted" />
                <input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={6}
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] py-2.5 pl-10 pr-3 text-white placeholder:text-aura-muted outline-none transition-all focus:border-white/[0.16] focus:ring-2 focus:ring-white/[0.08]"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && <p className="text-sm text-aura-pink">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-white py-2.5 font-medium text-black transition-colors hover:bg-white/90 disabled:opacity-50"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
