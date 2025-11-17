import Link from "next/link";

const highlights = [
  {
    title: "Zero-knowledge security",
    description:
      "End-to-end AES-256 + WebCrypto. Keys never touch our servers.",
    accent: "from-emerald-500/20 via-emerald-500/5 to-transparent",
  },
  {
    title: "Instant file search",
    description:
      "Browse gigabytes of encrypted files with blazing-fast lookups.",
    accent: "from-sky-500/20 via-sky-500/5 to-transparent",
  },
  {
    title: "Mobile-first UX",
    description:
      "Feels like a native app on every screen, with haptics-ready UI.",
    accent: "from-indigo-500/20 via-indigo-500/5 to-transparent",
  },
];

const timeline = [
  { label: "Upload", detail: "Drag & drop, chunked & resilient" },
  { label: "Encrypt", detail: "Processed locally with WebCrypto" },
  { label: "Store", detail: "DigitalOcean Spaces + Firestore metadata" },
  { label: "Share", detail: "Link-based access with revocable keys" },
];

export default function Home() {
  return (
    <main className="relative overflow-hidden bg-[#05060a] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.25),_transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(59,130,246,0.2),_transparent_45%)]" />
        <div className="animate-gradient absolute left-1/2 top-40 h-64 w-64 -translate-x-1/2 rounded-full bg-gradient-to-r from-emerald-500/40 via-cyan-400/30 to-indigo-500/30 blur-[120px]" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full flex-col gap-16 px-5 pb-16 pt-20 sm:px-8 lg:px-12 xl:px-16 2xl:px-20">
        <header className="flex flex-col gap-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.3em] text-emerald-200">
            ZeCrypt Drive
            <span className="h-1 w-1 rounded-full bg-emerald-300" />
            Zero-knowledge cloud
          </div>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start xl:grid-cols-[1.2fr_0.8fr]">
            <div>
              <h1 className="text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl xl:text-7xl lg:leading-[1.1]">
                Secure every file, share every idea, trust every moment.
          </h1>
              <p className="mt-5 text-base text-white/70 sm:text-lg lg:text-xl lg:max-w-3xl">
                ZeCrypt Drive is the zero-knowledge workspace for teams that
                demand privacy by design. Encrypt on the client, collaborate
                everywhere.
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/login"
                  className="group inline-flex items-center justify-center gap-3 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:translate-y-0.5 hover:bg-white/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  Launch Encrypted Drive
                  <span className="transition group-hover:translate-x-1">
                    →
                  </span>
                </Link>
                <Link
                  href="#features"
                  className="inline-flex items-center justify-center gap-3 rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white/90 transition hover:border-white/50 hover:bg-white/5"
                >
                  Watch the Story
                  <span className="text-white/60">▶</span>
                </Link>
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl shadow-emerald-500/10 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.35em] text-white/50">
                Live Snapshot
              </p>
              <div className="mt-4 space-y-4 text-base font-medium text-white/90">
                <div className="flex items-center justify-between">
                  <span>Files protected</span>
                  <span className="text-emerald-300">1,248,392</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Avg. decrypt time</span>
                  <span className="text-emerald-300">142ms</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Realtime sessions</span>
                  <span className="text-emerald-300">842</span>
                </div>
              </div>
            </div>
        </div>
        </header>

        <section
          id="features"
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 lg:gap-8"
        >
          {highlights.map((item) => (
            <div
              key={item.title}
              className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/20 transition hover:-translate-y-1"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${item.accent}`}
              />
              <div className="relative">
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="mt-3 text-sm text-white/70">{item.description}</p>
              </div>
            </div>
          ))}
        </section>

        <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] xl:gap-12">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.4em] text-white/50">
              Workflow
            </p>
            <h2 className="mt-3 text-2xl font-semibold">
              Built for encrypted collaboration.
            </h2>
            <div className="mt-8 space-y-4">
              {timeline.map((step, index) => (
                <div
                  key={step.label}
                  className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-sm font-semibold">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium">{step.label}</p>
                    <p className="text-sm text-white/60">{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-6 text-white/90 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.4em] text-white/50">
              Experience
            </p>
            <h3 className="mt-3 text-2xl font-semibold">
              Designed for humans. Trusted by teams.
            </h3>
            <p className="mt-5 text-sm text-white/70">
              “ZeCrypt feels like carrying a personal vault. Everything is fast,
              delightful, and private by default.”
            </p>
            <div className="mt-8 flex flex-col gap-2 text-sm text-white/60">
              <p>✔ 90% faster onboarding with guided encryption</p>
              <p>✔ Inline previews without leaving your browser</p>
              <p>✔ Offline-ready mobile experience</p>
            </div>
            <div className="mt-10 flex items-center gap-3 text-sm text-white/50">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.8)]" />
              SOC2 & GDPR compliant infrastructure
            </div>
          </div>
        </section>
        </div>
      </main>
  );
}
