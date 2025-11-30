"use client";

import * as React from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceArea,
} from "recharts";

import type { DayEvent } from "@/lib/timers/schema";
import { useChartSize } from "@/hooks/useChartSize";
import {
  DayTooltip,
  HOUR_TICKS,
  Point,
} from "./chartsShared";

interface SleepTimelineChartProps {
  events: DayEvent[];
  day: Date;
}

type SleepSegment = {
  id: string;
  startTime: number;
  endTime: number;
  label: string;
  showStartIcon: boolean;
  showEndIcon: boolean;
};

type SleepIconPoint = Point;

/* ---------- Utils sommeil ---------- */

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(d: Date, days: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function buildSleepSegmentsForDay(
  events: DayEvent[],
  day: Date,
): { segments: SleepSegment[]; points: Point[]; iconPoints: SleepIconPoint[] } {
  if (events.length === 0) {
    return { segments: [], points: [], iconPoints: [] };
  }

  const dayStart = startOfDay(day);
  const dayEnd = addDays(dayStart, 1);

  const dayStartTime = dayStart.getTime();
  const oneMinute = 60 * 1000;

  const segments: SleepSegment[] = [];

  for (const ev of events) {
    if (!ev.startedAt || !ev.endedAt) continue;

    const rawStart = new Date(ev.startedAt);
    const rawEnd = new Date(ev.endedAt as string);

    // event touche ce jour ?
    const intersects =
      rawEnd > dayStart && rawStart < dayEnd; // [start, end) ∩ [dayStart, dayEnd) ≠ ∅
    if (!intersects) continue;

    // clip dans [dayStart, dayEnd]
    const startMs = Math.max(rawStart.getTime(), dayStart.getTime());
    const endMs = Math.min(rawEnd.getTime(), dayEnd.getTime());
    if (endMs <= startMs) continue;

    const startMinutes = (startMs - dayStartTime) / oneMinute;
    const endMinutes = (endMs - dayStartTime) / oneMinute;

    const startTime = startMinutes / 60; // 0–24
    const endTime = endMinutes / 60;

    const label = `${rawStart.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    })} → ${rawEnd.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;

    const startInDay = rawStart >= dayStart && rawStart < dayEnd;
    const endInDay = rawEnd > dayStart && rawEnd <= dayEnd;

    segments.push({
      id: ev.id,
      startTime,
      endTime,
      label,
      showStartIcon: startInDay,
      showEndIcon: endInDay,
    });
  }

  const points: Point[] = segments.map((seg) => ({
    id: seg.id,
    time: (seg.startTime + seg.endTime) / 2,
    y: 0.5,
    label: seg.label,
    kind: "segment",
  }));

  const iconPoints: SleepIconPoint[] = [];
  for (const seg of segments) {
    if (seg.showStartIcon) {
      iconPoints.push({
        id: `${seg.id}-start`,
        time: seg.startTime,
        y: 0.5,
        label: "",
        kind: "sleep-start",
      });
    }
    if (seg.showEndIcon) {
      iconPoints.push({
        id: `${seg.id}-end`,
        time: seg.endTime,
        y: 0.5,
        label: "",
        kind: "sleep-end",
      });
    }
  }

  return { segments, points, iconPoints };
}

/* ---------- Composant ---------- */

export function SleepTimelineChart({ events, day }: SleepTimelineChartProps) {
  const { containerRef, size } = useChartSize();

  const { segments, points, iconPoints } = React.useMemo(
    () => buildSleepSegmentsForDay(events, day),
    [events, day],
  );

  const SLEEP_START_ICON = "😴";
  const SLEEP_END_ICON = "😀";

  const SleepIconShape: React.FC<{
    cx?: number;
    cy?: number;
    payload?: Point;
  }> = ({ cx, cy, payload }) => {
    if (cx == null || cy == null || !payload) return null;

    const iconY = cy - 12;
    const icon =
      payload.kind === "sleep-start" ? SLEEP_START_ICON : SLEEP_END_ICON;

    return (
      <text
        x={cx}
        y={iconY}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={18}
      >
        {icon}
      </text>
    );
  };

  const NullShape: React.FC = () => null;

  return (
    <div
      ref={containerRef}
      className="h-24 w-full rounded-md border border-border bg-muted/40 px-2 py-1 text-primary"
    >
      {size.width > 0 && size.height > 0 && segments.length > 0 && (
        <ScatterChart
          width={size.width}
          height={size.height}
          margin={{ top: 24, right: 16, bottom: 20, left: 16 }}
        >
          <CartesianGrid
            vertical={false}
            strokeDasharray="3 3"
            strokeOpacity={0.2}
          />
          <XAxis
            type="number"
            dataKey="time"
            domain={[0, 24]}
            ticks={HOUR_TICKS}
            tickFormatter={(value) => `${value}h`}
            tick={{ fontSize: 11 }}
            axisLine={{ strokeOpacity: 0.5 }}
            tickLine={{ strokeOpacity: 0.5 }}
          />
          <YAxis type="number" dataKey="y" hide domain={[0, 1]} />

          {segments.map((seg) => (
            <ReferenceArea
              key={seg.id}
              x1={seg.startTime}
              x2={seg.endTime}
              y1={0.47}
              y2={0.53}
              stroke="none"
              fill="rgba(56, 189, 248, 0.75)" // sky-400 approx
            />
          ))}

          {iconPoints.length > 0 && (
            <Scatter
              data={iconPoints}
              shape={<SleepIconShape />}
              isAnimationActive={false}
            />
          )}

          {points.length > 0 && (
            <>
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                content={<DayTooltip />}
              />
              <Scatter
                data={points}
                shape={<NullShape />}
                isAnimationActive={false}
              />
            </>
          )}
        </ScatterChart>
      )}

      {segments.length === 0 && (
        <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
          Aucun sommeil enregistré pour cette journée
        </div>
      )}
    </div>
  );
}
