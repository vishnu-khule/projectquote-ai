"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthResponse } from "./api";

type AuthState = {
  accessToken: string | null;
  user: AuthResponse["user"] | null;
  organization: AuthResponse["organization"] | null;
  setSession: (session: AuthResponse) => void;
  clearSession: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      organization: null,
      setSession: (session) =>
        set({
          accessToken: session.accessToken,
          user: session.user,
          organization: session.organization,
        }),
      clearSession: () =>
        set({ accessToken: null, user: null, organization: null }),
    }),
    { name: "projectquote-auth" },
  ),
);
