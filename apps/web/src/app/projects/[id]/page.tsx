"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  getProject,
  listProjectDocuments,
  uploadProjectDocument,
  type DocumentDto,
  type ProjectDetail,
} from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { ProjectChat } from "@/components/project-chat";
import { EstimateEditor } from "@/components/estimate-editor";
import { ProposalPanel } from "@/components/proposal-panel";
import { ProjectValidation } from "@/components/project-validation";

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [documents, setDocuments] = useState<DocumentDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const refresh = useCallback(async () => {
    if (!accessToken) return;
    const [p, docs] = await Promise.all([
      getProject(accessToken, projectId),
      listProjectDocuments(accessToken, projectId),
    ]);
    setProject(p);
    setDocuments(docs);
  }, [accessToken, projectId]);

  useEffect(() => {
    if (!accessToken) {
      router.replace("/login");
      return;
    }
    refresh().catch((err) =>
      setError(err instanceof Error ? err.message : "Failed to load project"),
    );
  }, [accessToken, router, refresh]);

  useEffect(() => {
    if (!accessToken) return;
    const hasActive = documents.some(
      (d) => d.status === "queued" || d.status === "processing",
    );
    if (!hasActive) return;
    const timer = setInterval(() => {
      listProjectDocuments(accessToken, projectId)
        .then(setDocuments)
        .catch(() => undefined);
      getProject(accessToken, projectId)
        .then(setProject)
        .catch(() => undefined);
    }, 3000);
    return () => clearInterval(timer);
  }, [accessToken, projectId, documents]);

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !accessToken) return;
    setUploading(true);
    setError(null);
    try {
      await uploadProjectDocument(accessToken, projectId, file);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/dashboard" className="text-sm text-brand-600 hover:underline">
        ← Dashboard
      </Link>
      {project && (
        <header className="mt-4">
          <h1 className="text-2xl font-semibold text-slate-900">{project.title}</h1>
          <p className="text-sm text-slate-500">
            {project.projectType} ·{" "}
            <span className="font-medium text-slate-700">{project.status}</span>
          </p>
        </header>
      )}

      {accessToken && (
        <div className="mt-8 space-y-8">
          <ProjectChat projectId={projectId} accessToken={accessToken} />
          <EstimateEditor projectId={projectId} accessToken={accessToken} />
          <ProjectValidation projectId={projectId} accessToken={accessToken} />
          <ProposalPanel projectId={projectId} accessToken={accessToken} />
        </div>
      )}

      <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Upload documents</h2>
        <p className="mt-1 text-sm text-slate-500">
          PDF, Excel, CSV, or images (max 25 MB). Processing runs in the background.
        </p>
        <label className="mt-4 inline-flex cursor-pointer items-center rounded-lg border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-600 hover:bg-slate-50">
          <input
            type="file"
            className="hidden"
            accept=".pdf,.xlsx,.xls,.csv,.txt,.jpg,.jpeg,.png,.webp"
            onChange={onFileChange}
            disabled={uploading}
          />
          {uploading ? "Uploading…" : "Choose file"}
        </label>
      </section>

      {error && (
        <p className="mt-4 text-sm text-red-600" role="alert">{error}</p>
      )}

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-slate-900">Files</h2>
        {documents.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No documents yet.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {documents.map((doc) => (
              <li
                key={doc.id}
                className="rounded-lg border border-slate-200 bg-white p-4 text-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-slate-900">{doc.fileName}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                    {doc.status}
                  </span>
                </div>
                {doc.error && (
                  <p className="mt-2 text-red-600">{doc.error}</p>
                )}
                {doc.extraction != null ? (
                  <pre className="mt-2 max-h-48 overflow-auto rounded bg-slate-50 p-2 text-xs text-slate-700">
                    {JSON.stringify(doc.extraction, null, 2)}
                  </pre>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
