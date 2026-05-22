import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { CoachCreateForm } from "@/components/coach-create-form";

export default async function NewCoachPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "OWNER") redirect("/");

  const specialties = await prisma.specialty.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="mb-6">
        <Link href="/owner/coaches" className="text-xs text-ink-500 hover:text-ink-700">← Back to coaches</Link>
        <h1 className="font-display text-3xl font-semibold mt-1">Add a new coach</h1>
        <p className="text-ink-600 text-sm">
          Creates a verified coach account and listing. The coach can fill in more details (long bio, photos, certifications, packages) after logging in.
        </p>
      </div>
      <CoachCreateForm specialties={specialties.map((s) => ({ slug: s.slug, name: s.name, icon: s.icon }))} />
    </div>
  );
}
