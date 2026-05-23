import "./globals.css";
import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { TopNav } from "@/components/top-nav";
import { ChatbotWidget } from "@/components/chatbot-widget";
import { getSession } from "@/lib/auth";
import { getSiteContent, type FooterColumn } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "Trainly — Find your coach. Train how you live.",
  description:
    "Singapore's verified marketplace for freelance fitness and wellness professionals. Personal trainers, yoga, physio, nutrition and more — at home, online, or outdoors.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Trainly",
  },
  icons: {
    icon: "/trainly-logo.png",
    apple: "/trainly-logo.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#3f694e",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // Allow zoom — accessibility win, and PWAs typically want it on
  maximumScale: 5,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const site = await getSiteContent();
  const cols: FooterColumn[] = [site.footer.clients, site.footer.coaches, site.footer.company];

  // Detect if we're inside the (app) PWA shell — those routes have their own
  // chrome (bottom tabs) and should NOT render the website's TopNav/footer/chatbot.
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";
  const isApp = pathname === "/app" || pathname.startsWith("/app/");

  return (
    <html lang="en">
      <body className="min-h-screen bg-cream text-ink-900">
        {isApp ? (
          // PWA app shell — completely takes over. No website chrome.
          <>{children}</>
        ) : (
          <>
            <TopNav session={session} brandName={site.brand.name} logoUrl={site.brand.logoUrl} />
            <main className="min-h-[calc(100vh-64px)]">{children}</main>
            <footer className="border-t border-ink-100 mt-24 bg-white">
              <div className="max-w-7xl mx-auto px-6 py-12 grid md:grid-cols-4 gap-8 text-sm text-ink-600">
                <div>
                  <div className="font-display text-2xl font-semibold text-ink-900">{site.brand.name}</div>
                  <p className="mt-2">{site.brand.tagline} · Singapore-based.</p>
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
          </>
        )}
      </body>
    </html>
  );
}
