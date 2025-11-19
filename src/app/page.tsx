import Link from "next/link";
import { ArrowRight, Shield, Zap, Globe, Lock, Check, Cloud } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-zinc-900 selection:bg-emerald-100 selection:text-emerald-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-zinc-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
              <Cloud className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold tracking-tight">ZeCrypt</span>
          </div>
          <div className="flex items-center gap-6">
            <Link 
              href="/login" 
              className="text-sm font-medium text-zinc-600 transition hover:text-zinc-900"
            >
              Sign In
            </Link>
            <Link
              href="/login"
              className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 active:scale-95"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-32 lg:pt-32">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-600 mb-8 animate-fade-in-up">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Zero-knowledge encryption is now standard
          </div>
          
          <h1 className="mx-auto max-w-4xl text-5xl font-bold tracking-tight text-zinc-900 sm:text-6xl lg:text-7xl mb-8">
            Secure cloud storage for <br className="hidden sm:block" />
            <span className="text-emerald-600">private</span> collaboration.
          </h1>
          
          <p className="mx-auto max-w-2xl text-lg text-zinc-600 mb-10 leading-relaxed">
            ZeCrypt ensures your files are encrypted before they leave your device. 
            No one—not even us—can see your data. Experience privacy by design.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="group flex h-12 items-center gap-2 rounded-full bg-emerald-600 px-8 text-sm font-semibold text-white transition hover:bg-emerald-700 active:scale-95"
            >
              Start for free
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </Link>
            <Link
              href="#features"
              className="flex h-12 items-center gap-2 rounded-full border border-zinc-200 px-8 text-sm font-semibold text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 active:scale-95"
            >
              How it works
            </Link>
          </div>

          {/* Hero Image / Dashboard Preview */}
          <div className="mt-20 relative mx-auto max-w-5xl rounded-2xl border border-zinc-200 bg-white p-2 shadow-2xl shadow-zinc-200/50">
            <div className="aspect-[16/10] overflow-hidden rounded-xl bg-zinc-50 relative group">
               <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-zinc-400 font-medium">Dashboard Preview Interface</p>
               </div>
               {/* Abstract UI Elements representation */}
               <div className="absolute top-4 left-4 right-4 h-8 bg-white rounded-lg shadow-sm opacity-50" />
               <div className="absolute top-16 left-4 bottom-4 w-48 bg-white rounded-lg shadow-sm opacity-50 hidden sm:block" />
               <div className="absolute top-16 left-4 sm:left-56 right-4 bottom-4 grid grid-cols-3 gap-4 p-4">
                  {[1,2,3,4,5,6].map(i => (
                    <div key={i} className="bg-white rounded-xl shadow-sm opacity-60" />
                  ))}
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="bg-zinc-50 py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-16 max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
              Privacy without compromise.
            </h2>
            <p className="mt-4 text-lg text-zinc-600">
              We built ZeCrypt to prove that secure software doesn&apos;t have to be difficult to use.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Shield,
                title: "End-to-End Encrypted",
                desc: "Client-side encryption (AES-256) means your files are locked before upload."
              },
              {
                icon: Zap,
                title: "Lightning Fast",
                desc: "Optimized for speed. Encryption happens instantly in your browser."
              },
              {
                icon: Globe,
                title: "Access Anywhere",
                desc: "Your private vault is accessible from any device, anywhere in the world."
              },
              {
                icon: Lock,
                title: "Zero Knowledge",
                desc: "We don't hold your keys. Your password is the only way to decrypt your data."
              },
              {
                icon: Check,
                title: "Simple Sharing",
                desc: "Securely share files with others using time-limited, encrypted links."
              },
              {
                icon: Cloud,
                title: "Automatic Backup",
                desc: "Redundant storage ensures your data is safe from hardware failures."
              }
            ].map((feature, i) => (
              <div 
                key={i} 
                className="group rounded-2xl bg-white p-8 shadow-sm transition-all hover:shadow-md hover:-translate-y-1"
              >
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-3 text-lg font-semibold text-zinc-900">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-zinc-500">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl mb-6">
            Ready to secure your digital life?
          </h2>
          <p className="text-lg text-zinc-600 mb-10">
            Join thousands of users who trust ZeCrypt with their most sensitive data.
          </p>
          <Link
            href="/login"
            className="inline-flex h-12 items-center gap-2 rounded-full bg-zinc-900 px-8 text-sm font-semibold text-white transition hover:bg-zinc-800 active:scale-95"
          >
            Create free account
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-100 bg-white py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 sm:flex-row">
          <div className="flex items-center gap-2 text-zinc-900">
            <Cloud className="h-5 w-5 fill-current" />
            <span className="font-bold">ZeCrypt</span>
          </div>
          <p className="text-sm text-zinc-500">
            © {new Date().getFullYear()} ZeCrypt Drive. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="#" className="text-sm text-zinc-500 hover:text-zinc-900">Privacy</Link>
            <Link href="#" className="text-sm text-zinc-500 hover:text-zinc-900">Terms</Link>
            <Link href="#" className="text-sm text-zinc-500 hover:text-zinc-900">Contact</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
