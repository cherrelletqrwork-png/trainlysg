import "./globals.css";
import type { Metadata } from "next";
import { TopNav } from "@/components/top-nav";
import { ChatbotWidget } from "@/components/chatbot-widget";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Trainly — Find your coach. Train how you live.",
  description:
    "Singapore's verified marketplace for freelance fitness and wellness professionals. Personal trainers, yoga, physio, nutrition and more — at home, online, or outdoors.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
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
            <div>
              <div className="font-medium text-ink-800 mb-2">For clients</div>
              <ul className="space-y-1.5">
                <li>Browse coaches</li>
                <li>AI Match</li>
                <li>Trainly+</li>
                <li>Gift cards</li>
              </ul>
            </div>
            <div>
              <div className="font-medium text-ink-800 mb-2">For coaches</div>
              <ul className="space-y-1.5">
                <li>Become a Trainly coach</li>
                <li>Coach Academy</li>
                <li>Insurance & trust</li>
                <li>Pricing</li>
              </ul>
            </div>
            <div>
              <div className="font-medium text-ink-800 mb-2">Company</div>
              <ul className="space-y-1.5">
                <li>About</li>
                <li>Press</li>
                <li>Careers</li>
                <li>Contact</li>
              </ul>
            </div>
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
