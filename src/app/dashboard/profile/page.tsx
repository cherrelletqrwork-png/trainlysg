import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { UserProfileEditor } from "@/components/user-profile-editor";

export default async function ClientProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "COACH") redirect("/coach/profile");

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) redirect("/login");

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard" className="text-sm text-sage-700 font-medium hover:underline">
            ← Back to dashboard
          </Link>
          <h1 className="font-display text-3xl font-semibold mt-2">Edit your profile</h1>
        </div>
      </div>

      <UserProfileEditor
        initial={{
          name: user.name || "",
          bio: user.bio || "",
          location: user.location || "",
          avatarUrl: user.avatarUrl || "",
        }}
        role="CLIENT"
      />

      <p className="text-xs text-ink-500 text-center">
        Your name and photo appear when you message coaches and request bookings.
        Your bio is only visible to coaches you've contacted.
      </p>
    </div>
  );
}
