"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cldUrl } from "@/lib/cloudinary-url";

type Img = { url: string; width: number | null; height: number | null };

export default function Gallery({ images, title }: { images: Img[]; title: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const touchX = useRef<number | null>(null);
  const count = images.length;

  const prev = useCallback(
    () => setOpen((i) => (i === null ? i : (i - 1 + count) % count)),
    [count],
  );
  const next = useCallback(
    () => setOpen((i) => (i === null ? i : (i + 1) % count)),
    [count],
  );

  useEffect(() => {
    if (open === null) return;
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") setOpen(null);
      else if (ev.key === "ArrowLeft") prev();
      else if (ev.key === "ArrowRight") next();
    };
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = oldOverflow;
    };
  }, [open, prev, next]);

  if (count === 0) return null;
  const [cover, ...rest] = images;

  // Base style for buttons
  const iconBtn =
    "flex items-center justify-center border border-ink bg-card text-ink shadow-[2px_2px_0_var(--color-ink)] md:hover:bg-sand transition-all";

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setOpen(0)}
        aria-label="Perbesar gambar"
        className="block w-full cursor-zoom-in border border-ink bg-sand shadow-[3px_3px_0_var(--color-ink)]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cldUrl(cover.url, "c_limit,w_1200,f_auto,q_auto")}
          alt={title}
          width={cover.width ?? undefined}
          height={cover.height ?? undefined}
          className="h-auto w-full"
        />
      </button>

      {rest.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {rest.map((img, i) => (
            <button
              key={img.url}
              type="button"
              onClick={() => setOpen(i + 1)}
              aria-label={`Perbesar gambar ${i + 2}`}
              className="block aspect-square cursor-zoom-in overflow-hidden border border-ink bg-sand"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cldUrl(img.url, "c_fill,g_auto,w_400,h_400,f_auto,q_auto")}
                alt={`${title} (${i + 2})`}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {open !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-ink/90 p-4 select-none"
          onClick={() => setOpen(null)}
          onTouchStart={(ev) => (touchX.current = ev.touches[0].clientX)}
          onTouchEnd={(ev) => {
            if (touchX.current === null) return;
            const dx = ev.changedTouches[0].clientX - touchX.current;
            touchX.current = null;
            if (Math.abs(dx) > 50) (dx > 0 ? prev : next)();
          }}
        >
          {/* Main Display Container */}
          <div className="relative flex flex-1 items-center justify-center w-full max-w-4xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cldUrl(images[open].url, "c_limit,w_1600,f_auto,q_auto")}
              alt={`${title} (${open + 1})`}
              onClick={(ev) => ev.stopPropagation()}
              className="max-h-[75vh] md:max-h-[85vh] max-w-full border border-ink bg-sand object-contain shadow-[4px_4px_0_var(--color-ink)]"
            />

            {/* Desktop-Only Arrows (Hidden on Mobile) */}
            {count > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Sebelumnya"
                  onClick={(ev) => { ev.stopPropagation(); prev(); }}
                  className={`${iconBtn} hidden md:flex absolute -left-6 top-1/2 -translate-y-1/2 h-11 w-11`}
                >
                  <ChevronLeft size={22} />
                </button>
                <button
                  type="button"
                  aria-label="Berikutnya"
                  onClick={(ev) => { ev.stopPropagation(); next(); }}
                  className={`${iconBtn} hidden md:flex absolute -right-6 top-1/2 -translate-y-1/2 h-11 w-11`}
                >
                  <ChevronRight size={22} />
                </button>
              </>
            )}
          </div>

          {/* Close button (Stays visible top-right) */}
          <button
            type="button"
            aria-label="Tutup"
            onClick={(ev) => { ev.stopPropagation(); setOpen(null); }}
            className={`${iconBtn} absolute right-4 top-4 h-10 w-10`}
          >
            <X size={18} />
          </button>

          {/* Bottom Interactive Area (Optimized for Mobile viewports) */}
          <div
            className="mt-6 flex items-center gap-6"
            onClick={(ev) => ev.stopPropagation()}
          >
            {count > 1 && (
              <button
                type="button"
                aria-label="Sebelumnya"
                onClick={(ev) => { ev.stopPropagation(); prev(); }}
                className={`${iconBtn} md:hidden h-12 w-12`}
              >
                <ChevronLeft size={24} />
              </button>
            )}

            <p className="font-mono text-sm font-bold text-paper bg-ink border border-paper px-3 py-1 shadow-[2px_2px_0_rgba(255,255,255,0.15)]">
              {open + 1} / {count}
            </p>

            {count > 1 && (
              <button
                type="button"
                aria-label="Berikutnya"
                onClick={(ev) => { ev.stopPropagation(); next(); }}
                className={`${iconBtn} md:hidden h-12 w-12`}
              >
                <ChevronRight size={24} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
