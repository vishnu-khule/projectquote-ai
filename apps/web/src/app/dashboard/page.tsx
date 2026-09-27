"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { listProjects, type ProjectDto } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";

export default function DashboardPage() {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const organization = useAuthStore((s) => s.organization);
  const clearSession = useAuthStore((s) => s.clearSession);
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) {
      router.replace("/login");
      return;
    }
    listProjects(accessToken)
      .then(setProjects)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load projects"),
      )
      .finally(() => setLoading(false));
  }, [accessToken, router]);

  return (
    <div className="mx-auto min-h-screen max-w-5xl px-6 py-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/" className="text-sm text-brand-600 hover:underline">
            ← Home
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">
            AI Proposal Generator
          </h1>
          <p className="text-sm text-slate-500">
            {organization?.name ?? "Workspace"}
            {user?.email ? ` · ${user.email}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/settings/catalog"
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Price catalog
          </Link>
          <Link
            href="/projects/new"
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500"
          >
            + New project
          </Link>
          <button
            type="button"
            onClick={() => {
              clearSession();
              router.push("/login");
            }}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            Sign out
          </button>
        </div>
      </header>

      {error && (
        <p className="mt-6 text-sm text-red-600" role="alert">{error}</p>
      )}

      <section className="mt-10 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <p className="px-4 py-8 text-sm text-slate-500">Loading projects…</p>
        ) : projects.length === 0 ? (
          <p className="px-4 py-8 text-sm text-slate-500">
            No projects yet. Create your first proposal.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Project</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-slate-50 last:border-0"
                >
                  <td className="px-4 py-3 font-medium text-slate-900">
                    <Link
                      href={`/projects/${p.id}`}
                      className="hover:text-brand-600 hover:underline"
                    >
                      {p.title}
                    </Link>
                    {p.customer?.name ? (
                      <span className="block text-xs font-normal text-slate-500">
                        {p.customer.name}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{p.projectType}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(p.updatedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
