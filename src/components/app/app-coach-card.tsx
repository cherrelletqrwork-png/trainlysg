import Link from "next/link";
import { sgd } from "@/lib/utils";

type Specialty = { specialty: { name: string; icon: string } };

type Coach = {
  id: string;
  slug: string;
  headline: string;
  hourlyRate: number;
  rating: number;
  reviewCount: number;
  formats: string;
  vibeTags: string;
  user: { name: string; avatarUrl: string | null; location: string | null };
  specialties: Specialty[];
};

const FORMAT_ICON: Record<string, string> = {
  HOME: "🏠",
  GYM: "🏋️",
  OUTDOOR: "🌳",
  VIRTUAL: "💻",
  STUDIO: "🪞",
};

export function AppCoachCard({ coach }: { coach: Coach }) {
  const formats = coach.formats.split(",").filter(Boolean).slice(0, 3);
  const vibe = coach.vibeTags.split(",")[0]?.trim();
  const initial = coach.user.name.charAt(0).toUpperCase();

  return (
    <Link
      href={`/coaches/${coach.slug}`}
      className="block bg-white rounded-2xl border border-ink-100 active:bg-ink-50 transition overflow-hidden"
    >
      <div className="flex gap-3 p-3.5">
        {coach.user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coach.user.avatarUrl}
            alt=""
            className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-20 h-20 rounded-xl bg-sage-100 text-sage-700 flex items-center justify-center font-display text-2xl font-semibold flex-shrink-0">
            {initial}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="font-medium leading-tight truncate">{coach.user.name}</div>
              <div className="text-xs text-ink-500 truncate mt-0.5">
                {coach.specialties.map((s) => s.specialty.name).slice(0, 2).join(" · ")}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="flex items-center gap-0.5 text-amber-600">
                <span className="text-xs">★</span>
                <span className="text-sm font-semibold">{coach.rating.toFixed(1)}</span>
              </div>
              <div className="text-[10px] text-ink-500">{coach.reviewCount} reviews</div>
            </div>
          </div>
          <p className="text-xs text-ink-600 mt-1.5 line-clamp-2">{coach.headline}</p>
          <div className="flex items-center justify-between mt-2 gap-2">
            <div className="flex gap-1 min-w-0">
              {formats.map((f) => (
                <span key={f} className="text-base" title={f}>
                  {FORMAT_ICON[f] ?? "•"}
                </span>
              ))}
              {vibe && (
                <span className="ml-1 text-[10px] text-sage-700 font-medium truncate">
                  · {vibe}
                </span>
              )}
            </div>
            <div className="text-sm font-semibold text-ink-900 flex-shrink-0">
              {sgd(coach.hourlyRate)}
              <span className="text-[10px] font-normal text-ink-500">/hr</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
