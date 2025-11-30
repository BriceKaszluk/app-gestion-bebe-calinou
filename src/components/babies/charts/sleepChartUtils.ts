// src/components/babies/charts/sleepChartUtils.ts
import type { SleepSegment } from "@/lib/timers/sleep";
import type { Point } from "./chartsShared";

export function buildSleepChartPoints(segments: SleepSegment[]) {
  const points: Point[] = segments.map((seg) => ({
    id: seg.id,
    time: (seg.startTime + seg.endTime) / 2,
    y: 0.5,
    label: seg.label,
    kind: "segment",
  }));

  const iconPoints: Point[] = [];

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

  return { points, iconPoints };
}
