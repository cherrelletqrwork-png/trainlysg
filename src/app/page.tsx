import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CoachCard } from "@/components/coach-card";
import { sgd } from "@/lib/utils";
import { getSiteContent } from "@/lib/site-content";

export default async function HomePage() {
  const featured = await prisma.coach.findMany({
    where: { isFeatured: true },
    include: {
      user: true,
      specialties: { include: { specialty: true } },
    },
    take: 3,
  });
  const specialties = await prisma.specialty.findMany({ take: 12 });
  const site = await getSiteContent();

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-cream via-sage-50 to-coral-50" />
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-coral-200/40 blur-3xl -z-10 float" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-sage-300/40 blur-3xl -z-10 float" />

        <div className="max-w-7xl mx-auto px-6 pt-16 pb-24 md:pt-24 md:pb-32 grid md:grid-cols-2 gap-12 items-center">
          <div className="fade-up">
            {/* Trainly brand block */}
            <div className="flex items-center gap-3 mb-6">
              <span className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-sage-500 to-coral-400 items-center justify-center text-white text-3xl font-bold shadow-lift">
                T
              </span>
              <div>
                <div className="font-display text-4xl md:text-5xl font-semibold tracking-tight leading-none text-ink-900">
                  Trainly
                </div>
                <div className="text-xs md:text-sm text-ink-500 mt-1 tracking-wide uppercase">
                  Train how you live
                </div>
              </div>
            </div>

            <div className="chip-sage mb-4">🇸🇬 Now live in Singapore</div>
            <h1 className="font-display text-5xl md:text-6xl font-semibold leading-[1.05] tracking-tight text-ink-900">
              Find your coach. <br />
              <span className="text-sage-700">Train how you live.</span>
            </h1>
            <p className="mt-5 text-lg text-ink-700 max-w-xl">
              <span className="font-semibold text-ink-900">Trainly</span> is Singapore's
              verified marketplace for freelance fitness and wellness professionals —
              personal trainers, physios, yoga teachers, nutritionists and more,
              bookable at home, online, or outdoors. No gym contracts. No middlemen.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/match" className="btn-coral">
                Start AI Match →
              </Link>
              <Link href="/coaches" className="btn-outline">
                Browse coaches
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-ink-600">
              {site.heroStats.map((s, i) => (
                <Stat key={i} n={s.n} label={s.label} />
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-sage-200 to-coral-200 rotate-3 -z-10" />
            <div
              className="rounded-3xl aspect-[4/5] bg-cover bg-center shadow-lift"
              style={{
                backgroundImage:
                  "url(https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1000&h=1250&fit=crop)",
              }}
            />
            <div className="absolute -bottom-6 -left-6 card p-4 max-w-[260px] fade-up">
              <div className="flex items-center gap-3">
                <img
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop"
                  className="w-10 h-10 rounded-full object-cover"
                  alt=""
                />
                <div>
                  <div className="font-medium text-sm">Aisha booked for tomorrow</div>
                  <div className="text-xs text-ink-500">7:00am · Home visit · {sgd(95)}</div>
                </div>
              </div>
              <div className="mt-3 flex gap-1.5">
                <span className="chip-sage text-[10px]">Confirmed</span>
                <span className="chip text-[10px]">🏠 Tiong Bahru</span>
              </div>
            </div>
            <div className="absolute -top-4 -right-4 card p-3 fade-up">
              <div className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full bg-sage-500 animate-pulse" />
                <span className="font-medium">12 coaches free in the next hour</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Specialties */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="chip mb-3">What we cover</div>
            <h2 className="section-title">Every kind of movement</h2>
          </div>
          <Link href="/coaches" className="text-sm text-sage-700 font-medium hover:underline hidden md:inline">
            See all coaches →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {specialties.map((s) => (
            <Link
              key={s.id}
              href={`/coaches?specialty=${s.slug}`}
              className="card p-4 hover:shadow-lift transition flex flex-col gap-2"
            >
              <div className="text-3xl">{s.icon}</div>
              <div className="font-medium text-sm">{s.name}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured coaches */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="chip-coral mb-3">⭐ Hand-picked</div>
            <h2 className="section-title">Featured coaches this week</h2>
            <p className="text-ink-600 mt-2">Verified, reviewed, ready to train.</p>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {featured.map((c) => (
            <CoachCard key={c.id} coach={c as any} />
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-sage-700 text-cream py-20 relative grain">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl">
            <div className="chip bg-sage-600 text-sage-50 mb-3">How Trainly works</div>
            <h2 className="font-display text-4xl md:text-5xl font-semibold">
              Three steps from doom-scrolling to your first session.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 mt-12">
            <Step
              n="01"
              title="Match"
              body="Take our 60-second quiz or filter by specialty, location, vibe and price. AI Match shortlists in seconds."
            />
            <Step
              n="02"
              title="Chat & book"
              body="Free 5-minute consult with any coach. Instant booking when you're ready. Pay per session, package, or monthly."
            />
            <Step
              n="03"
              title="Train"
              body="At home, in a park, at a partner gym, or virtual. We track your progress and you cancel anytime."
            />
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="chip-sage mb-3">Trust & safety</div>
            <h2 className="section-title">Vetted like we'd send our own mum.</h2>
            <p className="text-ink-700 mt-4 leading-relaxed">
              Every Trainly coach passes ID verification, certification checks (NASM, ACE, MOH-registered physio, RYT yoga),
              a 1-on-1 onboarding interview, and an annual background screen. Sessions are covered by S$1M liability insurance,
              and your first session is fully refundable if it isn't a fit.
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              <Bullet>Singpass MyInfo identity check</Bullet>
              <Bullet>Certification cross-verified with issuing body</Bullet>
              <Bullet>Two-sided reviews with booking proof</Bullet>
              <Bullet>SOS button on home-visit sessions</Bullet>
              <Bullet>48-hour first-session money-back guarantee</Bullet>
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="card p-5">
              <div className="text-3xl">🛡️</div>
              <div className="font-medium mt-2">S$1M insurance</div>
              <p className="text-sm text-ink-600 mt-1">Every verified session covered.</p>
            </div>
            <div className="card p-5 translate-y-6">
              <div className="text-3xl">🪪</div>
              <div className="font-medium mt-2">Singpass verified</div>
              <p className="text-sm text-ink-600 mt-1">No bots, no catfish coaches.</p>
            </div>
            <div className="card p-5">
              <div className="text-3xl">📋</div>
              <div className="font-medium mt-2">Certs checked</div>
              <p className="text-sm text-ink-600 mt-1">Direct from the issuing body.</p>
            </div>
            <div className="card p-5 translate-y-6">
              <div className="text-3xl">↩️</div>
              <div className="font-medium mt-2">48-hr refund</div>
              <p className="text-sm text-ink-600 mt-1">First session, no questions.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Coach CTA */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="rounded-3xl bg-gradient-to-br from-coral-500 to-coral-700 text-white p-10 md:p-16 relative overflow-hidden grain">
          <div className="absolute -right-20 -top-20 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
          <div className="relative max-w-2xl">
            <div className="chip bg-white/15 text-white border border-white/20 mb-4">For coaches</div>
            <h2 className="font-display text-4xl md:text-5xl font-semibold">
              Stop hustling for clients. Start coaching them.
            </h2>
            <p className="mt-4 text-white/90 text-lg">
              Trainly handles discovery, bookings, payments, and reviews — so you can spend your time on the work that
              actually moves people. Keep 80–88% of every booking. No website needed.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/signup" className="btn bg-white text-coral-700 hover:bg-cream">
                Become a Trainly coach
              </Link>
              <Link href="/coach/about" className="btn bg-transparent border border-white/30 text-white hover:bg-white/10">
                See how it works
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div>
      <div className="font-display text-2xl font-semibold">{n}</div>
      <div className="text-xs text-ink-500">{label}</div>
    </div>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="bg-sage-800/50 border border-sage-600/40 rounded-2xl p-6">
      <div className="font-display text-sm text-sage-200">{n}</div>
      <div className="font-display text-2xl font-semibold mt-2">{title}</div>
      <p className="text-sage-100/90 text-sm mt-2 leading-relaxed">{body}</p>
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5">
      <span className="mt-1 w-4 h-4 rounded-full bg-sage-200 text-sage-800 flex items-center justify-center text-[10px]">✓</span>
      <span className="text-ink-700">{children}</span>
    </li>
  );
}
