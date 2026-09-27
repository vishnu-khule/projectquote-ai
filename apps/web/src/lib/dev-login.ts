const DEV_DOMAIN =
  process.env.NEXT_PUBLIC_DEV_LOGIN_EMAIL_DOMAIN ?? "local.dev";

export function normalizeLoginEmail(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.includes("@")) {
    return trimmed.toLowerCase();
  }
  return `${trimmed.toLowerCase()}@${DEV_DOMAIN}`;
}

export const DEV_DEFAULT_USERNAME =
  process.env.NEXT_PUBLIC_DEV_DEFAULT_USERNAME ?? "vishnu";

export const DEV_DEFAULT_PASSWORD =
  process.env.NEXT_PUBLIC_DEV_DEFAULT_PASSWORD ?? "vishnu";

export function showDevLoginHint(): boolean {
  return process.env.NODE_ENV === "development";
}
