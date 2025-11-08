"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type BabyAction = {
  id: string;
  label: string;
  icon: string;
  color: string;
  startedAt?: string;
  lastEvent?: string;
  duration?: string;
};

export default function BabyTimePad({ babyId }: { babyId: string }) {
  const [actions, setActions] = useState<BabyAction[]>([
    { id: "biberon", label: "Biberon", icon: "🍼", color: "bg-blue-100" },
    { id: "dodo", label: "Dodo", icon: "😴", color: "bg-yellow-100" },
    { id: "repas", label: "Repas", icon: "🍽️", color: "bg-green-100" },
    { id: "caca", label: "Caca", icon: "💩", color: "bg-orange-100" },
    { id: "pipi", label: "Pipi", icon: "💧", color: "bg-cyan-100" },
    { id: "bain", label: "Bain", icon: "🛁", color: "bg-purple-100" },
  ]);

  // ⏱️ Met à jour les durées toutes les minutes
  useEffect(() => {
    const interval = setInterval(() => {
      setActions((prev) =>
        prev.map((a) =>
          a.startedAt
            ? {
                ...a,
                duration: formatDuration(
                  Math.floor((Date.now() - new Date(a.startedAt).getTime()) / 1000)
                ),
              }
            : a
        )
      );
    }, 60_000);

    return () => clearInterval(interval);
  }, []);

  // 🔄 Charger les derniers événements du bébé actif
  useEffect(() => {
    if (!babyId) return;

    const fetchEvents = async () => {
      const updated = await Promise.all(
        actions.map(async (action) => {
          const res = await fetch(`/api/events?type=${action.id}&babyId=${babyId}`);
          if (!res.ok) return action;
          const data = await res.json();
          const last = data.last;

          if (!last) return { ...action, lastEvent: "—" };

          // 💤 Si dodo en cours
          if (action.id === "dodo" && last && !last.endedAt) {
            return {
              ...action,
              startedAt: last.startedAt,
              lastEvent: "Dodo en cours",
              duration: formatDuration(
                Math.floor((Date.now() - new Date(last.startedAt).getTime()) / 1000)
              ),
            };
          }

          // ⏰ Sinon on indique "il y a X temps"
          const since = timeSince(new Date(last.startedAt));
          return { ...action, lastEvent: `il y a ${since}` };
        })
      );

      setActions(updated);
    };

    fetchEvents();
  }, [babyId]);

  // 🖱️ Lorsqu’on appuie sur un bouton
  const handlePress = async (id: string) => {
    if (!babyId) {
      alert("Aucun bébé sélectionné !");
      return;
    }

    const action = actions.find((a) => a.id === id);
    if (!action) return;

    // 💤 Cas particulier : Dodo = start / stop
    if (id === "dodo" && action.startedAt) {
      const endedAt = new Date().toISOString();

      await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: id, babyId, endedAt }),
      });

      const slept = formatDuration(
        Math.floor((new Date(endedAt).getTime() - new Date(action.startedAt).getTime()) / 1000)
      );

      setActions((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                startedAt: undefined,
                duration: undefined,
                lastEvent: `il y a 0 min — ${slept} de dodo`,
              }
            : a
        )
      );
      return;
    }

    // 💾 Enregistrement d’un nouvel événement
    await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: id, babyId, startedAt: new Date().toISOString() }),
    });

    // 🕒 Mise à jour locale
    setActions((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              startedAt: id === "dodo" ? new Date().toISOString() : undefined,
              lastEvent: id === "dodo" ? "Dodo en cours" : "il y a 0 min",
              duration: id === "dodo" ? "—" : undefined,
            }
          : a
      )
    );
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 w-full">
      {actions.map((action) => (
        <Card
          key={action.id}
          onClick={() => handlePress(action.id)}
          className={cn(
            "p-4 text-center rounded-2xl shadow cursor-pointer transition select-none",
            "hover:scale-[1.02] active:scale-[0.98]",
            action.color
          )}
        >
          <div className="text-3xl mb-2">{action.icon}</div>
          <p className="font-semibold text-gray-700">{action.label}</p>
          <p className="text-xs text-gray-500 mt-1">
            {action.lastEvent || "—"}
            {action.duration && ` — ${action.duration}`}
          </p>
        </Card>
      ))}
    </div>
  );
}

// 🕒 Temps écoulé depuis une date
function timeSince(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}min`;
}

// ⏰ Formater une durée en secondes
function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}min`;
}
