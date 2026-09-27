"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { TeamInvites } from "@/components/team-invites";
import { useAuthStore } from "@/lib/auth-store";

export default function TeamSettingsPage() {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!accessToken) router.replace("/login");
  }, [accessToken, router]);

  if (!accessToken) return null;

  return (
    <div className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <Link href="/dashboard" className="text-sm text-brand-600 hover:underline">
        ← Dashboard
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-slate-900">Team invites</h1>
      <div className="mt-6">
        <TeamInvites accessToken={accessToken} />
      </div>
    </div>
  );
}
