"use client";

import { useState, useTransition } from "react";
import { deleteOwnAccount } from "@/app/actions";

export function DeleteAccountButton({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const matches = typed.trim().toLowerCase() === email.toLowerCase();

  function confirmDelete() {
    setError(null);
    start(async () => {
      const res = await deleteOwnAccount(typed);
      // If the action redirected, we'll never reach here. If it returned an
      // error object, surface it.
      if (res && "error" in res) setError(res.error);
    });
  }

  return (
    <div className="card p-6 border-coral-200 bg-coral-50/40 space-y-4">
      <div>
        <h2 className="font-display text-xl font-semibold text-coral-800">Danger zone</h2>
        <p className="text-sm text-ink-700 mt-1">
          Permanently delete your Trainly account. We immediately remove your
          profile, your photo, your bookings, messages, and reviews — this
          can't be undone.
        </p>
      </div>

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="btn bg-white text-coral-700 border border-coral-300 hover:bg-coral-50"
        >
          Delete my account
        </button>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="label text-xs">
              Type your email <span className="font-mono text-ink-900">{email}</span> to confirm
            </label>
            <input
              className="input"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              placeholder={email}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-sm text-coral-800 bg-coral-100 border border-coral-200 rounded-lg px-3 py-2">
              ⚠ {error}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setTyped("");
                setError(null);
              }}
              className="btn-outline"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              disabled={!matches || pending}
              className="btn bg-coral-600 text-white hover:bg-coral-700 disabled:opacity-50"
            >
              {pending ? "Deleting…" : "Yes, permanently delete"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
