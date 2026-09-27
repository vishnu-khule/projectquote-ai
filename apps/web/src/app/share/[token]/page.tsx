"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getSharedProposal, type SharedProposalDto } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export default function SharedProposalPage() {
  const params = useParams();
  const token = params.token as string;
  const [data, setData] = useState<SharedProposalDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSharedProposal(token)
      .then(setData)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Link unavailable"),
      );
  }, [token]);

  if (error) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16 text-center">
        <h1 className="text-xl font-semibold text-slate-900">
          Proposal unavailable
        </h1>
        <p className="mt-2 text-slate-600">{error}</p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16 text-center text-slate-500">
        Loading proposal…
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <p className="text-sm font-medium text-brand-600">{data.organizationName}</p>
      <h1 className="mt-2 text-3xl font-semibold text-slate-900">{data.title}</h1>
      <p className="mt-2 text-slate-600">
        {data.projectTitle}
        {data.customerName ? ` · ${data.customerName}` : ""}
      </p>

      {data.hasPdf && (
        <a
          href={`${API_URL}/shared/proposals/${token}/pdf`}
          className="mt-6 inline-flex rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500"
        >
          Download PDF
        </a>
      )}

      <div className="mt-10 space-y-8">
        {data.sections
          .sort((a, b) => a.order - b.order)
          .map((section) => (
            <section key={section.id}>
              <h2 className="text-lg font-semibold text-slate-900">
                {section.title}
              </h2>
              <pre className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                {section.content}
              </pre>
            </section>
          ))}
      </div>

      <p className="mt-12 border-t border-slate-200 pt-6 text-center text-xs text-slate-400">
        Shared via ProjectQuote AI · Version {data.version}
      </p>
    </main>
  );
}
