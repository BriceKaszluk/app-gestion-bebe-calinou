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

export type Filter = "all" | "today" | "week";

export function useJournalEntries() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEntries = async () => {
      const cacheKey = "journalCache";
      const cached = localStorage.getItem(cacheKey);

      if (cached) {
        const { data, expiresAt } = JSON.parse(cached);
        if (Date.now() < expiresAt) {
          setEntries(data);
          setLoading(false);
          return;
        }
      }

      const res = await fetch("/api/journal");
      if (!res.ok) return setLoading(false);

      const data = await res.json();
      const withUrls = await Promise.all(
        data.map(async (entry: Entry) => {
          if (!entry.imagePath) return entry;
          const urlRes = await fetch("/api/journal/CreateImageSignedUrl", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ path: entry.imagePath }),
          });
          const { url } = await urlRes.json();
          return { ...entry, signedUrl: url };
        })
      );

      setEntries(withUrls);
      setLoading(false);
      localStorage.setItem(
        cacheKey,
        JSON.stringify({
          data: withUrls,
          expiresAt: Date.now() + 55 * 60 * 1000,
        })
      );
    };

    loadEntries();
  }, []);

  return { entries, setEntries, loading };
}
