"use client";

import { useEffect, useState } from "react";

export type Entry = {
  _id: string;
  message: string;
  createdAt: string;
  favorite?: boolean;
  imagePath?: string;
  signedUrl?: string;
};

export type Filter = "all" | "today" | "week" | "important";

export function useJournalEntries(babyId?: string) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!babyId) return; // ⚠️ attend que babyId soit défini

    const loadEntries = async () => {
      setLoading(true);

      const cacheKey = `journalCache_${babyId}`;
      const cached = localStorage.getItem(cacheKey);

      if (cached) {
        const { data, expiresAt } = JSON.parse(cached);
        if (Date.now() < expiresAt) {
          setEntries(data);
          setLoading(false);
          return;
        }
      }

      // 🔹 On ajoute babyId dans l’URL !
      const res = await fetch(`/api/journal?babyId=${babyId}`);
      if (!res.ok) {
        setLoading(false);
        return;
      }

      const data = await res.json();
      setEntries(data);
      setLoading(false);

      localStorage.setItem(
        cacheKey,
        JSON.stringify({
          data,
          expiresAt: Date.now() + 55 * 60 * 1000,
        })
      );
    };

    loadEntries();
  }, [babyId]);

  return { entries, setEntries, loading };
}
