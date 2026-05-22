import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { UserProfileEditor } from "@/components/user-profile-editor";
import { DeleteAccountButton } from "@/components/delete-account-button";

export default async function OwnerProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "OWNER") redirect("/dashboard/profile");

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) redirect("/login");

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 space-y-6">
      <div>
        <Link href="/owner" className="text-sm text-sage-700 font-medium hover:underline">
          ← Back to admin
        </Link>
        <h1 className="font-display text-3xl font-semibold mt-2">Owner profile</h1>
        <p className="text-ink-600 mt-1">
          You can edit how your name and photo appear inside Trainly. Owners aren't shown publicly.
        </p>
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

      <DeleteAccountButton email={user.email} />
    </div>
  );
}
