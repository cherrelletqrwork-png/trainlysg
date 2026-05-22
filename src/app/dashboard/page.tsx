import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { formatDate, formatTime, sgd } from "@/lib/utils";
import { FORMAT_LABELS } from "@/lib/types";
import { ProgressChart } from "@/components/progress-chart";
import { LogProgressForm } from "@/components/log-progress-form";

export default async function Dashboard() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "COACH") redirect("/coach");

  const now = new Date();
  const [upcoming, past, favourites, progress, user] = await Promise.all([
    prisma.booking.findMany({
      where: { clientId: session.userId, startsAt: { gte: now }, status: { in: ["PENDING", "CONFIRMED"] } },
      include: { coach: { include: { user: true } } },
      orderBy: { startsAt: "asc" },
    }),
    prisma.booking.findMany({
      where: { clientId: session.userId, OR: [{ status: "COMPLETED" }, { startsAt: { lt: now } }] },
      include: { coach: { include: { user: true } } },
      orderBy: { startsAt: "desc" },
      take: 5,
    }),
    prisma.favourite.findMany({
      where: { userId: session.userId },
      include: { coach: { include: { user: true, specialties: { include: { specialty: true } } } } },
    }),
    prisma.progressEntry.findMany({ where: { userId: session.userId }, orderBy: { recordedAt: "asc" } }),
    prisma.user.findUnique({ where: { id: session.userId } }),
  ]);

  const weights = progress.filter((p) => p.metric === "weight");
  const energy = progress.filter((p) => p.metric === "energy");
  const sessionCount = past.filter((b) => b.status === "COMPLETED").length;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          {user?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatarUrl} className="w-16 h-16 rounded-full object-cover" alt="" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-sage-100 text-sage-700 flex items-center justify-center font-display text-2xl font-semibold">
              {(user?.name || "?").split(" ").map((p) => p[0]).slice(0, 2).join("")}
            </div>
          )}
          <div>
            <h1 className="font-display text-3xl font-semibold">Hi, {user?.name.split(" ")[0]} 👋</h1>
            <p className="text-ink-600">Here's how you're tracking.</p>
          </div>
        </div>
        <Link href="/dashboard/profile" className="btn-outline text-sm">
          Edit profile
        </Link>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <KPI n={String(sessionCount)} l="Sessions completed" tint="sage" />
        <KPI n={String(upcoming.length)} l="Upcoming sessions" tint="coral" />
        <KPI n={String(favourites.length)} l="Favourite coaches" tint="sage" />
        <KPI
          n={weights.length >= 2 ? `${(weights[0].value - weights[weights.length - 1].value).toFixed(1)}kg` : "—"}
          l="Weight change"
          tint="coral"
        />
      </div>

      <section className="grid lg:grid-cols-[1.4fr_1fr] gap-6">
        <div>
          <h2 className="section-title mb-4">Upcoming sessions</h2>
          {upcoming.length === 0 ? (
            <div className="card p-6 text-center text-ink-600">
              No sessions booked yet. <Link href="/coaches" className="text-sage-700 font-medium">Find a coach →</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.map((b) => (
                <div key={b.id} className="card p-4 flex gap-4 items-center">
                  {b.coach.user.avatarUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.coach.user.avatarUrl} className="w-14 h-14 rounded-xl object-cover" alt="" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="font-medium">{b.coach.user.name}</div>
                      <span className={`chip text-[10px] ${
                        b.status === "CONFIRMED" ? "bg-sage-100 text-sage-800" : "bg-coral-100 text-coral-800"
                      }`}>
                        {b.status === "CONFIRMED" ? "✓ Confirmed" : "⏳ Pending"}
                      </span>
                    </div>
                    <div className="text-sm text-ink-600">
                      {formatDate(b.startsAt)} · {formatTime(b.startsAt)}
                    </div>
                    <div className="text-xs text-ink-500">
                      {FORMAT_LABELS[b.format]?.icon} {FORMAT_LABELS[b.format]?.label}
                      {b.locationNote && ` · ${b.locationNote}`}
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <div className="font-semibold">{sgd(b.priceSGD)}</div>
                    <Link href={`/chat/${b.coach.userId}`} className="text-xs text-sage-700 font-medium hover:underline">
                      Message
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="section-title mb-4">Progress</h2>
          <div className="card p-5">
            <div className="text-sm text-ink-600 mb-1">Weight (kg)</div>
            <ProgressChart
              data={weights.map((w) => ({ x: new Date(w.recordedAt).getTime(), y: w.value }))}
              color="#3f694e"
            />
          </div>
          <div className="card p-5 mt-3">
            <div className="text-sm text-ink-600 mb-1">Energy (/10)</div>
            <ProgressChart
              data={energy.map((w) => ({ x: new Date(w.recordedAt).getTime(), y: w.value }))}
              color="#ff5a31"
            />
          </div>
          <div className="card p-5 mt-3">
            <div className="text-sm font-medium mb-2">Log today</div>
            <LogProgressForm />
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">Your favourites</h2>
          <Link href="/coaches" className="text-sm text-sage-700 font-medium hover:underline">Browse more</Link>
        </div>
        {favourites.length === 0 ? (
          <div className="card p-6 text-center text-ink-600">No favourites yet — tap ❤ on any coach profile to save them here.</div>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {favourites.map((f) => (
              <Link
                key={f.id}
                href={`/coaches/${f.coach.slug}`}
                className="card p-4 flex gap-3 items-center hover:shadow-lift transition"
              >
                {f.coach.user.avatarUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={f.coach.user.avatarUrl} className="w-12 h-12 rounded-full object-cover" alt="" />
                )}
                <div className="min-w-0">
                  <div className="font-medium truncate">{f.coach.user.name}</div>
                  <div className="text-xs text-ink-500 truncate">{f.coach.specialties.map((s) => s.specialty.name).join(" · ")}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="section-title mb-4">Past sessions</h2>
        {past.length === 0 ? (
          <div className="card p-6 text-center text-ink-600">Your session history will appear here.</div>
        ) : (
          <div className="space-y-2">
            {past.map((b) => (
              <div key={b.id} className="card p-4 flex justify-between items-center">
                <div>
                  <div className="font-medium">{b.coach.user.name}</div>
                  <div className="text-xs text-ink-500">{formatDate(b.startsAt)} · {sgd(b.priceSGD)}</div>
                </div>
                <Link href={`/coaches/${b.coach.slug}`} className="btn-outline text-xs">Rebook</Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function KPI({ n, l, tint }: { n: string; l: string; tint: "sage" | "coral" }) {
  return (
    <div className={`card p-5 ${tint === "sage" ? "bg-sage-50 border-sage-100" : "bg-coral-50 border-coral-100"}`}>
      <div className="font-display text-3xl font-semibold">{n}</div>
      <div className="text-xs text-ink-600 mt-1">{l}</div>
    </div>
  );
}
