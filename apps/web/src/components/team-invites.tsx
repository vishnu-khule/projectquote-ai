"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createOrganizationInvite,
  listOrganizationInvites,
  type OrgInviteDto,
} from "@/lib/api";

type Props = {
  accessToken: string;
};

export function TeamInvites({ accessToken }: Props) {
  const [invites, setInvites] = useState<OrgInviteDto[]>([]);
  const [email, setEmail] = useState("");
  const [lastLink, setLastLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setInvites(await listOrganizationInvites(accessToken));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load invites");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    load();
  }, [load]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const result = await createOrganizationInvite(accessToken, email);
      setLastLink(result.acceptUrl);
      setEmail("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invite failed");
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Invite teammate</h2>
        <p className="mt-1 text-xs text-slate-500">
          Owners can invite members by email. Link expires in 7 days.
        </p>
        <form onSubmit={onSubmit} className="mt-4 flex flex-wrap gap-2">
          <input
            type="email"
            required
            placeholder="colleague@company.com"
            className="min-w-[220px] flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            type="submit"
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500"
          >
            Send invite
          </button>
        </form>
        {lastLink && (
          <p className="mt-3 break-all text-xs text-slate-600">
            Share link:{" "}
            <a href={lastLink} className="text-brand-600 hover:underline">
              {lastLink}
            </a>
          </p>
        )}
        {error && (
          <p className="mt-3 text-sm text-red-600" role="alert">{error}</p>
        )}
      </section>
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <h2 className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-900">
          Pending invites
        </h2>
        {loading ? (
          <p className="px-4 py-6 text-sm text-slate-500">Loading…</p>
        ) : invites.length === 0 ? (
          <p className="px-4 py-6 text-sm text-slate-500">No pending invites.</p>
        ) : (
          <ul className="divide-y divide-slate-100 text-sm">
            {invites.map((inv) => (
              <li key={inv.id} className="px-4 py-3">
                {inv.email}{" "}
                <span className="text-slate-400">· {inv.role}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
