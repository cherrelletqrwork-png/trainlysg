import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import { TopNav } from "@/components/top-nav";
import { ChatbotWidget } from "@/components/chatbot-widget";
import { getSession } from "@/lib/auth";
import { getSiteContent, type FooterColumn } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "Trainly — Find your coach. Train how you live.",
  description:
    "Singapore's verified marketplace for freelance fitness and wellness professionals. Personal trainers, yoga, physio, nutrition and more — at home, online, or outdoors.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const site = await getSiteContent();
  const cols: FooterColumn[] = [site.footer.clients, site.footer.coaches, site.footer.company];
  return (
    <html lang="en">
      <body className="min-h-screen bg-cream text-ink-900">
        <TopNav session={session} />
        <main className="min-h-[calc(100vh-64px)]">{children}</main>
        <footer className="border-t border-ink-100 mt-24 bg-white">
          <div className="max-w-7xl mx-auto px-6 py-12 grid md:grid-cols-4 gap-8 text-sm text-ink-600">
            <div>
              <div className="font-display text-2xl font-semibold text-ink-900">Trainly</div>
              <p className="mt-2">Train how you live. Singapore-based.</p>
            </div>
            {cols.map((col) => (
              <div key={col.title}>
                <div className="font-medium text-ink-800 mb-2">{col.title}</div>
                <ul className="space-y-1.5">
                  {col.links.map((l, i) => (
                    <li key={i}>
                      <Link href={l.href} className="hover:text-ink-900 hover:underline transition">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-ink-100 text-center text-xs text-ink-500 py-4">
            © {new Date().getFullYear()} Trainly Pte Ltd. Singapore.
          </div>
        </footer>
        <ChatbotWidget />
      </body>
    </html>
  );
}
