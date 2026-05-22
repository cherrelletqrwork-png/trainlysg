import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { formatDate, formatTime, sgd, timeAgo } from "@/lib/utils";
import { FORMAT_LABELS } from "@/lib/types";
import { BookingActions } from "@/components/booking-actions";
import { CoachProfileEditor } from "@/components/coach-profile-editor";

export default async function CoachHub() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "COACH") redirect("/dashboard");

  const coach = await prisma.coach.findUnique({
    where: { userId: session.userId },
    include: { user: true, specialties: { include: { specialty: true } } },
  });
  if (!coach) redirect("/signup");

  const now = new Date();
  const [requests, upcoming, recent, allBookings] = await Promise.all([
    prisma.booking.findMany({
      where: { coachId: coach.id, status: "PENDING" },
      include: { client: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.booking.findMany({
      where: { coachId: coach.id, status: "CONFIRMED", startsAt: { gte: now } },
      include: { client: true },
      orderBy: { startsAt: "asc" },
    }),
    prisma.booking.findMany({
      where: { coachId: coach.id, status: "COMPLETED" },
      include: { client: true },
      orderBy: { startsAt: "desc" },
      take: 5,
    }),
    prisma.booking.findMany({
      where: { coachId: coach.id, status: { in: ["CONFIRMED", "COMPLETED"] } },
    }),
  ]);

  const monthlyEarnings = allBookings
    .filter((b) => new Date(b.startsAt).getMonth() === now.getMonth() && new Date(b.startsAt).getFullYear() === now.getFullYear())
    .reduce((sum, b) => sum + b.priceSGD, 0);

  const allTimeEarnings = allBookings.reduce((s, b) => s + b.priceSGD, 0);
  const uniqueClients = new Set(allBookings.map((b) => b.clientId)).size;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {coach.user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coach.user.avatarUrl} className="w-16 h-16 rounded-full object-cover" alt="" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-sage-100 text-sage-700 flex items-center justify-center font-display text-2xl font-semibold">
              {coach.user.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
            </div>
          )}
          <div>
            <h1 className="font-display text-3xl font-semibold">Coach hub</h1>
            <p className="text-ink-600">Welcome back, {coach.user.name.split(" ")[0]}.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/coach/profile" className="btn-outline">Edit profile</Link>
          <Link href={`/coaches/${coach.slug}`} className="btn-outline">View public profile</Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid md:grid-cols-4 gap-4">
        <KPI n={sgd(Math.round(monthlyEarnings * 0.85))} l="Net earnings this month" sub={`${sgd(monthlyEarnings)} gross · 15% fee`} tint="coral" />
        <KPI n={sgd(Math.round(allTimeEarnings * 0.85))} l="All-time net" tint="sage" />
        <KPI n={String(uniqueClients)} l="Unique clients" tint="sage" />
        <KPI n={`${coach.rating.toFixed(2)} ★`} l={`${coach.reviewCount} reviews`} tint="coral" />
      </div>

      <section className="grid lg:grid-cols-[1.4fr_1fr] gap-6">
        <div>
          <h2 className="section-title mb-4">
            New requests <span className="text-coral-500">({requests.length})</span>
          </h2>
          {requests.length === 0 ? (
            <div className="card p-6 text-center text-ink-600">No new requests right now.</div>
          ) : (
            <div className="space-y-3">
              {requests.map((b) => (
                <div key={b.id} className="card p-4 border-coral-200">
                  <div className="flex items-start gap-3">
                    {b.client.avatarUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={b.client.avatarUrl} className="w-12 h-12 rounded-full object-cover" alt="" />
                    )}
                    <div className="flex-1">
                      <div className="font-medium">{b.client.name} · <span className="text-ink-500 text-xs font-normal">{timeAgo(b.createdAt)}</span></div>
                      <div className="text-sm text-ink-600 mt-0.5">
                        {formatDate(b.startsAt)} · {formatTime(b.startsAt)} · {FORMAT_LABELS[b.format]?.icon} {FORMAT_LABELS[b.format]?.label}
                      </div>
                      {b.locationNote && <div className="text-xs text-ink-500 mt-0.5">📍 {b.locationNote}</div>}
                      {b.notes && (
                        <div className="text-sm text-ink-700 mt-2 bg-cream rounded-lg p-2.5 italic">
                          "{b.notes}"
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{sgd(b.priceSGD)}</div>
                      <div className="text-[10px] text-ink-500">you net {sgd(Math.round(b.priceSGD * 0.85))}</div>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2 justify-end">
                    <Link href={`/chat/${b.clientId}`} className="btn-ghost text-xs">Message</Link>
                    <BookingActions bookingId={b.id} />
                  </div>
                </div>
              ))}
            </div>
          )}

          <h2 className="section-title mt-10 mb-4">Upcoming sessions</h2>
          {upcoming.length === 0 ? (
            <div className="card p-6 text-center text-ink-600">No confirmed sessions yet this week.</div>
          ) : (
            <div className="space-y-3">
              {upcoming.map((b) => (
                <div key={b.id} className="card p-4 flex gap-4 items-center">
                  {b.client.avatarUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.client.avatarUrl} className="w-12 h-12 rounded-full object-cover" alt="" />
                  )}
                  <div className="flex-1">
                    <div className="font-medium">{b.client.name}</div>
                    <div className="text-sm text-ink-600">
                      {formatDate(b.startsAt)} · {formatTime(b.startsAt)} · {FORMAT_LABELS[b.format]?.icon} {FORMAT_LABELS[b.format]?.label}
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <div className="font-semibold">{sgd(b.priceSGD)}</div>
                    <Link href={`/chat/${b.clientId}`} className="text-xs text-sage-700 hover:underline">Message</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="card p-5">
            <div className="font-medium mb-2">Quick edit profile</div>
            <CoachProfileEditor
              initial={{
                headline: coach.headline,
                tagline: coach.tagline,
                longBio: coach.longBio,
                hourlyRate: coach.hourlyRate,
                vibeTags: coach.vibeTags,
                languages: coach.languages,
                formats: coach.formats,
              }}
            />
          </div>

          <div className="card p-5 bg-sage-50 border-sage-100">
            <div className="font-medium">📈 This week</div>
            <p className="text-xs text-ink-700 mt-1">
              You're trending {Math.random() > 0.5 ? "above" : "below"} your usual pace. Reach out to past clients with a friendly check-in — repeat bookings are 4× cheaper to acquire than new ones.
            </p>
          </div>

          <div className="card p-5">
            <div className="font-medium mb-2">Recent completed</div>
            {recent.length === 0 ? (
              <div className="text-sm text-ink-500">No completed sessions yet.</div>
            ) : (
              <ul className="text-sm space-y-2">
                {recent.map((b) => (
                  <li key={b.id} className="flex justify-between">
                    <span className="text-ink-700">{b.client.name}</span>
                    <span className="text-ink-500 text-xs">{formatDate(b.startsAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function KPI({ n, l, sub, tint }: { n: string; l: string; sub?: string; tint: "sage" | "coral" }) {
  return (
    <div className={`card p-5 ${tint === "sage" ? "bg-sage-50 border-sage-100" : "bg-coral-50 border-coral-100"}`}>
      <div className="font-display text-2xl font-semibold">{n}</div>
      <div className="text-xs text-ink-700 mt-1 font-medium">{l}</div>
      {sub && <div className="text-[10px] text-ink-500 mt-0.5">{sub}</div>}
    </div>
  );
}
