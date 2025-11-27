// src/components/babies/BabyStatsOverview.tsx
"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useBabyStore } from "@/store/useBabyStore";
import {
  EVENT_TYPES,
  type TimerType,
  type DayEventsResponse,
  dayEventsResponseSchema,
} from "@/lib/timers/schema";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Chargement lazy des composants de graphique
const DayTimelineChart = dynamic(
  () =>
    import("./DayTimelineChart").then((m) => m.DayTimelineChart),
  { ssr: false },
);

const SleepTimelineChart = dynamic(
  () =>
    import("./DayTimelineChart").then((m) => m.SleepTimelineChart),
  { ssr: false },
);

const TYPE_LABELS: Record<
  TimerType,
  { label: string; description: string }
> = {
  biberon: {
    label: "Biberons",
    description: "Repas et rythme d’alimentation",
  },
  dodo: {
    label: "Sommeil",
    description: "Siestes et nuits cumulées",
  },
  repas: {
    label: "Repas",
    description: "Repas solides / mixtes",
  },
  caca: {
    label: "Caca",
    description: "Fréquence des selles",
  },
  pipi: {
    label: "Pipi",
    description: "Couches mouillées",
  },
  bain: {
    label: "Bain",
    description: "Rythme des bains",
  },
};

export function BabyStatsOverview() {
  const { activeBaby } = useBabyStore();

  const [offset, setOffset] = React.useState(0); // 0 = aujourd’hui
  const [data, setData] = React.useState<DayEventsResponse | null>(
    null,
  );
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // cache local : "<babyId>:YYYY-MM-DD" -> DayEventsResponse
  const cacheRef = React.useRef<Record<string, DayEventsResponse>>(
    {},
  );

  const currentDate = React.useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + offset);
    return d;
  }, [offset]);

  React.useEffect(() => {
    if (!activeBaby?._id) {
      setData(null);
      setError(null);
      cacheRef.current = {};
      return;
    }

    const dateKey = formatDateYYYYMMDD(currentDate);
    const cacheKey = `${activeBaby._id}:${dateKey}`;
    const cached = cacheRef.current[cacheKey];

    if (cached) {
      setData(cached);
      setError(null);
      return;
    }

    let isMounted = true;

    const fetchDay = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `/api/events/day?babyId=${encodeURIComponent(
            activeBaby._id,
          )}&date=${dateKey}`,
        );
        if (!res.ok) {
          throw new Error("Erreur lors du chargement des statistiques");
        }
        const json = await res.json();
        const parsed = dayEventsResponseSchema.parse(json);

        if (!isMounted) return;

        cacheRef.current[cacheKey] = parsed;
        setData(parsed);
        setError(null);
      } catch (err) {
        if (!isMounted) return;
        setError(
          err instanceof Error ? err.message : "Erreur inconnue",
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void fetchDay();

    return () => {
      isMounted = false;
    };
  }, [activeBaby?._id, currentDate]);

  if (!activeBaby) {
    return (
      <p className="text-sm text-muted-foreground">
        Sélectionne d’abord un bébé pour voir les statistiques.
      </p>
    );
  }

  const weekdayLabel = currentDate.toLocaleDateString("fr-FR", {
    weekday: "long",
  });

  if (loading && !data) {
    return (
      <div className="space-y-4">
        <HeaderRow
          offset={offset}
          setOffset={setOffset}
          weekdayLabel={weekdayLabel}
        />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <>
        <HeaderRow
          offset={offset}
          setOffset={setOffset}
          weekdayLabel={weekdayLabel}
        />
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </>
    );
  }

  return (
    <div className="space-y-4">
      <HeaderRow
        offset={offset}
        setOffset={setOffset}
        weekdayLabel={weekdayLabel}
      />

      {EVENT_TYPES.map((type) => {
        const t = type as TimerType;
        const meta = TYPE_LABELS[t];
        const eventsForType =
          data?.events.filter((ev) => ev.type === t) ?? [];

        return (
          <Card key={t} className="w-full">
            <CardHeader className="pb-2">
              <div className="flex items-baseline justify-between gap-2">
                <CardTitle className="text-base font-semibold">
                  {meta.label}
                </CardTitle>
                <span className="text-xs text-muted-foreground">
                  {eventsForType.length} évènement
                  {eventsForType.length > 1 ? "s" : ""} ce jour-là
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {meta.description}
              </p>
            </CardHeader>

            <CardContent>
              {eventsForType.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Aucun évènement enregistré pour ce type sur cette
                  journée.
                </p>
              ) : t === "dodo" ? (
                <SleepTimelineChart events={eventsForType} />
              ) : (
                <DayTimelineChart type={t} events={eventsForType} />
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

/* ---------- Header jour + boutons prev/next ---------- */

interface HeaderRowProps {
  offset: number;
  setOffset: React.Dispatch<React.SetStateAction<number>>;
  weekdayLabel: string;
}

function HeaderRow({
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

function formatDateYYYYMMDD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
