import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { sgd, formatDate, formatTime } from "@/lib/utils";
import { FORMAT_LABELS } from "@/lib/types";

type SearchParams = Promise<{ tab?: "upcoming" | "past" | "pending" }>;

export default async function AppBookings({ searchParams }: { searchParams: SearchParams }) {
  const session = await getSession();
  if (!session) redirect("/login?redirect=/app/bookings");

  const { tab = "upcoming" } = await searchParams;
  const now = new Date();
  const isClient = session.role === "CLIENT";

  // Same query for both roles, just different ID match
  const baseWhere = isClient ? { clientId: session.userId } : undefined;
  const coach = !isClient
    ? await prisma.coach.findUnique({ where: { userId: session.userId } })
    : null;
  const coachWhere = coach ? { coachId: coach.id } : undefined;

  const where = baseWhere ?? coachWhere ?? { clientId: "__none__" };

  const bookings = await prisma.booking.findMany({
    where: {
      ...where,
      ...(tab === "upcoming"
        ? { startsAt: { gte: now }, status: { in: ["CONFIRMED"] } }
        : tab === "pending"
        ? { status: "PENDING" }
        : {
            OR: [
              { status: "COMPLETED" },
              { status: "CANCELLED" },
              { status: "DECLINED" },
              { startsAt: { lt: now } },
            ],
          }),
    },
    include: {
      coach: { include: { user: true } },
      client: true,
    },
    orderBy: { startsAt: tab === "past" ? "desc" : "asc" },
    take: 50,
  });

  const tabs: { key: "upcoming" | "pending" | "past"; label: string }[] = [
    { key: "upcoming", label: "Upcoming" },
    { key: "pending", label: "Pending" },
    { key: "past", label: "Past" },
  ];

  return (
    <div>
      <header className="bg-cream sticky top-0 z-10 px-5 pt-12 pb-2 border-b border-ink-100">
        <h1 className="font-display text-2xl font-semibold mb-3">Bookings</h1>
        <div className="flex gap-1.5">
          {tabs.map((t) => {
            const active = t.key === tab;
            return (
              <Link
                key={t.key}
                href={`/app/bookings?tab=${t.key}`}
                className={`flex-1 text-center py-2 text-sm font-medium rounded-full transition ${
                  active
                    ? "bg-sage-700 text-white"
                    : "bg-white text-ink-700 border border-ink-200"
                }`}
              >
                {t.label}
              </Link>
            );
          })}
        </div>
      </header>

      <section className="px-5 mt-4">
        {bookings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-ink-100 p-8 text-center">
            <div className="text-4xl mb-3">
              {tab === "upcoming" ? "📅" : tab === "pending" ? "⏳" : "📜"}
            </div>
            <p className="text-sm text-ink-700 font-medium">
              {tab === "upcoming"
                ? "No upcoming sessions yet."
                : tab === "pending"
                ? "Nothing pending."
                : "No past sessions to show."}
            </p>
            <Link href="/app/discover" className="btn-primary text-sm mt-4 inline-flex">
              Find a coach
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => {
              const counterparty = isClient ? b.coach.user : b.client;
              const fmt = FORMAT_LABELS[b.format];
              return (
                <div key={b.id} className="bg-white rounded-2xl border border-ink-100 overflow-hidden">
                  <div className="flex items-center gap-3 p-4">
                    {counterparty.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={counterparty.avatarUrl} alt="" className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-sage-100 text-sage-700 flex items-center justify-center font-display font-semibold">
                        {counterparty.name.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium leading-tight truncate">{counterparty.name}</div>
                      <div className="text-xs text-ink-500 mt-0.5">
                        {formatDate(b.startsAt)} · {formatTime(b.startsAt)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">{sgd(b.priceSGD)}</div>
                      <StatusChip status={b.status} />
                    </div>
                  </div>
                  <div className="bg-cream/60 px-4 py-2.5 flex items-center justify-between text-xs">
                    <span className="text-ink-600">
                      {fmt?.icon} {fmt?.label}
                      {b.locationNote && <span className="text-ink-500"> · {b.locationNote}</span>}
                    </span>
                    <Link
                      href={`/chat/${isClient ? b.coach.userId : b.clientId}`}
                      className="text-sage-700 font-semibold"
                    >
                      Message
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function StatusChip({ status }: { status: string }) {
  const styles: Record<string, string> = {
    CONFIRMED: "bg-sage-100 text-sage-800",
    PENDING: "bg-coral-100 text-coral-800",
    COMPLETED: "bg-ink-100 text-ink-700",
    CANCELLED: "bg-white border border-ink-200 text-ink-500",
    DECLINED: "bg-white border border-ink-200 text-ink-500",
  };
  return (
    <span className={`inline-block mt-1 text-[9.5px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded ${styles[status] ?? "bg-ink-100"}`}>
      {status}
    </span>
  );
}
