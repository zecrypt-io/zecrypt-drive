import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white px-6 py-12 font-sans text-zinc-900 sm:px-10 lg:px-20">
      <div className="mx-auto flex max-w-4xl flex-col gap-12">
        <header className="flex flex-col gap-2">
          <p className="text-sm uppercase tracking-widest text-zinc-500">
            ZeCrypt Drive
          </p>
          <h1 className="text-4xl font-semibold leading-tight text-zinc-900 sm:text-5xl">
            Zero-knowledge storage that travels with you.
          </h1>
          <p className="text-base text-zinc-600 sm:text-lg">
            Encrypt files before they leave your device, organize folders with a
            clean mobile-first dashboard, and share securely with anyone.
          </p>
        </header>

        <div className="flex flex-col gap-6 rounded-3xl bg-white/80 p-6 shadow-lg ring-1 ring-black/5 sm:p-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-wide text-emerald-600">
                Ready to go
              </p>
              <h2 className="text-2xl font-semibold text-zinc-900 sm:text-3xl">
                Open your encrypted drive
              </h2>
              <p className="text-sm text-zinc-500 sm:text-base">
                Sign in with Firebase Auth to access uploads and folders.
              </p>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-6 py-3 text-base font-medium text-white shadow-lg shadow-emerald-600/40 transition hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
            >
              Sign In / Open Drive
            </Link>
          </div>
        </div>

        <section className="grid gap-6 sm:grid-cols-2">
          <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
            <h3 className="text-base font-semibold text-zinc-900">
              Client-side encryption
            </h3>
            <p className="mt-2 text-sm text-zinc-600">
              Web Crypto keeps keys on your device. Uploads are AES-GCM blobs,
              and only you hold the key.
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
            <h3 className="text-base font-semibold text-zinc-900">
              Mobile-first dashboard
            </h3>
            <p className="mt-2 text-sm text-zinc-600">
              Upload, search, and organize from any screen size with a clean,
              thumb-friendly UI.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
