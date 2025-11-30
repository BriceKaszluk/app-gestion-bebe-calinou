// src/components/babies/stats/statsMeta.ts
import type { TimerType } from "@/lib/timers/schema";

export const TYPE_LABELS: Record<
  TimerType,
  { label: string; description: string }
> = {
  biberon: {
    label: "Biberons",
    description: "Repas et rythme d’alimentation",
  },
  dodo: {
    label: "Sommeil",
    description: "Siestes et nuits cumulées",
  },
  repas: {
    label: "Repas",
    description: "Repas solides / mixtes",
  },
  caca: {
    label: "Caca",
    description: "Fréquence des selles",
  },
  pipi: {
    label: "Pipi",
    description: "Couches mouillées",
  },
  bain: {
    label: "Bain",
    description: "Rythme des bains",
  },
};
