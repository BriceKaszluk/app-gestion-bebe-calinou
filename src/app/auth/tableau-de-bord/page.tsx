"use client";

import { useEffect } from "react";
import { useBabyStore } from "@/store/useBabyStore";
import BabyCreationModal from "@/components/babies/BabyCreationModal";
import BabySelector from "@/components/BabySelector";
import BabyParentsList from "@/components/babies/BabyParentsList";
import BabyTimePad from "@/components/BabyTimePad";
import Journal from "@/components/Journal";

export default function DashboardPage() {
  const {
    babies,
    activeBaby,
    loadingBabies,
    init,
  } = useBabyStore();

  // ✅ Initialisation unique du store (sélection, cache local, etc.)
  useEffect(() => {
    init();
  }, [init]);

  // 🌀 État de chargement global
  if (loadingBabies) {
    return (
      <p className="text-center mt-10 text-gray-500">
        Chargement du tableau de bord...
      </p>
    );
  }

  // 🍼 Aucun bébé existant
  if (babies.length === 0) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <BabyCreationModal onCreated={() => init()} />
      </main>
    );
  }

  // 🧸 Interface principale
  return (
    <main className="flex flex-col items-center w-full min-h-screen bg-gray-50 p-4 sm:p-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 text-center">
        Bienvenue sur votre tableau de bord 👶
      </h1>

      {/* 🔹 Sélecteur du bébé actif */}
      <BabySelector />

      {!activeBaby ? (
        <p className="text-center text-gray-500 mt-6">
          Vous n’avez actuellement accès à aucun bébé.
        </p>
      ) : (
        <>
          {/* 🔹 Bloc parents + timers */}
          <div className="w-full max-w-none sm:max-w-lg md:max-w-2xl mx-auto mb-6">
            <BabyParentsList />
            <BabyTimePad />
          </div>

          {/* 🔹 Journal du bébé */}
          <div className="w-full max-w-none sm:max-w-lg md:max-w-2xl mx-auto">
            <Journal babyId={activeBaby._id} />
          </div>
        </>
      )}
    </main>
  );
}
