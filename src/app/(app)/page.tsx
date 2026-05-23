import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getSiteContent } from "@/lib/site-content";
import { sgd, formatDate, formatTime } from "@/lib/utils";
import { AppCoachCard } from "@/components/app/app-coach-card";
import { FORMAT_LABELS } from "@/lib/types";

export default async function AppHome() {
  const session = await getSession();
  const site = await getSiteContent();

  const [featured, specialties, upcoming, user] = await Promise.all([
    prisma.coach.findMany({
      where: { isFeatured: true },
      include: { user: true, specialties: { include: { specialty: true } } },
      take: 4,
    }),
    prisma.specialty.findMany({ take: 8 }),
    session?.role === "CLIENT"
      ? prisma.booking.findMany({
          where: {
            clientId: session.userId,
            startsAt: { gte: new Date() },
            status: { in: ["PENDING", "CONFIRMED"] },
          },
          include: { coach: { include: { user: true } } },
          orderBy: { startsAt: "asc" },
          take: 1,
        })
      : Promise.resolve([]),
    session ? prisma.user.findUnique({ where: { id: session.userId } }) : Promise.resolve(null),
  ]);

  const firstName = user?.name?.split(" ")[0] ?? "";
  const next = upcoming[0];

  return (
    <div>
      {/* App header — soft gradient like the OS shading */}
      <header className="bg-gradient-to-b from-sage-50 to-cream px-5 pt-12 pb-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-ink-500 font-semibold">
              {firstName ? `Hi, ${firstName}` : "Welcome to"}
            </div>
            <h1 className="font-display text-3xl font-semibold mt-0.5">{site.brand.name}</h1>
          </div>
          {user?.avatarUrl ? (
            <Link href="/app/profile">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={user.avatarUrl} alt="Profile" className="w-11 h-11 rounded-full object-cover ring-2 ring-white shadow-card" />
            </Link>
          ) : (
            <Link
              href={session ? "/app/profile" : "/login"}
              className="w-11 h-11 rounded-full bg-sage-100 text-sage-700 flex items-center justify-center font-display text-lg font-semibold ring-2 ring-white shadow-card"
            >
              {firstName.charAt(0) || "?"}
            </Link>
          )}
        </div>

        {/* Search nudge */}
        <Link
          href="/app/discover"
          className="mt-5 flex items-center gap-2.5 bg-white border border-ink-100 rounded-2xl px-4 py-3 shadow-card active:bg-ink-50"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5 text-ink-400">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <span className="text-sm text-ink-500">Search coaches, specialties…</span>
        </Link>
      </header>

      {/* Next session card — only if there is one */}
      {next && (
        <section className="px-5 mt-6">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-500 mb-2">Next session</div>
          <Link
            href={`/coaches/${next.coach.slug}`}
            className="block bg-gradient-to-br from-sage-700 to-sage-800 text-white rounded-2xl p-5 shadow-lift active:scale-[0.99] transition"
          >
            <div className="flex items-center gap-3">
              {next.coach.user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={next.coach.user.avatarUrl} alt="" className="w-12 h-12 rounded-full object-cover ring-2 ring-white/30" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center font-display font-semibold">
                  {next.coach.user.name.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-medium leading-tight truncate">{next.coach.user.name}</div>
                <div className="text-sm text-sage-100/90 truncate">
                  {formatDate(next.startsAt)} · {formatTime(next.startsAt)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-sage-100/80">{FORMAT_LABELS[next.format]?.icon}</div>
                <div className="text-sm font-semibold">{sgd(next.priceSGD)}</div>
              </div>
            </div>
            <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] bg-white/15 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-sage-200 animate-pulse" />
              {next.status === "CONFIRMED" ? "Confirmed" : "Awaiting coach confirmation"}
            </div>
          </Link>
        </section>
      )}

      {/* Quick actions */}
      <section className="px-5 mt-6">
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/match"
            className="bg-coral-500 text-white rounded-2xl p-4 active:scale-[0.98] transition shadow-card"
          >
            <div className="text-2xl">✨</div>
            <div className="font-medium mt-1.5">AI Match</div>
            <div className="text-[11px] text-white/85 mt-0.5">60-second quiz</div>
          </Link>
          <Link
            href="/app/discover"
            className="bg-white border border-ink-100 rounded-2xl p-4 active:bg-ink-50 shadow-card"
          >
            <div className="text-2xl">🔍</div>
            <div className="font-medium mt-1.5">Browse coaches</div>
            <div className="text-[11px] text-ink-500 mt-0.5">Filter by anything</div>
          </Link>
        </div>
      </section>

      {/* Specialties grid */}
      <section className="px-5 mt-7">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg font-semibold">What you'll find</h2>
          <Link href="/coaches" className="text-xs text-sage-700 font-semibold">See all →</Link>
        </div>
        <div className="grid grid-cols-4 gap-2.5">
          {specialties.map((s) => (
            <Link
              key={s.id}
              href={`/coaches?specialty=${s.slug}`}
              className="flex flex-col items-center gap-1.5 bg-white rounded-2xl border border-ink-100 px-2 py-3 active:bg-ink-50"
            >
              <div className="text-2xl">{s.icon}</div>
              <div className="text-[10.5px] font-medium text-center leading-tight">{s.name}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured coaches */}
      <section className="px-5 mt-7">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg font-semibold">Featured this week</h2>
          <Link href="/app/discover" className="text-xs text-sage-700 font-semibold">More →</Link>
        </div>
        <div className="space-y-3">
          {featured.map((c) => (
            <AppCoachCard key={c.id} coach={c as any} />
          ))}
        </div>
      </section>

      {/* Trust strip */}
      <section className="px-5 mt-7">
        <div className="bg-white rounded-2xl border border-ink-100 p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-sage-700 mb-2">
            Trainly Protect
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-base">🛡️</span>
              <span>S$1M insurance on every session</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base">🪪</span>
              <span>Singpass-verified coaches</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base">↩️</span>
              <span>48hr money-back guarantee</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base">📋</span>
              <span>Certifications cross-checked</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
