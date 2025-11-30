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
import { buildSleepSegmentsForDay } from "@/lib/timers/sleep";
import { DayTooltip, HOUR_TICKS, Point } from "./chartsShared";
import { buildSleepChartPoints } from "./sleepChartUtils";

interface SleepTimelineChartProps {
  events: DayEvent[];
  day: Date;
}

/* ---------- Composant ---------- */

export function SleepTimelineChart({ events, day }: SleepTimelineChartProps) {
  const { containerRef, size } = useChartSize();

  const { segments, points, iconPoints } = React.useMemo(() => {
    const builtSegments = buildSleepSegmentsForDay(events, day);
    const { points, iconPoints } = buildSleepChartPoints(builtSegments);

    return { segments: builtSegments, points, iconPoints };
  }, [events, day]);

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
