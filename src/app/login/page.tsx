"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Cloud, Lock } from "lucide-react";

export default function LoginPage() {
  const { signIn, error, loading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.replace("/dashboard");
    }
  }, [user, router]);

  const handleGoogleSignIn = async () => {
    await signIn();
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 py-12 sm:px-6 lg:px-8 selection:bg-emerald-100 selection:text-emerald-900">
      <div className="w-full max-w-md space-y-8">
        {/* Logo & Header */}
        <div className="text-center">
          <Link 
            href="/"
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/20 transition hover:scale-105"
          >
            <Cloud className="h-7 w-7" />
          </Link>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-zinc-900">
            Welcome back
          </h2>
          <p className="mt-2 text-sm text-zinc-600">
            Sign in to access your encrypted vault
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-white px-8 py-10 shadow-xl shadow-zinc-200/50 ring-1 ring-zinc-100 sm:px-10">
          <div className="space-y-6">
            <div>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3.5 text-sm font-semibold text-zinc-700 shadow-sm transition-all hover:bg-zinc-50 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" />
                ) : (
                  <>
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    Sign in with Google
                  </>
                )}
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-2 text-xs uppercase text-zinc-400">
                  Or continue with
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled
              className="group flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-3.5 text-sm font-medium text-zinc-400 transition cursor-not-allowed"
            >
              <span>Email address (Coming Soon)</span>
            </button>
          </div>

          {/* Status Messages */}
          <div className="mt-6 min-h-[20px]">
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-xs text-red-600 animate-in fade-in slide-in-from-top-2">
                {error}
              </div>
            )}
            {user && !error && (
              <div className="rounded-lg bg-emerald-50 p-3 text-center text-xs text-emerald-600 animate-in fade-in slide-in-from-top-2">
                Signed in! Redirecting...
              </div>
            )}
          </div>

          {/* Security Note */}
          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-zinc-400">
            <Lock className="h-3 w-3" />
            <span>End-to-end encrypted session</span>
          </div>
        </div>

        {/* Footer Links */}
        <p className="text-center text-xs text-zinc-500">
          By continuing, you agree to our{" "}
          <Link href="#" className="font-medium text-emerald-600 hover:text-emerald-500 underline underline-offset-2">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="#" className="font-medium text-emerald-600 hover:text-emerald-500 underline underline-offset-2">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
