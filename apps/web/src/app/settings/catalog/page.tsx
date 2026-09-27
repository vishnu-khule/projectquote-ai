"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { CatalogAdmin } from "@/components/catalog-admin";
import { useAuthStore } from "@/lib/auth-store";

export default function CatalogSettingsPage() {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const organization = useAuthStore((s) => s.organization);

  useEffect(() => {
    if (!accessToken) router.replace("/login");
  }, [accessToken, router]);

  if (!accessToken) return null;

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/dashboard" className="text-sm text-brand-600 hover:underline">
        ← Dashboard
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-slate-900">Price catalog</h1>
      <p className="text-sm text-slate-500">{organization?.name}</p>
      <div className="mt-8">
        <CatalogAdmin accessToken={accessToken} />
      </div>
    </main>
  );
}
