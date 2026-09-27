"use client";

import { useState } from "react";
import { validateProject, type ValidationResultDto } from "@/lib/api";

type Props = {
  projectId: string;
  accessToken: string;
};

export function ProjectValidation({ projectId, accessToken }: Props) {
  const [result, setResult] = useState<ValidationResultDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onValidate() {
    setLoading(true);
    setError(null);
    try {
      const data = await validateProject(accessToken, projectId);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Validation failed");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  const statusStyles =
    result?.status === "PASS"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : result?.status === "WARNING"
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : result?.status === "BLOCKED"
          ? "border-red-200 bg-red-50 text-red-900"
          : "border-slate-200 bg-white text-slate-700";

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            Estimate validation
          </h2>
          <p className="text-xs text-slate-500">
            Required before approving or sharing with customers.
          </p>
        </div>
        <button
          type="button"
          onClick={onValidate}
          disabled={loading}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {loading ? "Checking…" : "Run validation"}
        </button>
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-600" role="alert">{error}</p>
      )}

      {result && (
        <div className={`mt-4 rounded-lg border p-3 text-sm ${statusStyles}`}>
          <p className="font-semibold">Status: {result.status}</p>
          {result.issues.length > 0 && (
            <ul className="mt-2 list-disc pl-5">
              {result.issues.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
          {result.warnings.length > 0 && (
            <ul className="mt-2 list-disc pl-5 opacity-90">
              {result.warnings.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
          {result.suggestions.length > 0 && (
            <p className="mt-2 text-xs opacity-80">
              {result.suggestions.join(" · ")}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
