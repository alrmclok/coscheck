"use client";

import { useEffect, useRef } from "react";

// Change this link to your own placeholder image if you like
const PLACEHOLDER = "https://placehold.co/160x160/png?text=%3A3";

export default function MemberPhoto({ src, alt }: { src?: string; alt: string }) {
  const ref = useRef<HTMLImageElement>(null);

  // covers images that already failed before React took over
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0 && !img.dataset.fallback) {
      img.dataset.fallback = "1";
      img.src = PLACEHOLDER;
    }
  }, []);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      src={src || PLACEHOLDER}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={(e) => {
        const el = e.currentTarget;
        if (el.dataset.fallback) return; // stops an endless loop
        el.dataset.fallback = "1";
        el.src = PLACEHOLDER;
      }}
      className="size-20 shrink-0 border border-ink bg-sand object-cover sm:size-24"
    />
  );
}