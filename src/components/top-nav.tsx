import Link from "next/link";
import { logout } from "@/app/(auth)/actions";
import type { SessionPayload } from "@/lib/auth";

export function TopNav({ session }: { session: SessionPayload | null }) {
  return (
    <header className="sticky top-0 z-40 bg-cream/85 backdrop-blur border-b border-ink-100">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-display text-2xl font-semibold tracking-tight">
          <span className="inline-flex w-8 h-8 rounded-xl bg-gradient-to-br from-sage-500 to-coral-400 items-center justify-center text-white font-bold">T</span>
          Trainly
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-ink-700">
          <Link href="/coaches" className="hover:text-ink-900">Browse coaches</Link>
          <Link href="/match" className="hover:text-ink-900">AI Match</Link>
          <Link href="/coaches?format=HOME" className="hover:text-ink-900">Home visits</Link>
          <Link href="/coaches?format=VIRTUAL" className="hover:text-ink-900">Virtual</Link>
        </nav>

        <div className="flex items-center gap-2">
          {session ? (
            <>
              {session.role === "OWNER" ? (
                <Link href="/owner" className="btn-outline">Admin</Link>
              ) : session.role === "CLIENT" ? (
                <>
                  <Link href="/chat" className="btn-ghost">Chat</Link>
                  <Link href="/dashboard" className="btn-outline">Dashboard</Link>
                </>
              ) : (
                <>
                  <Link href="/chat" className="btn-ghost">Chat</Link>
                  <Link href="/coach" className="btn-outline">Coach hub</Link>
                </>
              )}
              <form action={logout}>
                <button className="btn-ghost text-xs">Log out</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost">Log in</Link>
              <Link href="/signup" className="btn-primary">Get started</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
