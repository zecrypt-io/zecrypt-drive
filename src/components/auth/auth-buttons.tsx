"use client";

import Image from "next/image";
import { useAuth } from "@/contexts/auth-context";

export function AuthButtons() {
  const { user, loading, signIn, signOut, error } = useAuth();

  return (
    <div className="flex flex-col gap-2">
      {loading ? (
        <p className="text-xs text-zinc-600">Checking session…</p>
      ) : user ? (
        <>
          <div className="flex items-center gap-2">
            {user.photoURL ? (
              <Image
                src={user.photoURL}
                alt={user.displayName || "User"}
                width={24}
                height={24}
                className="h-6 w-6 rounded-full"
              />
            ) : (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-xs font-semibold text-white">
                {user.email?.[0]?.toUpperCase() || "U"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="truncate text-xs font-medium text-zinc-900">
                {user.displayName ?? "Signed in"}
              </p>
              <p className="truncate text-xs text-zinc-500">{user.email}</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="mt-2 inline-flex items-center justify-center rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50"
          >
            Sign out
          </button>
        </>
      ) : (
        <>
          <p className="text-xs text-zinc-600">
            Sign in to access your drive
          </p>
          <button
            onClick={signIn}
            className="mt-2 inline-flex items-center justify-center rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-700"
          >
            Sign in with Google
          </button>
        </>
      )}
      {error && (
        <p className="text-xs font-medium text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
