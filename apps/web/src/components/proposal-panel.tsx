"use client";

import { useCallback, useEffect, useState } from "react";
import {
  approveProposal,
  generateProposal,
  createProposalShare,
  generateProposalPdf,
  getLatestProposal,
  updateProposalSection,
  type ProposalDto,
} from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type Props = {
  projectId: string;
  accessToken: string;
};

export function ProposalPanel({ projectId, accessToken }: Props) {
  const [proposal, setProposal] = useState<ProposalDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [draftContent, setDraftContent] = useState("");
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getLatestProposal(accessToken, projectId);
      setProposal(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load proposal");
    } finally {
      setLoading(false);
    }
  }, [accessToken, projectId]);

  useEffect(() => {
    load();
  }, [load]);

  async function onGenerate() {
    setError(null);
    try {
      const data = await generateProposal(accessToken, projectId);
      setProposal(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generate failed");
    }
  }

  async function onSaveSection(sectionId: string) {
    if (!proposal) return;
    try {
      const updated = await updateProposalSection(
        accessToken,
        proposal.id,
        sectionId,
        draftContent,
      );
      setProposal(updated);
      setEditingSection(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  }

  async function onApprove() {
    if (!proposal) return;
    try {
      const updated = await approveProposal(accessToken, proposal.id);
      setProposal(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Approve failed");
    }
  }

  async function onPdf() {
    if (!proposal) return;
    try {
      await generateProposalPdf(accessToken, proposal.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "PDF failed");
    }
  }

  async function onShare() {
    if (!proposal) return;
    setError(null);
    try {
      const result = await createProposalShare(accessToken, proposal.id);
      setShareUrl(result.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Share failed");
    }
  }

  function downloadUrl() {
    if (!proposal?.hasPdf) return null;
    return `${API_URL}/proposals/${proposal.id}/pdf`;
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Loading proposal…</p>;
  }

  if (!proposal) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Proposal</h2>
        <p className="mt-2 text-sm text-slate-500">
          Generate a customer-ready proposal from your confirmed estimate.
        </p>
        <button
          type="button"
          onClick={onGenerate}
          className="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500"
        >
          Generate proposal
        </button>
        {error && (
          <p className="mt-3 text-sm text-red-600" role="alert">{error}</p>
        )}
      </section>
    );
  }

  const url = downloadUrl();

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">{proposal.title}</h2>
          <p className="text-xs text-slate-500">
            v{proposal.version} · {proposal.status}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {proposal.status === "review" && (
            <button
              type="button"
              onClick={onApprove}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500"
            >
              Approve
            </button>
          )}
          {proposal.status === "approved" && (
            <button
              type="button"
              onClick={onPdf}
              className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-500"
            >
              Generate PDF
            </button>
          )}
          {url && (
            <a
              href={url}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              onClick={(e) => {
                e.preventDefault();
                fetch(url, {
                  headers: { Authorization: `Bearer ${accessToken}` },
                })
                  .then((r) => r.blob())
                  .then((blob) => {
                    const a = document.createElement("a");
                    a.href = URL.createObjectURL(blob);
                    a.download = `proposal-v${proposal.version}.pdf`;
                    a.click();
                  });
              }}
            >
              Download PDF
            </a>
          )}
          {proposal.hasPdf && (
            <button
              type="button"
              onClick={onShare}
              className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-100"
            >
              Share with customer
            </button>
          )}
        </div>
      </div>

      {shareUrl && (
        <div className="border-b border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Customer link (30 days):{" "}
          <a href={shareUrl} className="font-medium underline">{shareUrl}</a>
          <button
            type="button"
            className="ml-3 text-xs text-emerald-700 hover:underline"
            onClick={() => navigator.clipboard.writeText(shareUrl)}
          >
            Copy
          </button>
        </div>
      )}

      <div className="divide-y divide-slate-100">
        {proposal.sections
          .sort((a, b) => a.order - b.order)
          .map((section) => (
            <div key={section.id} className="px-4 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-slate-900">
                  {section.title}
                </h3>
                {proposal.status === "review" && (
                  <button
                    type="button"
                    className="text-xs text-brand-600 hover:underline"
                    onClick={() => {
                      setEditingSection(section.id);
                      setDraftContent(section.content);
                    }}
                  >
                    Edit
                  </button>
                )}
              </div>
              {editingSection === section.id ? (
                <div className="mt-2 space-y-2">
                  <textarea
                    className="w-full rounded-lg border border-slate-200 p-2 text-sm"
                    rows={6}
                    value={draftContent}
                    onChange={(e) => setDraftContent(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => onSaveSection(section.id)}
                    className="text-sm font-medium text-brand-600 hover:underline"
                  >
                    Save section
                  </button>
                </div>
              ) : (
                <pre className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                  {section.content}
                </pre>
              )}
            </div>
          ))}
      </div>

      {error && (
        <p className="px-4 pb-4 text-sm text-red-600" role="alert">{error}</p>
      )}
    </section>
  );
}
