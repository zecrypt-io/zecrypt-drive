"use client";

import { PropsWithChildren } from "react";
import { useAuth } from "@/contexts/auth-context";
import { AuthButtons } from "@/components/auth/auth-buttons";

export function AuthGuard({ children }: PropsWithChildren) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-base text-zinc-600">Loading your workspace…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[60vh] flex-col gap-6">
        <div className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-black/5 sm:p-10">
          <h2 className="text-2xl font-semibold text-zinc-900">
            Sign in to continue
          </h2>
          <p className="mt-2 text-sm text-zinc-600 sm:text-base">
            ZeCrypt Drive encrypts files on your device. Please sign in to load
            your keys and folder structure.
          </p>
        </div>
        <AuthButtons />
      </div>
    );
  }

  return <>{children}</>;
}


