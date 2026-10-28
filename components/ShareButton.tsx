"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";
import { btnGhost } from "@/lib/ui";

export default function ShareButton({ title, text }: { title: string; text: string }) {
  const [copied, setCopied] = useState(false);

  async function onClick() {
    const url = window.location.href;
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title, text, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // user cancelled the share sheet, or clipboard blocked: nothing to do
    }
  }

  return (
    <button type="button" onClick={onClick} className={btnGhost}>
      {copied ? <Check size={16} /> : <Share2 size={16} />}
      {copied ? "Link disalin" : "Bagikan"}
    </button>
  );
}
