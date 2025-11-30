// src/components/babies/stats/HeaderRow.tsx
"use client";

import * as React from "react";

type HeaderRowProps = {
  offset: number;
  setOffset: React.Dispatch<React.SetStateAction<number>>;
  weekdayLabel: string;
};

export function HeaderRow({
  offset,
  setOffset,
  weekdayLabel,
}: HeaderRowProps) {
  return (
    <div className="mb-2 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="rounded-md border px-2 py-1 text-xs"
          onClick={() => setOffset((o) => o - 1)}
        >
          Jour précédent
        </button>
        <button
          type="button"
          className="rounded-md border px-2 py-1 text-xs disabled:opacity-50"
          onClick={() => setOffset((o) => Math.min(o + 1, 0))}
          disabled={offset === 0}
        >
          Jour suivant
        </button>
      </div>
      <div className="text-xs text-muted-foreground capitalize">
        {weekdayLabel}
        {offset === 0 && " (aujourd’hui)"}
      </div>
    </div>
  );
}
