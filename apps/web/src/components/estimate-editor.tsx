"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  addEstimateLineFromCatalog,
  confirmEstimateLineItem,
  generateProjectEstimate,
  generateTierEstimates,
  getProjectEstimate,
  getTierEstimates,
  listCatalogItems,
  updateEstimateLineItem,
  type CatalogItemDto,
  type EstimateDto,
  type EstimateLineItemDto,
} from "@/lib/api";

type Props = {
  projectId: string;
  accessToken: string;
};

export function EstimateEditor({ projectId, accessToken }: Props) {
  const [estimate, setEstimate] = useState<EstimateDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [tierSummaries, setTierSummaries] = useState<
    { tier: string; grandTotal?: string }[]
  >([]);
  const [catalogItems, setCatalogItems] = useState<CatalogItemDto[]>([]);
  const [catalogItemId, setCatalogItemId] = useState("");
  const [catalogQty, setCatalogQty] = useState("1");
  const [addingCatalog, setAddingCatalog] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getProjectEstimate(accessToken, projectId);
      setEstimate(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load estimate");
    } finally {
      setLoading(false);
    }
  }, [accessToken, projectId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!accessToken) return;
    listCatalogItems(accessToken)
      .then(setCatalogItems)
      .catch(() => setCatalogItems([]));
  }, [accessToken]);

  async function onGenerate() {
    setError(null);
    try {
      const data = await generateProjectEstimate(accessToken, projectId);
      setEstimate(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generate failed");
    }
  }

  async function onGenerateTiers() {
    setError(null);
    try {
      await generateTierEstimates(accessToken, projectId);
      const tiers = await getTierEstimates(accessToken, projectId);
      setTierSummaries(
        tiers.map((t) => ({
          tier: t.tier,
          grandTotal: (t.totals as { grandTotal?: string })?.grandTotal,
        })),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tier generation failed");
    }
  }

  async function saveItem(item: EstimateLineItemDto) {
    if (!estimate) return;
    setSavingId(item.id);
    setError(null);
    try {
      const updated = await updateEstimateLineItem(
        accessToken,
        estimate.id,
        item.id,
        {
          name: item.name,
          category: item.category,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          labourHours: item.labourHours ?? undefined,
          labourRate: item.labourRate ?? undefined,
          discountPercent: item.discountPercent,
          taxPercent: item.taxPercent,
        },
      );
      setEstimate(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSavingId(null);
    }
  }

  async function onAddFromCatalog() {
    if (!estimate || !catalogItemId) return;
    setAddingCatalog(true);
    setError(null);
    try {
      const updated = await addEstimateLineFromCatalog(
        accessToken,
        estimate.id,
        { catalogItemId, quantity: catalogQty },
      );
      setEstimate(updated);
      setCatalogItemId("");
      setCatalogQty("1");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add catalog line");
    } finally {
      setAddingCatalog(false);
    }
  }

  async function onConfirm(itemId: string) {
    if (!estimate) return;
    try {
      const updated = await confirmEstimateLineItem(
        accessToken,
        estimate.id,
        itemId,
      );
      setEstimate(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Confirm failed");
    }
  }

  function updateLocal(
    itemId: string,
    field: keyof EstimateLineItemDto,
    value: string,
  ) {
    setEstimate((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        lineItems: prev.lineItems.map((row) =>
          row.id === itemId ? { ...row, [field]: value } : row,
        ),
      };
    });
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Loading estimate…</p>;
  }

  if (!estimate) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Estimate</h2>
        <p className="mt-2 text-sm text-slate-500">
          Generate a draft estimate from your project scope. Totals are calculated
          by the engine — not the LLM.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onGenerate}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500"
          >
            Generate estimate
          </button>
        </div>
        {error && (
          <p className="mt-3 text-sm text-red-600" role="alert">{error}</p>
        )}
      </section>
    );
  }

  const totals = estimate.totals as {
    grandTotal?: string;
    currency?: string;
    taxTotal?: string;
    subtotal?: string;
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <button
          type="button"
          onClick={onGenerateTiers}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          Generate Basic / Modern / Premium
        </button>
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Estimate</h2>
          <p className="text-xs text-slate-500">Version {estimate.version}</p>
        </div>
        <p className="text-lg font-semibold text-slate-900">
          {totals.currency ?? "INR"} {totals.grandTotal ?? "0.00"}
        </p>
      </div>

      {tierSummaries.length > 0 && (
        <div className="grid gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3 sm:grid-cols-3">
          {tierSummaries.map((t) => (
            <div
              key={t.tier}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <p className="font-medium capitalize text-slate-900">{t.tier}</p>
              <p className="text-slate-600">{t.grandTotal ?? "—"}</p>
            </div>
          ))}
        </div>
      )}

      {estimate.warnings?.length ? (
        <ul className="border-b border-amber-100 bg-amber-50 px-4 py-2 text-xs text-amber-900">
          {estimate.warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      ) : null}

      <div className="flex flex-wrap items-end gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3">
        <label className="text-xs text-slate-600">
          From catalog
          <select
            className="mt-1 block min-w-[200px] rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm"
            value={catalogItemId}
            onChange={(e) => setCatalogItemId(e.target.value)}
          >
            <option value="">Select item…</option>
            {catalogItems.map((c) => (
              <option key={c.id} value={c.id}>
                {c.kind === "labour" ? "[Labour] " : ""}
                {c.name} — {c.unitPrice}/{c.unit}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-slate-600">
          Qty / hours
          <input
            className="mt-1 block w-20 rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
            value={catalogQty}
            onChange={(e) => setCatalogQty(e.target.value)}
          />
        </label>
        <button
          type="button"
          disabled={!catalogItemId || addingCatalog}
          onClick={onAddFromCatalog}
          className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-500 disabled:opacity-50"
        >
          {addingCatalog ? "Adding…" : "Add line"}
        </button>
        {catalogItems.length === 0 && (
          <Link
            href="/settings/catalog"
            className="text-xs text-brand-600 hover:underline"
          >
            Set up catalog →
          </Link>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-3 py-2">Item</th>
              <th className="px-3 py-2">Qty</th>
              <th className="px-3 py-2">Unit price</th>
              <th className="px-3 py-2">Tax %</th>
              <th className="px-3 py-2">Source</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {estimate.lineItems.map((item) => (
              <tr key={item.id} className="border-t border-slate-100">
                <td className="px-3 py-2">
                  <input
                    className="w-full rounded border border-slate-200 px-2 py-1"
                    value={item.name}
                    onChange={(e) =>
                      updateLocal(item.id, "name", e.target.value)
                    }
                  />
                  <span className="text-xs text-slate-400">{item.category}</span>
                </td>
                <td className="px-3 py-2">
                  <input
                    className="w-20 rounded border border-slate-200 px-2 py-1"
                    value={item.quantity}
                    onChange={(e) =>
                      updateLocal(item.id, "quantity", e.target.value)
                    }
                  />
                  <span className="text-xs text-slate-400">{item.unit}</span>
                </td>
                <td className="px-3 py-2">
                  <input
                    className="w-24 rounded border border-slate-200 px-2 py-1"
                    value={item.unitPrice}
                    onChange={(e) =>
                      updateLocal(item.id, "unitPrice", e.target.value)
                    }
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    className="w-16 rounded border border-slate-200 px-2 py-1"
                    value={item.taxPercent}
                    onChange={(e) =>
                      updateLocal(item.id, "taxPercent", e.target.value)
                    }
                  />
                </td>
                <td className="px-3 py-2">
                  <span
                    className={
                      item.priceSource === "ai_suggestion" && !item.confirmed
                        ? "rounded bg-violet-100 px-2 py-0.5 text-xs text-violet-800"
                        : "text-xs text-slate-500"
                    }
                  >
                    {item.priceSource}
                    {!item.confirmed ? " · unconfirmed" : ""}
                  </span>
                </td>
                <td className="px-3 py-2 space-x-1">
                  {item.priceSource === "ai_suggestion" && !item.confirmed && (
                    <button
                      type="button"
                      onClick={() => onConfirm(item.id)}
                      className="text-xs font-medium text-brand-600 hover:underline"
                    >
                      Confirm
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={savingId === item.id}
                    onClick={() => saveItem(item)}
                    className="text-xs font-medium text-slate-700 hover:underline disabled:opacity-50"
                  >
                    {savingId === item.id ? "Saving…" : "Save"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
        Subtotal {totals.subtotal} · Tax {totals.taxTotal}
      </div>

      {error && (
        <p className="px-4 pb-3 text-sm text-red-600" role="alert">{error}</p>
      )}
    </section>
  );
}
