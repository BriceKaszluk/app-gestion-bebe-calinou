// src/hooks/useJournalEntries.ts
"use client";

import { useEffect, useMemo, useState } from "react";

export type Entry = {
  _id: string;
  message?: string;        // 💡 texte parfois absent (entrée image seule)
  createdAt: string;
  favorite?: boolean;
  imagePath?: string;
  signedUrl?: string;
};

export type Filter = "all" | "today" | "week" | "important";

type CacheShape = {
  entries: Entry[];
  expiresAt: number;
};

const TTL_MS = 55 * 60 * 1000; // 55 min

export function useJournalEntries(babyId?: string) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);
  const [bump, setBump] = useState(0); // permet de forcer un refresh

  const cacheKey = useMemo(
    () => (babyId ? `journalCache:${babyId}` : null),
    [babyId]
  );

  useEffect(() => {
    if (!babyId) {
      setEntries([]);
      return;
    }

    let aborted = false;
    const controller = new AbortController();

    const load = async () => {
      setLoading(true);

      // 1) Lecture cache (best-effort)
      if (cacheKey) {
        try {
          const raw = localStorage.getItem(cacheKey);
          if (raw) {
            const parsed = JSON.parse(raw) as CacheShape;
            if (
              parsed &&
              Array.isArray(parsed.entries) &&
              Number.isFinite(parsed.expiresAt) &&
              parsed.expiresAt > Date.now()
            ) {
              if (!aborted) setEntries(parsed.entries);
            }
          }
        } catch {
          // ignore (JSON invalide / quota)
        }
      }

      // 2) Requête réseau
      try {
        const res = await fetch(
          `/api/journal?babyId=${encodeURIComponent(babyId)}`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error("Erreur chargement journal");

        const data = (await res.json()) as { entries?: Entry[] } | Entry[];
        const next = Array.isArray(data) ? data : data.entries ?? [];

        if (!aborted) {
          setEntries(next);
          if (cacheKey) {
            try {
              const payload: CacheShape = {
                entries: next,
                expiresAt: Date.now() + TTL_MS,
              };
              localStorage.setItem(cacheKey, JSON.stringify(payload));
            } catch {
              // ignore (quota)
            }
          }
        }
      } catch {
        // offline/abort/erreur API — on garde ce qu’on a (cache éventuel)
      } finally {
        if (!aborted) setLoading(false);
      }
    };

    void load();

    return () => {
      aborted = true;
      controller.abort();
    };
  }, [babyId, cacheKey, bump]);

  const refresh = () => setBump((n) => n + 1);

  return { entries, setEntries, loading, refresh };
}
