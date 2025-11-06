"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BabyAction = {
  id: string;
  label: string;
  icon: string;
  color: string;
  time?: Date;
};

export default function BabyTimePad() {
  const [actions, setActions] = useState<BabyAction[]>([
    { id: "biberon", label: "Biberon", icon: "🍼", color: "bg-blue-100" },
    { id: "sieste", label: "Sieste", icon: "😴", color: "bg-yellow-100" },
    { id: "repas", label: "Repas", icon: "🍽️", color: "bg-green-100" },
    { id: "caca", label: "Caca", icon: "💩", color: "bg-orange-100" },
    { id: "pipi", label: "Pipi", icon: "💧", color: "bg-cyan-100" },
    { id: "bain", label: "Bain", icon: "🛁", color: "bg-purple-100" },
  ]);

  // --- Charger le dernier événement pour chaque bouton
  useEffect(() => {
    (async () => {
      const updated = await Promise.all(
        actions.map(async (a) => {
          const res = await fetch(`/api/events?type=${a.id}`, {
            credentials: "include",
          });
          const data = await res.json();
          return {
            ...a,
            time: data.last?.startedAt ? new Date(data.last.startedAt) : undefined,
          };
        })
      );
      setActions(updated);
    })();
  }, []);

  // --- Lorsqu’on appuie sur une case
  const handlePress = async (id: string) => {
    const startedAt = new Date();

    // MAJ immédiate de l’UI
    setActions((prev) =>
      prev.map((a) => (a.id === id ? { ...a, time: startedAt } : a))
    );

    // Enregistrement en base
    await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: id, startedAt }),
    });
  };

  // --- Calcul du temps écoulé
  const getElapsed = (time?: Date) => {
    if (!time) return "—";
    const diff = Date.now() - time.getTime();
    const min = Math.floor(diff / 60000);
    if (min < 60) return `il y a ${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24) return `il y a ${h} h`;
    const d = Math.floor(h / 24);
    return `il y a ${d} j`;
  };

  return (
    <Card className="w-full max-w-2xl bg-white shadow-md rounded-2xl p-4">
      <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        {actions.map((a) => (
          <Button
            key={a.id}
            onClick={() => handlePress(a.id)}
            variant="outline"
            className={cn(
              "flex flex-col items-center justify-center h-28 sm:h-32 text-center text-sm font-medium rounded-2xl border border-gray-200 transition-all duration-200",
              a.color,
              "hover:scale-105 active:scale-95"
            )}
          >
            <span className="text-3xl mb-1">{a.icon}</span>
            <span>{a.label}</span>
            <span className="text-xs text-gray-500">{getElapsed(a.time)}</span>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
