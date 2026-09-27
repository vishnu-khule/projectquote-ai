"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { GoogleSignIn } from "@/components/google-sign-in";
import { login } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import {
  DEV_DEFAULT_PASSWORD,
  DEV_DEFAULT_USERNAME,
  normalizeLoginEmail,
  showDevLoginHint,
} from "@/lib/dev-login";

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const devHint = showDevLoginHint();
  const [email, setEmail] = useState(devHint ? DEV_DEFAULT_USERNAME : "");
  const [password, setPassword] = useState(devHint ? DEV_DEFAULT_PASSWORD : "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const session = await login({
        email: normalizeLoginEmail(email),
        password,
      });
      setSession(session);
      router.push("/dashboard");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Login failed";
      setError(
        msg === "Failed to fetch" || msg === "Load failed"
          ? "Cannot reach the API (http://localhost:4000). Start the backend: pnpm dev from the repo root."
          : msg,
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <h1 className="text-2xl font-semibold text-slate-900">Sign in</h1>
      <p className="mt-2 text-sm text-slate-600">
        Access your proposals and estimates.
      </p>
      {devHint && (
        <p className="mt-2 text-sm text-slate-500">
          Dev default: username <code className="rounded bg-slate-100 px-1">vishnu</code>
          , password <code className="rounded bg-slate-100 px-1">vishnu</code>
        </p>
      )}
      <div className="mt-8 space-y-4">
        <GoogleSignIn
          onSuccess={(session) => {
            setSession(session);
            router.push("/dashboard");
          }}
          onError={setError}
        />
      </div>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <label className="block text-sm font-medium text-slate-700">
          Email or username
          <input
            type="text"
            required
            autoComplete="username"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Password
          <input
            type="password"
            required
            autoComplete="current-password"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && (
          <p className="text-sm text-red-600" role="alert">{error}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-medium text-white hover:bg-brand-500 disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        No account?{" "}
        <Link href="/register" className="text-brand-600 hover:underline">
          Register
        </Link>
      </p>
    </main>
  );
}
