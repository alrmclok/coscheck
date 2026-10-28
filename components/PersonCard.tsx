"use client";

import { useId, useRef } from "react";
import MemberPhoto from "@/components/MemberPhoto";
import type { Person } from "@/lib/credits";

interface PersonProps {
  p: Person;
}

function ProfileLink({ href, className = "" }: { href?: string; className?: string }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`relative z-10 font-mono text-xs text-accent underline underline-offset-4 ${className}`}
    >
      Profil
    </a>
  );
}

function PersonDialog({ p, dialogRef }: { p: Person; dialogRef: React.RefObject<HTMLDialogElement | null> }) {
  const labelId = useId();
  const descId = useId();

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === e.currentTarget) e.currentTarget.close();
  };

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      aria-labelledby={labelId}
      aria-describedby={p.bio ? descId : undefined}
      className="m-auto w-[min(92vw,420px)] border-2 border-ink bg-card p-0 text-ink shadow-[6px_6px_0_var(--color-ink)] backdrop:bg-black/60 focus:outline-none"
    >
      <div className="flex flex-col items-center gap-3 p-6 text-center">
        <MemberPhoto src={p.photo} alt={p.name} />

        <div className="min-w-0 max-w-full">
          <h2 id={labelId} className="break-words font-display text-xl font-bold">{p.name}</h2>
          <p className="mt-1 text-sm text-soft">{p.role}</p>
          {p.group && (
            <p className="mt-1 font-mono text-[11px] uppercase tracking-[1.5px] text-muted">
              {p.group}
            </p>
          )}
        </div>

        {p.bio && (
          <p id={descId} className="text-sm leading-relaxed text-soft">{p.bio}</p>
        )}

        <div className="mt-2 flex items-center gap-4">
          <ProfileLink href={p.link} />
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="border border-ink px-3 py-1 font-mono text-xs uppercase transition hover:bg-ink hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            Tutup
          </button>
        </div>
      </div>
    </dialog>
  );
}

export function PersonItem({ p, featured = false }: PersonProps & { featured?: boolean }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const containerStyles = featured
    ? "relative flex flex-col items-center gap-3 border-2 border-ink bg-bg p-6 text-center shadow-[4px_4px_0_var(--color-accent)] sm:flex-row sm:text-left"
    : "relative flex items-center gap-4 border border-ink p-3 transition hover:-translate-y-[3px] hover:shadow-[0px_3px_0_var(--color-ink)]";

  return (
    <>
      <li className={containerStyles}>
        <MemberPhoto src={p.photo} alt={p.name} />

        <div className="min-w-0">
          {featured && (
            <p className="font-mono text-[11px] uppercase tracking-[1.5px] text-accent">
              {p.role}
            </p>
          )}

          <button
            type="button"
            onClick={() => dialogRef.current?.showModal()}
            className="block max-w-full text-left font-bold cursor-pointer after:absolute after:inset-0 after:content-[''] focus:outline-none group-hover:underline"
          >
            <span className={featured ? "font-display text-xl" : "truncate block"}>
              {p.name}
            </span>
          </button>

          {!featured && <p className="truncate text-sm text-soft">{p.role}</p>}

          <ProfileLink href={p.link} />
        </div>
      </li>

      <PersonDialog p={p} dialogRef={dialogRef} />
    </>
  );
}

// Named exports to preserve original APIs if imported elsewhere
export const PersonCard = (props: PersonProps) => <PersonItem {...props} />;
export const FeaturedSponsor = (props: PersonProps) => <PersonItem {...props} featured />;
