"use client";
import { useEffect } from "react";

const CURSORS = { default: "4 2", pointer: "7 2", text: "16 16", crosshair: "16 16", move: "16 16", wait: "16 16", help: "4 2", "n-resize": "16 16", progress: "4 2", "zoom-in": "13 11", "zoom-out": "13 11",
 } as const;
const MAP = { "#FF00FF": "--color-ink", "#FFFF00": "--color-card", "#00FFFF": "--color-accent" } as const;

const cache: Record<string, string> = {};
const load = async (n: string) =>
  (cache[n] ??= await fetch(`/cursors/cursor-${n}.svg`).then((r) => {
    if (!r.ok) throw new Error(`missing cursor-${n}.svg`);
    return r.text();
  }));

async function apply() {
  const root = document.documentElement, cs = getComputedStyle(root);
  await Promise.all(Object.entries(CURSORS).map(async ([n, hot]) => {
    let svg = await load(n);
    for (const [from, v] of Object.entries(MAP)) svg = svg.replaceAll(new RegExp(from, "gi"), cs.getPropertyValue(v).trim());
    root.style.setProperty(`--cursor-${n}`, `url("data:image/svg+xml,${encodeURIComponent(svg)}") ${hot}, auto`);
  }));
}

export default function CursorTheme() {
  useEffect(() => {
    apply();
    const obs = new MutationObserver(apply);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);
  return null;
}
