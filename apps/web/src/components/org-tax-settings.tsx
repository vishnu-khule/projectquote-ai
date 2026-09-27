"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getOrganizationSettings,
  updateOrganizationSettings,
} from "@/lib/api";

type Props = {
  accessToken: string;
};

export function OrgTaxSettings({ accessToken }: Props) {
  const [defaultTaxPercent, setDefaultTaxPercent] = useState("18");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const settings = await getOrganizationSettings(accessToken);
      setDefaultTaxPercent(settings.defaultTaxPercent);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    load();
  }, [load]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await updateOrganizationSettings(accessToken, { defaultTaxPercent });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Loading tax settings…</p>;
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">Default GST / tax</h2>
      <p className="mt-1 text-xs text-slate-500">
        Applied to new draft estimate lines. Catalog items can override per SKU.
      </p>
      <form onSubmit={onSubmit} className="mt-4 flex flex-wrap items-end gap-3">
        <label className="text-sm text-slate-700">
          Default tax %
          <input
            required
            pattern="^\d+(\.\d+)?$"
            className="mt-1 block w-28 rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={defaultTaxPercent}
            onChange={(e) => setDefaultTaxPercent(e.target.value)}
          />
        </label>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </form>
      {saved && (
        <p className="mt-3 text-sm text-green-700">Settings saved.</p>
      )}
      {error && (
        <p className="mt-3 text-sm text-red-600" role="alert">{error}</p>
      )}
    </section>
  );
}
