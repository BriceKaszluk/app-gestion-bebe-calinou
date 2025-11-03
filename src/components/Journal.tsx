"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import JournalForm from "@/components/journal/JournalForm";
import JournalFilters from "@/components/journal/JournalFilters";
import JournalList from "@/components/journal/JournalList";
import { useJournalEntries, Filter } from "@/hooks/useJournalEntries";

export default function Journal() {
  const { entries, setEntries, loading } = useJournalEntries();
  const [filter, setFilter] = useState<Filter>("all");
  const [sending, setSending] = useState(false);

  const handleSubmit = async (message: string, file: File | null) => {
    setSending(true);
    const res = await fetch("/api/journal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    const newEntry = await res.json();
    setEntries((prev) => [newEntry, ...prev]);
    setSending(false);
  };

  const toggleFavorite = async (id: string) => {
    setEntries((prev) =>
      prev.map((e) => (e._id === id ? { ...e, favorite: !e.favorite } : e))
    );
    await fetch(`/api/journal/${id}/favorite`, { method: "PATCH" });
  };

  const filtered = entries.filter((entry) => {
    const d = new Date(entry.createdAt);
    const now = new Date();
    if (filter === "today") return d.toDateString() === now.toDateString();
    if (filter === "week") return (now.getTime() - d.getTime()) / 86400000 <= 7;
    return true;
  });

  return (
    <Card className="mx-auto w-full max-w-md sm:max-w-lg md:max-w-2xl p-4 sm:p-6 rounded-2xl shadow-md bg-white">
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl font-semibold text-center">
          Journal de bébé 🍼
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <JournalForm onSubmit={handleSubmit} loading={sending} />
        <JournalFilters filter={filter} setFilter={setFilter} />
        <JournalList entries={filtered} loading={loading} toggleFavorite={toggleFavorite} />
      </CardContent>
    </Card>
  );
}
