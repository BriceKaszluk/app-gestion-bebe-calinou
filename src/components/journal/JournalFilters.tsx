"use client";

import { Button } from "@/components/ui/button";
import { Filter } from "@/hooks/useJournalEntries";

type Props = {
  filter: Filter;
  setFilter: (f: Filter) => void;
};

export default function JournalFilters({ filter, setFilter }: Props) {
  const filters: Filter[] = ["all", "today", "week"];

  const labelMap: Record<Filter, string> = {
    all: "Tous",
    today: "Aujourd’hui",
    week: "7 jours",
  };

  return (
    <div className="flex flex-wrap justify-between items-center gap-2 sm:gap-4 w-full">
      <p className="text-sm text-gray-600">Filtrer :</p>

      {/* 🧭 Mobile : menu déroulant */}
      <select
        value={filter}
        onChange={(e) => setFilter(e.target.value as Filter)}
        className="block sm:hidden w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white"
      >
        {filters.map((f) => (
          <option key={f} value={f}>
            {labelMap[f]}
          </option>
        ))}
      </select>

      {/* 💻 Desktop : boutons */}
      <div className="hidden sm:flex flex-wrap gap-2">
        {filters.map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
          >
            {labelMap[f]}
          </Button>
        ))}
      </div>
    </div>
  );
}
