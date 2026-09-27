import Link from "next/link";

const steps = [
  "Describe your project in chat",
  "Upload past quotes or BOQ files",
  "Confirm requirements and pricing",
  "Review, approve, and share the PDF",
];

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col px-6 py-16">
      <p className="text-sm font-medium uppercase tracking-wide text-brand-600">
        ProjectQuote AI
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">
        Professional proposals and estimates, with AI — and math you can trust.
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-slate-600">
        Conversational requirements, document intelligence, deterministic
        calculations, and human approval before anything goes to your customer.
      </p>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/login"
          className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-brand-500"
        >
          Sign in
        </Link>
        <Link
          href="/register"
          className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Register
        </Link>
        <span className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-500">
          Docs in repo <code className="text-slate-700">/docs</code>
        </span>
      </div>

      <ol className="mt-14 space-y-4 border-t border-slate-200 pt-10">
        {steps.map((step, i) => (
          <li key={step} className="flex gap-4 text-slate-700">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-600">
              {i + 1}
            </span>
            <span className="pt-1">{step}</span>
          </li>
        ))}
      </ol>

      <p className="mt-12 text-sm text-slate-500">
        MVP scaffold — API at{" "}
        <code className="rounded bg-slate-100 px-1">localhost:4000</code>. See{" "}
        <code className="rounded bg-slate-100 px-1">docs/16-mvp-scope.md</code>.
      </p>
    </main>
  );
}
