"use client";

import { Button } from "@/components/ui/button";
import { Filter } from "@/hooks/useJournalEntries";

type Props = {
  filter: Filter;
  setFilter: (f: Filter) => void;
};

export default function JournalFilters({ filter, setFilter }: Props) {
  const filters: Filter[] = ["all", "today", "week"];
  return (
    <div className="flex flex-wrap justify-between items-center gap-2 sm:gap-4">
      <p className="text-sm text-gray-600">Filtrer :</p>
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "Tous" : f === "today" ? "Aujourd’hui" : "7 jours"}
          </Button>
        ))}
      </div>
    </div>
  );
}
