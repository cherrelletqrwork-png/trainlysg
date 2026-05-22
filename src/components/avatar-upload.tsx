"use client";

import { useRef, useState } from "react";

const MAX_INPUT_BYTES = 8 * 1024 * 1024; // refuse files bigger than 8MB before processing
const OUTPUT_SIZE = 384; // max px on the long edge after resize
const OUTPUT_QUALITY = 0.85;

type Props = {
  value: string;
  name: string;
  onChange: (url: string) => void;
};

/** Resize an image file in-browser to OUTPUT_SIZE max and return as a JPEG data URL. */
async function resizeToDataUrl(file: File): Promise<string> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("Couldn't read image"));
      i.src = objectUrl;
    });

    const scale = Math.min(OUTPUT_SIZE / img.width, OUTPUT_SIZE / img.height, 1);
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unsupported");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", OUTPUT_QUALITY);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function initialsFor(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0]!.toUpperCase())
    .slice(0, 2)
    .join("") || "?";
}

export function AvatarUpload({ value, name, onChange }: Props) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const [mode, setMode] = useState<"upload" | "url">("upload");
  const [urlInput, setUrlInput] = useState(value && value.startsWith("http") ? value : "");

  async function handleFiles(files: FileList | File[] | null) {
    setError(null);
    const file = files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("That doesn't look like an image.");
      return;
    }
    if (file.size > MAX_INPUT_BYTES) {
      setError("Image is too large (8MB max).");
      return;
    }
    setBusy(true);
    try {
      const dataUrl = await resizeToDataUrl(file);
      onChange(dataUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't process that image.");
    } finally {
      setBusy(false);
    }
  }

  function applyUrl() {
    const trimmed = urlInput.trim();
    if (!trimmed) {
      onChange("");
      return;
    }
    try {
      const u = new URL(trimmed);
      if (u.protocol !== "https:" && u.protocol !== "http:") {
        setError("Only http/https URLs allowed.");
        return;
      }
      setError(null);
      onChange(trimmed);
    } catch {
      setError("Doesn't look like a valid URL.");
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-4">
        {/* Avatar preview / drop zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            handleFiles(e.dataTransfer.files);
          }}
          onClick={() => mode === "upload" && fileInput.current?.click()}
          role={mode === "upload" ? "button" : undefined}
          tabIndex={mode === "upload" ? 0 : undefined}
          className={`relative w-24 h-24 rounded-full overflow-hidden border-2 ${
            drag ? "border-sage-500 ring-4 ring-sage-200" : "border-ink-200"
          } ${mode === "upload" ? "cursor-pointer hover:border-sage-400 transition" : ""} flex items-center justify-center bg-cream`}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="font-display text-3xl font-semibold text-ink-500">
              {initialsFor(name)}
            </span>
          )}
          {busy && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-ink-400 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex gap-1.5 mb-2 text-xs">
            <button
              type="button"
              onClick={() => {
                setMode("upload");
                setError(null);
              }}
              className={`chip ${mode === "upload" ? "bg-sage-600 text-white" : "bg-white border border-ink-200"}`}
            >
              📷 Upload
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("url");
                setError(null);
              }}
              className={`chip ${mode === "url" ? "bg-sage-600 text-white" : "bg-white border border-ink-200"}`}
            >
              🔗 Paste URL
            </button>
            {value && (
              <button
                type="button"
                onClick={() => {
                  setUrlInput("");
                  setError(null);
                  onChange("");
                }}
                className="chip bg-white border border-ink-200 text-ink-600 hover:text-coral-700"
              >
                Remove
              </button>
            )}
          </div>

          {mode === "upload" ? (
            <>
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                disabled={busy}
                className="btn-outline text-xs"
              >
                {busy ? "Processing…" : value ? "Replace photo" : "Choose photo"}
              </button>
              <p className="text-xs text-ink-500 mt-2">
                JPG/PNG, up to 8MB. We resize to {OUTPUT_SIZE}px on upload to keep things fast.
                Or drag a file onto the circle.
              </p>
            </>
          ) : (
            <div className="space-y-1.5">
              <div className="flex gap-1.5">
                <input
                  className="input py-1.5 text-xs"
                  placeholder="https://example.com/me.jpg"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                />
                <button type="button" onClick={applyUrl} className="btn-primary text-xs px-3 py-1.5">
                  Use
                </button>
              </div>
              <p className="text-xs text-ink-500">
                Paste any public image URL (e.g. from LinkedIn or Unsplash).
              </p>
            </div>
          )}

          {error && <p className="text-xs text-coral-700 mt-2">⚠ {error}</p>}
        </div>
      </div>

      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
