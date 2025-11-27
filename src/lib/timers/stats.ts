// src/lib/timers/stats.ts
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import {
  EventType,
  TimerStatsResponse,
  TimerTypeStats,
} from "./schema";

type EventDoc = {
  _id: ObjectId;
  userEmail: string;
  babyId: ObjectId;
  type: EventType;
  startedAt: Date;
  endedAt?: Date;
  createdAt?: Date;
};

function minutesBetween(start: Date, end: Date): number {
  return (end.getTime() - start.getTime()) / 60000;
}

export async function getBabyTimerStats(
  babyId: string,
  lookbackDays = 7,
): Promise<TimerStatsResponse> {
  const client = await clientPromise;
  const db = client.db("calinou");
  const col = db.collection<EventDoc>("events");

  const now = new Date();
  const from = new Date(now);
  from.setDate(now.getDate() - lookbackDays);

  const docs = await col
    .find({
      babyId: new ObjectId(babyId),
      startedAt: { $gte: from },
    })
    .sort({ startedAt: 1 })
    .toArray();

  // pas de zod ici, on bosse directement sur le type EventDoc

  const byType = new Map<EventType, EventDoc[]>();

  for (const ev of docs) {
    const list = byType.get(ev.type) ?? [];
    list.push(ev);
    byType.set(ev.type, list);
  }

  const stats: TimerTypeStats[] = [];

  for (const [type, list] of byType.entries()) {
    if (list.length === 0) continue;

    const durations: number[] = [];
    for (const ev of list) {
      if (ev.endedAt) {
        durations.push(minutesBetween(ev.startedAt, ev.endedAt));
      }
    }

    const avgDurationMinutes =
      durations.length > 0
        ? Number(
            (
              durations.reduce((sum, v) => sum + v, 0) / durations.length
            ).toFixed(1),
          )
        : null;

    const last = list[list.length - 1];

    const byDay: Record<
      string,
      { count: number; totalDuration: number; durationCount: number }
    > = {};

    for (const ev of list) {
      const dayKey = ev.startedAt.toISOString().slice(0, 10); // YYYY-MM-DD

      const bucket =
        byDay[dayKey] ??
        ({
          count: 0,
          totalDuration: 0,
          durationCount: 0,
        } as {
          count: number;
          totalDuration: number;
          durationCount: number;
        });

      bucket.count += 1;

      if (ev.endedAt) {
        const d = minutesBetween(ev.startedAt, ev.endedAt);
        bucket.totalDuration += d;
        bucket.durationCount += 1;
      }

      byDay[dayKey] = bucket;
    }

    const series = Object.entries(byDay)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([date, bucket]) => ({
        date,
        count: bucket.count,
        avgDurationMinutes:
          bucket.durationCount > 0
            ? Number(
                (bucket.totalDuration / bucket.durationCount).toFixed(1),
              )
            : null,
      }));

    stats.push({
      type,
      totalEvents: list.length,
      avgDurationMinutes,
      lastEventStart: last.startedAt.toISOString(),
      lastEventDurationMinutes:
        last.endedAt != null
          ? Number(
              minutesBetween(last.startedAt, last.endedAt).toFixed(1),
            )
          : null,
      series,
    });
  }

  return {
    lookbackDays,
    babyId,
    stats,
  };
}
