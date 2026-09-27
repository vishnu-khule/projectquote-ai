"use client";

import { GoogleLogin } from "@react-oauth/google";
import { googleSignIn, type AuthResponse } from "@/lib/api";

type Props = {
  onSuccess: (session: AuthResponse) => void;
  onError: (message: string) => void;
};

export function GoogleSignIn({ onSuccess, onError }: Props) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) return null;

  return (
    <div className="flex justify-center">
      <GoogleLogin
        onSuccess={async (res) => {
          if (!res.credential) {
            onError("Google did not return a credential");
            return;
          }
          try {
            onSuccess(await googleSignIn(res.credential));
          } catch (err) {
            onError(err instanceof Error ? err.message : "Google sign-in failed");
          }
        }}
        onError={() => onError("Google sign-in was cancelled or failed")}
        theme="outline"
        size="large"
        width="100%"
      />
    </div>
  );
}
