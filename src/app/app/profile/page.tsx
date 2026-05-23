import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logout } from "@/app/(auth)/actions";

export default async function AppProfile() {
  const session = await getSession();
  const user = session ? await prisma.user.findUnique({ where: { id: session.userId } }) : null;

  // Logged-out state: nudge to login / signup
  if (!session || !user) {
    return (
      <div>
        <header className="bg-gradient-to-b from-sage-50 to-cream px-5 pt-12 pb-6">
          <h1 className="font-display text-3xl font-semibold">Profile</h1>
        </header>

        <section className="px-5 mt-4 space-y-4">
          <div className="bg-white rounded-2xl border border-ink-100 p-6 text-center">
            <div className="text-4xl mb-3">👋</div>
            <h2 className="font-display text-xl font-semibold">Welcome to Trainly</h2>
            <p className="text-sm text-ink-600 mt-1">
              Log in to see your sessions, message coaches, and track your progress.
            </p>
            <div className="grid grid-cols-2 gap-2 mt-5">
              <Link href="/login?redirect=/app" className="btn-primary text-sm">Log in</Link>
              <Link href="/signup" className="btn-outline text-sm">Sign up</Link>
            </div>
          </div>

          <MenuGroup title="Explore">
            <MenuRow href="/app/discover" emoji="🔍" label="Browse coaches" />
            <MenuRow href="/match" emoji="✨" label="Take AI Match quiz" />
            <MenuRow href="/" emoji="🏠" label="Visit website" external />
          </MenuGroup>
        </section>
      </div>
    );
  }

  const firstName = user.name.split(" ")[0];
  const isCoach = session.role === "COACH";
  const isOwner = session.role === "OWNER";

  return (
    <div>
      <header className="bg-gradient-to-b from-sage-50 to-cream px-5 pt-12 pb-6">
        <h1 className="font-display text-2xl font-semibold mb-5">Profile</h1>

        <div className="flex items-center gap-4">
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatarUrl} alt="" className="w-20 h-20 rounded-full object-cover ring-2 ring-white shadow-card" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-sage-100 text-sage-700 flex items-center justify-center font-display text-2xl font-semibold ring-2 ring-white shadow-card">
              {firstName.charAt(0)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="font-display text-xl font-semibold truncate">{user.name}</div>
            <div className="text-sm text-ink-500 truncate">{user.email}</div>
            <span className="inline-block mt-1.5 text-[10px] font-semibold uppercase tracking-wider bg-white text-sage-700 px-2 py-0.5 rounded-full border border-ink-100">
              {isOwner ? "Owner" : isCoach ? "Coach" : "Client"}
            </span>
          </div>
        </div>

        <Link
          href={
            isOwner ? "/owner/profile" : isCoach ? "/coach/profile" : "/dashboard/profile"
          }
          className="btn-outline w-full mt-5 justify-center"
        >
          Edit profile
        </Link>
      </header>

      <section className="px-5 mt-4 space-y-4">
        <MenuGroup title="Activity">
          <MenuRow href="/app/bookings" emoji="📅" label="My bookings" />
          <MenuRow href="/chat" emoji="💬" label="Messages" />
          {!isCoach && !isOwner && <MenuRow href="/dashboard" emoji="📈" label="Progress dashboard" />}
        </MenuGroup>

        {isCoach && (
          <MenuGroup title="Coach tools">
            <MenuRow href="/coach" emoji="🛠️" label="Coach hub" />
            <MenuRow href="/coach/profile" emoji="✏️" label="Edit coaching profile" />
          </MenuGroup>
        )}

        {isOwner && (
          <MenuGroup title="Admin">
            <MenuRow href="/owner" emoji="📊" label="Admin dashboard" />
            <MenuRow href="/owner/coaches" emoji="🧑‍🏫" label="Manage coaches" />
            <MenuRow href="/owner/site" emoji="🌐" label="Edit site content" />
          </MenuGroup>
        )}

        <MenuGroup title="Support">
          <MenuRow href="mailto:hello@trainly.sg" emoji="✉️" label="Contact support" external />
          <MenuRow href="/" emoji="🌍" label="Visit website" external />
        </MenuGroup>

        <form action={logout} className="pt-2">
          <button className="w-full bg-white rounded-2xl border border-coral-200 text-coral-700 font-medium py-3.5 active:bg-coral-50">
            Log out
          </button>
        </form>

        <div className="text-center text-[11px] text-ink-400 pt-4 pb-2">
          Trainly · v0.1 · Singapore
        </div>
      </section>
    </div>
  );
}

function MenuGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-500 px-1 mb-2">{title}</div>
      <div className="bg-white rounded-2xl border border-ink-100 overflow-hidden divide-y divide-ink-100">
        {children}
      </div>
    </div>
  );
}

function MenuRow({
  href,
  emoji,
  label,
  external,
}: {
  href: string;
  emoji: string;
  label: string;
  external?: boolean;
}) {
  const content = (
    <>
      <span className="text-xl w-7 text-center">{emoji}</span>
      <span className="text-sm font-medium flex-1">{label}</span>
      <span className="text-ink-300">›</span>
    </>
  );
  const cls = "flex items-center gap-3 px-4 py-3.5 active:bg-ink-50";

  if (external) {
    return (
      <a
        href={href}
        target={href.startsWith("mailto:") ? undefined : "_blank"}
        rel="noopener noreferrer"
        className={cls}
      >
        {content}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {content}
    </Link>
  );
}
