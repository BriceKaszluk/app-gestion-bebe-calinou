// src/components/babies/stats/EventCards.tsx
"use client";

import * as React from "react";
import {
  EVENT_TYPES,
  type DayEvent,
  type DayEventsResponse,
  type TimerType,
} from "@/lib/timers/schema";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { TYPE_LABELS } from "./statsMeta";

type Charts = {
  DayTimelineChart: React.ComponentType<{
    events: DayEvent[];
    type: TimerType;
  }>;
  SleepTimelineChart: React.ComponentType<{
    events: DayEvent[];
    day: Date;
  }>;
};

type EventCardsProps = {
  data: DayEventsResponse | null;
  currentDate: Date;
  charts: Charts;
};

const fallback = <div className="h-24 w-full rounded-md bg-muted/50" />;

export function EventCards({
  data,
  currentDate,
  charts,
}: EventCardsProps) {
  const { DayTimelineChart, SleepTimelineChart } = charts;

  return (
    <>
      {EVENT_TYPES.map((t) => {
        const timerType = t as TimerType;
        const meta = TYPE_LABELS[timerType];
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
              <React.Suspense fallback={fallback}>
                {timerType === "dodo" ? (
                  <SleepTimelineChart
                    events={eventsForType}
                    day={currentDate}
                  />
                ) : (
                  <DayTimelineChart
                    type={timerType}
                    events={eventsForType}
                  />
                )}
              </React.Suspense>
            </CardContent>
          </Card>
        );
      })}
    </>
  );
}
