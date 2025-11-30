// src/components/babies/BabyTimePad.tsx
"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useBabyStore } from "@/store/useBabyStore";
import type { EventType } from "@/store/useBabyStore";

type ActionDef = {
  id: EventType;
  label: string;
  icon: string;
  color: string; // tailwind class
};

const ACTIONS: readonly ActionDef[] = [
  { id: "biberon", label: "Biberon", icon: "🍼", color: "bg-blue-100" },
  { id: "dodo",    label: "Dodo",    icon: "😴", color: "bg-yellow-100" },
  { id: "repas",   label: "Repas",   icon: "🍽️", color: "bg-green-100" },
  { id: "caca",    label: "Caca",    icon: "💩", color: "bg-orange-100" },
  { id: "pipi",    label: "Pipi",    icon: "💧", color: "bg-cyan-100" },
  { id: "bain",    label: "Bain",    icon: "🛁", color: "bg-purple-100" },
] as const;

export default function BabyTimePad() {
  const { activeBaby, events, loadingEvents, loadEvents, toggleEvent } = useBabyStore();

  // Durée courante uniquement pour un dodo en cours
  const [dodoDuration, setDodoDuration] = useState<string>("—");
  // Lock anti double-clic pendant un POST
  const [toggling, setToggling] = useState<EventType | null>(null);

  // (Re)charge quand l'id du bébé change
  useEffect(() => {
    if (activeBaby?._id) void loadEvents(activeBaby._id);
  }, [activeBaby?._id, loadEvents]);

  // Met à jour la durée du dodo en cours : immédiat + chaque minute
  useEffect(() => {
    const compute = () => {
      const d = events.dodo;
      if (d?.startedAt && !d.endedAt) {
        const secs = Math.floor((Date.now() - new Date(d.startedAt).getTime()) / 1000);
        setDodoDuration(formatDuration(secs));
      } else {
        setDodoDuration("—");
      }
    };
    compute();
    const it = setInterval(compute, 60_000);
    return () => clearInterval(it);
  }, [events.dodo]);

  if (!activeBaby) return null;

  const handleToggle = async (type: EventType) => {
    if (!activeBaby._id || toggling) return;
    setToggling(type);
    try {
      await toggleEvent(type, activeBaby._id);
      // toggleEvent recharge déjà via loadEvents dans le store
    } catch (e) {
      console.error(e);
    } finally {
      setToggling(null);
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 w-full">
      {ACTIONS.map((action) => {
        const e = events[action.id];
        const isDodo = action.id === "dodo";
        const ongoing = isDodo && Boolean(e?.startedAt && !e?.endedAt);
        const disabled = loadingEvents || toggling === action.id;

        // Libellé par type
        let label = "—";
        if (isDodo) {
          if (ongoing) {
            label = `Dodo en cours — ${dodoDuration}`;
          } else if (e?.startedAt && e.endedAt) {
            // Sieste terminée : durée + "il y a ..."
            const durSecs = Math.max(
              0,
              Math.floor(
                (new Date(e.endedAt).getTime() - new Date(e.startedAt).getTime()) / 1000
              )
            );
            label = `Durant ${formatDuration(durSecs)} — il y a ${timeSince(
              new Date(e.endedAt)
            )}`;
          } else if (e?.startedAt) {
            // Cas rare: start sans end (hérité) → traiter comme en cours
            label = `Dodo en cours — ${dodoDuration}`;
          }
        } else {
          // Autres actions : uniquement "il y a ..." (chaque clic remet à zéro côté store)
          if (e?.startedAt) label = `il y a ${timeSince(new Date(e.startedAt))}`;
        }

        return (
          <Card
            key={action.id}
            role="button"
            tabIndex={0}
            onClick={() => void handleToggle(action.id)}
            onKeyDown={(ev) => {
              if (ev.key === "Enter" || ev.key === " ") {
                ev.preventDefault();
                void handleToggle(action.id);
              }
            }}
            aria-pressed={ongoing}
            aria-disabled={disabled}
            className={cn(
              "p-4 text-center rounded-2xl shadow select-none transition",
              "hover:scale-[1.02] active:scale-[0.98] cursor-pointer",
              action.color,
              ongoing && "ring-2 ring-offset-2 ring-yellow-400",
              disabled && "opacity-60 pointer-events-none"
            )}
          >
            <div className="text-3xl mb-2">{action.icon}</div>
            <p className="font-semibold text-gray-700">{action.label}</p>
            <p className="text-xs text-gray-600 mt-1">{label}</p>
          </Card>
        );
      })}
    </div>
  );
}

/* ---------- Utils ---------- */

function timeSince(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "moins d’1 min";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins ? `${hours}h ${mins}min` : `${hours}h`;
}

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "—";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins ? `${hours}h ${mins}min` : `${hours}h`;
}
