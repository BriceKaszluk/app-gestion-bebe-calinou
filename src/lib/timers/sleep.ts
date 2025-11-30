// src/lib/timers/sleep.ts
import type { DayEvent } from "./schema";
import {
  clampIntervalToDay,
  getDayBounds,
  intervalIntersectsDay,
  minutesFromStartOfDay,
} from "./day";

const MINUTES_PER_HOUR = 60;

export type SleepSegment = {
  id: string;
  startTime: number;
  endTime: number;
  label: string;
  showStartIcon: boolean;
  showEndIcon: boolean;
};

function buildLabel(startedAt: Date, endedAt: Date): string {
  return `${startedAt.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  })} → ${endedAt.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

export function buildSleepSegmentsForDay(
  events: DayEvent[],
  day: Date,
): SleepSegment[] {
  if (events.length === 0) return [];

  const bounds = getDayBounds(day);

  return events.reduce<SleepSegment[]>((segments, ev) => {
    if (!ev.startedAt || !ev.endedAt) return segments;

    const startedAt = new Date(ev.startedAt);
    const endedAt = new Date(ev.endedAt);

    if (!intervalIntersectsDay(startedAt, endedAt, bounds)) {
      return segments;
    }

    const clamped = clampIntervalToDay(startedAt, endedAt, bounds);
    if (!clamped) return segments;

    const startHours =
      minutesFromStartOfDay(clamped.start, bounds) / MINUTES_PER_HOUR;
    const endHours =
      minutesFromStartOfDay(clamped.end, bounds) / MINUTES_PER_HOUR;

    if (endHours <= startHours) return segments;

    segments.push({
      id: ev.id,
      startTime: startHours,
      endTime: endHours,
      label: buildLabel(startedAt, endedAt),
      showStartIcon:
        startedAt >= bounds.start && startedAt < bounds.end,
      showEndIcon: endedAt > bounds.start && endedAt <= bounds.end,
    });

    return segments;
  }, []);
}
