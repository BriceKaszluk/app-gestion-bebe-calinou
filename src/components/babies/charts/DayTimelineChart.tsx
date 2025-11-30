"use client";

import * as React from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

import type { DayEvent, TimerType } from "@/lib/timers/schema";
import { useChartSize } from "@/hooks/useChartSize";
import {
  TYPE_ICON,
  eventsToPoints,
  DayTooltip,
  HOUR_TICKS,
} from "./chartsShared";

interface DayTimelineChartProps {
  events: DayEvent[];
  type: TimerType;
}

export function DayTimelineChart({ events, type }: DayTimelineChartProps) {
  const data = React.useMemo(() => eventsToPoints(events), [events]);
  const { containerRef, size } = useChartSize();

  const icon = TYPE_ICON[type] ?? "•";

  const DotWithIcon: React.FC<{ cx?: number; cy?: number }> = ({
    cx,
    cy,
  }) => {
    if (cx == null || cy == null) return null;

    const axisY = cy;
    const dotRadius = 3;
    const stemLength = 10;
    const iconOffset = 14;

    const stemY = axisY - stemLength;
    const iconY = axisY - iconOffset;

    return (
      <g>
        <circle cx={cx} cy={axisY} r={dotRadius} fill="currentColor" />
        <line
          x1={cx}
          y1={axisY}
          x2={cx}
          y2={stemY}
          stroke="currentColor"
          strokeWidth={1}
        />
        <text
          x={cx}
          y={iconY}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={20}
        >
          {icon}
        </text>
      </g>
    );
  };

  return (
    <div
      ref={containerRef}
      className="h-24 w-full rounded-md border border-border bg-muted/40 px-2 py-1 text-primary"
    >
      {size.width > 0 && size.height > 0 && data.length > 0 && (
        <ScatterChart
          width={size.width}
          height={size.height}
          margin={{ top: 20, right: 16, bottom: 20, left: 16 }}
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
          <Tooltip cursor={{ strokeDasharray: "3 3" }} content={<DayTooltip />} />
          <Scatter data={data} shape={<DotWithIcon />} />
        </ScatterChart>
      )}

      {data.length === 0 && (
        <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
          Aucune donnée pour cette journée
        </div>
      )}
    </div>
  );
}
