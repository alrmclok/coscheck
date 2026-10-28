"use client";

import { useState } from "react";
import { PersonCard } from "@/components/PersonCard";
import type { Person } from "@/lib/credits";

const grid = "grid gap-4 grid-cols-[repeat(auto-fill,minmax(240px,1fr))]";

export default function TeamSection({
  members,
  groups,
}: {
  members: Person[];
  groups: string[];
}) {
  const [grouped, setGrouped] = useState(true);

  const known = groups
    .map((g) => ({ name: g, list: members.filter((m) => m.group === g) }))
    .filter((g) => g.list.length > 0); // empty groups are skipped
  const rest = members.filter((m) => !m.group || !groups.includes(m.group));
  const canGroup = known.length > 0;

  const tab = (active: boolean) =>
    `border border-ink px-2.5 py-1 font-mono text-xs uppercase transition ${
      active ? "bg-ink text-paper" : "hover:bg-ink hover:text-paper"
    }`;

  return (
    <div>
      {canGroup && (
        <div className="mb-4 flex gap-2">
          <button type="button" className={tab(grouped)} onClick={() => setGrouped(true)}>
            Per grup
          </button>
          <button type="button" className={tab(!grouped)} onClick={() => setGrouped(false)}>
            Semua
          </button>
        </div>
      )}

      {canGroup && grouped ? (
        <div className="space-y-6">
          {known.map((g) => (
            <div key={g.name}>
              <h3 className="mb-3 font-mono text-[11px] uppercase tracking-[1.5px] text-muted">
                {g.name} · {g.list.length}
              </h3>
              <ul className={grid}>
                {g.list.map((m) => <PersonCard key={m.name} p={m} />)}
              </ul>
            </div>
          ))}
          {rest.length > 0 && (
            <div>
              <h3 className="mb-3 font-mono text-[11px] uppercase tracking-[1.5px] text-muted">
                Lainnya · {rest.length}
              </h3>
              <ul className={grid}>
                {rest.map((m) => <PersonCard key={m.name} p={m} />)}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <ul className={grid}>
          {members.map((m) => <PersonCard key={m.name} p={m} />)}
        </ul>
      )}
    </div>
  );
}