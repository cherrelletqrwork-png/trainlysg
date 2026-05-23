import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AppCoachCard } from "@/components/app/app-coach-card";

type SearchParams = Promise<{ q?: string; specialty?: string; format?: string }>;

export default async function AppDiscover({ searchParams }: { searchParams: SearchParams }) {
  const { q, specialty, format } = await searchParams;

  const [specialties, coaches] = await Promise.all([
    prisma.specialty.findMany({ orderBy: { name: "asc" } }),
    prisma.coach.findMany({
      where: {
        ...(specialty
          ? { specialties: { some: { specialty: { slug: specialty } } } }
          : {}),
        ...(format ? { formats: { contains: format } } : {}),
        ...(q
          ? {
              OR: [
                { headline: { contains: q, mode: "insensitive" } },
                { tagline: { contains: q, mode: "insensitive" } },
                { user: { name: { contains: q, mode: "insensitive" } } },
              ],
            }
          : {}),
      },
      include: { user: true, specialties: { include: { specialty: true } } },
      orderBy: [{ rating: "desc" }, { reviewCount: "desc" }],
      take: 30,
    }),
  ]);

  return (
    <div>
      {/* App header */}
      <header className="bg-cream sticky top-0 z-10 px-5 pt-12 pb-3 border-b border-ink-100">
        <div className="flex items-center justify-between mb-3">
          <h1 className="font-display text-2xl font-semibold">Discover</h1>
          <Link href="/match" className="text-xs font-semibold text-coral-600 bg-coral-50 px-3 py-1.5 rounded-full">
            ✨ AI Match
          </Link>
        </div>

        {/* Search */}
        <form action="/app/discover" method="get" className="relative">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="w-4 h-4 text-ink-400 absolute left-3.5 top-1/2 -translate-y-1/2"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search coaches, specialties…"
            className="w-full bg-white border border-ink-200 rounded-full pl-10 pr-4 py-2.5 text-sm placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-sage-300"
          />
          {(specialty || format) && (
            <input type="hidden" name="specialty" value={specialty ?? ""} />
          )}
        </form>

        {/* Format chips */}
        <div className="flex gap-1.5 mt-3 overflow-x-auto -mx-5 px-5 scrollbar-hide">
          {["", "HOME", "VIRTUAL", "OUTDOOR", "GYM", "STUDIO"].map((f) => {
            const label = f === "" ? "All" : f === "HOME" ? "🏠 Home" : f === "VIRTUAL" ? "💻 Online" : f === "OUTDOOR" ? "🌳 Outdoor" : f === "GYM" ? "🏋️ Gym" : "🪞 Studio";
            const active = (format ?? "") === f;
            const href = `/app/discover?${new URLSearchParams({
              ...(q ? { q } : {}),
              ...(specialty ? { specialty } : {}),
              ...(f ? { format: f } : {}),
            }).toString()}`;
            return (
              <Link
                key={f || "all"}
                href={href}
                className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium border transition ${
                  active
                    ? "bg-sage-700 text-white border-sage-700"
                    : "bg-white text-ink-700 border-ink-200"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </header>

      {/* Specialty horizontal scroller */}
      <section className="mt-4 mb-2">
        <div className="px-5 text-[11px] font-semibold uppercase tracking-wider text-ink-500 mb-2">
          By specialty
        </div>
        <div className="flex gap-3 overflow-x-auto px-5 pb-2 scrollbar-hide">
          {specialties.map((s) => {
            const active = specialty === s.slug;
            const href = `/app/discover?${new URLSearchParams({
              ...(q ? { q } : {}),
              ...(format ? { format } : {}),
              specialty: active ? "" : s.slug,
            }).toString()}`;
            return (
              <Link
                key={s.id}
                href={href}
                className={`flex-shrink-0 flex flex-col items-center gap-1 w-16 ${active ? "" : "opacity-80"}`}
              >
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${
                    active
                      ? "bg-sage-700 text-white ring-2 ring-sage-300"
                      : "bg-white border border-ink-100"
                  }`}
                >
                  {s.icon}
                </div>
                <div className={`text-[10px] text-center leading-tight ${active ? "font-semibold text-sage-700" : "text-ink-600"}`}>
                  {s.name.split(" ")[0]}
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Results */}
      <section className="px-5 mt-2">
        <div className="text-xs text-ink-500 mb-3">
          {coaches.length} coach{coaches.length === 1 ? "" : "es"}
          {(q || specialty || format) && (
            <Link href="/app/discover" className="ml-2 text-coral-600 font-semibold">
              Clear filters
            </Link>
          )}
        </div>
        {coaches.length === 0 ? (
          <div className="bg-white rounded-2xl border border-ink-100 p-6 text-center text-sm text-ink-600">
            No coaches match — try fewer filters or use AI Match.
          </div>
        ) : (
          <div className="space-y-3">
            {coaches.map((c) => (
              <AppCoachCard key={c.id} coach={c as any} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
