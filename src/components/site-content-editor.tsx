"use client";

import { useState, useTransition } from "react";
import { updateSiteContent } from "@/app/actions";
import type { SiteContent, FooterColumn } from "@/lib/site-content";

export function SiteContentEditor({ initial }: { initial: SiteContent }) {
  const [content, setContent] = useState<SiteContent>(initial);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  function updateHeroStat(i: number, key: "n" | "label", v: string) {
    setContent((c) => {
      const next = { ...c, heroStats: [...c.heroStats] };
      next.heroStats[i] = { ...next.heroStats[i], [key]: v };
      return next;
    });
  }
  function addHeroStat() {
    setContent((c) => ({ ...c, heroStats: [...c.heroStats, { n: "", label: "" }] }));
  }
  function removeHeroStat(i: number) {
    setContent((c) => ({ ...c, heroStats: c.heroStats.filter((_, idx) => idx !== i) }));
  }

  function updateFooterCol(key: "clients" | "coaches" | "company", col: FooterColumn) {
    setContent((c) => ({ ...c, footer: { ...c.footer, [key]: col } }));
  }

  function save() {
    setMsg(null);
    start(async () => {
      const res = await updateSiteContent(content);
      if ("error" in res) setMsg({ kind: "err", text: res.error });
      else setMsg({ kind: "ok", text: "Saved — landing page updated." });
      setTimeout(() => setMsg(null), 3000);
    });
  }

  return (
    <div className="space-y-8">
      {/* Hero stats */}
      <section className="card p-5">
        <div className="flex items-baseline justify-between mb-3">
          <div>
            <div className="font-display text-xl font-semibold">Hero stats</div>
            <p className="text-xs text-ink-500">The 3 numbers under the hero CTA — verified coaches, rating, guarantee.</p>
          </div>
          <button onClick={addHeroStat} className="btn-ghost text-xs">+ Add</button>
        </div>
        <div className="space-y-2">
          {content.heroStats.map((s, i) => (
            <div key={i} className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="label text-xs">Number / value</label>
                <input className="input py-2 text-sm" value={s.n} onChange={(e) => updateHeroStat(i, "n", e.target.value)} placeholder="2,400+" />
              </div>
              <div className="flex-[2]">
                <label className="label text-xs">Label</label>
                <input className="input py-2 text-sm" value={s.label} onChange={(e) => updateHeroStat(i, "label", e.target.value)} placeholder="verified coaches" />
              </div>
              <button
                onClick={() => removeHeroStat(i)}
                className="text-coral-700 hover:bg-coral-50 rounded px-2 py-2 text-xs"
                disabled={content.heroStats.length <= 1}
                title={content.heroStats.length <= 1 ? "Keep at least one" : "Remove"}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Footer columns */}
      <section className="card p-5">
        <div className="font-display text-xl font-semibold mb-1">Footer</div>
        <p className="text-xs text-ink-500 mb-4">
          Three columns of clickable links at the bottom of every page. Use a URL path like <code>/coaches</code> or a full <code>https://...</code> link.
        </p>
        <div className="grid md:grid-cols-3 gap-5">
          <FooterColumnEditor col={content.footer.clients} onChange={(c) => updateFooterCol("clients", c)} />
          <FooterColumnEditor col={content.footer.coaches} onChange={(c) => updateFooterCol("coaches", c)} />
          <FooterColumnEditor col={content.footer.company} onChange={(c) => updateFooterCol("company", c)} />
        </div>
      </section>

      <div className="sticky bottom-4 flex items-center justify-end gap-3 z-10">
        {msg && (
          <span className={`text-sm rounded-full px-3 py-1.5 ${msg.kind === "ok" ? "bg-sage-100 text-sage-800" : "bg-coral-100 text-coral-800"}`}>
            {msg.text}
          </span>
        )}
        <button onClick={save} disabled={pending} className="btn-coral shadow-lift">
          {pending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}

function FooterColumnEditor({ col, onChange }: { col: FooterColumn; onChange: (c: FooterColumn) => void }) {
  function updateTitle(t: string) {
    onChange({ ...col, title: t });
  }
  function updateLink(i: number, key: "label" | "href", v: string) {
    const links = [...col.links];
    links[i] = { ...links[i], [key]: v };
    onChange({ ...col, links });
  }
  function addLink() {
    onChange({ ...col, links: [...col.links, { label: "", href: "/" }] });
  }
  function removeLink(i: number) {
    onChange({ ...col, links: col.links.filter((_, idx) => idx !== i) });
  }
  return (
    <div className="rounded-xl border border-ink-100 p-3 bg-cream/50">
      <input
        className="input py-2 text-sm font-medium mb-2"
        value={col.title}
        onChange={(e) => updateTitle(e.target.value)}
        placeholder="Column title"
      />
      <div className="space-y-1.5">
        {col.links.map((l, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-1">
            <input
              className="input py-1.5 text-xs"
              value={l.label}
              onChange={(e) => updateLink(i, "label", e.target.value)}
              placeholder="Label"
            />
            <input
              className="input py-1.5 text-xs"
              value={l.href}
              onChange={(e) => updateLink(i, "href", e.target.value)}
              placeholder="/path or https://"
            />
            <button
              onClick={() => removeLink(i)}
              className="text-coral-700 hover:bg-coral-50 rounded px-2 text-xs"
              title="Remove"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button onClick={addLink} className="btn-ghost text-xs mt-2">
        + Add link
      </button>
    </div>
  );
}
