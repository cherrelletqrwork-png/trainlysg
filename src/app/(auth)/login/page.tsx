"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login, type AuthState } from "../actions";

export default function LoginPage() {
  const [state, action, pending] = useActionState<AuthState, FormData>(login, {});

  return (
    <div className="max-w-md mx-auto px-6 py-16">
      <div className="card p-8 fade-up">
        <h1 className="font-display text-3xl font-semibold mb-1">Welcome back</h1>
        <p className="text-ink-600 mb-6">Log in to keep training.</p>

        <form action={action} className="space-y-4">
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input className="input" id="email" name="email" type="email" required autoComplete="email" />
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input className="input" id="password" name="password" type="password" required autoComplete="current-password" />
          </div>
          {state?.error && <p className="text-sm text-coral-700 bg-coral-50 rounded-lg px-3 py-2">{state.error}</p>}
          <button className="btn-primary w-full" disabled={pending}>
            {pending ? "Signing in…" : "Log in"}
          </button>
        </form>

        <p className="text-sm text-center mt-6 text-ink-600">
          New here?{" "}
          <Link href="/signup" className="text-sage-700 font-medium hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
