import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getSiteContent } from "@/lib/site-content";
import { SiteContentEditor } from "@/components/site-content-editor";

export default async function OwnerSiteContentPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "OWNER") redirect("/");

  const content = await getSiteContent();

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/owner" className="text-xs text-ink-500 hover:text-ink-700">← Back to owner hub</Link>
          <h1 className="font-display text-3xl font-semibold mt-1">Edit site content</h1>
          <p className="text-ink-600 text-sm">Change the hero stats and footer links across the whole site.</p>
        </div>
      </div>
      <SiteContentEditor initial={content} />
    </div>
  );
}
