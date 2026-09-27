export async function initSentry() {
  const dsn = process.env.SENTRY_DSN?.trim();
  if (!dsn) return;
  try {
    const load = new Function(
      "specifier",
      "return import(specifier)",
    ) as (specifier: string) => Promise<{ init: (opts: unknown) => void }>;
    const Sentry = await load("@sentry/node");
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV ?? "development",
      tracesSampleRate: 0.1,
    });
  } catch {
    console.warn("SENTRY_DSN set but @sentry/node is not installed");
  }
}
