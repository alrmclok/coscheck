"use client";

import { useRef, type TextareaHTMLAttributes } from "react";
import { inputFull } from "@/lib/ui";

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  minHeight?: number;
  maxHeight?: number;
};

export function ResizableTextarea({
  minHeight = 80,
  maxHeight = 400,
  className,
  ...props
}: Props) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const drag = useRef<{ startY: number; startH: number } | null>(null);

  function onDown(e: React.PointerEvent<HTMLDivElement>) {
    const ta = taRef.current;
    if (!ta) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { startY: e.clientY, startH: ta.offsetHeight };
  }

  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    const ta = taRef.current;
    const d = drag.current;
    if (!ta || !d) return;
    const h = Math.min(maxHeight, Math.max(minHeight, d.startH + e.clientY - d.startY));
    ta.style.height = `${h}px`;
  }

  function onUp() {
    drag.current = null;
  }

  return (
    <>
      <textarea
        ref={taRef}
        {...props}
        className={`${className ?? inputFull} resize-none`}
      />
      <div
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onClick={(e) => e.preventDefault()}
        className="cursor-n-resize touch-none flex justify-center py-1"
        aria-hidden
      >
        <span className="h-1 w-10 rounded-full bg-line" />
      </div>
    </>
  );
}