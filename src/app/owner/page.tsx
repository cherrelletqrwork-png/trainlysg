import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { sgd, formatDate, formatTime, timeAgo } from "@/lib/utils";
import { AdminUserTable, type AdminUserRow } from "@/components/admin-user-table";

export default async function OwnerHome() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "OWNER") redirect("/dashboard");

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);

  const [users, coaches, bookings, recentBookings, recentSignups] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.coach.findMany({ include: { user: true } }),
    prisma.booking.findMany(),
    prisma.booking.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { client: true, coach: { include: { user: true } } },
    }),
    prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
  ]);

  const clientCount = users.filter((u) => u.role === "CLIENT").length;
  const coachCount = users.filter((u) => u.role === "COACH").length;
  const ownerCount = users.filter((u) => u.role === "OWNER").length;
  const newThisMonth = users.filter((u) => u.createdAt >= thirtyDaysAgo).length;

  const completed = bookings.filter((b) => b.status === "COMPLETED");
  const grossRevenue = completed.reduce((s, b) => s + b.priceSGD, 0);
  const platformFee = Math.round(grossRevenue * 0.15);

  const pending = bookings.filter((b) => b.status === "PENDING").length;
  const confirmed = bookings.filter((b) => b.status === "CONFIRMED").length;

  const rows: AdminUserRow[] = users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role as "CLIENT" | "COACH" | "OWNER",
    location: u.location,
    avatarUrl: u.avatarUrl,
    createdAt: u.createdAt.toISOString(),
    isSelf: u.id === session.userId,
  }));

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="chip bg-ink-900 text-white mb-2">OWNER</div>
          <h1 className="font-display text-3xl font-semibold">Trainly admin</h1>
          <p className="text-ink-600">Hi {session.name.split(" ")[0]} — here's how the business is doing.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/owner/profile" className="btn-outline">My profile</Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid md:grid-cols-4 gap-4">
        <KPI n={String(users.length)} l="Total users" sub={`${ownerCount} owner · ${coachCount} coach · ${clientCount} client`} tint="sage" />
        <KPI n={String(recentSignups)} l="Signups last 7 days" sub={`${newThisMonth} in last 30 days`} tint="coral" />
        <KPI n={String(bookings.length)} l="Total bookings" sub={`${confirmed} confirmed · ${pending} pending`} tint="sage" />
        <KPI n={sgd(platformFee)} l="Platform earnings (lifetime)" sub={`${sgd(grossRevenue)} gross GMV`} tint="coral" />
      </div>

      {/* Recent bookings */}
      <section>
        <h2 className="section-title mb-4">Latest bookings</h2>
        {recentBookings.length === 0 ? (
          <div className="card p-6 text-center text-ink-600">No bookings yet.</div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-cream text-ink-600 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="text-left px-4 py-2.5">When</th>
                    <th className="text-left px-4 py-2.5">Client</th>
                    <th className="text-left px-4 py-2.5">Coach</th>
                    <th className="text-left px-4 py-2.5">Status</th>
                    <th className="text-right px-4 py-2.5">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBookings.map((b) => (
                    <tr key={b.id} className="border-t border-ink-100">
                      <td className="px-4 py-3">
                        <div>{formatDate(b.startsAt)} · {formatTime(b.startsAt)}</div>
                        <div className="text-xs text-ink-500">created {timeAgo(b.createdAt)}</div>
                      </td>
                      <td className="px-4 py-3">{b.client.name}</td>
                      <td className="px-4 py-3">{b.coach.user.name}</td>
                      <td className="px-4 py-3">
                        <span className={`chip text-[10px] ${
                          b.status === "CONFIRMED"
                            ? "bg-sage-100 text-sage-800"
                            : b.status === "PENDING"
                            ? "bg-coral-100 text-coral-800"
                            : b.status === "COMPLETED"
                            ? "bg-ink-100 text-ink-800"
                            : "bg-white border border-ink-200 text-ink-600"
                        }`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">{sgd(b.priceSGD)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Users */}
      <section>
        <h2 className="section-title mb-4">All users</h2>
        <AdminUserTable users={rows} />
        <p className="text-xs text-ink-500 mt-3">
          Deleting a user permanently removes their account, bookings, reviews, messages, and (for coaches)
          their coaching profile and packages. Can't be undone.
        </p>
      </section>

      {/* Coaches overview */}
      <section>
        <h2 className="section-title mb-4">Coaches at a glance</h2>
        {coaches.length === 0 ? (
          <div className="card p-6 text-center text-ink-600">No coaches yet.</div>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {coaches.map((c) => (
              <Link
                key={c.id}
                href={`/coaches/${c.slug}`}
                className="card p-4 flex gap-3 items-center hover:shadow-lift transition"
              >
                {c.user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.user.avatarUrl} className="w-12 h-12 rounded-full object-cover" alt="" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-sage-100 text-sage-700 flex items-center justify-center font-semibold">
                    {c.user.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="font-medium truncate">{c.user.name}</div>
                  <div className="text-xs text-ink-500 truncate">
                    {c.headline} · ★ {c.rating.toFixed(2)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
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
