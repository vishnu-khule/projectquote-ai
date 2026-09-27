"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createProject } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";

export default function NewProjectPage() {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const [title, setTitle] = useState("");
  const [projectType, setProjectType] = useState("interior-modular-kitchen");
  const [customerName, setCustomerName] = useState("");
  const [location, setLocation] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken) {
      router.push("/login");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await createProject(accessToken, {
        title,
        projectType,
        customerName: customerName || undefined,
        location: location || undefined,
        projectDescription: projectDescription || undefined,
      });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create project");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-lg px-6 py-10">
      <Link href="/dashboard" className="text-sm text-brand-600 hover:underline">
        ← Dashboard
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-slate-900">New project</h1>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <label className="block text-sm font-medium text-slate-700">
          Title
          <input
            required
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Project type
          <select
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            value={projectType}
            onChange={(e) => setProjectType(e.target.value)}
          >
            <option value="interior-modular-kitchen">Modular kitchen</option>
            <option value="bathroom-renovation">Bathroom renovation</option>
            <option value="general-contractor">General contractor</option>
          </select>
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Customer name
          <input
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Location
          <input
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Description
          <textarea
            rows={4}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            value={projectDescription}
            onChange={(e) => setProjectDescription(e.target.value)}
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
          {loading ? "Creating…" : "Create project"}
        </button>
      </form>
    </main>
  );
}
