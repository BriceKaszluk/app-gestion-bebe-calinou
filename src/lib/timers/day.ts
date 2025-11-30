// src/lib/timers/day.ts
const MS_PER_MINUTE = 60 * 1000;

export type DayBounds = {
  start: Date;
  end: Date;
};

export function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function getDayBounds(date: Date): DayBounds {
  const start = startOfDay(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function intervalIntersectsDay(
  startedAt: Date,
  endedAt: Date | null | undefined,
  bounds: DayBounds,
): boolean {
  if (!endedAt) {
    return startedAt >= bounds.start && startedAt < bounds.end;
  }

  return startedAt < bounds.end && endedAt > bounds.start;
}

export function clampIntervalToDay(
  startedAt: Date,
  endedAt: Date,
  bounds: DayBounds,
): { start: Date; end: Date } | null {
  const startMs = Math.max(startedAt.getTime(), bounds.start.getTime());
  const endMs = Math.min(endedAt.getTime(), bounds.end.getTime());

  if (endMs <= startMs) {
    return null;
  }

  return { start: new Date(startMs), end: new Date(endMs) };
}

export function minutesFromStartOfDay(date: Date, bounds: DayBounds): number {
  return (date.getTime() - bounds.start.getTime()) / MS_PER_MINUTE;
}
