import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { UserProfileEditor } from "@/components/user-profile-editor";
import { CoachProfileEditor } from "@/components/coach-profile-editor";

export default async function CoachProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "COACH") redirect("/dashboard/profile");

  const coach = await prisma.coach.findUnique({
    where: { userId: session.userId },
    include: { user: true },
  });
  if (!coach) redirect("/signup");

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/coach" className="text-sm text-sage-700 font-medium hover:underline">
            ← Back to coach hub
          </Link>
          <h1 className="font-display text-3xl font-semibold mt-2">Edit your coach profile</h1>
        </div>
        <Link href={`/coaches/${coach.slug}`} className="btn-outline text-sm">
          View public profile
        </Link>
      </div>

      <UserProfileEditor
        initial={{
          name: coach.user.name || "",
          bio: coach.user.bio || "",
          location: coach.user.location || "",
          avatarUrl: coach.user.avatarUrl || "",
        }}
        role="COACH"
      />

      <div className="card p-6 space-y-2">
        <div>
          <h2 className="font-display text-xl font-semibold">Coaching details</h2>
          <p className="text-sm text-ink-600 mt-1">
            Headline, tagline, longer bio, hourly rate, formats, vibe, and languages.
            These show on your public coach page and in search results.
          </p>
        </div>
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

      <p className="text-xs text-ink-500 text-center">
        Changes are saved per-section and visible on your public profile within a minute.
      </p>
    </div>
  );
}
