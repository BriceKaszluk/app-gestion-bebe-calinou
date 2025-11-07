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

  // état spécial pour la sieste en cours
  const [napStart, setNapStart] = useState<Date | null>(null);
  const [elapsedNap, setElapsedNap] = useState<string>("");

  // --- actualise la durée de la sieste toutes les minutes
  useEffect(() => {
    if (!napStart) return;

    const updateElapsed = () => {
      const diff = Date.now() - napStart.getTime();
      const min = Math.floor(diff / 60000);
      const h = Math.floor(min / 60);
      const display =
        h > 0 ? `${h}h${min % 60 > 0 ? ` ${min % 60}min` : ""}` : `${min} min`;
      setElapsedNap(display);
    };

    updateElapsed(); // première exécution immédiate
    const interval = setInterval(updateElapsed, 60_000);
    return () => clearInterval(interval);
  }, [napStart]);

  // --- recharge les derniers événements en base
  useEffect(() => {
    (async () => {
      const updated = await Promise.all(
        actions.map(async (a) => {
          const res = await fetch(`/api/events?type=${a.id}`);
          const data = await res.json();
          return {
            ...a,
            time: data.last?.startedAt ? new Date(data.last.startedAt) : undefined,
          };
        })
      );
      setActions(updated);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- met à jour automatiquement tous les timers chaque minute
  useEffect(() => {
    const interval = setInterval(() => {
      setActions((prev) => [...prev]); // force re-render
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  // --- clic sur un bouton
  const handlePress = async (id: string) => {
    const now = new Date();

    // 💤 Cas spécial : sieste
    if (id === "sieste") {
      if (!napStart) {
        // début de sieste
        setNapStart(now);
      } else {
        // fin de sieste
        const duration = Math.floor((now.getTime() - napStart.getTime()) / 60000);
        setNapStart(null);
        setElapsedNap("");

        await fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "sieste",
            startedAt: napStart,
            endedAt: now,
          }),
        });

        setActions((prev) =>
          prev.map((a) =>
            a.id === "sieste" ? { ...a, time: now } : a
          )
        );

        console.log(`⏱️ Sieste de ${duration} minutes enregistrée`);
      }
      return;
    }

    // 🌟 Autres boutons classiques
    setActions((prev) =>
      prev.map((a) => (a.id === id ? { ...a, time: now } : a))
    );

    await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: id, startedAt: now }),
    });
  };

  // --- calcul du temps écoulé depuis un event
  const getElapsed = (time?: Date) => {
    if (!time) return "—";
    const diff = Date.now() - time.getTime();
    const min = Math.floor(diff / 60000);
    if (min < 60) return `il y a ${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24) {
      const rest = min % 60;
      return rest > 0 ? `il y a ${h}h ${rest}min` : `il y a ${h}h`;
    }
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
              "hover:scale-105 active:scale-95",
              a.id === "sieste" && napStart ? "border-yellow-400 bg-yellow-50" : ""
            )}
          >
            <span className="text-3xl mb-1">{a.icon}</span>
            <span>{a.label}</span>

            {a.id === "sieste" && napStart ? (
              <span className="text-xs text-yellow-700">
                Sieste en cours : {elapsedNap}
              </span>
            ) : (
              <span className="text-xs text-gray-500">{getElapsed(a.time)}</span>
            )}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
