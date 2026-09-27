export function devSeedEmail(): string {
  return (process.env.DEV_SEED_EMAIL ?? "vishnu@local.dev").toLowerCase();
}

export function normalizeDevLoginEmail(raw: string): string {
  const trimmed = raw.trim().toLowerCase();
  if (trimmed.includes("@")) {
    return trimmed;
  }
  const localPart = trimmed;
  const configured = devSeedEmail();
  if (configured.startsWith(`${localPart}@`)) {
    return configured;
  }
  const domain = process.env.DEV_SEED_EMAIL_DOMAIN ?? "local.dev";
  return `${localPart}@${domain}`;
}
