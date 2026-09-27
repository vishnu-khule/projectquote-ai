export function devCorsOrigins(): string[] | string {
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  if (process.env.NODE_ENV === "production") {
    return appUrl;
  }
  const extras = (process.env.CORS_EXTRA_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const set = new Set<string>([
    appUrl,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    ...extras,
  ]);
  return [...set];
}
