// src/lib/timers/schema.ts
import { z } from "zod";

export const EVENT_TYPES = [
  "biberon",
  "dodo",
  "repas",
  "caca",
  "pipi",
  "bain",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

// Points journaliers pour les stats
export const timerDayPointSchema = z.object({
  date: z.string(), // "YYYY-MM-DD"
  count: z.number().int().nonnegative(),
  avgDurationMinutes: z.number().nullable(),
});

export type TimerDayPoint = z.infer<typeof timerDayPointSchema>;

// Stats agrégées par type (biberon / dodo / etc.)
export const timerTypeStatsSchema = z.object({
  type: z.enum(EVENT_TYPES),
  totalEvents: z.number().int().nonnegative(),
  avgDurationMinutes: z.number().nullable(),
  lastEventStart: z.string().nullable(), // ISO
  lastEventDurationMinutes: z.number().nullable(),
  series: z.array(timerDayPointSchema),
});

export type TimerTypeStats = z.infer<typeof timerTypeStatsSchema>;

// Réponse globale de l’API de stats
export const timerStatsResponseSchema = z.object({
  lookbackDays: z.number().int().positive(),
  babyId: z.string(),
  stats: z.array(timerTypeStatsSchema),
});

export type TimerStatsResponse = z.infer<typeof timerStatsResponseSchema>;

// Alias lisible côté UI
export type TimerType = EventType;

export const dayEventSchema = z.object({
  id: z.string(),
  type: z.enum(EVENT_TYPES),
  startedAt: z.string(),
  endedAt: z.string().nullable(),
});

export type DayEvent = z.infer<typeof dayEventSchema>;

export const dayEventsResponseSchema = z.object({
  date: z.string(), // "YYYY-MM-DD"
  babyId: z.string(),
  type: z.enum(EVENT_TYPES).nullable(),
  events: z.array(dayEventSchema),
});

export type DayEventsResponse = z.infer<typeof dayEventsResponseSchema>;
