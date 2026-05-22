"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminCreateCoach } from "@/app/actions";

type Specialty = { slug: string; name: string; icon: string };

const FORMATS = [
  { v: "HOME", l: "🏠 Home" },
  { v: "GYM", l: "🏋️ Gym" },
  { v: "OUTDOOR", l: "🌳 Outdoor" },
  { v: "VIRTUAL", l: "💻 Virtual" },
  { v: "STUDIO", l: "🧘 Studio" },
];

function makeSlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function CoachCreateForm({ specialties }: { specialties: Specialty[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [location, setLocation] = useState("");
  const [headline, setHeadline] = useState("");
  const [tagline, setTagline] = useState("");
  const [hourlyRate, setHourlyRate] = useState(95);
  const [languages, setLanguages] = useState("English");
  const [selectedFormats, setSelectedFormats] = useState<string[]>(["HOME", "VIRTUAL"]);
  const [vibe, setVibe] = useState<string[]>([]);
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>([]);

  function onNameChange(v: string) {
    setName(v);
    if (!slugTouched) setSlug(makeSlug(v));
  }

  function toggle(arr: string[], v: string, set: (x: string[]) => void) {
    if (arr.includes(v)) set(arr.filter((x) => x !== v));
    else set([...arr, v]);
  }

  const VIBES = ["Calm", "Energetic", "Patient", "Direct", "Tough-love", "Fun", "Mindful", "Evidence-based", "Empowering", "Beginner-friendly"];

  function submit() {
    setErr(null);
    if (selectedSpecs.length === 0) {
      setErr("Pick at least one specialty.");
      return;
    }
    if (selectedFormats.length === 0) {
      setErr("Pick at least one session format.");
      return;
    }
    start(async () => {
      const res = await adminCreateCoach({
        name,
        email,
        password,
        slug,
        location,
        headline,
        tagline,
        hourlyRate,
        languages,
        formats: selectedFormats.join(","),
        vibeTags: vibe.join(","),
        specialtySlugs: selectedSpecs,
      });
      if ("error" in res) {
        setErr(res.error);
      } else {
        router.push(`/coaches/${res.coachSlug}`);
      }
    });
  }

  return (
    <div className="space-y-6">
      <section className="card p-5">
        <div className="font-display text-xl font-semibold mb-3">Basics</div>
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="label">Full name</label>
            <input className="input" value={name} onChange={(e) => onNameChange(e.target.value)} placeholder="Aisha Rahman" />
          </div>
          <div>
            <label className="label">Email (login)</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="aisha@trainly.com" />
          </div>
          <div>
            <label className="label">Temporary password</label>
            <input className="input" type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 chars" />
            <p className="text-[10px] text-ink-500 mt-1">They can change it after logging in.</p>
          </div>
          <div>
            <label className="label">URL slug</label>
            <input
              className="input"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugTouched(true);
              }}
              placeholder="aisha-rahman"
            />
            <p className="text-[10px] text-ink-500 mt-1">Lowercase letters, numbers, dashes only. URL: /coaches/{slug || "..."}</p>
          </div>
          <div>
            <label className="label">Location (neighbourhood)</label>
            <input className="input" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Tanjong Pagar" />
          </div>
          <div>
            <label className="label">Hourly rate (S$)</label>
            <input
              className="input"
              type="number"
              min={10}
              max={2000}
              value={hourlyRate}
              onChange={(e) => setHourlyRate(parseInt(e.target.value) || 0)}
            />
          </div>
        </div>
      </section>

      <section className="card p-5">
        <div className="font-display text-xl font-semibold mb-3">Profile copy</div>
        <div className="space-y-3">
          <div>
            <label className="label">Headline</label>
            <input className="input" value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Vinyasa & Pilates for busy professionals" />
          </div>
          <div>
            <label className="label">Tagline</label>
            <input className="input" value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Calm strength, every session." />
          </div>
          <div>
            <label className="label">Languages (comma-separated)</label>
            <input className="input" value={languages} onChange={(e) => setLanguages(e.target.value)} placeholder="English,Bahasa Melayu" />
          </div>
        </div>
      </section>

      <section className="card p-5">
        <div className="font-display text-xl font-semibold mb-1">Specialties</div>
        <p className="text-xs text-ink-500 mb-3">Pick one or more. These determine where the coach shows up in search.</p>
        <div className="flex flex-wrap gap-1.5">
          {specialties.map((s) => {
            const on = selectedSpecs.includes(s.slug);
            return (
              <button
                key={s.slug}
                type="button"
                onClick={() => toggle(selectedSpecs, s.slug, setSelectedSpecs)}
                className={`chip text-xs ${on ? "bg-sage-600 text-white" : "bg-white border border-ink-200"}`}
              >
                {s.icon} {s.name}
              </button>
            );
          })}
        </div>
      </section>

      <section className="card p-5">
        <div className="font-display text-xl font-semibold mb-3">Session formats</div>
        <div className="flex flex-wrap gap-1.5">
          {FORMATS.map((f) => {
            const on = selectedFormats.includes(f.v);
            return (
              <button
                key={f.v}
                type="button"
                onClick={() => toggle(selectedFormats, f.v, setSelectedFormats)}
                className={`chip text-xs ${on ? "bg-sage-600 text-white" : "bg-white border border-ink-200"}`}
              >
                {f.l}
              </button>
            );
          })}
        </div>
      </section>

      <section className="card p-5">
        <div className="font-display text-xl font-semibold mb-3">Coaching vibe</div>
        <div className="flex flex-wrap gap-1.5">
          {VIBES.map((v) => {
            const on = vibe.includes(v);
            return (
              <button
                key={v}
                type="button"
                onClick={() => toggle(vibe, v, setVibe)}
                className={`chip text-xs ${on ? "bg-coral-500 text-white" : "bg-white border border-ink-200"}`}
              >
                {v}
              </button>
            );
          })}
        </div>
      </section>

      {err && <div className="text-sm text-coral-700 bg-coral-50 rounded-lg px-3 py-2">{err}</div>}

      <div className="flex justify-end gap-3 sticky bottom-4">
        <button onClick={submit} disabled={pending} className="btn-coral shadow-lift">
          {pending ? "Creating…" : "Create coach"}
        </button>
      </div>
    </div>
  );
}
