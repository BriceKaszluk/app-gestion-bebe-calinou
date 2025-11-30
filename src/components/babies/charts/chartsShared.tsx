"use client";

import * as React from "react";
import type { DayEvent, TimerType } from "@/lib/timers/schema";

/* ---------- Icônes par type ---------- */

export const TYPE_ICON: Partial<Record<TimerType, string>> = {
  biberon: "🍼",
  dodo: "😴",
  repas: "🍽️",
  caca: "💩",
  pipi: "💧",
  bain: "🛁",
};

export type PointKind = "event" | "segment" | "sleep-start" | "sleep-end";

export type Point = {
  id: string;
  time: number;
  y: number;
  label: string;
  kind?: PointKind;
};

export type DayTooltipProps = {
  active?: boolean;
  payload?: { payload: Point }[];
};

export const HOUR_TICKS = [0, 6, 12, 18, 24] as const;

/* ---------- Conversion events -> points (timeline "simple") ---------- */

export function eventsToPoints(events: DayEvent[]): Point[] {
  return events.map((ev) => {
    const d = new Date(ev.startedAt);
    const minutes = d.getHours() * 60 + d.getMinutes();
    const time = minutes / 60; // 0–24

    const label = d.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    return {
      id: ev.id,
      time,
      y: 0.5,
      label,
    };
  });
}

/* ---------- Tooltip commun ---------- */

export function DayTooltip({ active, payload }: DayTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const point = payload[0]?.payload as Point | undefined;
  if (!point) return null;

  // pas de tooltip pour les icônes début/fin de sommeil
  if (point.kind === "sleep-start" || point.kind === "sleep-end") return null;

  return (
    <div className="rounded-md border bg-background px-2 py-1 text-xs shadow-sm">
      <span className="font-medium">{point.label}</span>
    </div>
  );
}
