import Image from 'next/image';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="relative flex min-h-screen flex-col bg-gradient-to-b from-[#cbe7ff] via-[#e8f3ff] to-[#f5fbff] overflow-hidden">
      {/* Atmosphere */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-white/50 blur-3xl opacity-70" />
        <div className="absolute right-[-6rem] top-0 h-80 w-80 rounded-full bg-white/40 blur-3xl opacity-70" />
        <div className="absolute left-1/3 bottom-[-6rem] h-96 w-96 rounded-full bg-white/30 blur-3xl opacity-60" />
      </div>

      {/* Nav */}
      <header className="relative z-10 flex items-center justify-between px-6 md:px-12 py-4">
        <div className="text-xl md:text-2xl font-semibold text-[#0b4e88]">Memory Map</div>
        <div className="flex items-center gap-4 md:gap-6 text-sm md:text-base">
          <Link href="#about" className="text-[#0b4e88]/80 hover:text-[#0b4e88] transition">
            About
          </Link>
          <Link href="#contact" className="text-[#0b4e88]/80 hover:text-[#0b4e88] transition">
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

      {/* Hero */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-6 md:px-12 pb-12">
        <div className="max-w-6xl w-full grid gap-10 md:grid-cols-2 items-center">
          {/* Left */}
          <div className="space-y-5">
            <span className="inline-flex items-center rounded-full bg-white/60 text-[#0b4e88]/80 text-xs px-3 py-1">
              Supportive care, made simple
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-[#0b4e88] leading-tight">
              A clear path to supportive care
            </h1>
            <p className="text-base md:text-lg text-[#1d3b53]/90 mt-2 max-w-xl">
              Memory Map helps patients and caregivers stay connected, share updates, and keep important details organized
              with calm, intuitive tools built for everyday support.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                href="/login"
                className="rounded-full bg-gradient-to-r from-[#5ac2ff] to-[#3f89ff] px-6 py-3 text-sm md:text-base font-semibold text-white shadow-md hover:shadow-lg hover:brightness-105 transition text-center"
              >
                Get started
              </Link>
              <Link
                href="#learn-more"
                className="rounded-full border border-[#0f5ca8]/30 px-5 py-3 text-sm md:text-base font-medium text-[#0f5ca8] bg-white/40 hover:bg-white/60 transition text-center"
              >
                Learn more
              </Link>
            </div>
          </div>

          {/* Right */}
          <div className="relative flex items-center justify-center">
            {/* Glow */}
            <div className="absolute h-80 w-80 md:h-[26rem] md:w-[26rem] rounded-full bg-white/70 blur-3xl" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-radial from-white/80 via-white/0 to-transparent opacity-80 blur-3xl" />
            </div>
            {/* Circle image */}
            <div className="relative h-72 w-72 md:h-96 md:w-96 rounded-full overflow-hidden shadow-2xl border border-white/60">
              <Image
                src="/hero.png"
                alt="Person relaxing and listening to audio"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 18rem, 24rem"
                priority
              />
            </div>

            {/* Floating cards */}
            <div className="hidden md:block absolute -top-6 -left-4 bg-white rounded-2xl shadow-lg px-4 py-3 text-xs text-[#1d3b53]">
              <p className="font-semibold text-sm">Daily memory check-in</p>
              <p className="text-xs text-[#1d3b53]/70 mt-1">“My granddaughter saw how I’m doing today.”</p>
            </div>
            <div className="hidden md:block absolute -bottom-6 -right-4 bg-white rounded-2xl shadow-lg px-4 py-3 text-xs text-[#1d3b53]">
              <p className="font-semibold text-sm">Mood</p>
              <p className="text-xs text-[#1d3b53]/70 mt-1">My caregiver knows how I’m feeling now.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
