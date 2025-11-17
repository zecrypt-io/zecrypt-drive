 "use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";

const benefits = [
  {
    title: "End-to-end encryption",
    description: "Your files are encrypted before they leave your device.",
  },
  {
    title: "Instant access",
    description: "Sign in securely and pick up your work from any device.",
  },
  {
    title: "Private by design",
    description: "We never see your content. You control the keys.",
  },
];

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
    <main className="min-h-screen bg-gradient-to-br from-sky-950 via-slate-950 to-slate-900 text-white">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col items-center px-4 py-10 sm:px-6 lg:flex-row lg:items-stretch lg:gap-12 lg:py-16">
        <section className="flex w-full flex-1 flex-col justify-center gap-8 lg:max-w-md">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.3em] text-sky-200">
            ZeCrypt Drive
            <span className="h-1 w-1 rounded-full bg-emerald-300" />
            Secure Cloud
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.25),_transparent_55%)]" />
            <div className="relative flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-emerald-400 shadow-lg shadow-sky-500/40">
                <span className="text-3xl">🔒</span>
              </div>
              <div className="space-y-1">
                <p className="text-sm uppercase tracking-[0.25em] text-sky-200">
                  Hello!
                </p>
                <p className="text-lg font-semibold">
                  Secure your files with ZeCrypt Drive.
                </p>
                <p className="text-xs text-sky-100/70">
                  Your personal vault for documents, photos, and everything that
                  matters.
                </p>
              </div>
            </div>
          </div>

          <div className="hidden gap-4 sm:grid sm:grid-cols-3">
            {benefits.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-white/10 bg-white/5 p-3 text-xs"
              >
                <p className="font-semibold text-sky-50">{item.title}</p>
                <p className="mt-1 text-sky-100/70">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 w-full max-w-md lg:mt-0">
          <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-8 shadow-2xl shadow-black/40 backdrop-blur">
            <h1 className="text-center text-2xl font-semibold sm:text-3xl">
              Welcome to ZeCrypt Drive
            </h1>
            <p className="mt-2 text-center text-sm text-sky-100/80">
              Secure · Private · Encrypted
            </p>

            <div className="mt-8 space-y-4">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="flex w-full items-center justify-center gap-3 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-sky-500/20 transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 via-red-500 to-yellow-400 text-xs font-bold text-white">
                  G
                </span>
                <span>
                  {loading ? "Signing in..." : "Sign in with Google"}
                </span>
              </button>

              <div className="flex items-center gap-3 text-[11px] text-sky-100/70">
                <span className="h-px flex-1 bg-slate-700" />
                <span>or</span>
                <span className="h-px flex-1 bg-slate-700" />
              </div>

              <button
                type="button"
                disabled
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-xs font-medium text-sky-100/80 opacity-70"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-600 text-[10px]">
                  ✉
                </span>
                Sign in with Email (coming soon)
              </button>
            </div>

            <div className="mt-6 space-y-2 text-xs text-sky-100/80">
              {error && (
                <p
                  className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-[11px] text-red-100"
                  role="alert"
                >
                  {error}
                </p>
              )}
              {user && !error && (
                <p
                  className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-[11px] text-emerald-100"
                  role="status"
                >
                  Signed in successfully. Redirecting to your drive…
                </p>
              )}
            </div>

            <p className="mt-4 text-[11px] text-sky-100/80">
              We never store your password. Authentication is handled securely
              by Google and Firebase Auth.
            </p>

            <p className="mt-6 text-center text-[11px] text-sky-100/70">
              By signing in you agree to our{" "}
              <Link
                href="/privacy"
                className="font-medium text-sky-200 underline underline-offset-2"
              >
                Privacy Policy
              </Link>{" "}
              and{" "}
              <Link
                href="/terms"
                className="font-medium text-sky-200 underline underline-offset-2"
              >
                Terms
              </Link>
              .
            </p>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-sky-100/60">
            <span className="inline-flex h-1 w-1 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.9)]" />
            End-to-end encryption. Zero-knowledge by default.
          </div>
        </section>
      </div>
    </main>
  );
}


