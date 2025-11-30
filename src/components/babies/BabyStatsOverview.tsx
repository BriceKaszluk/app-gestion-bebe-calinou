// src/components/babies/BabyStatsOverview.tsx
"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useBabyStore } from "@/store/useBabyStore";
import {
  EVENT_TYPES,
  type TimerType,
  type DayEventsResponse,
} from "@/lib/timers/schema";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useBabyDayEvents } from "@/hooks/useBabyDayEvents";

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

const TYPE_LABELS = {
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
} satisfies Record<
  TimerType,
  { label: string; description: string }
>;

export function BabyStatsOverview() {
  const { activeBaby } = useBabyStore();

  const {
    offset,
    setOffset,
    weekdayLabel,
    data,
    loading,
    error,
  } = useBabyDayEvents(activeBaby?._id);

  if (!activeBaby) {
    return (
      <p className="text-sm text-muted-foreground">
        Sélectionne d’abord un bébé pour voir les statistiques.
      </p>
    );
  }

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

      <EventCards data={data} />
    </div>
  );
}

/* ---------- Sous-composants ---------- */

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

interface EventCardsProps {
  data: DayEventsResponse | null;
}

function EventCards({ data }: EventCardsProps) {
  return (
    <>
      {EVENT_TYPES.map((t) => {
        const meta = TYPE_LABELS[t as TimerType];
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
                  {eventsForType.length} événement
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
                  Aucun événement enregistré pour ce type sur cette
                  journée.
                </p>
              ) : t === "dodo" ? (
                <SleepTimelineChart events={eventsForType} />
              ) : (
                <DayTimelineChart type={t as TimerType} events={eventsForType} />
              )}
            </CardContent>
          </Card>
        );
      })}
    </>
  );
}
