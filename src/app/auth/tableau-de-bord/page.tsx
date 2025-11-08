"use client";

import { useEffect, useState } from "react";
import { useActiveBaby } from "@/hooks/useActiveBaby";
import BabyCreationModal from "@/components/babies/BabyCreationModal";
import BabySelector from "@/components/BabySelector";
import BabyTimePad from "@/components/BabyTimePad";
import Journal from "@/components/Journal";

export default function DashboardPage() {
  const [hasBaby, setHasBaby] = useState<boolean | null>(null);
  const { activeBabyId, setActiveBabyId } = useActiveBaby();

  useEffect(() => {
    const checkBabies = async () => {
      const res = await fetch("/api/babies");
      const data = await res.json();
      setHasBaby(data.length > 0);

      if (data.length > 0 && !activeBabyId) {
        setActiveBabyId(data[0]._id);
      }
    };
    checkBabies();
  }, [activeBabyId, setActiveBabyId]);

  if (hasBaby === null) return <p className="text-center mt-10">Chargement...</p>;

  return (
    <main className="flex flex-col items-center w-full min-h-screen bg-gray-50 p-4 sm:p-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 text-center">
        Bienvenue sur votre tableau de bord 👶
      </h1>

      {!hasBaby && <BabyCreationModal onCreated={() => setHasBaby(true)} />}

      {hasBaby && (
        <>
          <BabySelector />
          {activeBabyId && (
            <>
              <div className="w-full max-w-none sm:max-w-lg md:max-w-2xl mx-auto mb-6">
                <BabyTimePad babyId={activeBabyId} />
              </div>
              <div className="w-full max-w-none sm:max-w-lg md:max-w-2xl mx-auto">
                <Journal babyId={activeBabyId} />
              </div>
            </>
          )}
        </>
      )}
    </main>
  );
}
