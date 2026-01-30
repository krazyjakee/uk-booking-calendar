import { notFound } from "next/navigation";
import db from "@/lib/db";

export const metadata = {
  title: "Widget Preview",
  robots: "noindex, nofollow",
};

interface Props {
  params: Promise<{ tradesmanId: string }>;
}

export default async function ChatbotPreviewPage({ params }: Props) {
  const { tradesmanId } = await params;

  // Verify the tradesman exists
  const tradesman = await db("users")
    .where("id", tradesmanId)
    .first<{ id: string; name: string; business_name?: string } | undefined>();

  if (!tradesman) notFound();

  const businessName = tradesman.business_name || tradesman.name;

  return (
    <div className="min-h-screen bg-white text-gray-900" style={{ fontFamily: "system-ui, sans-serif" }}>
      {/* Mock website header */}
      <header className="border-b border-gray-200 bg-slate-800 text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="text-lg font-semibold">{businessName}</span>
          <nav className="hidden gap-6 text-sm text-slate-300 sm:flex">
            <span className="cursor-default hover:text-white">Home</span>
            <span className="cursor-default hover:text-white">Services</span>
            <span className="cursor-default hover:text-white">About</span>
            <span className="cursor-default hover:text-white">Contact</span>
          </nav>
        </div>
      </header>

      {/* Hero section */}
      <section className="bg-slate-700 px-6 py-16 text-center text-white">
        <h1 className="mx-auto max-w-2xl text-3xl font-bold leading-tight sm:text-4xl">
          Professional Trade Services You Can Trust
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-slate-300">
          Reliable, experienced, and fully insured. Book your appointment today
          and let us take care of the rest.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <span className="inline-block cursor-default rounded-md bg-amber-500 px-6 py-2.5 text-sm font-medium text-white">
            Get a Quote
          </span>
          <span className="inline-block cursor-default rounded-md border border-white/30 px-6 py-2.5 text-sm font-medium text-white">
            Our Services
          </span>
        </div>
      </section>

      {/* Services */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="mb-8 text-center text-2xl font-semibold">Our Services</h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            { title: "Repairs & Maintenance", desc: "Fast, reliable repairs for your home or business." },
            { title: "Installations", desc: "Professional installations with quality materials." },
            { title: "Emergency Callouts", desc: "Available when you need us most — 24/7 support." },
          ].map((s) => (
            <div
              key={s.title}
              className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center"
            >
              <h3 className="mb-2 font-semibold">{s.title}</h3>
              <p className="text-sm text-gray-600">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-t border-gray-200 bg-gray-50 px-6 py-16">
        <h2 className="mb-8 text-center text-2xl font-semibold">
          What Our Customers Say
        </h2>
        <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-2">
          {[
            { name: "Sarah T.", text: "Brilliant service from start to finish. Would recommend to anyone." },
            { name: "James M.", text: "Prompt, professional, and reasonably priced. Five stars." },
          ].map((t) => (
            <blockquote
              key={t.name}
              className="rounded-lg border border-gray-200 bg-white p-5"
            >
              <p className="text-sm italic text-gray-700">&ldquo;{t.text}&rdquo;</p>
              <footer className="mt-3 text-xs font-medium text-gray-500">
                — {t.name}
              </footer>
            </blockquote>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-slate-800 px-6 py-8 text-center text-sm text-slate-400">
        <p>&copy; {new Date().getFullYear()} {businessName}. All rights reserved.</p>
        <p className="mt-1 text-xs text-slate-500">
          This is a preview page — not a real website.
        </p>
      </footer>

      {/* Embed the actual chat widget */}
      <script
        src="/widget.js"
        data-tradesman-id={tradesmanId}
        data-position="bottom-right"
        async
      />
    </div>
  );
}
