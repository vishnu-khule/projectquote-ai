"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createCatalogItem,
  listCatalogItems,
  type CatalogItemDto,
} from "@/lib/api";

type Props = {
  accessToken: string;
};

type Tab = "material" | "labour";

export function CatalogAdmin({ accessToken }: Props) {
  const [tab, setTab] = useState<Tab>("material");
  const [items, setItems] = useState<CatalogItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("material");
  const [unit, setUnit] = useState("pcs");
  const [unitPrice, setUnitPrice] = useState("");
  const [taxPercent, setTaxPercent] = useState("18");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await listCatalogItems(accessToken, tab));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load catalog");
    } finally {
      setLoading(false);
    }
  }, [accessToken, tab]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (tab === "labour") {
      setCategory("labour");
      setUnit("hr");
    } else {
      setCategory("material");
      setUnit("pcs");
    }
  }, [tab]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await createCatalogItem(accessToken, {
        sku,
        name,
        category,
        kind: tab,
        unit,
        unitPrice,
        taxPercent,
      });
      setSku("");
      setName("");
      setUnitPrice("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add item");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex gap-2">
        {(["material", "labour"] as Tab[]).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={
              tab === k
                ? "rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white"
                : "rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            }
          >
            {k === "material" ? "Materials" : "Labour rates"}
          </button>
        ))}
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">
          Add {tab === "material" ? "material" : "labour"} item
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Fixed prices for estimates (source: catalog, pre-confirmed).
        </p>
        <form onSubmit={onSubmit} className="mt-4 grid gap-3 sm:grid-cols-2">
          <input
            required
            placeholder="SKU"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
          />
          <input
            required
            placeholder="Name"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            placeholder="Category"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
          <input
            placeholder={tab === "labour" ? "Unit (hr)" : "Unit"}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
          />
          <input
            required
            placeholder={tab === "labour" ? "Rate per hour" : "Unit price"}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={unitPrice}
            onChange={(e) => setUnitPrice(e.target.value)}
          />
          <input
            required
            placeholder="Tax %"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={taxPercent}
            onChange={(e) => setTaxPercent(e.target.value)}
          />
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500 sm:col-span-2"
          >
            {saving ? "Saving…" : "Add item"}
          </button>
        </form>
        {error && (
          <p className="mt-3 text-sm text-red-600" role="alert">{error}</p>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <h2 className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-900">
          {tab === "material" ? "Materials" : "Labour rates"}
        </h2>
        {loading ? (
          <p className="px-4 py-6 text-sm text-slate-500">Loading…</p>
        ) : items.length === 0 ? (
          <p className="px-4 py-6 text-sm text-slate-500">No items yet.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-2">SKU</th>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Price</th>
                <th className="px-4 py-2">Tax %</th>
                <th className="px-4 py-2">Unit</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t border-slate-100">
                  <td className="px-4 py-2 font-mono text-xs">{item.sku}</td>
                  <td className="px-4 py-2">{item.name}</td>
                  <td className="px-4 py-2">{item.unitPrice}</td>
                  <td className="px-4 py-2">{item.taxPercent}</td>
                  <td className="px-4 py-2 text-slate-500">{item.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
