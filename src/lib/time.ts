// src/lib/time.ts
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;

export function timeSince(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < SECONDS_PER_MINUTE) return "moins d’1 min";

  const minutes = Math.floor(seconds / SECONDS_PER_MINUTE);
  if (minutes < MINUTES_PER_HOUR) return `${minutes} min`;

  const hours = Math.floor(minutes / MINUTES_PER_HOUR);
  const mins = minutes % MINUTES_PER_HOUR;
  return mins ? `${hours}h ${mins}min` : `${hours}h`;
}

export function formatDurationShort(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "—";

  const minutes = Math.floor(seconds / SECONDS_PER_MINUTE);
  if (minutes < MINUTES_PER_HOUR) return `${minutes} min`;

  const hours = Math.floor(minutes / MINUTES_PER_HOUR);
  const mins = minutes % MINUTES_PER_HOUR;
  return mins ? `${hours}h ${mins}min` : `${hours}h`;
}
