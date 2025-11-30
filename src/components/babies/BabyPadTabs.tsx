"use client";

import * as React from "react";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import BabyTimePad from "./BabyTimePad";
import { BabyStatsOverview } from "./BabyStatsOverview";

type TabValue = "timers" | "stats";

export function BabyPadTabs() {
  const [tab, setTab] = React.useState<TabValue>("timers");

  return (
    <Tabs
      value={tab}
      onValueChange={(value: string) => setTab(value as TabValue)}
      className="w-full"
    >
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="timers">Suivi en cours</TabsTrigger>
        <TabsTrigger value="stats">Stats &amp; historique</TabsTrigger>
      </TabsList>

      <div className="mt-4">
        <TabsContent value="timers" className="mt-0">
          {tab === "timers" && <BabyTimePad />}
        </TabsContent>

        <TabsContent value="stats" className="mt-0">
          {tab === "stats" && <BabyStatsOverview />}
        </TabsContent>
      </div>
    </Tabs>
  );
}
