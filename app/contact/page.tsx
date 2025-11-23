import Link from 'next/link';

export default function ContactPage() {
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

      <main className="relative z-10 flex flex-1 items-center justify-center">
        <div className="w-full max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl shadow-xl border border-white/60 p-6 md:p-10 space-y-6">
            <div className="space-y-2">
              <p className="inline-flex items-center rounded-full bg-[#e8f3ff] text-[#0b4e88] text-xs px-3 py-1">Contact</p>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-[#0b4e88] leading-tight">
                We'd love to hear from you
              </h1>
              <p className="text-base md:text-lg text-[#1d3b53]">
                What's on your mind? Share your thoughts or questions and leave your email so we can follow up.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="message" className="block text-sm font-medium text-[#0b4e88]">
                  What's on your mind?
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  className="w-full rounded-2xl border border-[#d0e3f7] bg-white px-4 py-3 text-base text-[#0d3b66] focus:ring-2 focus:ring-[#4a8fe2] focus:outline-none"
                  placeholder="Share your thoughts or questions"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-[#0b4e88]">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="w-full rounded-2xl border border-[#d0e3f7] bg-white px-4 py-3 text-base text-[#0d3b66] focus:ring-2 focus:ring-[#4a8fe2] focus:outline-none"
                  placeholder="you@example.com"
                />
              </div>

              <button
                type="button"
                className="w-full sm:w-auto rounded-full bg-gradient-to-r from-[#5ac2ff] to-[#3f89ff] px-6 py-3 text-sm md:text-base font-semibold text-white shadow-md hover:shadow-lg hover:brightness-105 transition"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
