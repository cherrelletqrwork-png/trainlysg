"use client";

import { useState, useTransition } from "react";
import { adminDeleteUser } from "@/app/actions";

export type AdminUserRow = {
  id: string;
  email: string;
  name: string;
  role: "CLIENT" | "COACH" | "OWNER";
  location: string | null;
  avatarUrl: string | null;
  createdAt: string; // ISO
  isSelf: boolean;
};

function roleChip(role: AdminUserRow["role"]) {
  if (role === "OWNER") return "bg-ink-900 text-white";
  if (role === "COACH") return "bg-coral-100 text-coral-800";
  return "bg-sage-100 text-sage-800";
}

function shortDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-SG", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

export function AdminUserTable({ users }: { users: AdminUserRow[] }) {
  const [filter, setFilter] = useState<"ALL" | "CLIENT" | "COACH" | "OWNER">("ALL");
  const [q, setQ] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, start] = useTransition();
  const [confirming, setConfirming] = useState<string | null>(null);

  const filtered = users.filter((u) => {
    if (filter !== "ALL" && u.role !== filter) return false;
    if (!q) return true;
    const haystack = `${u.name} ${u.email} ${u.location ?? ""}`.toLowerCase();
    return haystack.includes(q.toLowerCase());
  });

  function doDelete(userId: string) {
    setError(null);
    setPendingId(userId);
    start(async () => {
      const res = await adminDeleteUser(userId);
      setPendingId(null);
      if ("error" in res) setError(res.error);
      else setConfirming(null);
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1.5 text-xs">
          {(["ALL", "CLIENT", "COACH", "OWNER"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setFilter(r)}
              className={`chip ${filter === r ? "bg-sage-600 text-white" : "bg-white border border-ink-200"}`}
            >
              {r === "ALL" ? "All" : r}
              <span className="ml-1 opacity-70">
                ({r === "ALL" ? users.length : users.filter((u) => u.role === r).length})
              </span>
            </button>
          ))}
        </div>
        <input
          className="input py-1.5 text-sm max-w-[260px]"
          placeholder="Search name / email / location…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {error && (
        <p className="text-sm text-coral-800 bg-coral-100 border border-coral-200 rounded-lg px-3 py-2">
          ⚠ {error}
        </p>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-cream text-ink-600 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-2.5">User</th>
                <th className="text-left px-4 py-2.5">Role</th>
                <th className="text-left px-4 py-2.5 hidden md:table-cell">Location</th>
                <th className="text-left px-4 py-2.5 hidden md:table-cell">Joined</th>
                <th className="text-right px-4 py-2.5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-ink-500">
                    No users match those filters.
                  </td>
                </tr>
              )}
              {filtered.map((u) => (
                <tr key={u.id} className="border-t border-ink-100 align-middle">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {u.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={u.avatarUrl} className="w-8 h-8 rounded-full object-cover" alt="" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-sage-100 text-sage-700 flex items-center justify-center text-xs font-semibold">
                          {(u.name || "?").split(" ").map((p) => p[0]).slice(0, 2).join("")}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-medium truncate">{u.name}</div>
                        <div className="text-xs text-ink-500 truncate">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`chip text-[10px] ${roleChip(u.role)}`}>{u.role}</span>
                    {u.isSelf && (
                      <span className="ml-1 chip bg-white border border-ink-200 text-ink-600 text-[10px]">you</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-600 hidden md:table-cell">{u.location ?? "—"}</td>
                  <td className="px-4 py-3 text-ink-600 hidden md:table-cell">{shortDate(u.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    {u.isSelf ? (
                      <span className="text-xs text-ink-500">—</span>
                    ) : confirming === u.id ? (
                      <span className="inline-flex gap-1.5">
                        <button
                          className="btn-ghost text-xs"
                          onClick={() => setConfirming(null)}
                          disabled={pendingId === u.id}
                        >
                          Cancel
                        </button>
                        <button
                          className="btn bg-coral-600 text-white hover:bg-coral-700 text-xs px-3 py-1.5 disabled:opacity-50"
                          onClick={() => doDelete(u.id)}
                          disabled={pendingId === u.id}
                        >
                          {pendingId === u.id ? "Deleting…" : "Confirm"}
                        </button>
                      </span>
                    ) : (
                      <button
                        className="btn-ghost text-xs text-coral-700 hover:bg-coral-50"
                        onClick={() => {
                          setError(null);
                          setConfirming(u.id);
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
