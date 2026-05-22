import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { sgd } from "@/lib/utils";

export default async function OwnerCoachesPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "OWNER") redirect("/");

  const coaches = await prisma.coach.findMany({
    include: { user: true, specialties: { include: { specialty: true } } },
    orderBy: { rating: "desc" },
  });

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <Link href="/owner" className="text-xs text-ink-500 hover:text-ink-700">← Back to owner hub</Link>
          <h1 className="font-display text-3xl font-semibold mt-1">Coaches</h1>
          <p className="text-ink-600 text-sm">{coaches.length} coaches in Trainly</p>
        </div>
        <Link href="/owner/coaches/new" className="btn-coral">
          + Add new coach
        </Link>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-cream text-ink-600 text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left px-4 py-3">Coach</th>
              <th className="text-left px-4 py-3 hidden md:table-cell">Specialty</th>
              <th className="text-left px-4 py-3 hidden md:table-cell">Location</th>
              <th className="text-right px-4 py-3">Rate</th>
              <th className="text-right px-4 py-3 hidden md:table-cell">Rating</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {coaches.map((c) => (
              <tr key={c.id} className="hover:bg-cream/40">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    {c.user.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.user.avatarUrl} className="w-9 h-9 rounded-full object-cover" alt="" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-sage-100 text-sage-700 flex items-center justify-center font-medium text-sm">
                        {c.user.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="font-medium truncate">{c.user.name}</div>
                      <div className="text-xs text-ink-500 truncate">{c.user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-ink-600 hidden md:table-cell">
                  {c.specialties.slice(0, 2).map((s) => s.specialty.name).join(", ") || "—"}
                </td>
                <td className="px-4 py-3 text-ink-600 hidden md:table-cell">{c.user.location || "—"}</td>
                <td className="px-4 py-3 text-right font-medium">{sgd(c.hourlyRate)}</td>
                <td className="px-4 py-3 text-right hidden md:table-cell">
                  <span className="text-coral-500">★</span> {c.rating.toFixed(2)}
                  <span className="text-ink-400 text-xs"> ({c.reviewCount})</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/coaches/${c.slug}`} className="text-xs text-sage-700 hover:underline">View</Link>
                </td>
              </tr>
            ))}
            {coaches.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-ink-500">
                  No coaches yet. <Link href="/owner/coaches/new" className="text-sage-700 font-medium">Add the first one →</Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
