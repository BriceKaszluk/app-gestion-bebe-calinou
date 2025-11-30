"use client";

import * as React from "react";
import {
  type DayEventsResponse,
  dayEventsResponseSchema,
} from "@/lib/timers/schema";

function formatDateYYYYMMDD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

type UseBabyDayEventsResult = {
  offset: number;
  setOffset: React.Dispatch<React.SetStateAction<number>>;
  currentDate: Date;
  weekdayLabel: string;
  data: DayEventsResponse | null;
  loading: boolean;
  error: string | null;
};

export function useBabyDayEvents(
  babyId: string | null | undefined,
): UseBabyDayEventsResult {
  const [offset, setOffset] = React.useState(0); // 0 = aujourd'hui
  const [data, setData] = React.useState<DayEventsResponse | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // cache local : "<babyId>:YYYY-MM-DD" -> DayEventsResponse
  const cacheRef = React.useRef<Record<string, DayEventsResponse>>({});

  const currentDate = React.useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + offset);
    return d;
  }, [offset]);

  const weekdayLabel = React.useMemo(
    () =>
      currentDate.toLocaleDateString("fr-FR", {
        weekday: "long",
      }),
    [currentDate],
  );

  React.useEffect(() => {
    if (!babyId) {
      setData(null);
      setError(null);
      cacheRef.current = {};
      return;
    }

    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + offset);
    const dateKey = formatDateYYYYMMDD(d);
    const cacheKey = `${babyId}:${dateKey}`;
    const cached = cacheRef.current[cacheKey];

    if (cached) {
      setData(cached);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchDay = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          babyId,
          date: dateKey,
        });

        const res = await fetch(`/api/events/day?${params.toString()}`);

        if (!res.ok) {
          throw new Error("Erreur lors du chargement des statistiques");
        }

        const json = await res.json();
        const parsed = dayEventsResponseSchema.parse(json);

        if (cancelled) return;

        cacheRef.current[cacheKey] = parsed;
        setData(parsed);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Erreur inconnue",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchDay();

    return () => {
      cancelled = true;
    };
  }, [babyId, offset]);

  return {
    offset,
    setOffset,
    currentDate,
    weekdayLabel,
    data,
    loading,
    error,
  };
}
