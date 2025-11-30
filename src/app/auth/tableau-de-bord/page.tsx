"use client";

import { useEffect } from "react";
import { useBabyStore } from "@/store/useBabyStore";
import BabyCreationModal from "@/components/babies/BabyCreationModal";
import BabySelector from "@/components/babies/BabySelector";
import { BabyPadTabs } from "@/components/babies/BabyPadTabs";
import Journal from "@/components/journal/Journal";
import ManageParentsDialog from "@/components/babies/ManageParentsDialog";

export default function DashboardPage() {
  const { babies, activeBaby, loadingBabies, init } = useBabyStore();

  useEffect(() => {
    init();
  }, [init]);

  if (loadingBabies) {
    return (
      <p className="text-center mt-10 text-gray-500">
        Chargement du tableau de bord...
      </p>
    );
  }

  if (babies.length === 0) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
        <BabyCreationModal />
        <div className="mt-4 max-w-md text-center text-gray-600">
          <h2 className="text-xl font-semibold mb-2">Créez votre premier profil bébé</h2>
          <p>Renseignez un prénom pour démarrer. Vous pourrez ensuite inviter l’autre parent et enregistrer les événements.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col items-center w-full min-h-screen bg-gray-50 p-4 sm:p-8">
      {/* h1 invisible pour a11y, sans bruit visuel */}
      <h1 className="sr-only">Tableau de bord</h1>

      {/* Barre d’action compacte */}
      <div className="w-full flex justify-center mb-3">
        <div className="flex items-center justify-center gap-2 w-full max-w-none sm:max-w-lg md:max-w-2xl">
          <div className="flex-1">
            <BabySelector />
          </div>
          <ManageParentsDialog />
        </div>
      </div>

      {!activeBaby ? (
        <p className="text-center text-gray-500 mt-6">
          Sélectionnez un bébé pour commencer.
        </p>
      ) : (
        <>
          {/* 💥 Le cœur de l’app en premier */}
          <section aria-labelledby="section-timepad" className="w-full">
            <h2 id="section-timepad" className="sr-only">Raccourcis des événements</h2>
            <div className="w-full max-w-none sm:max-w-lg md:max-w-2xl mx-auto mb-6">
              <BabyPadTabs />
            </div>
          </section>

          {/* Journal ensuite */}
          <section aria-labelledby="section-journal" className="w-full">
            <h2 id="section-journal" className="sr-only">Journal de bébé</h2>
            <div className="w-full max-w-none sm:max-w-lg md:max-w-2xl mx-auto">
              <Journal babyId={activeBaby._id} />
            </div>
          </section>
        </>
      )}
    </main>
  );
}
