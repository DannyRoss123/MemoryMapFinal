import Image from 'next/image';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="relative min-h-screen flex flex-col bg-gradient-to-b from-[#cbe7ff] via-[#e8f3ff] to-[#f5fbff] px-6 md:px-12 py-10 overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-white/40 blur-3xl opacity-70" />
        <div className="absolute right-[-6rem] top-0 h-80 w-80 rounded-full bg-white/30 blur-3xl opacity-60" />
      </div>

      <header className="relative z-10 flex items-center justify-between mb-10">
        <Link href="/" className="text-xl md:text-2xl font-semibold text-[#0b4e88]">
          Memory Map
        </Link>
        <div className="flex items-center gap-4 md:gap-6 text-sm md:text-base">
          <Link href="/about" className="text-[#0b4e88]/80 hover:text-[#0b4e88] transition">
            About the Team
          </Link>
          <Link href="/contact" className="text-[#0b4e88]/80 hover:text-[#0b4e88] transition">
            Contact
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-[#0b4e88]/50 px-4 py-2 text-sm font-medium text-[#0b4e88] hover:bg-white/40 transition"
          >
            Login
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 items-center">
        <div className="grid gap-10 lg:gap-16 lg:grid-cols-2 w-full items-center">
          <div className="relative h-64 sm:h-80 lg:h-full rounded-3xl overflow-hidden shadow-2xl border border-white/50">
            <Image
              src="/duke_chapel.png"
              alt="Duke Chapel"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority={false}
            />
          </div>
          <div className="space-y-5 text-[#0b4e88]">
            <p className="inline-flex items-center rounded-full bg-white/60 text-[#0b4e88]/80 text-xs px-3 py-1">
              About the Team
            </p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold leading-tight">Students with a purpose</h1>
            <p className="text-base md:text-lg text-[#1d3b53]/90">
              We are a team from the AI Product Management class who have seen dementia touch our families and friends. Feeling
              disconnected from loved ones and their caregivers was tough. We want Memory Map to make it easier to share
              updates, keep memories close, and help everyone stay in sync.
            </p>
            <p className="text-base md:text-lg text-[#1d3b53]/90">
              We believe technology can feel warm and human. Memory Map is our effort to support families, give caregivers the
              context they need, and make staying connected feel natural.
            </p>
            <div className="flex gap-3">
              <Link
                href="/login"
                className="rounded-full bg-gradient-to-r from-[#5ac2ff] to-[#3f89ff] px-6 py-3 text-sm md:text-base font-semibold text-white shadow-md hover:shadow-lg hover:brightness-105 transition"
              >
                Get started
              </Link>
              <Link
                href="/contact"
                className="rounded-full border border-[#0f5ca8]/30 px-5 py-3 text-sm md:text-base font-medium text-[#0f5ca8] bg-white/40 hover:bg-white/60 transition"
              >
                Contact us
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
