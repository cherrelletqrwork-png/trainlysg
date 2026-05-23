"use client";

import { useEffect, useState } from "react";

// Stores a small "remind me later / never show again" flag in localStorage
const DISMISS_KEY = "trainly.install.dismissedAt";
const REMIND_AFTER_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

type Platform = "ios" | "android" | "desktop" | "other";

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent.toLowerCase();
  // iOS Safari (also catches iPad on iPadOS where it says "Macintosh" but has touch)
  if (/iphone|ipad|ipod/.test(ua) || (navigator.platform === "MacIntel" && (navigator as any).maxTouchPoints > 1)) {
    return "ios";
  }
  if (/android/.test(ua)) return "android";
  if (/macintosh|windows|linux/.test(ua)) return "desktop";
  return "other";
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  // iOS uses navigator.standalone, everyone else uses display-mode media query
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((window.navigator as any).standalone === true) return true;
  if (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) return true;
  return false;
}

export function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [platform, setPlatform] = useState<Platform>("other");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deferred, setDeferred] = useState<any>(null);

  useEffect(() => {
    if (isStandalone()) return; // already installed — nothing to do
    const p = detectPlatform();
    setPlatform(p);
    if (p === "desktop" || p === "other") return; // only nag on mobile

    // Don't show if the user dismissed it recently
    try {
      const raw = localStorage.getItem(DISMISS_KEY);
      const dismissedAt = raw ? Number(raw) : 0;
      if (dismissedAt && Date.now() - dismissedAt < REMIND_AFTER_MS) return;
    } catch {
      // ignore localStorage failures (private mode etc.)
    }

    // Capture the Chrome / Android-style beforeinstallprompt event so we can
    // trigger it from our custom button.
    function onBeforeInstall(e: Event) {
      e.preventDefault();
      setDeferred(e);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    // Show after a short delay so we don't jump-scare the user on page load
    const t = setTimeout(() => setShow(true), 1800);
    return () => {
      clearTimeout(t);
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
    };
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {}
    setShow(false);
  }

  async function installAndroid() {
    if (!deferred) return;
    deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice?.outcome) dismiss();
  }

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end pointer-events-none">
      <div
        className="m-3 mb-5 pointer-events-auto w-full bg-white rounded-3xl shadow-lift border border-ink-100 overflow-hidden fade-up"
        style={{ marginBottom: "max(20px, env(safe-area-inset-bottom))" }}
      >
        <div className="bg-gradient-to-br from-sage-600 to-coral-500 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/trainly-logo.png" alt="" className="w-8 h-8 rounded-lg" />
            <div className="font-display font-semibold leading-tight">Add Trainly to your home screen</div>
          </div>
          <button
            onClick={dismiss}
            className="text-white/80 hover:text-white text-xl leading-none px-1"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>

        <div className="p-5 space-y-3">
          {platform === "ios" ? (
            <>
              <p className="text-sm text-ink-700">
                Tap the <strong>Share</strong> button below, then choose <strong>Add to Home Screen</strong>.
                Trainly will open full-screen like a real app.
              </p>
              <div className="flex items-center gap-3 text-xs text-ink-500">
                <span className="inline-flex items-center gap-1.5">
                  <span className="text-base">⬆️</span> Share
                </span>
                <span>→</span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="text-base">➕</span> Add to Home Screen
                </span>
              </div>
            </>
          ) : platform === "android" ? (
            <>
              <p className="text-sm text-ink-700">
                Install Trainly on your phone for a faster, full-screen experience. No app store needed.
              </p>
              <div className="flex gap-2">
                {deferred ? (
                  <button onClick={installAndroid} className="btn-primary text-sm">
                    Install Trainly
                  </button>
                ) : (
                  <p className="text-xs text-ink-500">
                    Tap the <strong>⋮</strong> menu in Chrome and choose <strong>Install app</strong> or <strong>Add to Home screen</strong>.
                  </p>
                )}
                <button onClick={dismiss} className="btn-outline text-sm">
                  Maybe later
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
