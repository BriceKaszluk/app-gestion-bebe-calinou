"use client";
import { useEffect, useState } from "react";

type Entry = {
  _id: string;
  message: string;
  createdAt: string;
  imagePath?: string;
  signedUrl?: string;
  favorite?: boolean;
};

export function useJournalEntries() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEntries() {
      const cacheKey = "journalCache";
      const cacheData = localStorage.getItem(cacheKey);

      if (cacheData) {
        const parsed = JSON.parse(cacheData);
        const now = Date.now();
        if (now < parsed.expiresAt) {
          setEntries(parsed.data);
          setLoading(false);
          return;
        }
      }

      const res = await fetch("/api/journal/CreateImageSignedUrl");
      const data = await res.json();

      if (res.ok) {
        setEntries(data);
        localStorage.setItem(
          cacheKey,
          JSON.stringify({
            data,
            expiresAt: Date.now() + 55 * 60 * 1000, // 55 min de validité
          })
        );
      }
      setLoading(false);
    }

    loadEntries();
  }, []);

  return { entries, loading };
}
