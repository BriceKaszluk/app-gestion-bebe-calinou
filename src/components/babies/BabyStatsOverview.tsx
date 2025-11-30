// src/components/babies/BabyStatsOverview.tsx
"use client";

import dynamic from "next/dynamic";
import { useBabyStore } from "@/store/useBabyStore";
import type { DayEvent, TimerType } from "@/lib/timers/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useBabyDayEvents } from "@/hooks/useBabyDayEvents";
import { HeaderRow } from "@/components/babies/stats/HeaderRow";
import { EventCards } from "@/components/babies/stats/EventCards";

const DayTimelineChart = dynamic<{
  events: DayEvent[];
  type: TimerType;
}>(
  () =>
    import("./charts/DayTimelineChart").then((m) => m.DayTimelineChart),
  { ssr: false },
);

const SleepTimelineChart = dynamic<{
  events: DayEvent[];
  day: Date;
}>(
  () =>
    import("./charts/SleepTimelineChart").then((m) => m.SleepTimelineChart),
  { ssr: false },
);

export function BabyStatsOverview() {
  const { activeBaby } = useBabyStore();

  const {
    offset,
    setOffset,
    weekdayLabel,
    currentDate,
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

      <EventCards
        data={data}
        currentDate={currentDate}
        charts={{ DayTimelineChart, SleepTimelineChart }}
      />
    </div>
  );
}
