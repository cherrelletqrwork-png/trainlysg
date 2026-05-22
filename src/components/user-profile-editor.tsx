"use client";

import { useState, useTransition } from "react";
import { updateUserProfile } from "@/app/actions";
import { AvatarUpload } from "./avatar-upload";

type Initial = {
  name: string;
  bio: string;
  location: string;
  avatarUrl: string;
};

const BIO_MAX = 500;
const NAME_MAX = 80;
const LOCATION_MAX = 80;

export function UserProfileEditor({
  initial,
  role,
}: {
  initial: Initial;
  role: "CLIENT" | "COACH";
}) {
  const [s, setS] = useState(initial);
  const [pending, start] = useTransition();
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const dirty =
    s.name !== initial.name ||
    s.bio !== initial.bio ||
    s.location !== initial.location ||
    s.avatarUrl !== initial.avatarUrl;

  function save() {
    setStatus("idle");
    setErrorMsg(null);
    start(async () => {
      const res = await updateUserProfile({
        name: s.name,
        bio: s.bio,
        location: s.location,
        avatarUrl: s.avatarUrl,
      });
      if ("error" in res) {
        setStatus("error");
        setErrorMsg(res.error);
      } else {
        setStatus("saved");
        setTimeout(() => setStatus("idle"), 2000);
      }
    });
  }

  return (
    <div className="card p-6 space-y-5">
      <div>
        <h2 className="font-display text-xl font-semibold">
          {role === "COACH" ? "Your public face" : "Your profile"}
        </h2>
        <p className="text-sm text-ink-600 mt-1">
          {role === "COACH"
            ? "How clients see you in search results, chat, and on your booking page."
            : "How coaches see you when you send them messages or booking requests."}
        </p>
      </div>

      <AvatarUpload
        value={s.avatarUrl}
        name={s.name}
        onChange={(url) => setS({ ...s, avatarUrl: url })}
      />

      <div>
        <label className="label text-xs">Display name</label>
        <input
          className="input"
          value={s.name}
          maxLength={NAME_MAX}
          onChange={(e) => setS({ ...s, name: e.target.value })}
        />
        <div className="text-[11px] text-ink-500 mt-1">
          {s.name.length}/{NAME_MAX}
        </div>
      </div>

      <div>
        <label className="label text-xs">Bio</label>
        <textarea
          className="input"
          rows={4}
          maxLength={BIO_MAX}
          placeholder={
            role === "COACH"
              ? "One paragraph about you, your style, and who you love working with."
              : "Optional — anything coaches should know about you before training."
          }
          value={s.bio}
          onChange={(e) => setS({ ...s, bio: e.target.value })}
        />
        <div className="text-[11px] text-ink-500 mt-1">
          {s.bio.length}/{BIO_MAX}
        </div>
      </div>

      <div>
        <label className="label text-xs">
          {role === "COACH" ? "Home base / neighbourhood" : "Where you train"}
        </label>
        <input
          className="input"
          placeholder="e.g. Tiong Bahru, CBD, Tampines"
          value={s.location}
          maxLength={LOCATION_MAX}
          onChange={(e) => setS({ ...s, location: e.target.value })}
        />
      </div>

      <div className="flex items-center justify-between pt-1">
        <div className="text-xs">
          {status === "saved" && <span className="text-sage-700">✓ Saved</span>}
          {status === "error" && <span className="text-coral-700">⚠ {errorMsg}</span>}
        </div>
        <button
          className="btn-primary"
          disabled={pending || !dirty}
          onClick={save}
        >
          {pending ? "Saving…" : dirty ? "Save profile" : "Saved"}
        </button>
      </div>
    </div>
  );
}
