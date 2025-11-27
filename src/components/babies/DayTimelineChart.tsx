// src/components/babies/DayTimelineChart.tsx
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

import type { DayEvent, TimerType } from "@/lib/timers/schema";

/* ---------- Constantes ---------- */

// Partial pour ne pas exploser si TimerType évolue
const TYPE_ICON: Partial<Record<TimerType, string>> = {
  biberon: "🍼",
  dodo: "😴",
  repas: "🍽️",
  caca: "💩",
  pipi: "💧",
  bain: "🛁",
};

type PointKind = "event" | "segment" | "sleep-start" | "sleep-end";

type Point = {
  id: string;
  time: number; // heure en décimal 0–24
  y: number;
  label: string;
  kind?: PointKind;
};

type DayTooltipProps = {
  active?: boolean;
  payload?: { payload: Point }[];
};

/* ---------- Utils ---------- */

function eventsToPoints(events: DayEvent[]): Point[] {
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
      y: 0.5, // milieu de la zone (domaine [0,1])
      label,
    };
  });
}

/* =========================================
   Graphique générique (biberon, repas...)
   ========================================= */

interface DayTimelineChartProps {
  events: DayEvent[];
  type: TimerType;
}

// forme custom pour biberon/repas/etc.

export function DayTimelineChart({ events, type }: DayTimelineChartProps) {
  const data = React.useMemo(() => eventsToPoints(events), [events]);

  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [size, setSize] = React.useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  React.useEffect(() => {
    if (!containerRef.current) return;

    if (typeof ResizeObserver === "undefined") {
      const rect = containerRef.current.getBoundingClientRect();
      setSize({ width: rect.width, height: rect.height });
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setSize({
        width: width ?? 0,
        height: height ?? 0,
      });
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const icon = TYPE_ICON[type] ?? "•";

  // composant complet pour le dot + icône au-dessus
  const DotWithIcon: React.FC<{ cx?: number; cy?: number }> = ({ cx, cy }) => {
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
            ticks={[0, 6, 12, 18, 24]}
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

/* ---------- Tooltip commun ---------- */

function DayTooltip({ active, payload }: DayTooltipProps) {
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

/* ---------- Graphique spécifique Sommeil (plages) ---------- */

interface SleepTimelineChartProps {
  events: DayEvent[];
}

/**
 * Sommeil : même axe que DayTimelineChart,
 * plages bleues + icône 😴 au début, 😀 à la fin.
 */
export function SleepTimelineChart({ events }: SleepTimelineChartProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [size, setSize] = React.useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  React.useEffect(() => {
    if (!containerRef.current) return;

    if (typeof ResizeObserver === "undefined") {
      const rect = containerRef.current.getBoundingClientRect();
      setSize({ width: rect.width, height: rect.height });
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setSize({
        width: width ?? 0,
        height: height ?? 0,
      });
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const { segments, points, iconPoints } = React.useMemo(() => {
    if (events.length === 0) {
      return {
        segments: [] as { id: string; startTime: number; endTime: number; label: string }[],
        points: [] as Point[],
        iconPoints: [] as Point[],
      };
    }

    // journée du premier event
    const first = new Date(events[0].startedAt);
    const dayStart = new Date(first);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const dayStartTime = dayStart.getTime();
    const oneMinute = 60 * 1000;

    const segs: { id: string; startTime: number; endTime: number; label: string }[] = [];

    for (const ev of events) {
      if (!ev.startedAt || !ev.endedAt) continue;

      const rawStart = new Date(ev.startedAt);
      const rawEnd = new Date(ev.endedAt as string);

      // clip sur la journée affichée
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

      segs.push({ id: ev.id, startTime, endTime, label });
    }

    // centre de plage pour le tooltip
    const pts: Point[] = segs.map((seg) => ({
      id: seg.id,
      time: (seg.startTime + seg.endTime) / 2,
      y: 0.5,
      label: seg.label,
      kind: "segment",
    }));

    // icônes début (😴) / fin (😀)
    const iconPts: Point[] = [];
    for (const seg of segs) {
      iconPts.push(
        {
          id: `${seg.id}-start`,
          time: seg.startTime,
          y: 0.5,
          label: "",
          kind: "sleep-start",
        },
        {
          id: `${seg.id}-end`,
          time: seg.endTime,
          y: 0.5,
          label: "",
          kind: "sleep-end",
        }
      );
    }

    return { segments: segs, points: pts, iconPoints: iconPts };
  }, [events]);

  const ticks = [0, 6, 12, 18, 24];
  const SLEEP_START_ICON = "😴";
  const SLEEP_END_ICON = "😀";

  // forme custom pour les icônes début/fin
  const SleepIconShape: React.FC<{
    cx?: number;
    cy?: number;
    payload?: Point;
  }> = ({ cx, cy, payload }) => {
    if (cx == null || cy == null || !payload) return null;

    const iconY = cy - 12; // au-dessus de la ligne
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

  // forme vide pour les points "fantômes" du tooltip
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
            ticks={ticks}
            tickFormatter={(value) => `${value}h`}
            tick={{ fontSize: 11 }}
            axisLine={{ strokeOpacity: 0.5 }}
            tickLine={{ strokeOpacity: 0.5 }}
          />
          <YAxis type="number" dataKey="y" hide domain={[0, 1]} />

          {/* plages de sommeil : fines, bleues */}
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

          {/* icônes 😴 / 😀 début / fin */}
          {iconPoints.length > 0 && (
            <Scatter
              data={iconPoints}
              shape={<SleepIconShape />}
              isAnimationActive={false}
            />
          )}

          {/* points invisibles pour le tooltip */}
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
