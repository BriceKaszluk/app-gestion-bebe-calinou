"use client";

import { useEffect, useState } from "react";
import { useActiveBaby } from "@/hooks/useActiveBaby";
import BabyCreationModal from "@/components/babies/BabyCreationModal";
import BabySelector from "@/components/BabySelector";
import BabyParentsList from "@/components/babies/BabyParentsList";
import BabyTimePad from "@/components/BabyTimePad";
import Journal from "@/components/Journal";

type Baby = {
  _id: string;
  name: string;
};

export default function DashboardPage() {
  const [babies, setBabies] = useState<Baby[]>([]);
  const [loading, setLoading] = useState(true);
  const { activeBabyId, setActiveBabyId } = useActiveBaby();

  // ✅ Chargement des bébés au montage uniquement
  useEffect(() => {
    let cancelled = false;

    const loadBabies = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/babies");
        if (!res.ok) throw new Error("Erreur récupération bébés");

        const data: Baby[] = await res.json();
        if (cancelled) return;

        setBabies(data);

        // 🧹 Si aucun bébé → supprime le cache
        if (data.length === 0) {
          setActiveBabyId(null);
          return;
        }

        // ⚙️ Si bébé actif inexistant → sélectionne le premier
        if (activeBabyId && !data.some((b) => b._id === activeBabyId)) {
          console.warn("Bébé révoqué, nettoyage du cache local");
          setActiveBabyId(data[0]._id);
          return;
        }

        // 🎯 Si aucun bébé actif → sélectionne le premier
        if (!activeBabyId) {
          setActiveBabyId(data[0]._id);
        }
      } catch (err) {
        console.error("Erreur chargement bébés:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadBabies();
    return () => {
      cancelled = true;
    };
    // ✅ On ne relance pas quand activeBabyId change
  }, []); // ← tableau vide, effet exécuté une seule fois

  // 🔄 Met à jour l’état quand activeBabyId change (si besoin spécifique)
  useEffect(() => {
    if (!activeBabyId) return;
    // ici tu pourrais éventuellement refetch des données spécifiques au bébé
  }, [activeBabyId]);

  if (loading)
    return (
      <p className="text-center mt-10 text-gray-500">
        Chargement du tableau de bord...
      </p>
    );

  // 🍼 Aucun bébé du tout
  if (babies.length === 0)
    return (
      <main className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <BabyCreationModal onCreated={() => window.location.reload()} />
      </main>
    );

  // 🧸 Interface principale
  return (
    <main className="flex flex-col items-center w-full min-h-screen bg-gray-50 p-4 sm:p-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 text-center">
        Bienvenue sur votre tableau de bord 👶
      </h1>

      <BabySelector />

      {!activeBabyId ? (
        <p className="text-center text-gray-500 mt-6">
          Vous n’avez actuellement accès à aucun bébé.
        </p>
      ) : (
        <>
          <div className="w-full max-w-none sm:max-w-lg md:max-w-2xl mx-auto mb-6">
            <BabyParentsList babyId={activeBabyId} />
            <BabyTimePad babyId={activeBabyId} />
          </div>
          <div className="w-full max-w-none sm:max-w-lg md:max-w-2xl mx-auto">
            <Journal babyId={activeBabyId} />
          </div>
        </>
      )}
    </main>
  );
}
