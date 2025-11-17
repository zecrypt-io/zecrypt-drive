"use client";

import { PropsWithChildren, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";

export function AuthGuard({ children }: PropsWithChildren) {
  const { user, loading, error } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect to login if not authenticated or if there's an auth error
    if (!loading && (!user || error)) {
      router.replace("/login");
    }
  }, [user, loading, error, router]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-base text-zinc-600">Loading your workspace…</p>
      </div>
    );
  }

  if (!user || error) {
    // Show loading while redirecting
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-base text-zinc-600">Redirecting to login…</p>
      </div>
    );
  }

  return <>{children}</>;
}


